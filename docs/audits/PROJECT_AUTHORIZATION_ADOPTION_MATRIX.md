# Project Authorization Adoption Matrix

This matrix records availability of the minimal Project Authorization Kernel
separately from adoption by business entry points. It must not be read as
evidence that an unchanged route is protected.

| Formal area / entry point | KERNEL_AVAILABLE | AUTHORIZATION_ADOPTED | ENTRY_TESTED | AUTHORIZATION_TESTED | Status |
| --- | --- | --- | --- | --- | --- |
| `POST /api/projects` → project creation + OWNER membership | YES | YES | YES | YES | ENFORCED |
| Historical project owner bootstrap CLI | YES | YES (operational only) | YES | YES | ENFORCED |
| Retrieval → Review proposal | YES | NO | YES | NO | NOT_ADOPTED |
| Review → Fact canonical project route | YES | NO | YES | NO | BLOCKED |
| Legacy `POST /api/evidence-reviews/:reviewId/facts` | YES | NO | YES | NO | UNSAFE / BLOCKED |
| Fact → Mapping | YES | NO | YES | NO | NOT_ADOPTED |
| Mapping → Claim | YES | NO | PARTIAL | NO | PARTIAL |
| Claim Gate → Writer | YES | NO | YES | NO | NOT_ADOPTED |
| DocumentVersion confirmation | YES | NO | YES | NO | NOT_ADOPTED |
| Project-scoped material/evidence/retrieval reads and writes | YES | NO | PARTIAL | NO | NOT_ADOPTED |

## Kernel boundary

The kernel owns only:

```text
Trusted Actor → ProjectMembership → ProjectAuthorizationService
```

It does not add enterprise RBAC, Knowledge ACL, Material ACL, Tenant or
Organization isolation. Existing business services remain unchanged until a
separate adoption decision authorizes each entry point.

## Current security status

- `Review → Fact` remains **BLOCKED**. The known approved Review ID cross-project
  exploit is not fixed by merely adding the kernel.
- `Mapping → Claim` remains **PARTIAL**.
- `I19` remains **PARTIAL**.
- Historical projects without membership remain
  `UNASSIGNED_FOR_WRITE`; no automatic backfill is performed.
