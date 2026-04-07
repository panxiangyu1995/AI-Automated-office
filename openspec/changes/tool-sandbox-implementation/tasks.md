# Tasks: 工具权限沙箱实现

## 实现类型
- **类型**: enhancement
- **优先级**: high (P1)
- **阶段**: Phase 3 - P1核心

## 任务列表

### Task 1: 创建沙箱模块
- **描述**: 创建ToolSandbox和数据结构
- **文件**:
  - `src-tauri/src/agent/permission/sandbox.rs` (新建)
- **验收**: 基础结构完成

### Task 2: 实现匹配引擎
- **描述**: 实现五种匹配模式
- **文件**:
  - `src-tauri/src/agent/permission/sandbox.rs`
- **验收**: 匹配准确

### Task 3: 实现权限判断
- **描述**: 实现黑白灰名单判断
- **文件**:
  - `src-tauri/src/agent/permission/sandbox.rs`
- **验收**: 符合ADR-022-1

### Task 4: 集成到工具执行管道
- **描述**: 工具执行前检查权限
- **文件**:
  - `src-tauri/src/agent/tools/pipeline.rs`
- **验收**: 未授权工具被阻止

### Task 5: 集成测试
- **描述**: 测试沙箱功能
- **验收**: 测试通过
