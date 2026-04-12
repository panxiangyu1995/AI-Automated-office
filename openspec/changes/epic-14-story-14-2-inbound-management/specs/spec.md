# Specification: Story 14.2 入库操作记录

## 需求来源

### PRD 需求
- FR180: 用户可以管理仓储位置
- FR181: 用户可以记录商品出入库

### 架构约束
- ARCH-03: 部门模块插件化
- ARCH-015: 本地优先存储

## 功能规格

### 用户故事

**As a** 用户,
**I want** 记录入库操作,
**So that** 追踪入库商品。

### 验收场景

#### Scenario 1: 创建入库单
- **GIVEN** 用户在入库管理页面
- **WHEN** 创建入库单
- **THEN** 记录商品信息、数量、供应商
- **AND** 更新库存数量
- **AND** 生成入库记录

#### Scenario 2: 入库单状态流转
- **GIVEN** 用户创建入库单草稿
- **WHEN** 确认入库
- **THEN** 状态变更为已确认
- **AND** 库存数量增加
- **AND** 生成库存流水记录

## 数据规格

### warehouse_inbound

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| inbound_no | string | 是 | 唯一，格式: IN+YYYYMMDD+序号 |
| type | enum | 是 | purchase/return/transfer |
| supplier_id | UUID | 否 | 外键 |
| supplier_name | string | 否 | 最大100字符 |
| warehouse_id | UUID | 是 | 外键 |
| status | enum | 是 | draft/pending/confirmed/cancelled |
| total_quantity | integer | 是 | >= 0 |
| total_amount | decimal | 是 | >= 0 |
| remark | string | 否 | 最大500字符 |
| created_by | UUID | 是 | 外键 |
| created_at | datetime | 是 | 自动生成 |
| updated_at | datetime | 是 | 自动更新 |

### warehouse_inbound_item

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| inbound_id | UUID | 是 | 外键 |
| product_id | UUID | 是 | 外键 |
| location_id | UUID | 是 | 外键 |
| quantity | integer | 是 | > 0 |
| unit_cost | decimal | 是 | >= 0 |
| amount | decimal | 是 | = quantity * unit_cost |
| batch_no | string | 否 | 最大50字符 |
| production_date | date | 否 | 不能超过有效期 |
| expiry_date | date | 否 | 必须大于生产日期 |
| remark | string | 否 | 最大200字符 |

## 边界条件

- 入库数量必须 > 0
- 商品和库位必须存在
- 同一批次号不能重复（如果填写）
- 有效期必须大于生产日期
- 草稿状态可编辑，确认后不可修改

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| INB001 | 入库单不存在 | 提示重新选择 |
| INB002 | 状态不允许操作 | 提示当前状态 |
| INB003 | 商品不存在 | 提示重新选择 |
| INB004 | 库位不存在 | 提示重新选择 |
| INB005 | 数量必须大于0 | 提示输入正数 |
| INB006 | 有效期不能早于生产日期 | 提示修正日期 |
| INB007 | 批次号已存在 | 提示更换批次号 |

## 销售-仓储联动

### 入库来源分类
1. **采购入库**: 来自采购申请
2. **退货入库**: 来自销售退货
3. **调拨入库**: 来自其他仓库调拨

### 库存流水记录
入库确认时生成：
```typescript
{
  type: 'inbound',
  ref_type: 'purchase' | 'return' | 'transfer',
  ref_id: inbound_id,
  product_id: item.product_id,
  location_id: item.location_id,
  quantity: item.quantity,
  before_quantity: old_quantity,
  after_quantity: new_quantity,
  created_at: Date.now()
}
```
