## ADDED Requirements

### Requirement: 销售订单关联合同与出库

As a 销售人员，I want 销售订单绑定合同和出库记录，So that 可以追踪订单关联的合同和发货情况。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/sales-orders/{order_id}/contract 销售订单绑定合同

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/sales-orders/{order_id}/delivery 创建出库记录，出库配件/产品必须与关联合同一致

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 销售订单审批流与合同审批流可独立运行

