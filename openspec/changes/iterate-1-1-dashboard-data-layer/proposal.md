# 迭代变更提案 - Dashboard数据层重构

## 背景

当前DashboardHome组件使用模拟数据，无法真实展示业务数据。PRD要求企业驾驶舱应展示真实业务数据。

## 问题

1. DashboardHome.tsx使用模拟store数据
2. StatCard组件无数据获取逻辑
3. 缺少真实后端API调用

## 目标

重构Dashboard数据层，连接真实后端API。

## 预期效果

- Dashboard展示真实业务数据
- 数据自动刷新
- 加载状态和错误处理完善

## 关联维度

- 需求对齐度: 提升
- 用户体验度: 提升
- 数据价值度: 提升
