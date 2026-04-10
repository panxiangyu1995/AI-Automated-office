//! Personal Subagent 加载器
//!
//! 从本地 SQLite 加载 Personal Subagent

use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tokio::sync::RwLock;

use rusqlite::{Connection, params};
use uuid::Uuid;

use super::types::{
    AgentConfig, AgentMode, AgentType, ModelConfig, ModelProvider,
    SubagentError, SubagentResult, ToolPermissions, TriggerConfig, TriggerMode, LimitsConfig,
};
use super::loader::SubagentLoader;

/// Personal Subagent 加载器
///
/// 从本地 SQLite 加载用户创建的 Subagent
pub struct PersonalLoader {
    /// 数据库连接 (使用 Mutex 保证线程安全)
    db: Arc<Mutex<Connection>>,
    /// 用户 ID
    user_id: String,
    /// 内存缓存
    cache: Arc<RwLock<Vec<AgentConfig>>>,
}

impl PersonalLoader {
    /// 创建新的 PersonalLoader
    pub fn new(db_path: PathBuf, user_id: String) -> SubagentResult<Self> {
        let db = Connection::open(&db_path)?;

        // 初始化表
        Self::init_table(&db)?;

        Ok(Self {
            db: Arc::new(Mutex::new(db)),
            user_id,
            cache: Arc::new(RwLock::new(Vec::new())),
        })
    }

    /// 创建新的 PersonalLoader（使用内存数据库）
    #[allow(dead_code)]
    pub fn new_in_memory(user_id: String) -> SubagentResult<Self> {
        let db = Connection::open_in_memory()?;

        // 初始化表
        Self::init_table(&db)?;

        Ok(Self {
            db: Arc::new(Mutex::new(db)),
            user_id,
            cache: Arc::new(RwLock::new(Vec::new())),
        })
    }

    /// 初始化数据库表
    fn init_table(db: &Connection) -> SubagentResult<()> {
        db.execute(
            "CREATE TABLE IF NOT EXISTS personal_subagents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                description TEXT,
                creator_id TEXT NOT NULL,
                model_provider TEXT NOT NULL,
                model_id TEXT NOT NULL,
                temperature REAL DEFAULT 0.7,
                max_tokens INTEGER DEFAULT 4096,
                prompt TEXT NOT NULL,
                trigger_keywords TEXT DEFAULT '[]',
                trigger_conditions TEXT DEFAULT '[]',
                trigger_mode TEXT DEFAULT 'manual',
                priority INTEGER DEFAULT 5,
                allowed_tools TEXT DEFAULT '[]',
                denied_tools TEXT DEFAULT '[]',
                knowledge_sources TEXT DEFAULT '[]',
                max_steps INTEGER DEFAULT 20,
                max_concurrent INTEGER DEFAULT 1,
                timeout_seconds INTEGER DEFAULT 300,
                enabled INTEGER DEFAULT 1,
                version INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(name, creator_id)
            )",
            [],
        )?;

