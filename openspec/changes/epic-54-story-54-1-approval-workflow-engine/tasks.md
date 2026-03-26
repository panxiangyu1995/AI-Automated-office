# Tasks: 审批中心完整实现 - 流程引擎

## 任务列表

### Task 124: 审批中心完整实现 - 流程引擎

| 属性 | 值 |
|------|-----|
| **ID** | 124 |
| **Epic** | Epic 54 - 业务模块动态化 |
| **Story** | Story 54.1 |
| **Title** | 审批中心完整实现 - 流程引擎 |
| **implementationType** | `new` (全新开发) |
| **优先级** | `high` |
| **阶段** | Phase 4 - 业务模块动态化 |
| **后端必需** | `true` |

#### 描述
实现审批中心的完整流程引擎，包括审批流程创建、状态流转、历史记录管理。

#### 现有代码状态
- **前端**: 无现有代码（需要全新创建）
- **后端**: 无现有代码（需要全新创建）
- **数据库**: 无现有表结构（需要创建审批相关表）

---

## 详细任务列表

### Phase 1: 后端基础设施

#### Task 1.1: 创建后端模块结构
- [ ] 创建 `src-tauri/src/agent/approval/` 目录
- [ ] 创建 `approval/mod.rs` 模块入口
- [ ] 更新 `src-tauri/src/agent/mod.rs` 添加 approval 子模块
- [ ] 更新 `src-tauri/Cargo.toml` 添加依赖 (serde, chrono, uuid, sqlx, tokio)

#### Task 1.2: 定义数据模型
- [ ] 创建 `approval/models.rs`
- [ ] 定义 `ApprovalFlowDef` 审批流程定义结构
- [ ] 定义 `ApprovalInstance` 审批实例结构
- [ ] 定义 `ApprovalNodeInstance` 审批节点实例结构
- [ ] 定义 `ApprovalHistory` 审批历史记录结构
- [ ] 定义 `FlowConfig` 流程配置结构
- [ ] 定义 `NodeDef`, `EdgeDef` 节点和边定义
- [ ] 定义 `ApprovalStatus` 枚举
- [ ] 定义 `ApprovalResult` 枚举
- [ ] 定义 `ApprovalType`, `NodeType` 枚举

#### Task 1.3: 实现数据访问层
- [ ] 创建 `approval/repository.rs`
- [ ] 实现 `ApprovalRepository` 结构体
- [ ] 实现流程定义的 CRUD 操作
- [ ] 实现审批实例的 CRUD 操作
- [ ] 实现审批节点实例的 CRUD 操作
- [ ] 实现审批历史的查询操作

#### Task 1.4: 实现状态机
- [ ] 创建 `approval/state_machine.rs`
- [ ] 定义 `Transition` 状态转换结构
- [ ] 实现 `ApprovalStateMachine` 状态机
- [ ] 实现 `can_transition()` 转换验证方法
- [ ] 实现 `get_allowed_transitions()` 获取允许转换方法

#### Task 1.5: 实现核心引擎
- [ ] 创建 `approval/engine.rs`
- [ ] 实现 `ApprovalWorkflowEngine` 核心结构体
- [ ] 实现 `create_flow()` 创建流程定义
- [ ] 实现 `start_instance()` 启动审批实例
- [ ] 实现 `submit_approval()` 提交审批
- [ ] 实现 `handle_approve()` 审批通过处理
- [ ] 实现 `handle_reject()` 审批拒绝处理
- [ ] 实现 `handle_cancel()` 审批取消处理
- [ ] 实现 `find_next_node()` 查找下一节点

#### Task 1.6: 实现错误处理
- [ ] 创建 `approval/error.rs`
- [ ] 定义 `ApprovalError` 错误枚举
- [ ] 实现 `From` trait 用于错误转换
- [ ] 实现 `std::error::Error` trait
- [ ] 实现 `std::fmt::Display` trait

#### Task 1.7: 实现 Tauri 命令
- [ ] 创建 `approval/commands.rs`
- [ ] 实现 `create_approval_flow` 命令
- [ ] 实现 `get_approval_flow` 命令
- [ ] 实现 `list_approval_flows` 命令
- [ ] 实现 `create_approval_instance` 命令
- [ ] 实现 `get_approval_instance` 命令
- [ ] 实现 `submit_approval` 命令
- [ ] 实现 `get_approval_history` 命令
- [ ] 在 `mod.rs` 中注册所有命令

---

### Phase 2: 数据库迁移

#### Task 2.1: 创建数据库表
- [ ] 创建 `approval_flow_def` 审批流程定义表
- [ ] 创建 `approval_instance` 审批实例表
- [ ] 创建 `approval_node_instance` 审批节点实例表
- [ ] 创建 `approval_history` 审批历史表

#### Task 2.2: 创建索引
- [ ] 为 `approval_instance.status` 创建索引
- [ ] 为 `approval_instance.applicant_id` 创建索引
- [ ] 为 `approval_history.instance_id` 创建索引

---

### Phase 3: 前端基础结构

