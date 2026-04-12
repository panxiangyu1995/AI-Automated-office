# Specification: Story 14.5 物流信息追踪

## 需求来源

### PRD 需求
- FR187: 用户可以追踪物流信息

## 功能规格

### 用户故事

**As a** 用户,
**I want** 追踪物流信息,
**So that** 了解货物运输状态。

### 验收场景

#### Scenario 1: 查询物流
- **GIVEN** 货物已发货
- **WHEN** 查询物流
- **THEN** 显示物流轨迹
- **AND** 显示预计到达时间

## 数据规格

### warehouse_logistics

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| tracking_no | string | 是 | 唯一，最大50字符 |
| carrier | string | 是 | 最大50字符 |
| outbound_id | UUID | 是 | 外键 |
| status | enum | 是 | pending/in_transit/delivered/exception |
| current_location | string | 否 | 最大100字符 |
| estimated_arrival | datetime | 否 | |
| created_at | datetime | 是 | 自动生成 |
| updated_at | datetime | 是 | 自动更新 |

### warehouse_logistics_event

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| logistics_id | UUID | 是 | 外键 |
| time | datetime | 是 | |
| location | string | 是 | 最大100字符 |
| status | string | 是 | 最大50字符 |
| description | string | 否 | 最大200字符 |
