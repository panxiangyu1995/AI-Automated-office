# Specification: Story 14.4 库存预警

## 需求来源

### PRD 需求
- FR186: 用户可以查看库存预警

## 功能规格

### 用户故事

**As a** 用户,
**I want** 查看库存预警,
**So that** 及时补货。

### 验收场景

#### Scenario 1: 查看预警列表
- **GIVEN** 库存低于安全库存
- **WHEN** 系统检测
- **THEN** 发送预警通知
- **AND** 显示预警商品列表
- **AND** 建议补货数量

## 数据规格

### warehouse_warning (预警记录)

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| product_id | UUID | 是 | 外键 |
| location_id | UUID | 是 | 外键 |
| current_quantity | integer | 是 | >= 0 |
| min_stock | integer | 是 | >= 0 |
| max_stock | integer | 是 | >= min_stock |
| level | enum | 是 | info/warning/critical |
| type | enum | 是 | low/high/expiring |
| is_read | boolean | 是 | 默认false |
| is_resolved | boolean | 是 | 默认false |
| resolved_at | datetime | 否 | 解决时间 |
| created_at | datetime | 是 | 自动生成 |

## 边界条件

- 多个库位同一商品只显示最低库存的库位
- 预警解决后记录保留作为历史

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| WRN001 | 暂无预警 | 显示"库存状态良好" |
| WRN002 | 商品不存在 | 提示刷新页面 |

## AI 交互

### 主动预警
```
系统自动检测 → 发现库存不足
    ↓
推送卡片:
"⚠️ 库存预警
电脑库存5台，低于安全库存10台
[查看详情] [忽略]"
```

### 查询预警
```
用户: @AI "哪些商品需要补货？"
AI: 返回补货建议列表
```