#### Task 3.1: 创建前端类型定义
- [ ] 创建 `src/features/approval/types/approval.types.ts`
- [ ] 定义与后端对应的 TypeScript 类型
- [ ] 定义 API 请求/响应类型

#### Task 3.2: 创建前端 API 封装
- [ ] 创建 `src/features/approval/api/approvalApi.ts`
- [ ] 封装所有后端命令的调用
- [ ] 添加类型安全的参数校验

#### Task 3.3: 创建前端 Zustand Store
- [ ] 创建 `src/features/approval/stores/approvalStore.ts`
- [ ] 实现状态管理
- [ ] 实现数据加载和缓存逻辑

#### Task 3.4: 创建前端 Hook
- [ ] 创建 `src/features/approval/hooks/useApprovalWorkflow.ts`
- [ ] 封装常用审批操作
- [ ] 提供响应式数据访问

#### Task 3.5: 创建模块入口
- [ ] 创建 `src/features/approval/index.ts`
- [ ] 导出所有公共 API

---

## 验收标准

### 功能验收

| # | 验收标准 | 验证方法 |
|---|----------|----------|
| AC-1 | 创建 ApprovalWorkflowEngine 核心类 | 代码审查 + 单元测试 |
| AC-2 | 实现审批流程的定义与存储 | 创建流程后能从数据库查询 |
| AC-3 | 实现审批状态的流转逻辑（待审批→审批中→已通过/已拒绝） | 状态转换单元测试 |
| AC-4 | 添加审批节点的处理逻辑 | 节点创建和流转测试 |
| AC-5 | 实现审批历史记录管理 | 历史记录查询测试 |

### 技术验收

| # | 验收标准 | 验证方法 |
|---|----------|----------|
| TC-1 | 代码编译通过，无 TypeScript/Rust 错误 | `npm run build` + `cargo build` |
| TC-2 | 所有 Tauri 命令正确注册 | 命令列表 API 测试 |
| TC-3 | 数据库表创建成功 | 数据库迁移脚本执行 |
| TC-4 | 前端类型定义完整 | TypeScript 编译检查 |
| TC-5 | 遵循命名约定 `{plugin}_{entity}_{action}` | 代码审查 |

---

## 测试要点

### 单元测试

#### 后端单元测试
- [ ] `ApprovalWorkflowEngine::create_flow` 测试
- [ ] `ApprovalWorkflowEngine::start_instance` 测试
- [ ] `ApprovalWorkflowEngine::submit_approval` 测试
- [ ] `ApprovalStateMachine::can_transition` 测试
- [ ] `ApprovalStateMachine::get_allowed_transitions` 测试
- [ ] 各 CRUD 方法测试

#### 前端单元测试
- [ ] approvalApi 各方法测试
- [ ] approvalStore 状态管理测试
- [ ] 类型定义正确性测试

### 集成测试
- [ ] 完整审批流程测试：创建流程 → 启动实例 → 提交审批 → 审批通过
- [ ] 审批拒绝流程测试
- [ ] 审批取消流程测试
- [ ] 历史记录查询测试

### E2E 测试（根据优先级）
- [ ] 审批工作流端到端测试（如果时间允许）

### 浏览器测试
- [ ] UI 组件渲染测试（后续 Story 实现 UI 后）

---

## 执行顺序

```
1. Phase 0: 完成前置依赖
   └─ Task 101 (后端 Rust Agent 基础架构)
   └─ Story 39.1, 39.2, 42.1

2. Phase 1: 后端基础设施
   ├─ Task 1.1 - 创建后端模块结构
   ├─ Task 1.2 - 定义数据模型
   ├─ Task 1.3 - 实现数据访问层
   ├─ Task 1.4 - 实现状态机
   ├─ Task 1.5 - 实现核心引擎
   ├─ Task 1.6 - 实现错误处理
   └─ Task 1.7 - 实现 Tauri 命令

3. Phase 2: 数据库迁移
   ├─ Task 2.1 - 创建数据库表
   └─ Task 2.2 - 创建索引

4. Phase 3: 前端基础结构
   ├─ Task 3.1 - 创建前端类型定义
   ├─ Task 3.2 - 创建前端 API 封装
   ├─ Task 3.3 - 创建前端 Zustand Store
   ├─ Task 3.4 - 创建前端 Hook
   └─ Task 3.5 - 创建模块入口

5. Phase 4: 测试与验证
   └─ 执行验收标准测试
```

---

## 依赖关系

### 前置依赖
- Task 101 (后端 Rust Agent 基础架构)
- Story 39.1 (基础数据模型定义)
- Story 39.2 (基础权限系统)
- Story 42.1 (基础状态管理框架)

### 被依赖
- Story 54.2 (审批中心 - Agent 集成)
- Story 54.8 (AI 暂存写回与审阅机制)

---

## 估算工作量

| Phase | 任务 | 估算时间 |
|-------|------|----------|
| Phase 1 | 后端基础设施 | 8 小时 |
| Phase 2 | 数据库迁移 | 2 小时 |
| Phase 3 | 前端基础结构 | 4 小时 |
| Phase 4 | 测试与验证 | 4 小时 |
| **总计** | | **18 小时** |
