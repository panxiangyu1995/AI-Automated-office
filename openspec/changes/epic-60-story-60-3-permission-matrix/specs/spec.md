# Specification: 权限矩阵基础

## 需求来源

### PRD 需求

| 需求编号 | 描述 |
|----------|------|
| FR460 | 用户主Agent及其Sub-Agent在部门上下文下只能调用本部门的内部工具 |
| FR609 | 系统提供敏感操作确认和审计日志记录 |

### 架构约束

| ADR | 描述 |
|-----|------|
| ADR-059 | 部门化 Subagent 架构 |
| ADR-018 | 字段级权限采用后台动态配置 |
| ADR-052 | 权限控制采用三级动作模型 |

## 功能规格

### 用户故事

As a **系统管理员**,
I want **配置角色×部门×能力三维权限矩阵**,
So that **我可以精细控制每个用户的 Agent 能力**。

### 验收场景

#### Scenario 1: 权限计算

- **GIVEN** 用户发起请求
- **WHEN** 调用工具
- **THEN** 系统计算最终权限 = Platform_Base ∪ Department_Capability ∪ Role_Enhancement ∖ Blacklist

#### Scenario 2: 字段过滤

- **GIVEN** 用户请求返回 bank_account 字段
- **WHEN** 用户角色 = staff
- **THEN** 该字段被过滤，不返回

## 边界条件

- 权限配置循环依赖检测
- 权限计算超时限制（100ms）
