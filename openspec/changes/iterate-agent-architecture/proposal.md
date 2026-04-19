# Proposal: Agent核心模块架构优化

## 变更类型
- [ ] 新功能
- [x] 架构优化
- [ ] 性能优化
- [ ] 代码重构

## 背景

Agent 核心模块（`src-tauri/src/agent/` + `src/features/agent/`）经过多轮迭代，存在以下架构问题：

1. **编译耦合**：tools/pipeline.rs 直接 import 所有工具子模块，任何工具变更都触发 pipeline 重新编译
2. **并发原语不统一**：ToolRegistry 使用 `Mutex` 而其他模块使用 `RwLock`
3. **Provider 模式僵硬**：Plan/Act 双模式用字段切换，违反开闭原则
4. **前端接口膨胀**：index.ts 导出 50+ 项，新人难以找到入口
5. **大文件集中**：多个 Rust 文件超过 700 行，违反 SRP
6. **路由逻辑混杂**：routing.rs 混合同步/异步逻辑

**代码规模**：236 个 Rust 文件（约 45,782 行）+ 79 个前端文件（约 31,911 行）

## 优化目标

| 优化项 | 当前状态 | 目标状态 | 影响范围 |
|--------|----------|----------|----------|
| 工具注册解耦 | pipeline 直接 import 所有工具 | 工具自注册，pipeline 只依赖 registry | tools/pipeline.rs |
| 并发原语统一 | `Mutex` vs `RwLock` 混用 | 统一使用 `Arc<RwLock>` | tools/registry.rs |
| LLM Provider 模式 | 字段切换 Plan/Act | Strategy 模式抽象 | llm_agent_provider.rs |
| 前端接口拆分 | index.ts 导出 50+ 项 | 按域导出子模块 | src/features/agent/ |
| 大文件拆分 | 多个 >700 行文件 | 每文件 <400 行 | tools/*.rs |
| 路由逻辑分离 | sync/async 混合 | 纯 async 服务 + sync utils | routing.rs |

## 功能不变性保证

**必须保持的功能点（铁律约束）：**
1. 所有 Tauri 命令接口不变（前端通过 IPC 调用后端）
2. LLM Provider 的多后端支持（Zhipu/DeepSeek/Minimax/OpenAI-compatible）
3. 工具注册和执行流程不变
4. 路由匹配逻辑（keyword/semantic/combined/llm_guided）不变
5. 三层记忆架构（Personal/Enterprise/Graph）不变
6. 会话管理和检查点机制不变
7. 权限和安全检查逻辑不变
8. 前端所有组件的 Props 接口不变

## 优化方案

### 阶段一：编译耦合消除

**目标**：消除 tools/pipeline.rs 对所有工具子模块的直接依赖

**方案**：
1. 引入 `ToolRegistry` 作为唯一依赖点
2. 所有工具子模块改为通过 `pub fn register_tools(registry: &mut ToolRegistry)` 自注册
3. pipeline.rs 只保留对 registry 和 executor trait 的依赖
4. 工具注册从编译时耦合改为运行时注册

### 阶段二：并发原语统一

**目标**：统一所有并发模块使用 `Arc<RwLock>`

**方案**：
1. `ToolRegistry` 的 `Mutex<HashMap>` 改为 `Arc<RwLock<HashMap>>`
2. 保持读多写少场景下的并发性能
3. 与其他模块（routing、memory）保持一致

### 阶段三：Provider Strategy 模式

**目标**：将 Plan/Act 双模式从字段切换改为 Strategy 模式

**方案**：
1. 定义 `AgentStrategy` trait：`fn execute(ctx, req) -> Response`
2. 实现 `PlanStrategy` 和 `ActStrategy`
3. `LlmAgentProvider` 持有 `Arc<dyn AgentStrategy>`
4. 新增模式只需实现 trait，无需修改 provider 结构

### 阶段四：前端接口按域拆分

**目标**：将 index.ts 的 50+ 导出按功能域拆分

**方案**：
1. `index.ts` 仅保留入口导出（主要组件 + hooks）
2. 新增 `components/chat/index.ts`（对话相关）
3. 新增 `components/agent/index.ts`（Agent 协作相关）
4. 新增 `components/monitoring/index.ts`（可观测性相关）
5. 新增 `hooks/domains/index.ts`（按域聚合 hooks）

### 阶段五：大文件拆分

**目标**：将超过 700 行的文件拆分到 400 行以内

**方案**（按文件优先级）：
1. `tools/enterprise.rs` (892行) → 按执行器拆分为独立文件
2. `tools/document.rs` (837行) → 按文档类型拆分
3. `tools/filesystem.rs` (793行) → 按操作类型拆分
4. `routing.rs` (783行) → 分离 sync utils 和 async service

## 影响范围

### 涉及的文件
- `src-tauri/src/agent/tools/pipeline.rs`
- `src-tauri/src/agent/tools/registry.rs`
- `src-tauri/src/agent/llm_agent_provider.rs`
- `src-tauri/src/agent/routing.rs`
- `src-tauri/src/agent/tools/enterprise.rs`
- `src-tauri/src/agent/tools/document.rs`
- `src-tauri/src/agent/tools/filesystem.rs`
- `src/features/agent/index.ts`
- `src/features/agent/components/`

### 不涉及的范围
- 所有 Tauri IPC 命令接口
- 所有前端 Props 类型
- 所有数据库 schema
- 所有 API 类型定义

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 工具注册顺序改变导致运行时错误 | 低 | 高 | 保留注册函数签名，逐步迁移 |
| 改用 RwLock 引入死锁风险 | 中 | 中 | review 阶段重点检查锁顺序 |
| 前端导出路径改变导致 import 错误 | 中 | 中 | 保留 index.ts 兼容层，渐进迁移 |

## 依赖

- **前置依赖**: 无
- **后置依赖**: 无
- **并行任务**: 无

## 参考资料

- SOLID 原则（单一职责、开闭、里氏替换、接口隔离、依赖倒置）
- KISS 原则（保持简单）
- DRY 原则（不重复）
- DIP 原则（依赖抽象）
- YAGNI 原则（不为可能需要的功能浪费精力）
