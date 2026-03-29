# Proposal: workspace-data-model

## Why

当前系统的工作区（Workbench）只是一个静态布局容器，PRD 中定义的"工作区与项目管理"功能（FR1000-FR1006）完全未实现。系统缺乏多工作区管理、项目隔离、布局预设等核心能力，无法满足企业级多项目协作的需求。

## What Changes

- 新增 `Workspace` 数据模型，支持多工作区隔离
- 新增 `Project` 数据模型，工作区内的项目抽象
- 新增 `WorkspaceMember` 数据模型，工作区成员与角色关联
- 实现工作区 CRUD 操作（创建、查询、更新、删除）
- 实现工作区切换功能
- 持久化当前工作区上下文到 uiStore

## Capabilities

### New Capabilities

- `workspace-entity`: 工作区实体定义，包含名称、描述、创建者、创建时间、设置等
- `project-entity`: 项目实体定义，包含名称、所属工作区、状态（活跃/归档）、工具配置、权限配置等
- `workspace-membership`: 工作区成员关系，关联用户与工作区，定义角色
- `workspace-crud`: 工作区增删改查 API 和前端组件
- `workspace-switching`: 工作区切换机制，切换后更新全局上下文
- `workspace-persistence`: 工作区状态持久化，包括当前工作区ID

## Impact

- 新增 `src/stores/workspaceStore.ts` - 工作区状态管理
- 新增 `src/features/workspace/` - 工作区功能模块
- 修改 `src/stores/uiStore.ts` - 集成工作区上下文
- 需要云端 API 支持工作区和项目的 CRUD
- 影响范围：前端状态管理、部门模块权限、布局预设系统
