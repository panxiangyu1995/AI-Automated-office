# Proposal: MCP模块-协议层JSON-RPC抽取

## 变更类型

- [ ] 新功能
- [x] 架构优化
- [ ] 性能优化
- [ ] 代码重构

## 背景

当前MCP协议处理（如JSON-RPC消息编解码、验证）与Transport层耦合在一起。根据Rust MCP最佳实践，应分离协议层，实现独立的JSON-RPC处理模块。

## 优化目标

创建独立的`protocol`模块处理JSON-RPC协议：
1. 实现JSON-RPC Request/Response序列化
2. 实现消息验证器
3. 实现消息处理器
4. 与Transport层解耦

## 功能不变性保证

- MCPMessage枚举定义保持不变
- MCPToolCall/MCPToolResult结构保持不变
- 现有错误处理逻辑保持不变

## 优化方案

### 模块结构

```
src-tauri/src/mcp/protocol/
├── mod.rs
├── codec.rs      # JSON-RPC编解码
├── validator.rs  # 消息验证
├── handler.rs    # 消息处理
└── error.rs     # 协议错误
```

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 破坏现有协议 | 低 | 高 | 保持MCPMessage兼容，逐步迁移 |
