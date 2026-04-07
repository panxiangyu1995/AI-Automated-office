# Tasks: 部门模块基础框架

## 实现类型
- **类型**: new
- **优先级**: critical
- **阶段**: Phase 1 - 部门模块基础

## 任务列表

### Task 1: 创建部门数据模型
- **描述**: 定义 DepartmentPackage、DepartmentLoader 等核心类型
- **文件**: 
  - `src/features/department/types/department.ts`
  - `src-tauri/src/department/types.rs`
- **验收**: 类型定义完整，包含所有必要字段

### Task 2: 实现部门注册表
- **描述**: 实现部门注册表，支持注册、查询、注销
- **文件**: `src-tauri/src/department/registry.rs`
- **验收**: 
  - 可以注册新部门
  - 可以查询已注册部门
  - 可以注销部门

### Task 3: 实现部门加载器
- **描述**: 实现部门加载器，支持加载和卸载部门
- **文件**: `src-tauri/src/department/loader.rs`
- **验收**:
  - 可以加载部门能力包
  - 可以卸载部门能力包
  - 加载状态可查询

### Task 4: 实现部门间通信
- **描述**: 实现部门间消息通信机制
- **文件**: `src-tauri/src/department/message.rs`
- **验收**:
  - 可以发送消息
  - 可以订阅消息
  - 支持请求/响应模式

### Task 5: 创建 Tauri 命令
- **描述**: 创建部门管理的 Tauri IPC 命令
- **文件**: `src-tauri/src/department/commands.rs`
- **验收**:
  - 所有 API 端点对应命令存在
  - 命令可以正常调用

### Task 6: 创建前端 Store
- **描述**: 创建部门管理的 Zustand Store
- **文件**: `src/features/department/stores/departmentStore.ts`
- **验收**:
  - 状态管理正常
  - 支持持久化

### Task 7: 创建部门管理 UI
- **描述**: 创建部门列表和详情页面
- **文件**: `src/features/department/components/`
- **验收**:
  - 可以查看部门列表
  - 可以查看部门详情
  - 支持启用/禁用操作

## 测试要点

- [x] 单元测试
  - 部门注册表单元测试
  - 部门加载器单元测试
  - 部门消息单元测试

- [x] 集成测试
  - 部门 CRUD 集成测试
  - 部门通信集成测试

- [x] E2E 测试
  - 部门管理页面 E2E

- [x] 浏览器测试
  - 部门列表页面渲染
  - 部门详情页面交互
