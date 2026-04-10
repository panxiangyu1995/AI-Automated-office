# Proposal: MCP模块-桥接层解耦重构

## 变更类型

- [ ] 新功能
- [x] 架构优化
- [ ] 性能优化
- [ ] 代码重构

## 背景

当前`MCPToolBridge`硬编码依赖`agent::tools::ToolRegistry`，导致：
1. MCP模块与Agent模块紧耦合
2. 难以接入其他工具系统（如插件系统）
3. 难以扩展新的工具系统

## 优化目标

将MCPToolBridge重构为trait抽象，支持多工具系统：
1. 定义`ToolBridge` trait
2. 实现`AgentToolBridge`适配ToolRegistry
3. 实现`PluginToolBridge`适配插件系统
4. 支持工具系统热插拔

## 功能不变性保证

- 工具注册/注销功能保持不变
- 工具调用路由逻辑保持不变
- `mcp_{service}_{tool}`命名约定保持不变

## 优化方案

### Trait定义

```rust
pub trait ToolBridge: Send + Sync {
    fn register_tool(&self, tool: MCPTool, service_id: &str) -> Result<(), String>;
    fn unregister_tool(&self, tool_name: &str) -> Result<(), String>;
    fn call_tool(&self, tool_name: &str, args: serde_json::Value) -> Result<serde_json::Value, String>;
    fn list_tools(&self) -> Vec<(String, String)>; // (tool_name, service_id)
}
```

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 破坏现有工具调用 | 低 | 高 | 保持AgentToolBridge实现与现有逻辑一致 |
