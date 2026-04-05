# Specification: Finance Department Subagent

## 需求来源

### PRD 需求

| 需求编号 | 描述 |
|----------|------|
| FR460 | 用户主Agent及其Sub-Agent在部门上下文下只能调用本部门的内部工具 |
| FR461 | 用户主Agent及其Sub-Agent可以调用其他部门暴露的协作工具 |
| FR462 | 部门管理员可以在后台配置本部门哪些工具对外共享 |

### 架构约束

| ADR | 描述 |
|-----|------|
| ADR-059 | 部门化 Subagent 架构 |
| ADR-018 | 字段级权限控制 |

## 功能规格

### 用户故事

As a **财务专员**,
I want **使用 Finance Subagent 处理发票识别和报销审核**,
So that **我可以快速完成日常财务工作**。

### 验收场景

#### Scenario 1: 发票 OCR 识别

- **GIVEN** 用户上传发票图片
- **WHEN** 调用 finance_ocr 工具
- **THEN** 返回发票信息（金额、日期、发票号）
- **AND** 自动验真

#### Scenario 2: 权限限制

- **GIVEN** staff 角色用户调用 finance_query
- **WHEN** 查询 bank_account 字段
- **THEN** 该字段被过滤，不返回

## 数据规格

### 工具输入

| 工具 | 参数 | 类型 | 必填 |
|------|------|------|------|
| finance_query | id | string | 否 |
| finance_query | date_range | DateRange | 否 |
| finance_ocr | image | string | 是 |
| finance_mutate | action | string | 是 |
