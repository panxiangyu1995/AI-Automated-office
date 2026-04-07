# Design: Personal Agent本地存储

## 技术架构

### 1. Personal Agent定义

```rust
pub struct PersonalAgent {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub description: String,
    pub model_config: ModelConfig,
    pub tools: Vec<String>,
    pub skills: Vec<String>,
    pub storage_path: PathBuf,  // 本地隔离存储
    pub max_permission_scope: PermissionScope,  // 权限上限
}
```

### 2. 权限继承

```rust
impl PersonalAgent {
    pub fn inherit_permissions(&self, main_agent: &MainAgent) -> PermissionScope {
        PermissionScope {
            // 取交集，确保不超过主Agent权限
            allowed_tools: self.tools.iter()
                .filter(|t| main_agent.allowed_tools.contains(t))
                .cloned()
                .collect(),
            max_execution_time: min(self.max_permission_scope.max_execution_time, 
                                   main_agent.max_execution_time),
            // ... 其他权限
        }
    }
}
```

### 3. Tauri命令

```rust
#[tauri::command]
pub async fn create_personal_agent(
    name: String,
    description: String,
) -> Result<PersonalAgent, String>;

#[tauri::command]
pub async fn switch_to_personal_agent(
    agent_id: String,
) -> Result<(), String>;

#[tauri::command]
pub async fn get_personal_agents() -> Result<Vec<PersonalAgent>, String>;
```
