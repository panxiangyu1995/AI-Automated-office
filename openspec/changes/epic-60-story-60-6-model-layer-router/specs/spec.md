# Specification: 模型分层与自动路由

## 需求来源

### PRD 需求

| 需求编号 | 描述 |
|----------|------|
| FR915 | Sub-Agent可以配置独立的工具权限 |
| FR916 | Sub-Agent可以配置独立的数据范围 |

### 架构约束

| ADR | 描述 |
|-----|------|
| ADR-059 | 简单任务自动路由到轻量模型 |
| ADR-055 | Plan/Act 双配置模式 |

## 功能规格

### 用户故事

As a **系统**,
I want **根据任务复杂度自动选择模型**,
So that **在保证质量的同时降低成本**。

### 验收场景

#### Scenario 1: OCR 使用轻量模型

- **GIVEN** 用户上传发票图片
- **WHEN** 调用 finance_ocr
- **THEN** 使用 Haiku 模型处理

#### Scenario 2: 复杂推理使用主模型

- **GIVEN** 用户请求生成财务报告
- **WHEN** 调用 finance Subagent
- **THEN** 使用 Sonnet 模型处理

## 模型选择规则

| 任务类型 | 模型 | 温度 |
|----------|------|------|
| OCR | Haiku | 0.3 |
| 简单查询 | Haiku | 0.3 |
| 标题生成 | Haiku | 0.5 |
| 复杂推理 | Sonnet | 0.7 |
| 报表生成 | Sonnet | 0.7 |
