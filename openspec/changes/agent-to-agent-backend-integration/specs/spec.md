# Specification: Agent-to-Agent通信后端集成

## 需求来源

### PRD 需求
- FR59: AI Agent可以给其他员工的AI Agent发送消息
- FR60: AI Agent发送重要消息前需员工确认
- FR61: 员工可以查看自己AI Agent的所有发送和接收记录
- FR62: 员工可以设置AI Agent的通信权限
- FR63: 员工可以撤回AI Agent发送的消息
- FR64: AI Agent接收的消息会通知员工并记录到日志
- FR65: AI Agent不能访问员工未授权的数据
- FR66: 系统可以设置Agent间通信的内容审核规则
- FR67: AI Agent可以请求其他Agent的协作
- FR68: 管理员可以配置企业级的Agent通信策略
- FR600: 系统支持统一的参与者ID格式 (human:xx / agent:xx / system:xx / group:xx)
- FR615: Agent间消息不暴露用户私有数据
- FR622: 消息支持已发送、已送达、已读状态
- FR623: Agent消息同样支持状态追踪

### 架构约束
- ARCH-01: 分层微内核架构
- ADR-021: 统一消息系统采用参与者模型

### UX 规范
- UX-01: VSCode风格四栏布局
- UX-04: Shadcn/ui 组件使用

## 功能规格

### 用户故事

As an **Employee**,
I want **我的AI Agent能够与其他员工的AI Agent进行工作通信**,
So that **AI Agent可以代表我与其他AI协作完成任务**。

As an **Employee**,
I want **控制AI Agent的通信权限**,
So that **防止AI Agent发送不当消息**。

### 验收场景

#### Scenario 1: Agent发送消息
- **GIVEN** 用户通过AgentIntercom发送消息
- **WHEN** 消息发送
- **THEN** 消息进入发送队列，接收方Agent收到通知

#### Scenario 2: 消息发送前确认（FR60）
- **GIVEN** Agent配置为需要确认
- **WHEN** Agent准备发送消息
- **THEN** 用户收到确认请求，确认后消息才发送

#### Scenario 3: 权限控制（FR62, FR65）
- **GIVEN** 用户设置了Agent通信权限
- **WHEN** Agent尝试发送消息到未授权接收方
- **THEN** 消息被拒绝，返回权限错误

#### Scenario 4: 消息状态追踪（FR622, FR623）
- **GIVEN** 消息已发送
- **WHEN** 接收方Agent收到并读取消息
- **THEN** 消息状态从"已发送"变为"已送达"再变为"已读"

## 数据规格

### AgentMessage
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | String | 是 | UUID格式 |
| sender_type | String | 是 | human/agent/system |
| sender_id | String | 是 | 非空 |
| receiver_type | String | 是 | 固定为agent |
| receiver_id | String | 是 | 非空 |
| content | String | 是 | 长度1-10000 |
| status | String | 是 | sending/sent/delivered/read |
| requires_confirmation | bool | 否 | 默认false |
| created_at | i64 | 是 | Unix时间戳 |
| delivered_at | Option<i64> | 否 | Unix时间戳 |
| read_at | Option<i64> | 否 | Unix时间戳 |

### AgentPermission
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| agent_id | String | 是 | 非空 |
| can_send_to_agents | bool | 是 | 默认true |
| allowed_receivers | Vec<String> | 否 | 列表 |
| blocked_receivers | Vec<String> | 否 | 列表 |
| content_restrictions | Vec<String> | 否 | 关键词列表 |
| requires_confirmation | bool | 是 | 默认false |

## 边界条件

- 消息内容为空时返回错误
- 接收方Agent不存在时返回错误
- 消息发送超时时返回错误
- 循环消息检测（同一消息发送超过3次）

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| A2A_001 | 权限不足 | 返回错误，提示用户 |
| A2A_002 | 接收方不存在 | 返回错误 |
| A2A_003 | 内容审核失败 | 拒绝发送 |
| A2A_004 | 消息发送超时 | 重试或提示 |
| A2A_005 | 循环消息检测 | 拒绝发送 |
| A2A_006 | 用户拒绝确认 | 不发送，记录日志 |
