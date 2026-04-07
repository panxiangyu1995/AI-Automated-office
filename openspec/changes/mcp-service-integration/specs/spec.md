# Specification: MCP服务集成

## 需求来源

### PRD 需求
- FR13: MCP 工具集成
- ARCH-01: 分层微内核架构

### 架构约束
- MCP 协议支持 JSON-RPC 2.0
- 工具调用超时控制

### UX 规范
- UX-01: VSCode风格四栏布局
- UX-04: Shadcn/ui 组件使用

## 功能规格

### 用户故事

As a **用户**,
I want **连接 MCP 服务并使用其提供的工具**,
So that **扩展 AI 助手的能力**。

As a **系统管理员**,
I want **配置和管理 MCP 服务连接**,
So that **控制哪些 MCP 工具可用**。

### 验收场景

#### Scenario 1: 连接 MCP 服务
- **GIVEN** 用户提供了 MCP 服务地址
- **WHEN** 点击连接
- **THEN** 成功连接并显示可用工具

#### Scenario 2: 工具发现
- **GIVEN** MCP 服务已连接
- **WHEN** 调用 mcp_list_tools
- **THEN** 返回所有可用工具

#### Scenario 3: 工具调用
- **GIVEN** 存在已注册的工具
- **WHEN** 通过工具系统调用
- **THEN** 请求转发到 MCP 服务并返回结果

#### Scenario 4: 健康检查
- **GIVEN** MCP 服务已配置
- **WHEN** 定时健康检查
- **THEN** 检测连接状态并更新 UI

## 数据规格

### MCP Server Config
| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | String | 是 | 唯一标识 |
| name | String | 是 | 显示名称 |
| endpoint | String | 是 | 服务地址 |
| auth_token | String | 否 | 认证令牌 |
| enabled | Boolean | 是 | 是否启用 |
| health_check_interval_secs | Number | 否 | 健康检查间隔 |

### MCP Tool
| 字段 | 类型 | 描述 |
|------|------|------|
| name | String | 工具名称 |
| description | String | 工具描述 |
| input_schema | Object | 输入参数 schema |
| output_schema | Object | 输出 schema |

## 边界条件

- MCP 服务地址无效时返回连接错误
- 认证失败时提示重新输入 token
- 超时时间默认 30 秒
- 断连后自动重连（可选）

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| CONN_001 | 连接失败 | 检查地址和网络 |
| CONN_002 | 认证失败 | 提示检查 token |
| CONN_003 | 服务不存在 | 检查服务地址 |
| CALL_001 | 工具不存在 | 返回错误 |
| CALL_002 | 调用超时 | 返回超时错误 |
| CALL_003 | 参数错误 | 返回验证错误 |
