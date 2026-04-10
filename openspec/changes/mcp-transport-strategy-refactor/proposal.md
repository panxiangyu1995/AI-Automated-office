# Proposal: MCP模块-Transport层策略模式重构

## 变更类型

- [ ] 新功能
- [x] 架构优化
- [ ] 性能优化
- [ ] 代码重构

## 背景

当前`MCPClient`将STDIO、HTTP、WebSocket三种传输方式混在一个结构体中实现，违反了单一职责原则。根据WebSearch最佳实践（turbomcp、Rustify），应使用策略模式分离Transport实现。

**现有问题：**
1. HTTP和WebSocket传输层是mock实现
2. 所有transport逻辑耦合在`MCPClient`中
3. 难以独立测试各transport实现
4. 难以扩展新的transport类型

## 优化目标

将Transport层重构为策略模式：
1. 定义`Transport` trait作为抽象接口
2. 实现`StdioTransport`替换现有start_stdio
3. 实现`HttpTransport`替换mock实现
4. 实现`WebSocketTransport`替换mock实现
5. `MCPClient`委托给具体Transport实现

## 功能不变性保证

**必须保持的功能点：**
1. Tauri命令接口不变（`mcp_add_service`, `mcp_call_tool`等）
2. `MCPServiceConfig`结构不变
3. `MCPToolResult`响应格式不变
4. `MCPTransportType`枚举不变
5. 服务生命周期管理逻辑不变

## 优化方案

### 1. 定义Transport Trait

```rust
/// Transport trait - 抽象传输层接口
pub trait Transport: Send + Sync {
    /// 启动传输层
    async fn start(&self) -> Result<(), String>;
    
    /// 停止传输层
    async fn stop(&self) -> Result<(), String>;
    
    /// 发送请求并接收响应
    async fn call(&self, request: MCPRequest) -> Result<MCPResponse, String>;
    
    /// 获取传输类型
    fn transport_type(&self) -> MCPTransportType;
    
    /// 检查是否连接
    fn is_connected(&self) -> bool;
}
```

### 2. 实现StdioTransport

基于现有的`start_stdio`实现：
- 使用`tokio::process::Command`启动子进程
- 使用`BufReader`读写stdin/stdout
- 实现JSON-RPC协议通信

### 3. 实现HttpTransport

替换mock实现：
- 使用`reqwest::Client`发送HTTP请求
- 实现JSON-RPC over HTTP
- 支持连接池和超时控制

### 4. 实现WebSocketTransport

替换mock实现：
- 使用`tokio-tungstenite`处理WebSocket
- 实现`StreamExt::split`分离读写
- 支持心跳和重连

### 5. TransportFactory

```rust
pub enum TransportFactory;

impl TransportFactory {
    pub fn create(config: &MCPServiceConfig) -> Box<dyn Transport> {
        match config.transport {
            MCPTransportType::Stdio => Box::new(StdioTransport::new(config)),
            MCPTransportType::Http => Box::new(HttpTransport::new(config)),
            MCPTransportType::WebSocket => Box::new(WebSocketTransport::new(config)),
        }
    }
}
```

## 影响范围

### 后端文件
- `src-tauri/src/mcp/client.rs` - 重构为使用Transport trait
- `src-tauri/src/mcp/transport.rs` - 新增Transport trait和实现
- `src-tauri/src/mcp/mod.rs` - 导出新模块

### 测试
- 新增transport模块单元测试
- 保持现有集成测试通过

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 破坏现有功能 | 低 | 高 | 保持Tauri命令接口不变，先写测试 |
| HTTP实现复杂 | 中 | 中 | 参考turbomcp实现 |
| WebSocket重连逻辑 | 中 | 中 | 参考tokio-tungstenite示例 |

## 依赖

- **前置依赖:** 无
- **后置依赖:** Task 217（MCP模块-注册表职责分离重构）

## 参考资料

1. [turbomcp - Enterprise Rust MCP SDK](https://github.com/Epistates/turbomcp)
2. [Rust MCP 2026 Best Practices](https://rustify.rs/articles/rust-for-mcp-model-context-protocol-servers-2026)
3. [Rust async transport patterns](https://medium.com/@wedevare/rust-build-the-local-node-websocket-transport-layer)