        // 创建索引
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_personal_subagents_creator ON personal_subagents(creator_id)",
            [],
        )?;

        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_personal_subagents_name ON personal_subagents(name)",
            [],
        )?;

        Ok(())
    }

    /// 创建 Subagent
    pub async fn create(&self, request: &CreatePersonalSubagentRequest) -> SubagentResult<AgentConfig> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        // 检查名称唯一性
        let count: i32 = {
            let db = self.db.lock()
                .map_err(|e| SubagentError::LockError(e.to_string()))?;
            db.query_row(
                "SELECT COUNT(*) FROM personal_subagents WHERE name = ? AND creator_id = ?",
                params![request.name, self.user_id],
                |row| row.get(0),
            )?
        };

        if count > 0 {
            return Err(SubagentError::ConfigInvalid(
                format!("Subagent name '{}' already exists", request.name)
            ));
        }

        // 检查数量限制
        let count: i32 = {
            let db = self.db.lock()
                .map_err(|e| SubagentError::LockError(e.to_string()))?;
            db.query_row(
                "SELECT COUNT(*) FROM personal_subagents WHERE creator_id = ? AND enabled = 1",
                params![self.user_id],
                |row| row.get(0),
            )?
        };

        const MAX_PERSONAL_SUBAGENTS: i32 = 10;
        if count >= MAX_PERSONAL_SUBAGENTS {
            return Err(SubagentError::ConfigInvalid(
                format!("Maximum number of personal subagents ({}) reached", MAX_PERSONAL_SUBAGENTS)
            ));
        }

        // 序列化 JSON 字段
        let trigger_keywords = serde_json::to_string(&request.trigger.keywords)?;
        let trigger_conditions = serde_json::to_string(&request.trigger.conditions)?;
        let trigger_mode = serde_json::to_string(&request.trigger.mode)?;
        let allowed_tools = serde_json::to_string(&request.tools.allowed)?;
        let denied_tools = serde_json::to_string(&request.tools.denied)?;
        let knowledge_sources = serde_json::to_string(&request.knowledge_sources)?;

        {
            let db = self.db.lock()
                .map_err(|e| SubagentError::LockError(e.to_string()))?;
            db.execute(
                "INSERT INTO personal_subagents (
                    id, name, display_name, description, creator_id,
                    model_provider, model_id, temperature, max_tokens,
                    prompt, trigger_keywords, trigger_conditions, trigger_mode, priority,
                    allowed_tools, denied_tools, knowledge_sources,
                    max_steps, max_concurrent, timeout_seconds,
                    enabled, version, created_at, updated_at
                ) VALUES (
                    ?1, ?2, ?3, ?4, ?5,
                    ?6, ?7, ?8, ?9,
                    ?10, ?11, ?12, ?13, ?14,
                    ?15, ?16, ?17,
                    ?18, ?19, ?20,
                    1, 1, ?21, ?22
                )",
                params![
                    id, request.name, request.display_name, request.description.as_deref().unwrap_or(""), self.user_id,
                    request.model.provider, request.model.model_id, request.model.temperature, request.model.max_tokens as i32,
                    request.prompt, trigger_keywords, trigger_conditions, trigger_mode, request.trigger.priority as i32,
                    allowed_tools, denied_tools, knowledge_sources,
                    request.limits.max_steps as i32, request.limits.max_concurrent as i32, request.limits.timeout_seconds as i32,
                    now.clone(), now
                ],
            )?;
        }

        // 清除缓存
        {
            let mut cache = self.cache.write().await;
            *cache = Vec::new();
        }

        self.load(&request.name)?.ok_or_else(|| SubagentError::NotFound(format!("Subagent '{}' not found", request.name)))
    }

    /// 更新 Subagent
    #[allow(dead_code)]
    pub async fn update(&self, name: &str, request: &UpdatePersonalSubagentRequest) -> SubagentResult<AgentConfig> {
        let now = chrono::Utc::now().to_rfc3339();

        // 检查是否存在
        let exists: i32 = {
            let db = self.db.lock()
                .map_err(|e| SubagentError::LockError(e.to_string()))?;
            db.query_row(
                "SELECT COUNT(*) FROM personal_subagents WHERE name = ? AND creator_id = ?",
                params![name, self.user_id],
                |row| row.get(0),
            )?
        };

        if exists == 0 {
            return Err(SubagentError::NotFound(format!("Subagent '{}' not found", name)));
        }

        // 构建动态更新
        let mut updates = Vec::new();
        let mut values: Vec<Box<dyn rusqlite::ToSql + Send + Sync>> = Vec::new();

        if let Some(ref v) = request.display_name {
            updates.push("display_name = ?1");
            values.push(Box::new(v.clone()));
        }
        if let Some(ref v) = request.description {
            updates.push("description = ?");
            values.push(Box::new(v.clone()));
        }
        if let Some(ref v) = request.model {
            updates.push("model_provider = ?");
            values.push(Box::new(v.provider.clone()));
            updates.push("model_id = ?");
            values.push(Box::new(v.model_id.clone()));
            updates.push("temperature = ?");
            values.push(Box::new(v.temperature));
            updates.push("max_tokens = ?");
            values.push(Box::new(v.max_tokens as i32));
        }
        if let Some(ref v) = request.prompt {
            updates.push("prompt = ?");
            values.push(Box::new(v.clone()));
        }
        if let Some(ref v) = request.trigger {
            updates.push("trigger_keywords = ?");
            values.push(Box::new(serde_json::to_string(&v.keywords).unwrap_or_default()));
            updates.push("trigger_conditions = ?");
            values.push(Box::new(serde_json::to_string(&v.conditions).unwrap_or_default()));
            updates.push("trigger_mode = ?");
            values.push(Box::new(serde_json::to_string(&v.mode).unwrap_or_default()));
            updates.push("priority = ?");
            values.push(Box::new(v.priority as i32));
        }
        if let Some(ref v) = request.tools {
            updates.push("allowed_tools = ?");
            values.push(Box::new(serde_json::to_string(&v.allowed).unwrap_or_default()));
            updates.push("denied_tools = ?");
            values.push(Box::new(serde_json::to_string(&v.denied).unwrap_or_default()));
        }
        if let Some(v) = request.enabled {
            updates.push("enabled = ?");
            values.push(Box::new(if v { 1 } else { 0 }));
        }

        updates.push("updated_at = ?");
        values.push(Box::new(now));
        updates.push("version = version + 1");

        // 安全：WHERE子句使用参数化查询，防止SQL注入
        if !updates.is_empty() {
            // 构建SET子句
            let set_clause = updates.join(", ");
            let sql = format!(
                "UPDATE personal_subagents SET {} WHERE name = ?1 AND creator_id = ?2",
                set_clause
            );

            // 构建参数：动态字段值 + name + user_id
            let mut all_params: Vec<Box<dyn rusqlite::ToSql + Send + Sync>> = values;
            all_params.push(Box::new(name.to_string()));
            all_params.push(Box::new(self.user_id.clone()));

            let params: Vec<&dyn rusqlite::ToSql> = all_params.iter()
                .map(|v| v.as_ref() as &dyn rusqlite::ToSql)
                .collect();

            let db = self.db.lock()
                .map_err(|e| SubagentError::LockError(e.to_string()))?;
            db.execute(&sql, params.as_slice())?;
        }

        // 清除缓存
        {
            let mut cache = self.cache.write().await;
            *cache = Vec::new();
        }

        self.load(name)?.ok_or_else(|| SubagentError::NotFound(format!("Subagent '{}' not found", name)))
    }

    /// 删除 Subagent
    #[allow(dead_code)]
    pub async fn delete(&self, name: &str) -> SubagentResult<()> {
        // 安全：使用参数化查询，防止SQL注入
        // 注意：name和user_id都通过bind()参数化，避免字符串拼接
        {
            let db = self.db.lock()
                .map_err(|e| SubagentError::LockError(e.to_string()))?;
            db.execute(
                "DELETE FROM personal_subagents WHERE name = ?1 AND creator_id = ?2",
                params![name, self.user_id],
            )?;
        }

        // 清除缓存
        {
            let mut cache = self.cache.write().await;
            *cache = Vec::new();
        }

        Ok(())
    }

    /// 获取用户 ID
    #[allow(dead_code)]
    pub fn user_id(&self) -> &str {
        &self.user_id
    }
}

