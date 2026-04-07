# Tasks: 检查点系统Runtime集成

## 实现类型
- **类型**: enhancement
- **优先级**: critical (P0)
- **阶段**: Phase 3 - P0核心

## 任务列表

### Task 1: 创建CheckpointService
- **描述**: 创建检查点服务，整合CheckpointStore
- **文件**:
  - `src-tauri/src/agent/checkpoint.rs` (新建)
- **验收**: 服务可以创建和获取检查点

### Task 2: 实现自动检查点创建
- **描述**: 在消息发送时自动创建检查点
- **文件**:
  - `src-tauri/src/agent/execution.rs`
- **验收**: 符合FR17-1

### Task 3: 实现Git提交集成
- **描述**: 检查点创建时自动Git提交
- **文件**:
  - `src-tauri/src/agent/git_manager.rs` (新建)
- **验收**: 符合FR17-3, FR17-14-FR17-17

### Task 4: 实现回滚功能
- **描述**: 实现两种回滚模式
- **文件**:
  - `src-tauri/src/agent/checkpoint.rs`
- **验收**: 符合FR17-6-FR17-10

### Task 5: 实现编辑重试分支
- **描述**: 从历史检查点编辑并重新发送
- **文件**:
  - `src-tauri/src/agent/checkpoint.rs`
- **验收**: 符合FR17-11-FR17-13

### Task 6: 添加检查点管理Tauri命令
- **描述**: 注册所有检查点相关命令
- **文件**:
  - `src-tauri/src/lib.rs`
- **验收**: 前端可以调用检查点功能

### Task 7: 集成测试
- **描述**: 测试检查点创建和回滚
- **验收**: 集成测试通过
