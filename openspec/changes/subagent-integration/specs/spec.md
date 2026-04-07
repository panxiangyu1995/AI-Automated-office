# Specification: SubAgent完整集成

## 需求来源

### PRD 需求
- FR930: SubAgent 委派机制
- FR931: 意图路由与匹配
- FR932: SubAgent 执行与结果返回
- FR933: 权限继承与约束
- FR934: SubAgent 配置管理

### 架构约束
- ARCH-01: 分层微内核架构
- ADR-059: 部门化 Subagent 架构

### UX 规范
- UX-01: VSCode风格四栏布局
- UX-04: Shadcn/ui 组件使用

## 功能规格

### 用户故事

As a **主 Agent**,
I want **在处理用户请求时自动识别需要委派的意图**,
So that **将复杂任务委派给专业 SubAgent 执行，提高处理效率**。

As a **用户**,
I want **配置和管理 SubAgent**,
So that **定制化我的 AI 助手能力**。

### 验收场景

#### Scenario 1: 自动路由委派
- **GIVEN** 用户发送一条涉及财务报销的消息
- **WHEN** 主 Agent 分析消息意图
- **THEN** 自动路由到 Finance SubAgent 执行

#### Scenario 2: 手动确认委派
- **GIVEN** 路由置信度为中等
- **WHEN** 系统展示委派建议
- **THEN** 用户确认后执行委派

#### Scenario 3: 权限收缩
- **GIVEN** 主 Agent 有 10 个��具权限，Finance SubAgent 声明需要 5 个
- **WHEN** 执行委派
- **THEN** Finance SubAgent 仅能使用 5 个工具（交集）

#### Scenario 4: 超时处理
- **GIVEN** SubAgent 执行超时
- **WHEN** 超时触发
- **THEN** 返回超时错误，主 Agent 接管处理

## 数据规格

### 输入
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| message | String | 是 | 长度 1-10000 |
| subagent_id | String | 是 | 存在于注册表 |
| timeout_seconds | Number | 否 | 默认 300，最小 10，最大 3600 |

### 输出
| 字段 | 类型 | 描述 |
|------|------|------|
| delegation_id | String | 委派唯一标识 |
| subagent_id | String | 执行委派的 SubAgent ID |
| result | String | 执行结果内容 |
| execution_time_ms | Number | 执行耗时（毫秒） |
| status | String | success/timeout/error |

## 边界条件

- 消息为空时返回错误
- SubAgent ID 不存在时返回错误
- 超时时间超出限制时使用默认值
- 循环委派检测（最大深度 3）

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| ROUTE_001 | 路由决策失败 | 回退到主 Agent |
| DELEG_001 | SubAgent 不存在 | 返回配置错误 |
| DELEG_002 | 委派超时 | 返回超时结果，提供重试 |
| DELEG_003 | 权限不足 | 返回权限错误 |
| DELEG_004 | 循环委派检测 | 拒绝委派 |
