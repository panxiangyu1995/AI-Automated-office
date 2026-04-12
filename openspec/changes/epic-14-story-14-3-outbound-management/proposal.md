---
schema: spec-driven
created: 2026-04-12
epic: Epic 14
story: Story 14.3
phase: Phase 5 - 核心部门模块
priority: high
status: draft
---

# Proposal: Story 14.3 出库操作记录

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

出库操作是仓储管理的核心功能之一，与销售模块紧密关联。出库可以关联销售订单，扣减库存，并通知财务模块生成应收款。

## 目标

实现出库操作记录功能：
- 创建出库单
- 记录商品信息、数量、去向
- 更新库存数量
- 关联销售订单（如有）

## 范围

### 包含
- 出库单创建
- 出库商品明细
- 库存自动扣减
- 关联销售订单

### 不包含
- 销售订单创建（Epic 15）
- 物流追踪（Story 14.5）

## 影响范围

### 前端
- `src/features/warehouse/` - 仓库模块扩展
- `src/features/sales/` - 销售模块（关联）

### 后端
- `src-tauri/src/commands/warehouse.rs` - 出库相关命令

### 数据库
- `warehouse_outbound` - 出库单表
- `warehouse_outbound_item` - 出库明细表
- `warehouse_sales_outbound` - 销售出库关联表

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 库存不足 | 中 | 高 | 出库前检查库存 |
| 超卖 | 低 | 高 | 使用事务 + 乐观锁 |
| 销售关联失败 | 低 | 中 | 允许独立出库 |

## 依赖

- **前置依赖**: Story 14.1 库存信息管理, Story 14.2 入库操作
- **后置依赖**: Story 14.7 销售发货通知接收
