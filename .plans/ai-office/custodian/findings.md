# custodian - 发现索引

> 纯索引——每个条目应简短（Status + Report 链接 + Summary）。

---

## C1 合规清理

| # | 级别 | 类别 | 摘要 |
|---|------|------|------|
| C1 | ADVISORY | 文档同步 | docs/ 未反映 C1 新增 — 已修复 |
| C2 | ADVISORY | 索引 | backend-dev findings 标记过时 — 已修复 |
| C3 | ADVISORY | 索引 | e2e-tester findings 为空 — 已填充 |

详细报告: [audit-c1/report.md](audit-c1/report.md)

## C2 合规清理

| # | 级别 | 类别 | 摘要 |
|---|------|------|------|
| C2-1 | ADVISORY | 文档同步 | docs/ 未反映 C2 新增(群聊Agent/模板存储/ProblemCenter) — 已修复 |
| C2-2 | ADVISORY | 文档同步 | api-contracts.md 未记录C2接口 — 已修复 |
| C2-3 | ADVISORY | 代码 | baseColors.ts 3处注释占位(C1遗留) — 建议C3修复 |
| C2-4 | ADVISORY | 代码 | archived JSON未加入.gitignore(C1遗留) — 建议C3修复 |

详细报告: [audit-c2/report.md](audit-c2/report.md)

## C3 合规清理

| # | 级别 | 类别 | 摘要 |
|---|------|------|------|
| C3-1 | ADVISORY | 文档同步 | docs/ 未反映 C3 新增 — 已修复 |
| C3-2 | ADVISORY | 代码 | baseColors.ts注释占位(C1遗留) — 建议C4修复 |
| C3-3 | ADVISORY | 代码 | archived JSON(C1遗留) — 建议C4修复 |

详细报告: [audit-c3/report.md](audit-c3/report.md)

## C4 合规清理

| # | 级别 | 类别 | 摘要 |
|---|------|------|------|
| C4-1 | ADVISORY | 文档同步 | docs/ 未反映 C4 新增 — 已修复 |
| C4-2 | ADVISORY | 代码 | GroupChat.tsx 1164行超限 — 建议C5修复 |

详细报告: [audit-c4/findings.md](audit-c4/findings.md)
