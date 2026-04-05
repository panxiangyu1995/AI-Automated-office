# Specification: Personal Subagent CRUD

## 需求来源

### PRD 需求

| 需求编号 | 描述 |
|----------|------|
| FR890 | 用户可以创建新的Sub-Agent配置 |
| FR891 | 用户可以编辑Sub-Agent的名称和描述 |
| FR892 | 用户可以删除不再需要的Sub-Agent |
| FR893 | 用户可以启用/禁用Sub-Agent |
| FR894 | 用户可以复制现有Sub-Agent创建新配置 |

### 架构约束

| ADR | 描述 |
|-----|------|
| ADR-059 | Personal Agent 仅本地存储 |

## 功能规格

### 用户故事

As a **用户**,
I want **创建和管理个人专属的 Subagent**,
So that **我可以为特殊场景定制 Agent 能力**。

### 验收场景

#### Scenario 1: 创建 Personal Subagent

- **GIVEN** 用户填写 Subagent 配置
- **WHEN** 点击创建
- **THEN** 系统验证工具权限后保存到本地

#### Scenario 2: 权限限制

- **GIVEN** 用户选择的工具超出主 Agent 权限
- **WHEN** 保存时
- **THEN** 系统过滤无效工具并提示

## 边界条件

- 名称唯一性
- 数量限制（最多 10 个/用户）
- 导入导出格式验证
