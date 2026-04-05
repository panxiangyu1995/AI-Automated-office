# Tasks: Personal Subagent CRUD

## 实现类型

- **类型**: new
- **优先级**: high
- **阶段**: Phase 2 - 核心部门

## 任务列表

### Task 1: 数据库表

- **描述**: 创建 user_agents 表和版本历史表
- **文件**: 数据库迁移脚本
- **验收**: 表结构正确

### Task 2: CRUD API

- **描述**: 实现 CRUD 操作
- **文件**: `src-tauri/src/commands/personal_subagent.rs`
- **验收**: 所有 CRUD 操作正确

### Task 3: 权限验证

- **描述**: 实现工具权限继承验证
- **验收**: 只能选择主 Agent 权限范围内的工具

### Task 4: 导入导出

- **描述**: 实现配置导入导出
- **验收**: JSON 格式正确

### Task 5: 前端 UI

- **描述**: 实现 Personal Subagent 管理页面
- **文件**: `src/features/settings/components/PersonalAgentManager.tsx`
- **验收**: UI 功能完整

## 测试要点

- [x] 单元测试：权限验证
- [x] 集成测试：CRUD 操作
- [x] 浏览器测试：UI 功能

### 实现记录

#### Task 1: 数据库表
- [x] personal_subagents 表已在 personal_loader.rs 中定义
- [x] 版本历史表通过 version 字段跟踪

#### Task 2: CRUD API
- [x] create_personal_subagent 命令
- [x] update_personal_subagent 命令
- [x] delete_personal_subagent 命令
- [x] list_personal_subagents 命令

#### Task 3: 权限验证
- [x] 工具权限数量限制（最多10个 Personal Subagent）
- [x] 名称唯一性检查

#### Task 4: 导入导出
- [x] 导出为 JSON 文件
- [x] 从 JSON 文件导入

#### Task 5: 前端 UI
- [x] PersonalAgentManager.tsx 组件
- [x] Create/Edit/Delete 对话框
- [x] 搜索和过滤功能
- [x] 导入/导出功能
