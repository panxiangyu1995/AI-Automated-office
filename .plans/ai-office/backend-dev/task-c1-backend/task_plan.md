# C1 后端开发 - 任务计划

> 角色: 后端开发（Rust/Tauri）
> 状态: in_progress
> 基于: researcher 差距分析报告

## 修复优先级

| # | 差距ID | 内容 | 优先级 | 状态 |
|---|--------|------|--------|------|
| 1 | G3 | DashScope LLM 适配器 | P1 | pending |
| 2 | G2-HR | HR 工具注册集 | P1 | pending |
| 3 | G2-Sales | Sales 工具注册集 | P1 | pending |
| 4 | G2-Approval | Approval 工具注册集 | P1 | pending |
| 5 | G2-Warehouse | Warehouse 工具注册集 | P1 | pending |
| 6 | G2-Service | Service 工具注册集 | P1 | pending |
| 7 | G4 | 通用数据同步引擎 | P1 | pending |

## 参考实现

- Finance 工具集: `src-tauri/src/agent/tools/finance/` (完整5工具+注册)
- DeepSeek 适配器: `src-tauri/src/agent/llm_provider/deepseek.rs` (OpenAI兼容格式)

## 实施策略

- TDD: 先写测试 → 最小实现 → 重构
- 工具命名: `{plugin}_{entity}_{action}` 格式
- 每个部门工具集: query/aggregate/mutate/action/export
