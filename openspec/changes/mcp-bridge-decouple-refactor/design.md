# Design: MCP模块-桥接层解耦重构

## 优化前架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       MCPToolBridge                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ tool_registry: Arc<RwLock<Option<Arc<ToolRegistry>>>>   │   │
│  │ tool_service_map: HashMap<String, String>                │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 硬编码依赖ToolRegistry                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 优化后架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       MCPToolBridge                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ bridge: Box<dyn ToolBridge>                             │   │
│  │ registry: Arc<MCPServiceRegistry>                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ToolBridge Trait                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ + register_tool(tool, service_id) -> Result            │   │
│  │ + unregister_tool(tool_name) -> Result                   │   │
│  │ + call_tool(tool_name, args) -> Result                  │   │
│  │ + list_tools() -> Vec<(String, String)>                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────┴────────┐ ┌──────┴───────┐ ┌────────┴────────┐
│ AgentToolBridge  │ │PluginToolBridge│ │CustomToolBridge│
│ (适配ToolRegistry)│ │(适配插件系统) │ │ (用户自定义)  │
└──────────────────┘ └───────────────┘ └─────────────────┘
```

## 详细设计

### 1. ToolBridge Trait

```rust
// src-tauri/src/mcp/bridge.rs

use super::types::MCPTool;
use async_trait::async_trait;

#[async_trait]
pub trait ToolBridge: Send + Sync {
    /// 注册工具
    fn register_tool(&self, tool: MCPTool, service_id: &str) -> Result<(), String>;
    
    /// 注销工具
    fn unregister_tool(&self, tool_name: &str) -> Result<(), String>;
    
    /// 调用工具
    async fn call_tool(
        &self, 
        tool_name: &str, 
        args: serde_json::Value
    ) -> Result<serde_json::Value, String>;
    
    /// 列出所有工具
    fn list_tools(&self) -> Vec<(String, String)>; // (tool_name, service_id)
}
```

### 2. AgentToolBridge

```rust
pub struct AgentToolBridge {
    registry: Arc<ToolRegistry>,
    tool_service_map: Arc<RwLock<HashMap<String, String>>>,
}

impl AgentToolBridge {
    pub fn new(registry: Arc<ToolRegistry>) -> Self {
        Self {
            registry,
            tool_service_map: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

#[async_trait]
impl ToolBridge for AgentToolBridge {
    fn register_tool(&self, tool: MCPTool, service_id: &str) -> Result<(), String> {
        let tool_name = format!("mcp_{}_{}", service_id, tool.name);
        
        let descriptor = ToolDescriptor {
            id: tool_name.clone(),
            name: tool_name.clone(),
            description: tool.description,
            category: ToolCategory::Mcp,
            // ... 其他字段
        };
        
        self.registry.register(descriptor);
        self.tool_service_map.write().await
            .insert(tool_name, service_id.to_string());
        
        Ok(())
    }

    fn unregister_tool(&self, tool_name: &str) -> Result<(), String> {
        self.registry.unregister(tool_name);
        self.tool_service_map.write().await.remove(tool_name);
        Ok(())
    }

    async fn call_tool(
        &self, 
        tool_name: &str, 
        args: serde_json::Value
    ) -> Result<serde_json::Value, String> {
        // 查找工具对应的service_id
        let service_id = self.tool_service_map.read().await
            .get(tool_name)
            .cloned()
            .ok_or_else(|| format!("Tool {} not registered", tool_name))?;
        
        // 调用MCP服务
        // ...
        
        Ok(serde_json::json!({"result": "ok"}))
    }

    fn list_tools(&self) -> Vec<(String, String)> {
        self.tool_service_map.blocking_read()
            .iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    }
}
```

### 3. MCPToolBridge重构

```rust
pub struct MCPToolBridge {
    registry: Arc<MCPServiceRegistry>,
    bridge: Box<dyn ToolBridge>,
    tool_service_map: Arc<RwLock<HashMap<String, String>>>,
}

impl MCPToolBridge {
    pub fn new(
        registry: Arc<MCPServiceRegistry>,
        bridge: Box<dyn ToolBridge>,
    ) -> Self {
        Self {
            registry,
            bridge,
            tool_service_map: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 创建使用AgentToolBridge的MCPToolBridge
    pub fn with_agent_bridge(registry: Arc<MCPServiceRegistry>) -> Self {
        let agent_bridge = AgentToolBridge::new(Arc::new(ToolRegistry::new()));
        Self::new(registry, Box::new(agent_bridge))
    }

    /// 创建使用PluginToolBridge的MCPToolBridge
    pub fn with_plugin_bridge(registry: Arc<MCPServiceRegistry>) -> Self {
        let plugin_bridge = PluginToolBridge::new(/* ... */);
        Self::new(registry, Box::new(plugin_bridge))
    }
}
```
