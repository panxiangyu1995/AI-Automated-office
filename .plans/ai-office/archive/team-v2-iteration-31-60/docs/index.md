# ai-office - 知识库索引

> 动态导航地图。custodian 维护此文件。
> 智能体：需要在 docs/ 中查找信息时先 Read 此文件。
> CLAUDE.md 指向这里但不复制此内容。

| 文档 | 关键 Sections | 最后更新 |
|------|-------------|---------|
| architecture.md | §组件图: C1+C2+C3+C4(SIEM/模板命令/部门路由/组件集成) + R2(CSP/RBAC) | 2026-04-16 R5 |
| api-contracts.md | §Auth/RBAC(R2)+§模板命令层(C4)+§SIEM审计(C4)+C1+C2+C3接口 | 2026-04-16 R5 |
| invariants.md | §安全: INV-11已验证 · §契约: INV-7已验证 · §铁律: INV-10部分合规 | 2026-04-16 R5 |

## 如何使用此索引

- 需要了解系统组件？→ 读 architecture.md §系统概览
- 需要 API 字段名？→ 读 api-contracts.md，跳到相关 section
- 需要检查变更是否违反边界？→ 读 invariants.md

## 新鲜度日志

> custodian 每次审计后更新。

| 文档 | 上次审计 | 状态 |
|------|---------|------|
| architecture.md | 2026-04-16 R5 | [UPDATED] R5补充CSP安全策略+RBAC权限描述 |
| api-contracts.md | 2026-04-16 R5 | [UPDATED] R5补充Auth/RBAC命令节+CSP配置 |
| invariants.md | 2026-04-16 R5 | [UPDATED] R5新增INV-11(API密钥不得硬编码) |
