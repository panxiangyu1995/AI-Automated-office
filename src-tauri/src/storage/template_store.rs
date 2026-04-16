//! Template Version Store
//!
//! H7: 模板持久化从 localStorage 迁移到 SQLite
//!
//! 替代前端 templateVersionStore.ts 的 localStorage 方案，
//! 提供基于 SQLite 的模板版本 CRUD、发布/回滚、默认版本设置。
//!
//! 对应前端类型:
//! - TemplateStatus: 'draft' | 'published' | 'archived'
//! - TemplateVersion: { id, templateId, version, status, createdAt, updatedAt, content }
//! - TemplateRuntimeState: { templateId, defaultVersionId, activeVersionId, versions }

use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};

/// 模板版本状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TemplateStatus {
    Draft,
    Published,
    Archived,
}

impl Default for TemplateStatus {
    fn default() -> Self {
        Self::Draft
    }
}

impl TemplateStatus {
    pub fn as_str(&self) -> &str {
        match self {
            Self::Draft => "draft",
            Self::Published => "published",
            Self::Archived => "archived",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "draft" => Some(Self::Draft),
            "published" => Some(Self::Published),
            "archived" => Some(Self::Archived),
            _ => None,
        }
    }
}

/// 模板版本
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateVersion {
    pub id: String,
    pub template_id: String,
    pub version: i64,
    pub status: TemplateStatus,
    pub content: String,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 模板元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Template {
    pub id: String,
    pub name: String,
    pub default_version_id: Option<String>,
    pub active_version_id: Option<String>,
    /// 模板 Schema JSON (FR1279)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema_json: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 模板运行时状态（对应前端 TemplateRuntimeState）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateRuntimeState {
    pub template_id: String,
    pub default_version_id: Option<String>,
    pub active_version_id: Option<String>,
    pub versions: Vec<TemplateVersion>,
}

/// 模板版本存储
#[derive(Clone)]
pub struct TemplateStore {
    pool: SqlitePool,
    tenant_id: String,
}

impl TemplateStore {
    pub fn new(pool: SqlitePool, tenant_id: String) -> Self {
        Self { pool, tenant_id }
    }

    // ---- Template CRUD ----

    /// 创建模板
    pub async fn create_template(&self, id: &str, name: &str) -> Result<Template> {
        let now = now_timestamp();
        sqlx::query(
            "INSERT INTO templates (id, name, default_version_id, active_version_id, created_at, updated_at, tenant_id)
             VALUES (?, ?, NULL, NULL, ?, ?, ?);",
        )
        .bind(id)
        .bind(name)
        .bind(now)
        .bind(now)
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        Ok(Template {
            id: id.to_string(),
            name: name.to_string(),
            default_version_id: None,
            active_version_id: None,
            schema_json: None,
            created_at: now,
            updated_at: now,
        })
    }

    /// 获取模板
    pub async fn get_template(&self, id: &str) -> Result<Option<Template>> {
        let row = sqlx::query(
            "SELECT id, name, default_version_id, active_version_id, schema_json, created_at, updated_at
             FROM templates WHERE id = ? AND tenant_id = ? LIMIT 1;",
        )
        .bind(id)
        .bind(&self.tenant_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_template))
    }

    /// 获取所有模板
    pub async fn list_templates(&self) -> Result<Vec<Template>> {
        let rows = sqlx::query(
            "SELECT id, name, default_version_id, active_version_id, schema_json, created_at, updated_at
             FROM templates WHERE tenant_id = ? ORDER BY updated_at DESC;",
        )
        .bind(&self.tenant_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_template).collect())
    }

    /// 设置默认版本
    pub async fn set_default_version(
        &self,
        template_id: &str,
        version_id: &str,
    ) -> Result<bool> {
        // 验证版本存在
        let version = self.get_version(version_id).await?;
        let Some(version) = version else {
            return Ok(false);
        };
        if version.template_id != template_id {
            return Ok(false);
        }

        let now = now_timestamp();
        sqlx::query(
            "UPDATE templates SET default_version_id = ?, updated_at = ?
             WHERE id = ? AND tenant_id = ?;",
        )
        .bind(version_id)
        .bind(now)
        .bind(template_id)
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        Ok(true)
    }

    // ---- Template Version CRUD ----

    /// 创建草稿版本
    pub async fn create_draft(
        &self,
        template_id: &str,
        content: &str,
    ) -> Result<TemplateVersion> {
        // 获取下一个版本号
        let next_version = self.next_version_number(template_id).await?;
        let version_id = format!("{}-v{}", template_id, next_version);
        let now = now_timestamp();

        sqlx::query(
            "INSERT INTO template_versions (id, template_id, version, status, content, created_at, updated_at, tenant_id)
             VALUES (?, ?, ?, 'draft', ?, ?, ?, ?);",
        )
        .bind(&version_id)
        .bind(template_id)
        .bind(next_version)
        .bind(content)
        .bind(now)
        .bind(now)
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        // 更新模板 updated_at
        sqlx::query("UPDATE templates SET updated_at = ? WHERE id = ? AND tenant_id = ?;")
            .bind(now)
            .bind(template_id)
            .bind(&self.tenant_id)
            .execute(&self.pool)
            .await?;

        Ok(TemplateVersion {
            id: version_id,
            template_id: template_id.to_string(),
            version: next_version,
            status: TemplateStatus::Draft,
            content: content.to_string(),
            created_at: now,
            updated_at: now,
        })
    }

    /// 发布版本
    ///
    /// 将指定版本设为 published，同时将之前的 published 版本归档为 archived
    pub async fn publish_version(
        &self,
        template_id: &str,
        version_id: &str,
    ) -> Result<Option<TemplateVersion>> {
        let now = now_timestamp();

        // 归档当前 published 版本
        sqlx::query(
            "UPDATE template_versions SET status = 'archived', updated_at = ?
             WHERE template_id = ? AND status = 'published' AND tenant_id = ?;",
        )
        .bind(now)
        .bind(template_id)
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        // 发布指定版本
        let result = sqlx::query(
            "UPDATE template_versions SET status = 'published', updated_at = ?
             WHERE id = ? AND template_id = ? AND tenant_id = ?;",
        )
        .bind(now)
        .bind(version_id)
        .bind(template_id)
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }

        // 设置为 active version
        sqlx::query(
            "UPDATE templates SET active_version_id = ?, updated_at = ?
             WHERE id = ? AND tenant_id = ?;",
        )
        .bind(version_id)
        .bind(now)
        .bind(template_id)
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        self.get_version(version_id).await
    }

    /// 回滚到指定版本
    ///
    /// 类似 publish，将指定版本重新发布，当前 published 归档
    pub async fn rollback_to_version(
        &self,
        template_id: &str,
        version_id: &str,
    ) -> Result<Option<TemplateVersion>> {
        // 回滚逻辑与发布相同
        self.publish_version(template_id, version_id).await
    }

    /// 获取版本
    pub async fn get_version(&self, version_id: &str) -> Result<Option<TemplateVersion>> {
        let row = sqlx::query(
            "SELECT id, template_id, version, status, content, created_at, updated_at
             FROM template_versions WHERE id = ? AND tenant_id = ? LIMIT 1;",
        )
        .bind(version_id)
        .bind(&self.tenant_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_version))
    }

    /// 获取模板的所有版本
    pub async fn list_versions(&self, template_id: &str) -> Result<Vec<TemplateVersion>> {
        let rows = sqlx::query(
            "SELECT id, template_id, version, status, content, created_at, updated_at
             FROM template_versions WHERE template_id = ? AND tenant_id = ?
             ORDER BY version ASC;",
        )
        .bind(template_id)
        .bind(&self.tenant_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_version).collect())
    }

    /// 获取活跃版本（当前 published 版本）
    pub async fn get_active_version(
        &self,
        template_id: &str,
    ) -> Result<Option<TemplateVersion>> {
        let row = sqlx::query(
            "SELECT id, template_id, version, status, content, created_at, updated_at
             FROM template_versions
             WHERE template_id = ? AND status = 'published' AND tenant_id = ?
             LIMIT 1;",
        )
        .bind(template_id)
        .bind(&self.tenant_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_version))
    }

    /// 获取模板运行时状态（对应前端 TemplateRuntimeState）
    pub async fn get_runtime_state(
        &self,
        template_id: &str,
    ) -> Result<TemplateRuntimeState> {
        let template = self.get_template(template_id).await?;
        let versions = self.list_versions(template_id).await?;

        let (default_version_id, active_version_id) = match template {
            Some(t) => (t.default_version_id, t.active_version_id),
            None => (None, None),
        };

        Ok(TemplateRuntimeState {
            template_id: template_id.to_string(),
            default_version_id,
            active_version_id,
            versions,
        })
    }

    /// 计算下一个版本号
    async fn next_version_number(&self, template_id: &str) -> Result<i64> {
        let row = sqlx::query(
            "SELECT MAX(version) as max_version FROM template_versions
             WHERE template_id = ? AND tenant_id = ?;",
        )
        .bind(template_id)
        .bind(&self.tenant_id)
        .fetch_one(&self.pool)
        .await?;

        let max_version: Option<i64> = row.try_get("max_version").unwrap_or(None);
        Ok(max_version.unwrap_or(0) + 1)
    }

    // ---- Schema CRUD (FR1279-FR1284) ----

    /// FR1279: 保存模板 Schema
    pub async fn save_schema(&self, template_id: &str, schema_json: &str) -> Result<bool> {
        let now = now_timestamp();
        let result = sqlx::query(
            "UPDATE templates SET schema_json = ?, updated_at = ?
             WHERE id = ? AND tenant_id = ?;",
        )
        .bind(schema_json)
        .bind(now)
        .bind(template_id)
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// FR1279: 获取模板 Schema JSON
    pub async fn get_schema(&self, template_id: &str) -> Result<Option<String>> {
        let row = sqlx::query(
            "SELECT schema_json FROM templates WHERE id = ? AND tenant_id = ? LIMIT 1;",
        )
        .bind(template_id)
        .bind(&self.tenant_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.and_then(|r| r.try_get::<String, _>("schema_json").ok()))
    }

    /// FR1280: 创建模板并关联 Schema
    pub async fn create_template_with_schema(
        &self,
        id: &str,
        name: &str,
        schema_json: &str,
    ) -> Result<Template> {
        let now = now_timestamp();
        sqlx::query(
            "INSERT INTO templates (id, name, default_version_id, active_version_id, schema_json, created_at, updated_at, tenant_id)
             VALUES (?, ?, NULL, NULL, ?, ?, ?, ?);",
        )
        .bind(id)
        .bind(name)
        .bind(schema_json)
        .bind(now)
        .bind(now)
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        Ok(Template {
            id: id.to_string(),
            name: name.to_string(),
            default_version_id: None,
            active_version_id: None,
            schema_json: Some(schema_json.to_string()),
            created_at: now,
            updated_at: now,
        })
    }
}

