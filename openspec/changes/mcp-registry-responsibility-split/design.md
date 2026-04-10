# Design: MCP模块-注册表职责分离重构

## 优化前架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     MCPServiceRegistry                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ clients: Arc<RwLock<HashMap<String, Arc<MCPClient>>>>   │   │
│  │ configs: Arc<RwLock<HashMap<String, MCPServiceConfig>>>  │   │
│  │ approval_configs: Arc<RwLock<...>>                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ + add_service()          // 服务管理                     │   │
│  │ + remove_service()                                       │   │
│  │ + start_service()                                        │   │
│  │ + stop_service()                                        │   │
│  │ + call_tool()           // 工具调用                      │   │
│  │ + discover_tools()                                       │   │
│  │ + set_tool_approval_config()  // 审批配置                │   │
│  │ + check_auto_approve()    // 审批检查                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**问题：**
1. 三种职责混在一个结构体
2. 审批逻辑与业务逻辑耦合
3. 配置管理与服务管理耦合
4. 难以独立测试和扩展

## 优化后架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     MCPServiceRegistry                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ service_manager: Arc<ServiceManager>                     │   │
│  │ config_store: Arc<ConfigStore>                          │   │
│  │ policy_engine: Arc<PolicyEngine>                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ // 委托方法 - 保持向后兼容                               │   │
│  │ + add_service() → service_manager.add_service()        │   │
│  │ + call_tool() → check policy → service_manager.call()  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                │                   │                 │
                ▼                   ▼                 ▼
┌─────────────────────────┐ ┌─────────────────┐ ┌───────────────────┐
│    ServiceManager       │ │   ConfigStore   │ │   PolicyEngine    │
│  ┌───────────────────┐ │ │ ┌─────────────┐ │ │ ┌───────────────┐ │
│  │ clients: Arc<...> │ │ │ │configs:Arc<│ │ │ │configs:Arc<..>│ │
│  └───────────────────┘ │ │ │  RwLock<..>>│ │ │ └───────────────┘ │
│  + add_service()       │ │ └─────────────┘ │ │ + check()         │
│  + remove_service()    │ │ + save()        │ │ + set_config()    │
│  + start/stop()        │ │ + load()        │ │ + get_config()    │
│  + list_services()     │ │ + update()      │ │ + delete_config() │
└─────────────────────────┘ │ + delete()      │ │ + list_configs()  │
                            └─────────────────┘ └───────────────────┘
```

## 详细设计

### 1. ServiceManager模块

```rust
// src-tauri/src/mcp/manager.rs

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use super::client::{MCPClient, MCPClientConfig};
use super::types::{MCPServiceInfo, MCPServiceStatus};

pub struct ServiceManager {
    clients: Arc<RwLock<HashMap<String, Arc<MCPClient>>>>,
}

