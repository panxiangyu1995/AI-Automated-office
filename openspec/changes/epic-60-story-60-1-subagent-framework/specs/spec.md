# Specification: Subagent 核心框架

## 需求来源

### PRD 需求

| 需求编号 | 描述 |
|----------|------|
| FR890 | 用户可以创建新的Sub-Agent配置 |
| FR891 | 用户可以编辑Sub-Agent的名称和描述 |
| FR892 | 用户可以删除不再需要的Sub-Agent |
| FR893 | 用户可以启用/禁用Sub-Agent |
| FR894 | 用户可以复制现有Sub-Agent创建新配置 |
| FR895 | 用户可以查看Sub-Agent列表和状态 |
| FR896 | 用户可以设置Sub-Agent的调用优先级 |
| FR915 | Sub-Agent可以配置独立的工具权限 |
| FR916 | Sub-Agent可以配置独立的数据范围 |

### 架构约束

| ADR | 描述 |
|-----|------|
| ADR-059 | 部门化 Subagent 架构：插件即 Agent Bundle |
| ADR-013 | Sub-Agent 执行上下文和隔离 |

### UX 规范

| UX | 描述 |
|----|------|
| UX-01 | VSCode 风格四栏布局 |
| UX-04 | 组件使用 Shadcn/ui |

## 功能规格

### 用户故事

As a **用户**,
I want **创建和管理 Personal Subagent**,
So that **我可以为个人工作场景定制专用 Agent**。

As a **管理员**,
I want **部门 Subagent 随插件自动加载**,
So that **部门内的用户可以共享统一的业务处理能力**。

### 验收场景

#### Scenario 1: Department Subagent 加载

- **GIVEN** 用户安装了财务插件
- **WHEN** 用户登录系统
- **THEN** 系统自动加载 finance Subagent
- **AND** 用户可以在对话中触发该 Subagent

#### Scenario 2: Personal Subagent CRUD

- **GIVEN** 用户在设置页面
- **WHEN** 用户点击"新建 Subagent"
- **AND** 填写名称、提示词、工具权限
- **THEN** 系统创建 Personal Subagent 并存储到本地

#### Scenario 3: Subagent 委派

- **GIVEN** 用户发送消息"帮我分析发票"
- **WHEN** 主 Agent 识别到意图
- **THEN** 主 Agent 构建 DelegationContract
- **AND** 调用相应的 Department Subagent

## 数据规格

### 输入

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| name | string | 是 | 唯一性校验，长度 1-64 |
| display_name | string | 是 | 长度 1-128 |
| description | string | 否 | 最大长度 512 |
| model_provider | string | 是 | 必须是已配置 provider |
| model_id | string | 是 | 必须是 provider 支持的模型 |
| prompt | string | 是 | 最大长度 8192 |
| trigger_keywords | string[] | 否 | 最大 50 个关键词 |
| allowed_tools | string[] | 是 | 必须是用户有权限的工具 |
| denied_tools | string[] | 否 | 交集后有效 |

### 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | Subagent 唯一标识 |
| name | string | Subagent 名称 |
| agent_type | AgentType | Subagent 类型 |
| config | AgentConfig | 完整配置 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

## 边界条件

- Subagent 名称不能与现有 Subagent 重名
- Personal Subagent 数量限制（默认最多 10 个/用户）
- 工具权限不能超过用户当前权限范围
- 提示词长度限制 8192 字符

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| SUBAGENT_NOT_FOUND | Subagent 不存在 | 返回 404 |
| SUBAGENT_NAME_DUPLICATED | Subagent 名称已存在 | 提示用户修改 |
| SUBAGENT_LIMIT_EXCEEDED | 超过 Subagent 数量限制 | 提示用户删除旧的 |
| TOOL_PERMISSION_DENIED | 工具权限不足 | 过滤无效工具并警告 |
| INVALID_MODEL | 模型配置无效 | 返回错误详情 |
