# Tasks: Agent核心模块架构优化

## 实现类型
- **类型**: optimize
- **优先级**: high
- **阶段**: 架构升级迭代

## 任务列表

### Task 1: 工具自注册模式 - pipeline.rs 解耦
- **描述**: 将 tools/pipeline.rs 从直接 import 所有工具子模块，改为通过 registry 自注册模式解耦
- **状态**: [部分完成] pipeline 已有良好注册入口模式，需进一步引入动态注册
- **文件**:
  - `src-tauri/src/agent/tools/pipeline.rs` (已有 register_* 函数)
- **验收**:
  - [x] `cargo check` 无编译错误
  - [ ] 引入 `ToolModule` trait 实现动态自注册
  - [ ] 新增模块正确导出注册函数

### Task 2: 并发原语统一 - ToolRegistry 改用 RwLock
- **描述**: 将 ToolRegistry 的 Mutex 改为 Arc<RwLock>，与其他模块保持一致
- **状态**: [完成]
- **文件**:
  - `src-tauri/src/agent/tools/registry.rs` (修改)
- **验收**:
  - [x] `cargo check` 无编译错误
  - [x] 使用 `Arc<RwLock>` 替代 `Mutex`
  - [x] 所有读操作使用 `.read()`，写操作使用 `.write()`

### Task 3: Provider Strategy 模式
- **描述**: 将 Plan/Act 双模式从字段切换改为 Strategy 模式
- **状态**: [完成]
- **文件**:
  - `src-tauri/src/agent/dual_agent_provider.rs` (新增)
  - `src-tauri/src/agent/mod.rs` (修改)
- **验收**:
  - [x] `cargo check` 无编译错误
  - [x] `DualAgentProvider` 实现 `AgentProvider` trait
  - [x] 支持 `get_mode()` / `set_mode()` 模式切换
  - [ ] 集成到 `RuntimeConfig` 初始化流程（待后续任务）

### Task 4: 前端按域拆分导出
- **描述**: 将 src/features/agent/index.ts 的导出按功能域拆分
- **状态**: [完成]
- **文件**:
  - `src/features/agent/components/chat/index.ts` (新增)
  - `src/features/agent/components/collaboration/index.ts` (新增)
  - `src/features/agent/components/monitoring/index.ts` (新增)
  - `src/features/agent/components/pilot/index.ts` (新增)
  - `src/features/agent/components/checkpoint/index.ts` (新增)
  - `src/features/agent/components/error/index.ts` (新增)
  - `src/features/agent/components/search/index.ts` (新增)
  - `src/features/agent/components/workcard/index.ts` (新增)
  - `src/features/agent/components/core/index.ts` (新增)
  - `src/features/agent/components/index.ts` (新增)
  - `src/features/agent/hooks/domains/useChat.ts` (新增)
  - `src/features/agent/hooks/domains/useCheckpoint.ts` (新增)
  - `src/features/agent/hooks/domains/useGit.ts` (新增)
  - `src/features/agent/hooks/domains/useCompression.ts` (新增)
  - `src/features/agent/hooks/domains/index.ts` (新增)
  - `src/features/agent/index.ts` (修改)
- **验收**:
  - [x] TypeScript 编译无 agent 模块错误
  - [x] 组件按 chat/collaboration/monitoring/pilot/error/search/workcard/core/checkpoint 功能域正确分组
  - [x] 旧导入路径通过兼容层可用

### Task 5: 大文件拆分 - enterprise.rs
- **描述**: 将 tools/enterprise.rs (892行) 按执行器拆分为独立文件
- **状态**: [完成]
- **文件**:
  - `src-tauri/src/agent/tools/enterprise/mod.rs` (新增)
  - `src-tauri/src/agent/tools/enterprise/resource.rs` (新增, 131行)
  - `src-tauri/src/agent/tools/enterprise/knowledge.rs` (新增, 125行)
  - `src-tauri/src/agent/tools/enterprise/messaging.rs` (新增, 142行)
  - `src-tauri/src/agent/tools/enterprise/delegation.rs` (新增, 98行)
  - `src-tauri/src/agent/tools/enterprise/workspace.rs` (新增, 96行)
  - `src-tauri/src/agent/tools/enterprise/database.rs` (新增, 111行)
  - `src-tauri/src/agent/tools/enterprise.rs` (删除)
- **验收**:
  - [x] 拆分后每文件 <400 行（最大142行）
  - [x] `cargo check` 无编译错误
  - [x] 原有注册函数正确聚合到 `register_enterprise_tools`
  - [x] 测试保留（迁移到 `enterprise.rs` 存根）

### Task 6: 大文件拆分 - document.rs 和 filesystem.rs
- **描述**: 将 tools/document.rs (837行) 和 tools/filesystem.rs (793行) 按功能拆分
- **状态**: [待完成]
- **文件**:
  - `src-tauri/src/agent/tools/document/mod.rs` (新增)
  - `src-tauri/src/agent/tools/document/reader.rs` (新增)
  - `src-tauri/src/agent/tools/document/writer.rs` (新增)
  - `src-tauri/src/agent/tools/filesystem/mod.rs` (新增)
  - `src-tauri/src/agent/tools/filesystem/read.rs` (新增)
  - `src-tauri/src/agent/tools/filesystem/write.rs` (新增)
- **验收**:
  - [ ] 拆分后每文件 <400 行
  - [ ] `cargo check` 无编译错误
  - [ ] 原有注册函数正确聚合

## 测试要点

- [x] `cargo check` 编译成功
- [x] TypeScript agent 模块无编译错误
- [ ] `cargo test --lib` 单元测试通过（预存错误）
- [ ] 工具注册流程功能回归测试
- [ ] Plan/Act 模式切换功能回归测试
- [ ] 前端组件渲染功能回归测试
