# Proposal: MCP模块-注册表职责分离重构

## 变更类型

- [ ] 新功能
- [x] 架构优化
- [ ] 性能优化
- [ ] 代码重构

## 背景

当前`MCPServiceRegistry`承担了三种职责：
1. **ServiceManager**: 服务生命周期管理
2. **ConfigStore**: 配置持久化
3. **PolicyEngine**: 审批策略管理

根据SOLID原则中的单一职责原则，应分离这些职责。

## 优化目标

将`MCPServiceRegistry`拆分为三个独立模块：
1. `ServiceManager`: 服务生命周期管理
2. `ConfigStore`: 配置存储（支持热更新）
3. `PolicyEngine`: 审批策略管理

## 功能不变性保证

**必须保持的功能点：**
1. 审批策略逻辑（ApprovalPolicy/AutoApprove）
2. 工具调用接口
3. 服务生命周期管理
4. Tauri命令接口

## 优化方案

### 1. ServiceManager模块

```rust
pub struct ServiceManager {
    clients: Arc<RwLock<HashMap<String, Arc<MCPClient>>>>,
}

impl ServiceManager {
    pub async fn add_service(&self, config: MCPServiceConfig) -> Result<MCPServiceInfo, String>;
    pub async fn remove_service(&self, service_id: &str) -> Result<(), String>;
    pub async fn start_service(&self, service_id: &str) -> Result<(), String>;
    pub async fn stop_service(&self, service_id: &str) -> Result<(), String>;
    pub async fn list_services(&self) -> Vec<MCPServiceInfo>;
    pub async fn get_service(&self, service_id: &str) -> Option<MCPServiceInfo>;
}
```

### 2. ConfigStore模块

```rust
pub struct ConfigStore {
    configs: Arc<RwLock<HashMap<String, MCPServiceConfig>>>,
}

impl ConfigStore {
    pub async fn save(&self, config: MCPServiceConfig) -> Result<(), String>;
    pub async fn load(&self, service_id: &str) -> Option<MCPServiceConfig>;
    pub async fn delete(&self, service_id: &str) -> Result<(), String>;
    pub async fn list(&self) -> Vec<MCPServiceConfig>;
    pub async fn update(&self, config: MCPServiceConfig) -> Result<(), String>;
}
```

### 3. PolicyEngine模块

```rust
pub struct PolicyEngine {
    configs: Arc<RwLock<HashMap<String, PerToolApprovalConfig>>>,
}

impl PolicyEngine {
    pub async fn check(&self, service_id: &str, tool_name: &str) -> AutoApproveResult;
    pub async fn set_config(&self, config: PerToolApprovalConfig) -> Result<(), String>;
    pub async fn get_config(&self, config_id: &str) -> Option<PerToolApprovalConfig>;
    pub async fn delete_config(&self, config_id: &str) -> Result<(), String>;
    pub async fn list_configs(&self, service_id: &str) -> Vec<PerToolApprovalConfig>;
}
```

### 4. MCPServiceRegistry重构

```rust
pub struct MCPServiceRegistry {
    service_manager: Arc<ServiceManager>,
    config_store: Arc<ConfigStore>,
    policy_engine: Arc<PolicyEngine>,
}

impl MCPServiceRegistry {
    // 委托方法保持不变
}
```

## 影响范围

- `src-tauri/src/mcp/registry.rs` - 拆分为多个模块
- `src-tauri/src/mcp/mod.rs` - 导出新模块
- `src-tauri/src/mcp/engine.rs` - PolicyEngine实现
- `src-tauri/src/mcp/store.rs` - ConfigStore实现

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 接口变更影响现有调用 | 低 | 高 | 保持Registry接口兼容 |
| 配置热更新导致不一致 | 低 | 中 | 使用事务保证原子性 |

## 依赖

- **前置依赖:** Task 216（Transport层策略模式重构）
- **后置依赖:** Task 218（协议层JSON-RPC抽取）

## 参考资料

1. [Rust Registry Pattern Best Practices](https://users.rust-lang.org/t/best-practice-for-async-configuration-management-with-rwlock-and-serde/133693)
2. [Arc and RwLock Best Practices](https://www.reddit.com/r/rust/comments/175anmh/shared_state_whats_the_better_approach_an/)
