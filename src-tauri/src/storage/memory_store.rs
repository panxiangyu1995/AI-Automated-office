use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryFact {
    pub id: String,
    pub key: String,
    pub value: String,
    pub category: Option<String>,
    pub confidence: f64,
    pub source: Option<String>,
    pub embedding: Option<Vec<u8>>,
    pub created_at: i64,
    pub updated_at: i64,
    pub last_accessed_at: Option<i64>,
    pub access_count: i64,
    pub is_deleted: bool,
    pub tenant_id: String,
}

#[derive(Clone)]
pub struct MemoryStore {
    pool: SqlitePool,
    tenant_id: String,
}

impl MemoryStore {
    pub fn new(pool: SqlitePool, tenant_id: String) -> Self {
        Self { pool, tenant_id }
    }

    pub async fn create(&self, fact: &MemoryFact) -> Result<()> {
        sqlx::query(
            "INSERT INTO memory_facts (id, key, value, category, confidence, source, embedding, created_at, updated_at, last_accessed_at, access_count, is_deleted, tenant_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&fact.id)
        .bind(&fact.key)
        .bind(&fact.value)
        .bind(&fact.category)
        .bind(fact.confidence)
        .bind(&fact.source)
        .bind(&fact.embedding)
        .bind(fact.created_at)
        .bind(fact.updated_at)
        .bind(fact.last_accessed_at)
        .bind(fact.access_count)
        .bind(if fact.is_deleted { 1 } else { 0 })
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<MemoryFact>> {
        let row = sqlx::query(
            "SELECT id, key, value, category, confidence, source, embedding, created_at, updated_at, last_accessed_at, access_count, is_deleted, tenant_id
             FROM memory_facts WHERE id = ? AND tenant_id = ? LIMIT 1;",
        )
        .bind(id)
        .bind(&self.tenant_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_fact))
    }

    pub async fn update(&self, fact: &MemoryFact) -> Result<()> {
        sqlx::query(
            "UPDATE memory_facts
             SET key = ?, value = ?, category = ?, confidence = ?, source = ?, embedding = ?, created_at = ?, updated_at = ?, last_accessed_at = ?, access_count = ?, is_deleted = ?
             WHERE id = ? AND tenant_id = ?;",
        )
        .bind(&fact.key)
        .bind(&fact.value)
        .bind(&fact.category)
        .bind(fact.confidence)
        .bind(&fact.source)
        .bind(&fact.embedding)
        .bind(fact.created_at)
        .bind(fact.updated_at)
        .bind(fact.last_accessed_at)
        .bind(fact.access_count)
        .bind(if fact.is_deleted { 1 } else { 0 })
        .bind(&fact.id)
        .bind(&self.tenant_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn soft_delete(&self, id: &str) -> Result<()> {
        sqlx::query("UPDATE memory_facts SET is_deleted = 1 WHERE id = ? AND tenant_id = ?;")
            .bind(id)
            .bind(&self.tenant_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

fn map_fact(row: sqlx::sqlite::SqliteRow) -> MemoryFact {
    MemoryFact {
        id: row.get("id"),
        key: row.get("key"),
        value: row.get("value"),
        category: row.get("category"),
        confidence: row.get("confidence"),
        source: row.get("source"),
        embedding: row.get("embedding"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        last_accessed_at: row.get("last_accessed_at"),
        access_count: row.get("access_count"),
        is_deleted: row.get::<i64, _>("is_deleted") != 0,
        tenant_id: row.try_get("tenant_id").unwrap_or_default(),
    }
}