impl ServiceManager {
    pub fn new() -> Self {
        Self {
            clients: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn add_service(&self, config: MCPServiceConfig) -> Result<MCPServiceInfo, String> {
        // 检查是否存在
        if self.clients.read().await.contains_key(&config.id) {
            return Err(format!("Service {} already exists", config.id));
        }

        // 创建client
        let client_config = MCPClientConfig::from_service(config.clone());
        let client = Arc::new(MCPClient::new(client_config));

        // 自动启动
        if config.auto_start {
            client.start().await?;
        }

        // 存储
        self.clients.write().await.insert(config.id.clone(), client.clone());
        
        Ok(client.service_info().await)
    }

    pub async fn remove_service(&self, service_id: &str) -> Result<(), String> {
        if let Some(client) = self.clients.write().await.remove(service_id) {
            let _ = client.stop().await;
        }
        Ok(())
    }

    pub async fn get_client(&self, service_id: &str) -> Option<Arc<MCPClient>> {
        self.clients.read().await.get(service_id).cloned()
    }

    pub async fn list_services(&self) -> Vec<MCPServiceInfo> {
        self.clients.read().await
            .values()
            .map(|c| futures::executor::block_on(c.service_info()))
            .collect()
    }

    pub async fn count(&self) -> usize {
        self.clients.read().await.len()
    }
}
```

### 2. ConfigStore模块

```rust
// src-tauri/src/mcp/store.rs

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use super::types::MCPServiceConfig;

pub struct ConfigStore {
    configs: Arc<RwLock<HashMap<String, MCPServiceConfig>>>,
}

impl ConfigStore {
    pub fn new() -> Self {
        Self {
            configs: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn save(&self, config: MCPServiceConfig) -> Result<(), String> {
        self.configs.write().await
            .insert(config.id.clone(), config);
        Ok(())
    }

    pub async fn load(&self, service_id: &str) -> Option<MCPServiceConfig> {
        self.configs.read().await.get(service_id).cloned()
    }

    pub async fn delete(&self, service_id: &str) -> Option<MCPServiceConfig> {
        self.configs.write().await.remove(service_id)
    }

    pub async fn update(&self, config: MCPServiceConfig) -> Result<(), String> {
        if !self.configs.read().await.contains_key(&config.id) {
            return Err(format!("Service {} not found", config.id));
        }
        self.configs.write().await
            .insert(config.id.clone(), config);
        Ok(())
    }

    pub async fn list(&self) -> Vec<MCPServiceConfig> {
        self.configs.read().await.values().cloned().collect()
    }
}
```

### 3. PolicyEngine模块

```rust
// src-tauri/src/mcp/engine.rs

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use super::types::{PerToolApprovalConfig, ApprovalPolicy, AutoApproveResult};

pub struct PolicyEngine {
    configs: Arc<RwLock<HashMap<String, PerToolApprovalConfig>>>,
}

impl PolicyEngine {
    pub fn new() -> Self {
        Self {
            configs: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn check(&self, service_id: &str, tool_name: &str) -> AutoApproveResult {
        let configs = self.configs.read().await;

        for config in configs.values() {
            if config.service_id == service_id && config.matches(tool_name) {
                let approved = config.policy == ApprovalPolicy::AutoApprove;
                return AutoApproveResult {
                    approved,
                    policy: config.policy.clone(),
                    matched_config_id: Some(config.id.clone()),
                    reason: if approved {
                        format!("Tool '{}' auto-approved by config '{}'", tool_name, config.id)
                    } else {
                        format!("Tool '{}' policy is {:?} according to config '{}'",
                            tool_name, config.policy, config.id)
                    },
                };
            }
        }

        AutoApproveResult {
            approved: false,
            policy: ApprovalPolicy::Manual,
            matched_config_id: None,
            reason: format!(
                "No approval config found for tool '{}' in service '{}', defaulting to manual",
                tool_name, service_id
            ),
        }
    }

    pub async fn set_config(&self, config: PerToolApprovalConfig) -> Result<(), String> {
        self.configs.write().await
            .insert(config.id.clone(), config);
        Ok(())
    }

    pub async fn get_config(&self, config_id: &str) -> Option<PerToolApprovalConfig> {
        self.configs.read().await.get(config_id).cloned()
    }

    pub async fn delete_config(&self, config_id: &str) -> Option<PerToolApprovalConfig> {
        self.configs.write().await.remove(config_id)
    }

    pub async fn list_configs(&self, service_id: &str) -> Vec<PerToolApprovalConfig> {
        self.configs.read().await
            .values()
            .filter(|c| c.service_id == service_id)
            .cloned()
            .collect()
    }

    pub async fn list_all_configs(&self) -> Vec<PerToolApprovalConfig> {
        self.configs.read().await.values().cloned().collect()
    }
}
```

### 4. MCPServiceRegistry重构

```rust
// src-tauri/src/mcp/registry.rs (简化版)

mod manager;
mod store;
mod engine;

pub use manager::ServiceManager;
pub use store::ConfigStore;
pub use engine::PolicyEngine;

pub struct MCPServiceRegistry {
    service_manager: Arc<ServiceManager>,
    config_store: Arc<ConfigStore>,
    policy_engine: Arc<PolicyEngine>,
}

impl MCPServiceRegistry {
    pub fn new() -> Self {
        Self {
            service_manager: Arc::new(ServiceManager::new()),
            config_store: Arc::new(ConfigStore::new()),
            policy_engine: Arc::new(PolicyEngine::new()),
        }
    }

    // 委托方法保持现有接口
    pub async fn add_service(&self, config: MCPServiceConfig) -> Result<MCPServiceInfo, String> {
        // 保存配置
        self.config_store.save(config.clone()).await?;
        // 添加服务
        self.service_manager.add_service(config).await
    }

    pub async fn call_tool(
        &self,
        service_id: &str,
        tool_name: String,
        arguments: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        // 检查审批策略
        let approval = self.policy_engine.check(service_id, &tool_name).await;
        if !approval.approved {
            return Err(format!("Tool '{}' requires manual approval: {}", tool_name, approval.reason));
        }

        // 调用工具
        let client = self.service_manager.get_client(service_id).await
            .ok_or_else(|| format!("Service {} not found", service_id))?;

        let args_map: std::collections::HashMap<String, serde_json::Value> =
            serde_json::from_value(arguments)
            .map_err(|e| e.to_string())?;

        let call = super::types::MCPToolCall {
            tool: tool_name,
            arguments: args_map,
        };

        let result = client.call_tool(call).await?;

        if result.success {
            result.content.ok_or_else(|| "No content".to_string())
        } else {
            Err(result.error.unwrap_or_else(|| "Unknown error".to_string()))
        }
    }

    // ... 其他委托方法
}
```

## 实现要点

1. **保持向后兼容**: MCPServiceRegistry接口不变
2. **模块独立**: 三个子模块可独立测试
3. **委托模式**: Registry作为门面，委托给子模块
4. **并发安全**: 使用Arc<RwLock<HashMap>>管理共享状态
