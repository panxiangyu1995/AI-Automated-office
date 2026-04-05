# Tasks: Subagent 核心框架

## 实现类型

- **类型**: new
- **优先级**: critical
- **阶段**: Phase 1 - 基础框架

## 任务列表

### Task 1: 创建目录结构和类型定义

- **描述**: 创建 `src-tauri/src/agent/subagent/` 目录结构，实现核心类型定义
- **文件**:
  - `src-tauri/src/agent/subagent/mod.rs`
  - `src-tauri/src/agent/subagent/types.rs`
  - `src/features/agent/types/subagent.ts`
- **验收**:
  - [ ] 类型定义完整，包含 AgentType、AgentMode、AgentConfig 等
  - [ ] DelegationContract 委派协议定义正确
  - [ ] 序列化/反序列化实现正确
  - [ ] TypeScript 类型与 Rust 类型一致

### Task 2: 实现 Department Subagent 加载器

- **描述**: 实现从插件 manifest 加载 Department Subagent 的加载器
- **文件**:
  - `src-tauri/src/agent/subagent/department_loader.rs`
- **验收**:
  - [ ] 从插件 manifest 正确读取 subagent 配置
  - [ ] SubagentLoader trait 实现正确
  - [ ] 集成到 PluginManager

### Task 3: 实现 Personal Subagent 加载器

- **描述**: 实现从 SQLite 加载 Personal Subagent 的加载器
- **文件**:
  - `src-tauri/src/agent/subagent/personal_loader.rs`
- **验收**:
  - [ ] 数据库表创建脚本正确
  - [ ] CRUD 操作实现正确
  - [ ] 权限过滤正确（只能加载自己的 Agent）

### Task 4: 实现 Subagent Manager

- **描述**: 实现统一管理所有 Subagent 的 Manager
- **文件**:
  - `src-tauri/src/agent/subagent/manager.rs`
- **验收**:
  - [ ] 统一加载 Department 和 Personal Subagent
  - [ ] 根据用户权限过滤可用 Subagent
  - [ ] 提供查询接口

### Task 5: 注册 Tauri Commands

- **描述**: 注册 Subagent 相关的 Tauri 命令
- **文件**:
  - `src-tauri/src/commands/subagent.rs`
- **验收**:
  - [ ] `get_available_subagents` 命令
  - [ ] `get_subagent_config` 命令
  - [ ] `create_personal_subagent` 命令
  - [ ] `update_personal_subagent` 命令
  - [ ] `delete_personal_subagent` 命令

### Task 6: 集成测试

- **描述**: 编写集成测试验证 Subagent 加载和查询功能
- **文件**:
  - `tests/integration/agent/subagent_framework.rs`
- **验收**:
  - [ ] Department Subagent 加载测试通过
  - [ ] Personal Subagent CRUD 测试通过
  - [ ] 权限过滤测试通过

## 测试要点

### 单元测试

- [ ] AgentConfig 序列化/反序列化测试
- [ ] DelegationContract 构建测试
- [ ] ToolConstraint 验证测试

### 集成测试

- [ ] Department Subagent 从插件加载
- [ ] Personal Subagent CRUD 操作
- [ ] Subagent Manager 权限过滤

### E2E 测试

- [ ] 用户创建 Personal Subagent 并触发
- [ ] Department Subagent 被正确委派

### 浏览器测试

- [ ] Subagent 配置 UI 能正确显示
- [ ] Personal Subagent 创建表单验证
