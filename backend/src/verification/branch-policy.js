import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_BRANCH_POLICY_PATH = resolve(moduleDirectory, '../../../config/branch-policy.json');
export const BRANCH_ROLES = Object.freeze({
  AUTHORITATIVE: 'AUTHORITATIVE',
  FEATURE: 'FEATURE',
  HISTORICAL: 'HISTORICAL',
  UNRELATED: 'UNRELATED'
});

function readPolicyFile(policyPath) {
  try {
    if (!existsSync(policyPath)) return null;
    return JSON.parse(readFileSync(policyPath, 'utf8'));
  } catch (_error) {
    return null;
  }
}

function resolvePolicyPath(repoRoot, policyPath) {
  if (policyPath) return policyPath;
  let current = resolve(repoRoot);
  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = resolve(current, 'config/branch-policy.json');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return resolve(repoRoot, 'config/branch-policy.json');
}

export function loadBranchPolicy({ repoRoot = process.cwd(), policyPath = null } = {}) {
  const resolvedPath = resolvePolicyPath(repoRoot, policyPath);
  const policy = readPolicyFile(resolvedPath);
  const requirementExtraction = policy?.requirement_extraction;
  if (!requirementExtraction || typeof requirementExtraction.authoritative_branch !== 'string') {
    return {
      path: resolvedPath,
      authoritative_branch: null,
      historical_branches: [],
      production_sync_policy: null,
      force_push_allowed: false,
      automatic_reset_allowed: false
    };
  }
  return {
    path: resolvedPath,
    authoritative_branch: requirementExtraction.authoritative_branch,
    historical_branches: Array.isArray(requirementExtraction.historical_branches)
      ? requirementExtraction.historical_branches.filter((value) => typeof value === 'string')
      : [],
    production_sync_policy: requirementExtraction.production_sync_policy || null,
    force_push_allowed: requirementExtraction.force_push_allowed === true,
    automatic_reset_allowed: requirementExtraction.automatic_reset_allowed === true
  };
}

function gitRef(repoRoot, branch) {
  if (!branch) return null;
  for (const ref of [`refs/heads/${branch}`, `refs/remotes/origin/${branch}`]) {
    try {
      return execFileSync('git', ['rev-parse', '--verify', ref], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
    } catch (_error) {
      // Try the next local/remote ref without exposing command output.
    }
  }
  return null;
}

function hasMergeBase(repoRoot, leftRef, rightRef) {
  if (!leftRef || !rightRef) return false;
  try {
    const mergeBase = execFileSync('git', ['merge-base', leftRef, rightRef], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    return Boolean(mergeBase);
  } catch (_error) {
    return false;
  }
}

function isFeatureBranch(branch) {
  return /^(?:fix|feat)\//.test(String(branch || ''));
}

export function classifyBranch({
  branch,
  policy = loadBranchPolicy(),
  repoRoot = process.cwd(),
  headRef = 'HEAD'
} = {}) {
  const authoritativeBranch = policy?.authoritative_branch || null;
  const historicalBranches = Array.isArray(policy?.historical_branches) ? policy.historical_branches : [];
  const authoritativeRef = gitRef(repoRoot, authoritativeBranch);
  const currentRef = branch ? gitRef(repoRoot, branch) : null;
  const branchExists = Boolean(currentRef);
  if (branch && branch === authoritativeBranch) {
    return {
      branch_name: branch,
      branch_role: BRANCH_ROLES.AUTHORITATIVE,
      authoritative_branch: authoritativeBranch,
      production_eligible: true,
      lineage_verified: branchExists && Boolean(authoritativeRef),
      blocker: branchExists && authoritativeRef ? null : 'BRANCH_LINEAGE_DRIFT'
    };
  }
  if (branch && historicalBranches.includes(branch)) {
    return {
      branch_name: branch,
      branch_role: BRANCH_ROLES.HISTORICAL,
      authoritative_branch: authoritativeBranch,
      production_eligible: false,
      lineage_verified: branchExists,
      blocker: null
    };
  }
  if (isFeatureBranch(branch)) {
    const lineageVerified = branchExists
      && Boolean(authoritativeRef)
      && hasMergeBase(repoRoot, currentRef || headRef, authoritativeRef);
    return {
      branch_name: branch || null,
      branch_role: lineageVerified ? BRANCH_ROLES.FEATURE : BRANCH_ROLES.UNRELATED,
      authoritative_branch: authoritativeBranch,
      production_eligible: false,
      lineage_verified: lineageVerified,
      blocker: lineageVerified ? null : 'BRANCH_LINEAGE_DRIFT'
    };
  }
  return {
    branch_name: branch || null,
    branch_role: BRANCH_ROLES.UNRELATED,
    authoritative_branch: authoritativeBranch,
    production_eligible: false,
    lineage_verified: false,
    blocker: 'BRANCH_LINEAGE_DRIFT'
  };
}

/**
 * Read-only sync guard. The authoritative tip may advance to the feature tip
 * only when it is an ancestor; every other relationship is a stop condition.
 * This helper never performs a Git mutation (merge, rebase, reset, or push).
 */
export function evaluateFastForwardSync({
  authoritativeHead,
  featureHead,
  authoritativeIsAncestor = false
} = {}) {
  if (!authoritativeHead || !featureHead) {
    return { allowed: false, status: 'BRANCH_LINEAGE_DIVERGED' };
  }
  if (authoritativeHead === featureHead) {
    return { allowed: true, status: 'ALREADY_SYNCED' };
  }
  if (authoritativeIsAncestor === true) {
    return { allowed: true, status: 'FAST_FORWARD_ALLOWED' };
  }
  return { allowed: false, status: 'BRANCH_LINEAGE_DIVERGED' };
}

/**
 * Inspect real refs for a policy-compliant ff-only sync. No mutation occurs.
 */
export function checkFastForwardSync({
  repoRoot = process.cwd(),
  authoritativeBranch,
  featureBranch
} = {}) {
  const authoritativeRef = gitRef(repoRoot, authoritativeBranch);
  const featureRef = gitRef(repoRoot, featureBranch);
  let authoritativeIsAncestor = false;
  if (authoritativeRef && featureRef) {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', authoritativeRef, featureRef], {
        cwd: repoRoot,
        stdio: 'ignore'
      });
      authoritativeIsAncestor = true;
    } catch (_error) {
      authoritativeIsAncestor = false;
    }
  }
  const result = evaluateFastForwardSync({
    authoritativeHead: authoritativeRef,
    featureHead: featureRef,
    authoritativeIsAncestor
  });
  return {
    ...result,
    authoritative_branch: authoritativeBranch || null,
    feature_branch: featureBranch || null,
    authoritative_head: authoritativeRef,
    feature_head: featureRef
  };
}

export function assertLiveBranch({ branchInfo } = {}) {
  if (branchInfo?.branch_role !== BRANCH_ROLES.AUTHORITATIVE) {
    return { allowed: false, blocker: 'BRANCH_DRIFT' };
  }
  return { allowed: true, blocker: null };
}

export function branchPolicySummary(policy = loadBranchPolicy()) {
  return {
    authoritative_branch: policy.authoritative_branch,
    historical_branches: [...policy.historical_branches],
    production_sync_policy: policy.production_sync_policy,
    force_push_allowed: policy.force_push_allowed === true,
    automatic_reset_allowed: policy.automatic_reset_allowed === true
  };
}
