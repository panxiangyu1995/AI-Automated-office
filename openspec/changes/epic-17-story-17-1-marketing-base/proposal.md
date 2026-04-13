# Epic 17 Story 17.1: Marketing 市场宣传模块基础架构

## Why

市场宣传是企业获取客户的重要渠道。当前系统缺少专业的营销管理能力，导致：
- 营销活动分散，难以统一管理
- 内容创作效率低
- 营销效果无法量化

实现市场宣传模块可以：
- 集中管理营销活动
- 规范化内容创作流程
- 追踪营销效果
- 提升获客效率

## What Changes

实现市场宣传模块的基础架构：
- 营销活动管理
- 营销内容管理
- 活动数据统计基础

## Capabilities

### New Capabilities

- `marketing-campaign`: 营销活动管理，支持活动创建、执行追踪
- `marketing-content`: 营销内容管理，支持内容创建、审批
- `marketing-base-ui`: 市场宣传模块前端UI

### Modified Capabilities

- 无

## Impact

- 新增：`src/features/marketing/` - 市场宣传模块前端
- 新增：`src-tauri/src/marketing/` - 市场宣传模块后端
- 依赖：`approval` 模块（内容审批）
