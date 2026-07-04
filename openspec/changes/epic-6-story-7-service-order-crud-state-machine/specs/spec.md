## ADDED Requirements

### Requirement: 售后工单 CRUD 与状态机

As a 售后人员，I want 创建、编辑、删除售后工单并管理状态流转，So that 可以管理售后服务流程。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/service-orders 创建售后工单（创建状态）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 状态流转：创建→报价中→确认→维修中→待签字→已完成

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/service-orders/{order_id} 仅创建状态可删除（软删除）

