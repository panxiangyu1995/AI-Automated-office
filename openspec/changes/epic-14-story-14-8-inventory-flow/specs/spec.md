# Specification: Story 14.8 库存流水记录

## 需求来源

### PRD 需求
- FR188: 用户可以查看库存流水记录

## 功能规格

### 用户故事

**As a** 用户,
**I want** 查看库存流水记录,
**So that** 追溯库存变动。

### 验收场景

#### Scenario 1: 查看流水
- **GIVEN** 用户查看流水
- **WHEN** 显示流水列表
- **THEN** 记录每次变动时间、类型、数量
- **AND** 支持按时间范围筛选
- **AND** 可导出流水记录

## 数据规格

### warehouse_movement

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| type | enum | 是 | inbound/outbound/stocktaking/adjustment |
| ref_type | string | 是 | 最大20字符 |
| ref_id | UUID | 是 | 对应单据ID |
| product_id | UUID | 是 | 外键 |
| location_id | UUID | 是 | 外键 |
| quantity | integer | 是 | 正数入库，负数出库 |
| before_quantity | integer | 是 | 变动前数量 |
| after_quantity | integer | 是 | 变动后数量 |
| remark | string | 否 | 最大200字符 |
| created_by | UUID | 是 | 外键 |
| created_at | datetime | 是 | 自动生成 |
