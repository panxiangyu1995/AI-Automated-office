# Specification: MCP模块-Transport层策略模式重构

## 需求来源

### 架构约束
- **ARCH-01**: 分层微内核架构 - Presentation Layer → Agent Core Layer → Plugin Layer → Data Layer → Cloud Layer
- MCP模块属于Agent Core Layer的Tool子系统

### SOLID原则
- **SRP（单一职责）**: 当前MCPClient承担了多种Transport实现，违反SRP
- **OCP（开闭原则）**: 添加新Transport需要修改MCPClient，违反OCP
- **DIP（依赖倒置）**: 应依赖抽象（Trait）而非具体实现

## 功能规格

### 用户故事

As a 开发者,
I want MCP模块支持多种传输方式,
So that 可以灵活对接不同的MCP服务（本地进程/HTTP服务/WebSocket服务）。

### 验收场景

#### Scenario 1: 创建Transport trait

- **GIVEN** 需要添加新的传输方式
- **WHEN** 开发者实现Transport trait
- **THEN** 新传输方式可被MCPClient使用，无需修改MCPClient代码

#### Scenario 2: 使用StdioTransport

- **GIVEN** 配置指定STDIO传输
- **WHEN** 调用`mcp_add_service`添加服务
- **THEN** 系统使用StdioTransport启动本地进程并通信

#### Scenario 3: 使用HttpTransport

- **GIVEN** 配置指定HTTP传输
- **WHEN** 调用`mcp_call_tool`执行工具
- **THEN** 系统通过HTTP POST请求调用远程MCP服务

#### Scenario 4: 使用WebSocketTransport

- **GIVEN** 配置指定WebSocket传输
- **WHEN** 调用`mcp_call_tool`执行工具
- **THEN** 系统通过WebSocket与远程MCP服务通信

## 接口规格

### Transport Trait

```rust
pub trait Transport: Send + Sync {
    async fn start(&self) -> Result<(), TransportError>;
    async fn stop(&self) -> Result<(), TransportError>;
    async fn call(&self, request: MCPRequest) -> Result<MCPResponse, TransportError>;
    fn transport_type(&self) -> MCPTransportType;
    fn is_connected(&self) -> bool;
}
```

### TransportFactory

```rust
impl TransportFactory {
    pub fn create(config: &MCPServiceConfig) -> Box<dyn Transport>;
}
```

## 数据规格

### 输入

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| MCPServiceConfig.transport | MCPTransportType | 是 | 枚举值：Stdio/Http/WebSocket |
| MCPServiceConfig.command | Option<String> | Stdio传输时必填 | 非空字符串 |
| MCPServiceConfig.url | Option<String> | Http传输时必填 | 有效URL格式 |
| MCPServiceConfig.ws_url | Option<String> | WebSocket传输时必填 | 有效ws://格式 |

### 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| TransportError | enum | 传输层错误类型 |
| MCPResponse | enum | MCP协议响应 |

## 边界条件

1. **STDIO进程启动失败**: 返回ConnectionFailed错误
2. **HTTP服务不可达**: 返回RequestFailed错误，包含HTTP状态码
3. **WebSocket连接断开**: 返回NotConnected错误
4. **请求超时**: 返回Timeout错误
5. **响应格式错误**: 返回InvalidResponse错误

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| TransportError::NotConnected | "Transport not connected" | 自动重连或返回错误 |
| TransportError::ConnectionFailed | "Connection failed: {reason}" | 记录日志，返回ServiceResponse::err |
| TransportError::RequestFailed | "Request failed: {reason}" | 记录日志，返回ServiceResponse::err |
| TransportError::Timeout | "Request timeout" | 增加超时时间或返回错误 |
| TransportError::InvalidResponse | "Invalid response: {reason}" | 记录日志，返回错误 |

## 约束条件

1. **向后兼容**: 所有现有Tauri命令接口保持不变
2. **线程安全**: Transport trait必须是Send + Sync
3. **异步设计**: 所有IO操作使用async/await
4. **错误处理**: 使用Result类型，不得使用unwrap()

## 验收标准

- [ ] Transport trait定义符合async-trait规范
- [ ] StdioTransport能正常启动本地进程并通信
- [ ] HttpTransport能正常发送HTTP请求并接收响应
- [ ] WebSocketTransport能正常建立WebSocket连接并通信
- [ ] TransportFactory能根据配置创建正确的Transport
- [ ] MCPClient重构后功能与重构前完全一致
- [ ] 所有Transport实现支持graceful shutdown
- [ ] 单元测试覆盖率达到80%以上
- [ ] cargo clippy无警告