/// 创建 Personal Subagent 请求
#[derive(Debug, Clone)]
pub struct CreatePersonalSubagentRequest {
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub model: ModelProvider,
    pub prompt: String,
    pub trigger: TriggerConfig,
    pub tools: ToolPermissions,
    pub knowledge_sources: Vec<String>,
    pub limits: LimitsConfig,
}

/// 更新 Personal Subagent 请求
#[derive(Debug, Clone, Default)]
pub struct UpdatePersonalSubagentRequest {
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub model: Option<ModelProvider>,
    pub prompt: Option<String>,
    pub trigger: Option<TriggerConfig>,
    pub tools: Option<ToolPermissions>,
    pub enabled: Option<bool>,
}

/// 从数据库行转换为 AgentConfig
fn row_to_agent_config(row: &rusqlite::Row) -> rusqlite::Result<AgentConfig> {
    let trigger_keywords: String = row.get("trigger_keywords")?;
    let trigger_conditions: String = row.get("trigger_conditions")?;
    let trigger_mode: String = row.get("trigger_mode")?;
    let allowed_tools: String = row.get("allowed_tools")?;
    let denied_tools: String = row.get("denied_tools")?;

    let mode = match trigger_mode.as_str() {
        "\"manual\"" => TriggerMode::Manual,
        "\"auto\"" => TriggerMode::Auto,
        "\"hybrid\"" => TriggerMode::Hybrid,
        _ => TriggerMode::Manual,
    };

    Ok(AgentConfig {
        name: row.get("name")?,
        agent_type: AgentType::Personal,
        mode: AgentMode::Department,
        display_name: row.get("display_name")?,
        description: row.get::<_, Option<String>>("description")?.unwrap_or_default(),
        models: ModelConfig {
            primary: ModelProvider {
                provider: row.get("model_provider")?,
                model_id: row.get("model_id")?,
                temperature: row.get("temperature")?,
                max_tokens: row.get::<_, i32>("max_tokens")? as u32,
            },
            light: None,
            small: None,
        },
        tools: ToolPermissions {
            allowed: serde_json::from_str(&allowed_tools).unwrap_or_default(),
            denied: serde_json::from_str(&denied_tools).unwrap_or_default(),
            constraints: Default::default(),
        },
        trigger: TriggerConfig {
            mode,
            keywords: serde_json::from_str(&trigger_keywords).unwrap_or_default(),
            conditions: serde_json::from_str(&trigger_conditions).unwrap_or_default(),
            priority: row.get::<_, i32>("priority")? as u8,
        },
        limits: LimitsConfig {
            max_steps: row.get::<_, i32>("max_steps")? as u32,
            max_concurrent: row.get::<_, i32>("max_concurrent")? as u32,
            timeout_seconds: row.get::<_, i32>("timeout_seconds")? as u32,
        },
        plugin_id: None,
        creator_id: Some(row.get("creator_id")?),
    })
}

