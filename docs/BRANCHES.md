# Branches

## Active authoritative branch

Requirement Extraction 的当前权威分支是：

`feat/v4.3-semantic-boundary-routing`

该身份由 [`config/branch-policy.json`](../config/branch-policy.json) 定义，
不绑定某个固定 HEAD。HEAD 正常变化不会产生 branch drift。

## Historical / not current production target

`feat/v4.3-production-beta` 是历史开发线，不是当前 Requirement Extraction
production target。它允许读取、比较和审计，但不得被自动用于 live、deploy 或
production sync。

## Branch safety

`fix/*` 和 `feat/*` 可作为普通开发分支。只有能够通过 Git ancestry 证明与权威
分支存在共同 lineage 的分支才是有效 `FEATURE`；live、deploy 和 runtime restart
仍只允许在精确的 authoritative branch 上执行。无法证明 lineage 时必须停止，
不得自动 merge、rebase、cherry-pick、reset 或 force-push。
