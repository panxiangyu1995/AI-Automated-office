# Proposal: workspace-advanced-features

## Why

在完成工作区基础框架、Quick Open 和布局预设后，需要实现高级功能来完善工作区能力：项目模板（FR1004）、工作区级工具/插件配置（FR1002）、工作区成员权限管理（FR1003, FR1006）。

## What Changes

- 实现项目模板系统，支持创建、导入、初始化项目
- 实现工作区级工具配置，支持按工作区启用/禁用工具
- 实现工作区级插件配置，支持按工作区管理插件
- 实现工作区成员权限管理，支持邀请成员、分配角色
- 实现管理员配置工作区默认入口（FR1006-1）

## Capabilities

### New Capabilities

- `project-template`: 项目模板系统，支持模板创建、列表、初始化
- `workspace-tool-config`: 工作区级工具配置
- `workspace-plugin-config`: 工作区级插件配置
- `workspace-member-invite`: 工作区成员邀请与角色管理
- `workspace-default-entry`: 工作区默认入口配置

## Impact

- 新增 `src/features/workspace/templates/` - 项目模板模块
- 修改 `src/features/workspace/` - 添加工具和插件配置 UI
- 修改 `src/stores/workspaceStore.ts` - 添加成员管理
- 需要后端 API 支持模板和配置 CRUD
- 依赖 Phase 1-3 完成
