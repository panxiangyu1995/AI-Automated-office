# Epic 18 Story 18.1: Workspace 工作台基础架构

## Why

工作台是用户日常工作的核心区域。借鉴VSCode工作台体验，为用户提供：
- 统一的工作入口
- 任务聚合和快速访问
- 灵活的工作场景切换
- 高效的日清管理

当前系统缺少统一的工作台，用户需要在多个模块间切换才能完成日常工作。

## What Changes

实现工作台基础架构：
- 工作台页面框架
- 日清列表组件
- 任务聚合组件
- 布局预设管理

## Capabilities

### New Capabilities

- `workspace-base`: 工作台基础框架
- `workspace-dashboard`: 个人工作台和日清列表
- `workspace-layout`: 布局预设管理

### Modified Capabilities

- 无

## Impact

- 修改：`src/components/common/Workbench.tsx` - 增强工作台
- 新增：`src/features/workspace/` - 工作台模块
- 依赖：所有业务模块的任务聚合
