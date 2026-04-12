# Specification: Story 14.6 仓储位置管理

## 需求来源

### PRD 需求
- FR185: 用户可以管理仓储位置

## 功能规格

### 用户故事

**As a** 用户,
**I want** 管理仓储位置,
**So that** 优化仓储空间。

### 验收场景

#### Scenario 1: 创建库位
- **GIVEN** 用户进入位置管理
- **WHEN** 设置仓储位置
- **THEN** 可创建库位
- **AND** 可分配商品到库位

## 数据规格

### warehouse_location

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| code | string | 是 | 唯一，最大20字符 |
| name | string | 是 | 最大50字符 |
| zone | string | 是 | 最大20字符 |
| aisle | string | 是 | 最大10字符 |
| position | string | 是 | 最大10字符 |
| capacity | integer | 是 | > 0 |
| current_count | integer | 是 | >= 0 |
| status | enum | 是 | available/full/disabled |
| remark | string | 否 | 最大200字符 |
| created_at | datetime | 是 | 自动生成 |
| updated_at | datetime | 是 | 自动更新 |

## 边界条件

- 库位编码唯一
- 库位满时禁止分配新商品
- 禁用库位不可使用