impl SubagentLoader for PersonalLoader {
    fn load_all(&self) -> SubagentResult<Vec<AgentConfig>> {
        // 安全：使用参数化查询，防止SQL注入
        let db = self.db.lock()
            .map_err(|e| SubagentError::LockError(e.to_string()))?;
        let mut stmt = db.prepare(
            "SELECT * FROM personal_subagents WHERE creator_id = ?1 AND enabled = 1"
        )?;

        let configs = stmt.query_map([&self.user_id], row_to_agent_config)?
            .filter_map(|r| r.ok())
            .collect();

        Ok(configs)
    }

    fn load(&self, name: &str) -> SubagentResult<Option<AgentConfig>> {
        // 安全：使用参数化查询，防止SQL注入
        let db = self.db.lock()
            .map_err(|e| SubagentError::LockError(e.to_string()))?;
        let mut stmt = db.prepare(
            "SELECT * FROM personal_subagents WHERE name = ?1 AND creator_id = ?2"
        )?;

        let config = stmt.query_row(params![name, self.user_id], row_to_agent_config).ok();
        Ok(config)
    }

    fn get_type(&self) -> AgentType {
        AgentType::Personal
    }

    fn name(&self) -> &str {
        "personal"
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    fn test_create_and_load() {
        let loader = PersonalLoader::new_in_memory("user123".to_string()).unwrap();

        let request = CreatePersonalSubagentRequest {
            name: "my-agent".to_string(),
            display_name: "我的助手".to_string(),
            description: Some("测试助手".to_string()),
            model: ModelProvider {
                provider: "openai".to_string(),
                model_id: "gpt-4".to_string(),
                temperature: 0.7,
                max_tokens: 4096,
            },
            prompt: "你是一个有用的助手".to_string(),
            trigger: TriggerConfig::default(),
            tools: ToolPermissions::default(),
            knowledge_sources: vec![],
            limits: LimitsConfig::default(),
        };

        let created = futures::executor::block_on(loader.create(&request)).unwrap();
        assert_eq!(created.name, "my-agent");

        let loaded = futures::executor::block_on(async { loader.load("my-agent").await }).unwrap();
        assert!(loaded.is_some());
        assert_eq!(loaded.unwrap().name, "my-agent");
    }

    #[tokio::test]
    fn test_delete() {
        let loader = PersonalLoader::new_in_memory("user123".to_string()).unwrap();

        let request = CreatePersonalSubagentRequest {
            name: "to-delete".to_string(),
            display_name: "删除测试".to_string(),
            description: None,
            model: ModelProvider::default(),
            prompt: "test".to_string(),
            trigger: TriggerConfig::default(),
            tools: ToolPermissions::default(),
            knowledge_sources: vec![],
            limits: LimitsConfig::default(),
        };

        futures::executor::block_on(loader.create(&request)).unwrap();
        futures::executor::block_on(loader.delete("to-delete")).unwrap();

        let loaded = futures::executor::block_on(async { loader.load("to-delete").await }).unwrap();
        assert!(loaded.is_none());
    }
}
