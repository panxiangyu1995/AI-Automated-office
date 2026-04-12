# Specification: Story 14.1 库存信息管理

## 需求来源

### PRD 需求
- FR180: 用户可以管理仓储位置
- FR181: 用户可以记录商品出入库
- FR182: 系统可以自动通知仓储部发货

### 架构约束
- ARCH-01: 使用 Tauri + React 技术栈
- ARCH-03: 部门模块插件化
- ARCH-015: 本地优先存储 + 云端同步

### UX 规范
- UX-01: VSCode风格四栏布局
- UX-04: L1-L4 层级系统
- AI即入口: AI对话能触发库存查询

## 功能规格

### 用户故事

**As a** 用户,
**I want** 管理库存信息,
**So that** 了解库存状况。

### 验收场景

#### Scenario 1: 查看库存列表
- **GIVEN** 用户进入库存管理页面
- **WHEN** 系统加载库存列表
- **THEN** 显示商品名称、数量、位置
- **AND** 支持搜索和筛选
- **AND** 支持库存盘点

#### Scenario 2: 搜索库存
- **GIVEN** 用户在库存列表页面
- **WHEN** 输入搜索关键词
- **THEN** 实时过滤显示匹配的商品

#### Scenario 3: 筛选库存
- **GIVEN** 用户在库存列表页面
- **WHEN** 选择分类或库位筛选
- **THEN** 显示筛选后的库存列表

#### Scenario 4: 库存盘点
- **GIVEN** 用户选择商品进行盘点
- **WHEN** 输入实际库存数量
- **THEN** 系统记录盘点前后的差异
- **AND** 更新库存数量

## 数据规格

### warehouse_product

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| name | string | 是 | 最大50字符 |
| sku | string | 是 | 唯一，最大20字符 |
| category | string | 是 | 最大20字符 |
| unit | string | 是 | 枚举: 台/件/箱/个 |
| unit_cost | decimal | 是 | >= 0 |
| min_stock | integer | 否 | >= 0，默认0 |
| max_stock | integer | 否 | >= min_stock |
| created_at | datetime | 是 | 自动生成 |
| updated_at | datetime | 是 | 自动更新 |

### warehouse_inventory

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| product_id | UUID | 是 | 外键 → warehouse_product |
| location_id | UUID | 是 | 外键 → warehouse_location |
| quantity | integer | 是 | >= 0 |
| available_quantity | integer | 是 | >= 0 |
| reserved_quantity | integer | 是 | >= 0 |
| updated_at | datetime | 是 | 自动更新 |

### warehouse_stocktaking

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | UUID | 是 | 自动生成 |
| product_id | UUID | 是 | 外键 → warehouse_product |
| location_id | UUID | 是 | 外键 → warehouse_location |
| before_quantity | integer | 是 | 盘点前数量 |
| after_quantity | integer | 是 | 盘点后数量 |
| adjustment | integer | 是 | 差异 = after - before |
| remark | string | 否 | 最大200字符 |
| created_by | UUID | 是 | 操作人 |
| created_at | datetime | 是 | 自动生成 |

## 边界条件

- 库存数量为0时仍可显示（显示为0）
- 盘点数量为负数时提示错误
- 商品删除时检查是否有库存记录
- 库位删除时检查是否有商品存放

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| INV001 | 商品不存在 | 提示用户重新选择 |
| INV002 | 库位不存在 | 提示用户重新选择 |
| INV003 | 库存不足 | 提示库存不足 |
| INV004 | 盘点数量不能为负 | 提示输入正数 |
| INV005 | 商品已存在 | 提示SKU重复 |

## AI 交互

### AI 查询库存
```
用户: @AI "查看库存"
AI: 返回库存概览卡片，包含：
  - 总商品数
  - 库存预警数
  - 最近入库/出库记录
```

### AI 库存预警
```
用户: @AI "哪些商品库存不足？"
AI: 返回预警列表，包含：
  - 商品名称
  - 当前库存
  - 安全库存
  - 建议补货数量
```
