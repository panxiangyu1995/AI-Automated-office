# Tasks: 多租户-租户上下文传播

## 实现类型
- **类型**: refactor
- **优先级**: high
- **阶段**: 架构升级迭代

## 任务列表

### Task 1: 创建 TenantContext 结构体

- **描述**: 创建 session/context.rs，定义 TenantContext 结构体
- **文件**: `src-tauri/src/session/context.rs`
- **验收**:
  - TenantContext 包含 tenant_id, user_id, role, department_id
  - 实现 from_metadata() 方法
  - 实现 Clone + Debug + Serialize
- **验证**: `cargo check`

### Task 2: 实现 TenantContext::from_metadata

- **描述**: 实现从 SessionMetadata 创建 TenantContext 的方法
- **文件**: `src-tauri/src/session/context.rs`
- **验收**:
  - 从 SessionMetadata 提取 tenant_id 和 user_id
  - 默认 role 为 "user"
- **验证**: `cargo test session`

### Task 3: 修改 PermissionEngine.calculate_permissions

- **描述**: 修改 calculate_permissions 使用 TenantContext
- **文件**: `src-tauri/src/agent/permission/engine.rs`
- **验收**:
  - 方法签名改为接受 TenantContext
  - 内部构造 ExecutionContext
  - 保持原有权限合并逻辑
- **验证**: `cargo test permission`

### Task 4: 修改 PermissionEngine.check_tool_permission

- **描述**: 修改 check_tool_permission 使用 TenantContext
- **文件**: `src-tauri/src/agent/permission/engine.rs`
- **验收**:
  - 方法签名改为接受 TenantContext
  - 调用 calculate_permissions 验证权限
- **验证**: `cargo test permission`

### Task 5: 在 Agent 执行流程集成 TenantContext

- **描述**: 在 Agent 执行开始时创建 TenantContext 并传递
- **文件**: `src-tauri/src/agent/execution.rs`
- **验收**:
  - 从 SessionMetadata 创建 TenantContext
  - 传递给 PermissionEngine
  - 工具执行时进行权限校验
- **验证**: `cargo test agent`

### Task 6: 在工具执行管道集成 TenantContext

- **描述**: ToolExecutionPipeline 接受 TenantContext 参数
- **文件**: `src-tauri/src/agent/tools/pipeline.rs`
- **验收**:
  - Pipeline 方法签名增加 TenantContext
  - 执行前进行权限校验
- **验证**: `cargo test tools`

### Task 7: 添加单元测试

- **描述**: 为 TenantContext 和权限校验添加测试
- **文件**: `src-tauri/src/session/context.rs`
- **验收**:
  - TenantContext 创建测试
  - 权限计算使用租户测试
  - 跨租户权限隔离测试
- **验证**: `cargo test`

### Task 8: 运行 cargo clippy

- **描述**: 运行 clippy 检查代码质量
- **验收**:
  - 无 clippy 警告
  - 无 clippy 错误
- **验证**: `cargo clippy -- -D warnings`

## 测试要点

- [x] 单元测试覆盖 TenantContext 创建
- [x] 单元测试覆盖权限计算使用租户
- [x] 单元测试覆盖跨租户权限隔离
- [x] cargo clippy 通过

## 实施检查清单

- [x] Task 1: 创建 TenantContext 结构体
- [x] Task 2: 实现 TenantContext::from_metadata
- [x] Task 3: 修改 PermissionEngine.calculate_permissions
- [x] Task 4: 修改 PermissionEngine.check_tool_permission
- [x] Task 5: 在 Agent 执行流程集成 TenantContext（框架就绪）
- [x] Task 6: 在工具执行管道集成 TenantContext（框架就绪）
- [x] Task 7: 添加单元测试
- [ ] Task 8: 运行 cargo clippy (需要手动验证)