// ============ Helper functions ============

fn now_timestamp() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn map_template(row: sqlx::sqlite::SqliteRow) -> Template {
    Template {
        id: row.get("id"),
        name: row.get("name"),
        default_version_id: row.try_get("default_version_id").unwrap_or(None),
        active_version_id: row.try_get("active_version_id").unwrap_or(None),
        schema_json: row.try_get("schema_json").unwrap_or(None),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

fn map_version(row: sqlx::sqlite::SqliteRow) -> TemplateVersion {
    let status_str: String = row.try_get("status").unwrap_or_else(|_| "draft".to_string());
    let status = TemplateStatus::from_str(&status_str).unwrap_or_default();

    TemplateVersion {
        id: row.get("id"),
        template_id: row.get("template_id"),
        version: row.get("version"),
        status,
        content: row.get("content"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

// ============ 单元测试 ============

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;
    use std::time::{SystemTime, UNIX_EPOCH};

    /// 创建隔离的测试 SQLite pool
    ///
    /// 使用 tempfile::tempdir() 创建临时目录，避免并行测试竞态
    async fn create_test_pool() -> SqlitePool {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let tenant_id = format!("test-template-{}", suffix);

        let temp_dir = tempfile::tempdir().expect("failed to create temp dir");
        let base_dir = temp_dir.path().to_path_buf();

        // 使用临时目录创建 pool（绕过 env var）
        let db_path = base_dir.join(&tenant_id).join("local.db");
        std::fs::create_dir_all(db_path.parent().unwrap())
            .expect("failed to create db dir");

        use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};
        let options = SqliteConnectOptions::new()
            .filename(&db_path)
            .create_if_missing(true)
            .journal_mode(SqliteJournalMode::Wal)
            .synchronous(SqliteSynchronous::Normal);

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(options)
            .await
            .expect("failed to connect sqlite");

        sqlx::query("PRAGMA foreign_keys = ON;")
            .execute(&pool)
            .await
            .expect("failed to enable foreign keys");

        crate::storage::migrations::run_migrations(&pool)
            .await
            .expect("failed to run migrations");

        pool
    }

    #[test]
    fn test_template_status_roundtrip() {
        assert_eq!(TemplateStatus::from_str("draft"), Some(TemplateStatus::Draft));
        assert_eq!(TemplateStatus::from_str("published"), Some(TemplateStatus::Published));
        assert_eq!(TemplateStatus::from_str("archived"), Some(TemplateStatus::Archived));
        assert_eq!(TemplateStatus::from_str("unknown"), None);
    }

    #[test]
    fn test_template_status_as_str() {
        assert_eq!(TemplateStatus::Draft.as_str(), "draft");
        assert_eq!(TemplateStatus::Published.as_str(), "published");
        assert_eq!(TemplateStatus::Archived.as_str(), "archived");
    }

    #[test]
    fn test_template_status_default() {
        assert_eq!(TemplateStatus::default(), TemplateStatus::Draft);
    }

    #[tokio::test]
    async fn test_create_template() {
        let pool = create_test_pool().await;
        let store = TemplateStore::new(pool, "test-tenant".to_string());

        let template = store.create_template("tmpl-1", "测试模板").await.unwrap();
        assert_eq!(template.id, "tmpl-1");
        assert_eq!(template.name, "测试模板");
        assert!(template.default_version_id.is_none());
        assert!(template.active_version_id.is_none());
    }

    #[tokio::test]
    async fn test_create_draft_version() {
        let pool = create_test_pool().await;
        let store = TemplateStore::new(pool, "test-tenant".to_string());

        store.create_template("tmpl-2", "测试模板2").await.unwrap();

        let version = store.create_draft("tmpl-2", "模板内容v1").await.unwrap();
        assert_eq!(version.template_id, "tmpl-2");
        assert_eq!(version.version, 1);
        assert_eq!(version.status, TemplateStatus::Draft);
        assert_eq!(version.content, "模板内容v1");
    }

    #[tokio::test]
    async fn test_publish_version() {
        let pool = create_test_pool().await;
        let store = TemplateStore::new(pool, "test-tenant".to_string());

        store.create_template("tmpl-3", "测试模板3").await.unwrap();
        let draft = store.create_draft("tmpl-3", "模板内容v1").await.unwrap();

        let published = store.publish_version("tmpl-3", &draft.id).await.unwrap();
        assert!(published.is_some());
        let published = published.unwrap();
        assert_eq!(published.status, TemplateStatus::Published);
    }

    #[tokio::test]
    async fn test_publish_archives_previous() {
        let pool = create_test_pool().await;
        let store = TemplateStore::new(pool, "test-tenant".to_string());

        store.create_template("tmpl-4", "测试模板4").await.unwrap();
        let v1 = store.create_draft("tmpl-4", "内容v1").await.unwrap();
        let v2 = store.create_draft("tmpl-4", "内容v2").await.unwrap();

        // 发布 v1
        store.publish_version("tmpl-4", &v1.id).await.unwrap();

        // 发布 v2 -> v1 应变为 archived
        store.publish_version("tmpl-4", &v2.id).await.unwrap();

        let v1_after = store.get_version(&v1.id).await.unwrap().unwrap();
        assert_eq!(v1_after.status, TemplateStatus::Archived);

        let v2_after = store.get_version(&v2.id).await.unwrap().unwrap();
        assert_eq!(v2_after.status, TemplateStatus::Published);
    }

    #[tokio::test]
    async fn test_get_active_version() {
        let pool = create_test_pool().await;
        let store = TemplateStore::new(pool, "test-tenant".to_string());

        store.create_template("tmpl-5", "测试模板5").await.unwrap();
        let v1 = store.create_draft("tmpl-5", "内容v1").await.unwrap();
        store.publish_version("tmpl-5", &v1.id).await.unwrap();

        let active = store.get_active_version("tmpl-5").await.unwrap();
        assert!(active.is_some());
        assert_eq!(active.unwrap().id, v1.id);
    }

    #[tokio::test]
    async fn test_set_default_version() {
        let pool = create_test_pool().await;
        let store = TemplateStore::new(pool, "test-tenant".to_string());

        store.create_template("tmpl-6", "测试模板6").await.unwrap();
        let v1 = store.create_draft("tmpl-6", "内容v1").await.unwrap();

        let result = store.set_default_version("tmpl-6", &v1.id).await.unwrap();
        assert!(result);

        let template = store.get_template("tmpl-6").await.unwrap().unwrap();
        assert_eq!(template.default_version_id, Some(v1.id));
    }

    #[tokio::test]
    async fn test_list_versions() {
        let pool = create_test_pool().await;
        let store = TemplateStore::new(pool, "test-tenant".to_string());

        store.create_template("tmpl-7", "测试模板7").await.unwrap();
        store.create_draft("tmpl-7", "内容v1").await.unwrap();
        store.create_draft("tmpl-7", "内容v2").await.unwrap();
        store.create_draft("tmpl-7", "内容v3").await.unwrap();

        let versions = store.list_versions("tmpl-7").await.unwrap();
        assert_eq!(versions.len(), 3);
        assert_eq!(versions[0].version, 1);
        assert_eq!(versions[1].version, 2);
        assert_eq!(versions[2].version, 3);
    }

    #[tokio::test]
    async fn test_get_runtime_state() {
        let pool = create_test_pool().await;
        let store = TemplateStore::new(pool, "test-tenant".to_string());

        store.create_template("tmpl-8", "测试模板8").await.unwrap();
        let v1 = store.create_draft("tmpl-8", "内容v1").await.unwrap();
        store.publish_version("tmpl-8", &v1.id).await.unwrap();

        let state = store.get_runtime_state("tmpl-8").await.unwrap();
        assert_eq!(state.template_id, "tmpl-8");
        assert!(state.active_version_id.is_some());
        assert_eq!(state.versions.len(), 1);
    }

    #[tokio::test]
    async fn test_rollback_to_version() {
        let pool = create_test_pool().await;
        let store = TemplateStore::new(pool, "test-tenant".to_string());

        store.create_template("tmpl-9", "测试模板9").await.unwrap();
        let v1 = store.create_draft("tmpl-9", "内容v1").await.unwrap();
        let v2 = store.create_draft("tmpl-9", "内容v2").await.unwrap();
        store.publish_version("tmpl-9", &v2.id).await.unwrap();

        // 回滚到 v1
        let result = store.rollback_to_version("tmpl-9", &v1.id).await.unwrap();
        assert!(result.is_some());
        assert_eq!(result.unwrap().status, TemplateStatus::Published);

        // v2 应变为 archived
        let v2_after = store.get_version(&v2.id).await.unwrap().unwrap();
        assert_eq!(v2_after.status, TemplateStatus::Archived);
    }

    #[tokio::test]
    async fn test_save_and_get_schema() {
        let pool = create_test_pool().await;
        let store = TemplateStore::new(pool, "test-tenant".to_string());

        store.create_template("tmpl-s1", "Schema测试").await.unwrap();

        // 初始无 schema
        let schema = store.get_schema("tmpl-s1").await.unwrap();
        assert!(schema.is_none());

        // 保存 schema
        let schema_json = r#"{"schemaVersion":"1.0","templateId":"tmpl-s1"}"#;
        let saved = store.save_schema("tmpl-s1", schema_json).await.unwrap();
        assert!(saved);

        // 读取 schema
        let schema = store.get_schema("tmpl-s1").await.unwrap();
        assert!(schema.is_some());
        assert!(schema.unwrap().contains("tmpl-s1"));
    }

    #[tokio::test]
    async fn test_create_template_with_schema() {
        let pool = create_test_pool().await;
        let store = TemplateStore::new(pool, "test-tenant".to_string());

        let schema_json = r#"{"schemaVersion":"1.0","templateId":"tmpl-s2"}"#;
        let template = store
            .create_template_with_schema("tmpl-s2", "带Schema模板", schema_json)
            .await
            .unwrap();

        assert_eq!(template.id, "tmpl-s2");
        assert!(template.schema_json.is_some());

        // 通过 get_template 读取
        let loaded = store.get_template("tmpl-s2").await.unwrap().unwrap();
        assert!(loaded.schema_json.is_some());
    }
}
