# Specification: Story 14.3 出库操作记录

## 需求来源

### PRD 需求
- FR180: 用户可以管理仓储位置
- FR181: 用户可以记录商品出入库
- FR149: 系统可以自动通知仓储部发货

### 架构约束
- ARCH-03: 部门模块插件化
- ARCH-015: 本地优先存储
- 部门间事件总线联动

## 功能规格

### 用户故事

**As a** 用户,
**I want** 记录出库操作,
**So that** 追踪出库商品。

### 验收场景

#### Scenario 1: 创建出库单
- **GIVEN** 用户在出库管理页面
- **WHEN** 创建出库单
- **THEN** 记录商品信息、数量、去向
- **AND** 更新库存数量
- **AND** 关联销售订单（如有）

#### Scenario 2: 库存不足处理
- **GIVEN** 用户尝试出库但库存不足
- **WHEN** 系统检测
- **THEN** 提示库存不足数量
- **AND** 提供可选方案

#### Scenario 3: 销售关联出库
- **GIVEN** 销售模块发起发货请求
- **WHEN** 仓储收到通知
- **THEN** 自动生成出库单
- **AND** 更新销售订单状态

## 数据规格

### warehouse_outbound

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| outbound_no | string | 是 | 唯一，格式: OUT+YYYYMMDD+序号 |
| type | enum | 是 | sale/return/transfer/damage |
| customer_id | UUID | 否 | 外键 |
| customer_name | string | 否 | 最大100字符 |
| sales_order_id | UUID | 否 | 外键，销售订单 |
| warehouse_id | UUID | 是 | 外键 |
| status | enum | 是 | draft/pending/confirmed/cancelled |
| total_quantity | integer | 是 | >= 0 |
| total_amount | decimal | 是 | >= 0 |
| remark | string | 否 | 最大500字符 |
| created_by | UUID | 是 | 外键 |
| created_at | datetime | 是 | 自动生成 |
| updated_at | datetime | 是 | 自动更新 |

### warehouse_outbound_item

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| outbound_id | UUID | 是 | 外键 |
| product_id | UUID | 是 | 外键 |
| location_id | UUID | 是 | 外键 |
| quantity | integer | 是 | > 0 |
| unit_price | decimal | 否 | >= 0 |
| amount | decimal | 否 | = quantity * unit_price |
| batch_no | string | 否 | 最大50字符 |
| remark | string | 否 | 最大200字符 |

## 边界条件

- 出库数量必须 > 0
- 出库数量不能超过可用库存
- 草稿状态可编辑，确认后不可修改
- 已取消的出库单不可确认
- 关联销售订单时检查订单状态

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| OUT001 | 出库单不存在 | 提示重新选择 |
| OUT002 | 状态不允许操作 | 提示当前状态 |
| OUT003 | 库存不足 | 显示可用数量 |
| OUT004 | 超过可用库存 | 提示最大可出库数量 |
| OUT005 | 关联的销售订单不存在 | 提示检查订单 |
| OUT006 | 销售订单已全部发货 | 提示订单已完成 |

## 销售-仓储联动

### 出库单状态流转
```
draft(草稿) → pending(待确认) → confirmed(已确认) → shipped(已发货)
                         ↘ cancelled(已取消)
```

### 库存流水记录
出库确认时生成：
```typescript
{
  type: 'outbound',
  ref_type: 'sale' | 'return' | 'transfer' | 'damage',
  ref_id: outbound_id,
  product_id: item.product_id,
  location_id: item.location_id,
  quantity: -item.quantity,  // 负数表示出库
  before_quantity: old_quantity,
  after_quantity: new_quantity,
  created_at: Date.now()
}
```

## 财务联动

### 出库完成触发应收款
```
确认出库（type=sale）
    ↓
事件: outbound_confirmed
    ↓
财务模块订阅
    ↓
生成应收款记录
```
