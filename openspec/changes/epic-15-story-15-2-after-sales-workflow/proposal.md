# Epic 15 Story 15.2: After-sales 售后工单流程管理

## Why

售后工单的核心价值在于流程规范化。实现完整的工单处理流程可以：
- 明确各环节责任和时限
- 提供透明的进度追踪
- 积累处理数据用于分析优化

## What Changes

实现售后工单完整流程管理，包括：
- 工单创建和自动分配
- 处理记录和时间线追踪
- 工单回访功能
- 工单统计面板

## Capabilities

### New Capabilities
- `after-sales-workflow`: 工单流程管理，支持自动分配、处理记录、回访
- `after-sales-stats`: 工单统计面板，显示处理效率、满意度等指标

### Modified Capabilities
- 无

## Impact
- 前端：新增工作流组件和统计面板
- 后端：新增工作流状态机逻辑
- 依赖：Story 15.1基础架构
