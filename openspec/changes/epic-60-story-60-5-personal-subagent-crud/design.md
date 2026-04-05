# Design: Personal Subagent CRUD

## 1. Personal Subagent 结构

```rust
/// Personal Subagent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalSubagent {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub creator_id: String,
    pub model: ModelConfig,
    pub prompt: String,
    pub trigger: TriggerConfig,
    pub tools: ToolPermissions,
    pub knowledge_sources: Vec<String>,
    pub limits: LimitsConfig,
    pub enabled: bool,
    pub version: i32,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

/// 创建请求
#[derive(Debug, Deserialize)]
pub struct CreatePersonalSubagentRequest {
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub model: ModelConfig,
    pub prompt: String,
    pub trigger: TriggerConfig,
    pub tools: ToolPermissions,
    pub knowledge_sources: Option<Vec<String>>,
    pub limits: Option<LimitsConfig>,
}

/// 更新请求
#[derive(Debug, Deserialize)]
pub struct UpdatePersonalSubagentRequest {
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub model: Option<ModelConfig>,
    pub prompt: Option<String>,
    pub trigger: Option<TriggerConfig>,
    pub tools: Option<ToolPermissions>,
    pub knowledge_sources: Option<Vec<String>>,
    pub limits: Option<LimitsConfig>,
    pub enabled: Option<bool>,
}
```

## 2. CRUD 操作

```rust
/// Personal Subagent 服务
pub struct PersonalSubagentService {
    db: Arc<Database>,
    permission_checker: Arc<PermissionEngine>,
}

impl PersonalSubagentService {
    /// 创建
    pub async fn create(
        &self,
        creator_id: &str,
        request: CreatePersonalSubagentRequest,
    ) -> Result<PersonalSubagent, ServiceError> {
        // 1. 检查数量限制
        self.check_limit(creator_id).await?;
        
        // 2. 检查名称唯一性
        self.check_unique_name(creator_id, &request.name).await?;
        
        // 3. 验证工具权限
        self.validate_tool_permissions(&request.tools, creator_id).await?;
        
        // 4. 保存
        let subagent = PersonalSubagent {
            id: generate_uuid(),
            name: request.name,
            display_name: request.display_name,
            description: request.description,
            creator_id: creator_id.to_string(),
            model: request.model,
            prompt: request.prompt,
            trigger: request.trigger,
            tools: request.tools,
            knowledge_sources: request.knowledge_sources.unwrap_or_default(),
            limits: request.limits.unwrap_or_default(),
            enabled: true,
            version: 1,
            created_at: now(),
            updated_at: now(),
        };
        
        self.db.insert(&subagent).await?;
        Ok(subagent)
    }
    
    /// 更新（含版本历史）
    pub async fn update(
        &self,
        id: &str,
        creator_id: &str,
        request: UpdatePersonalSubagentRequest,
    ) -> Result<PersonalSubagent, ServiceError> {
        // 1. 获取现有记录
        let mut subagent = self.get(id, creator_id).await?;
        
        // 2. 保存旧版本到历史
        self.save_version_history(&subagent).await?;
        
        // 3. 更新字段
        if let Some(v) = request.display_name { subagent.display_name = v; }
        if let Some(v) = request.prompt { subagent.prompt = v; }
        // ... 其他字段
        
        subagent.version += 1;
        subagent.updated_at = now();
        
        self.db.update(&subagent).await?;
        Ok(subagent)
    }
    
    /// 删除
    pub async fn delete(&self, id: &str, creator_id: &str) -> Result<(), ServiceError> {
        // 1. 验证所有权
        let subagent = self.get(id, creator_id).await?;
        
        // 2. 删除关联的会话历史
        self.delete_session_history(id).await?;
        
        // 3. 删除记录
        self.db.delete::<PersonalSubagent>(id).await?;
        
        Ok(())
    }
}
```

## 3. 权限继承

```rust
impl PersonalSubagentService {
    /// 验证工具权限 - Personal Agent 只能选择主 Agent 权限范围内的工具
    async fn validate_tool_permissions(
        &self,
        tools: &ToolPermissions,
        user_id: &str,
    ) -> Result<(), ServiceError> {
        // 1. 获取用户主 Agent 权限
        let user_permissions = self.permission_engine
            .get_user_permissions(user_id)
            .await?;
        
        // 2. 检查 allowed_tools 是否都在用户权限内
        for tool in &tools.allowed {
            if !user_permissions.allowed_tools.contains(tool) {
                return Err(ServiceError::ToolPermissionDenied(tool.clone()));
            }
        }
        
        // 3. 检查是否有高风险工具被拒绝
        for tool in &tools.denied {
            if user_permissions.denied_tools.contains(tool) {
                // 已在黑名单，无需重复添加
            }
        }
        
        Ok(())
    }
}
```

## 4. 导入导出

```rust
/// 导出
pub struct SubagentExporter;

impl SubagentExporter {
    pub fn export(&self, subagent: &PersonalSubagent) -> Vec<u8> {
        let config = ExportConfig {
            name: subagent.name.clone(),
            display_name: subagent.display_name.clone(),
            prompt: subagent.prompt.clone(),
            trigger: subagent.trigger.clone(),
            tools: subagent.tools.clone(),
            model: subagent.model.clone(),
        };
        
        serde_json::to_vec_pretty(&config).unwrap()
    }
}

/// 导入
pub struct SubagentImporter;

impl SubagentImporter {
    pub async fn import(
        &self,
        creator_id: &str,
        data: Vec<u8>,
    ) -> Result<PersonalSubagent, ServiceError> {
        let config: ExportConfig = serde_json::from_slice(&data)?;
        
        // 创建时需要新名称
        let request = CreatePersonalSubagentRequest {
            name: generate_unique_name(),
            display_name: config.display_name,
            description: None,
            model: config.model,
            prompt: config.prompt,
            trigger: config.trigger,
            tools: config.tools,
            knowledge_sources: None,
            limits: None,
        };
        
        self.create(creator_id, request).await
    }
}
```
