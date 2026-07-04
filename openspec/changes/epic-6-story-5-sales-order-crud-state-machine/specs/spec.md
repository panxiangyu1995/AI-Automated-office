## ADDED Requirements

### Requirement: 销售订单 CRUD 与状态机

As a 销售人员，I want 创建、编辑、删除销售订单并管理状态流转，So that 可以管理销售流程。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/sales-orders 创建销售订单（草稿状态），必须关联客户

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 状态按规则流转：草稿→审批中→已确认→已出库→已完成

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/sales-orders/{order_id} 仅草稿状态可删除（软删除）

