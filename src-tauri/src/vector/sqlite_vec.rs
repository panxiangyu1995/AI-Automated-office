use crate::vector::hybrid::Bm25Store;
use crate::vector::store::{SearchResult, VectorItem, VectorQuery, VectorStore};
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use rusqlite::{params, params_from_iter, Connection};
use rusqlite::ffi::sqlite3_auto_extension;
use std::mem::transmute;
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use zerocopy::AsBytes;

#[derive(Clone)]
pub struct SqliteVecStore {
    conn: Arc<Mutex<Connection>>,
    dimension: usize,
}

impl SqliteVecStore {
    pub fn new(path: impl AsRef<Path>, dimension: usize) -> Result<Self> {
        unsafe {
            sqlite3_auto_extension(Some(transmute(sqlite_vec::sqlite3_vec_init as *const ())));
        }
        if let Some(parent) = path.as_ref().parent() {
            fs::create_dir_all(parent)?;
        }
        let conn = Connection::open(path)?;
        let store = Self {
            conn: Arc::new(Mutex::new(conn)),
            dimension,
        };
        store.init_schema()?;
        Ok(store)
    }

    fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock().map_err(|_| anyhow!("无法获取连接锁"))?;
        let sql = format!(
            "CREATE VIRTUAL TABLE IF NOT EXISTS vec_items USING vec0(
                id TEXT PRIMARY KEY,
                embedding FLOAT[{}],
                content TEXT,
                metadata TEXT,
                created_at INTEGER
            );
            CREATE VIRTUAL TABLE IF NOT EXISTS text_index USING fts5(
                id,
                content,
                metadata,
                tokenize='porter unicode61'
            );",
            self.dimension
        );
        conn.execute_batch(&sql)?;
        Ok(())
    }

    pub async fn bm25_search(&self, query: &str, k: usize) -> Result<Vec<SearchResult>> {
        let conn = self.conn.clone();
        let query = query.to_string();
        tokio::task::spawn_blocking(move || {
            let conn = conn.lock().map_err(|_| anyhow!("无法获取连接锁"))?;
            let mut stmt = conn.prepare(
                "SELECT id, metadata, bm25(text_index) as score
                 FROM text_index
                 WHERE text_index MATCH ?
                 ORDER BY score
                 LIMIT ?;",
            )?;
            let rows = stmt.query_map(params![query, k as i64], |row| {
                let metadata: String = row.get(1)?;
                let raw_score: f64 = row.get(2)?;
                let score = 1.0 / (1.0 + raw_score.abs());
                Ok(SearchResult {
                    id: row.get(0)?,
                    score: score as f32,
                    metadata: serde_json::from_str(&metadata).unwrap_or_default(),
                })
            })?;
            let mut results = Vec::new();
            for row in rows {
                results.push(row?);
            }
            Ok(results)
        })
        .await?
    }

    fn normalize_vector(vector: &[f32]) -> Vec<f32> {
        let norm = vector.iter().map(|v| (*v as f64) * (*v as f64)).sum::<f64>().sqrt();
        if norm == 0.0 {
            return vector.to_vec();
        }
        vector.iter().map(|v| (v / norm as f32)).collect()
    }

    fn current_timestamp() -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0)
    }

    fn build_filter(filter: Option<&str>) -> Result<(String, Vec<rusqlite::types::Value>)> {
        let Some(filter) = filter else {
            return Ok((String::new(), Vec::new()));
        };

        let value: serde_json::Value =
            serde_json::from_str(filter).map_err(|_| anyhow!("过滤条件必须是 JSON"))?;
        let map = value
            .as_object()
            .ok_or_else(|| anyhow!("过滤条件必须是对象"))?;
        let allowed = ["category", "source", "tag", "type"];
        let mut clauses = Vec::new();
        let mut params = Vec::new();
        for (key, value) in map.iter() {
            if !allowed.contains(&key.as_str()) {
                return Err(anyhow!("不允许的过滤字段: {}", key));
            }
            clauses.push(format!("json_extract(metadata, '$.{}') = ?", key));
            let param = match value {
                serde_json::Value::String(value) => rusqlite::types::Value::from(value.clone()),
                serde_json::Value::Number(value) => {
                    if let Some(value) = value.as_i64() {
                        rusqlite::types::Value::from(value)
                    } else if let Some(value) = value.as_u64() {
                        rusqlite::types::Value::from(value as i64)
                    } else {
                        rusqlite::types::Value::from(value.as_f64().unwrap_or(0.0))
                    }
                }
                serde_json::Value::Bool(value) => rusqlite::types::Value::from(*value as i64),
                serde_json::Value::Null => rusqlite::types::Value::Null,
                _ => {
                    return Err(anyhow!("过滤条件仅支持字符串、数字和布尔值"));
                }
            };
            params.push(param);
        }
        if clauses.is_empty() {
            return Ok((String::new(), Vec::new()));
        }
        Ok((format!("WHERE {}", clauses.join(" AND ")), params))
    }

    fn ensure_dimension(&self, vector: &[f32]) -> Result<()> {
        if vector.len() != self.dimension {
            return Err(anyhow!(
                "向量维度不匹配，期望 {}，实际 {}",
                self.dimension,
                vector.len()
            ));
        }
        Ok(())
    }

    fn metadata_content(metadata: &serde_json::Value, content: &Option<String>) -> String {
        content
            .clone()
            .or_else(|| metadata.get("content").and_then(|v| v.as_str()).map(|v| v.to_string()))
            .unwrap_or_default()
    }

    fn upsert_text_index(
        conn: &dyn TextIndexConnection,
        id: &str,
        content: &str,
        metadata: &serde_json::Value,
    ) -> Result<()> {
        let metadata_string = metadata.to_string();
        let delete_params: [&dyn rusqlite::ToSql; 1] = [&id];
        conn.execute("DELETE FROM text_index WHERE id = ?1;", &delete_params)?;
        let insert_params: [&dyn rusqlite::ToSql; 3] = [&id, &content, &metadata_string];
        conn.execute(
            "INSERT INTO text_index (id, content, metadata) VALUES (?1, ?2, ?3);",
            &insert_params,
        )?;
        Ok(())
    }
}

#[async_trait]
impl VectorStore for SqliteVecStore {
    async fn insert(&self, id: &str, vector: &[f32], metadata: &serde_json::Value) -> Result<()> {
        self.ensure_dimension(vector)?;
        let conn = self.conn.clone();
        let id = id.to_string();
        let vector = vector.to_vec();
        let metadata = metadata.clone();
        tokio::task::spawn_blocking(move || {
            let conn = conn.lock().map_err(|_| anyhow!("无法获取连接锁"))?;
            let vector = Self::normalize_vector(&vector);
            let content = Self::metadata_content(&metadata, &None);
            // sqlite-vec 虚拟表不支持 UPSERT，需要先删除再插入
            conn.execute("DELETE FROM vec_items WHERE id = ?1", params![id])?;
            conn.execute(
                "INSERT INTO vec_items (id, embedding, content, metadata, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![id, vector.as_bytes(), content, metadata.to_string(), Self::current_timestamp()],
            )?;
            Self::upsert_text_index(&*conn, &id, &content, &metadata)?;
            Ok(())
        })
        .await?
    }

    async fn insert_batch(&self, items: Vec<VectorItem>) -> Result<()> {
        let conn = self.conn.clone();
        let dimension = self.dimension;
        tokio::task::spawn_blocking(move || {
            let mut conn = conn.lock().map_err(|_| anyhow!("无法获取连接锁"))?;
            let tx = conn.transaction()?;
            for item in items {
                if item.vector.len() != dimension {
                    return Err(anyhow!("向量维度不匹配"));
                }
                let vector = Self::normalize_vector(&item.vector);
                let content = Self::metadata_content(&item.metadata, &item.content);
                // sqlite-vec 虚拟表不支持 UPSERT，需要先删除再插入
                tx.execute("DELETE FROM vec_items WHERE id = ?1", params![item.id])?;
                tx.execute(
                    "INSERT INTO vec_items (id, embedding, content, metadata, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![
                        item.id,
                        vector.as_bytes(),
                        content,
                        item.metadata.to_string(),
                        Self::current_timestamp()
                    ],
                )?;
                Self::upsert_text_index(&tx, &item.id, &content, &item.metadata)?;
            }
            tx.commit()?;
            Ok(())
        })
        .await?
    }

    async fn search(&self, query: VectorQuery) -> Result<Vec<SearchResult>> {
        self.ensure_dimension(&query.vector)?;
        let conn = self.conn.clone();
        let vector = query.vector.clone();
        let k = query.k;
        let filter = query.filter.clone();
        let include_metadata = query.include_metadata;
        tokio::task::spawn_blocking(move || {
            let conn = conn.lock().map_err(|_| anyhow!("无法获取连接锁"))?;
            let vector = Self::normalize_vector(&vector);
            let (filter_clause, mut params) = Self::build_filter(filter.as_deref())?;
            let sql = format!(
                "SELECT id, metadata, vec_distance_cosine(embedding, ?) as distance
                 FROM vec_items
                 {}
                 ORDER BY distance
                 LIMIT ?;",
                filter_clause
            );
            let mut all_params = Vec::with_capacity(params.len() + 2);
            all_params.push(rusqlite::types::Value::from(vector.as_bytes().to_vec()));
            all_params.append(&mut params);
            all_params.push(rusqlite::types::Value::from(k as i64));
            let mut stmt = conn.prepare(&sql)?;
            let rows = stmt.query_map(params_from_iter(all_params), |row| {
                let distance: f64 = row.get(2)?;
                let metadata: String = row.get(1)?;
                let metadata_value = if include_metadata {
                    serde_json::from_str(&metadata).unwrap_or_default()
                } else {
                    serde_json::Value::Object(serde_json::Map::new())
                };
                Ok(SearchResult {
                    id: row.get(0)?,
                    score: (1.0 - distance) as f32,
                    metadata: metadata_value,
                })
            })?;
            let mut results = Vec::new();
            for row in rows {
                results.push(row?);
            }
            Ok(results)
        })
        .await?
    }

    async fn delete(&self, id: &str) -> Result<()> {
        let conn = self.conn.clone();
        let id = id.to_string();
        tokio::task::spawn_blocking(move || {
            let conn = conn.lock().map_err(|_| anyhow!("无法获取连接锁"))?;
            conn.execute("DELETE FROM vec_items WHERE id = ?1;", params![id])?;
            conn.execute("DELETE FROM text_index WHERE id = ?1;", params![id])?;
            Ok(())
        })
        .await?
    }

    async fn update(&self, id: &str, vector: &[f32], metadata: &serde_json::Value) -> Result<()> {
        self.insert(id, vector, metadata).await
    }

    async fn count(&self) -> Result<usize> {
        let conn = self.conn.clone();
        tokio::task::spawn_blocking(move || {
            let conn = conn.lock().map_err(|_| anyhow!("无法获取连接锁"))?;
            let count: i64 = conn.query_row("SELECT COUNT(*) FROM vec_items;", [], |row| row.get(0))?;
            Ok(count as usize)
        })
        .await?
    }
}

trait TextIndexConnection {
    fn execute(&self, sql: &str, params: &[&dyn rusqlite::ToSql]) -> rusqlite::Result<usize>;
}

impl TextIndexConnection for rusqlite::Connection {
    fn execute(&self, sql: &str, params: &[&dyn rusqlite::ToSql]) -> rusqlite::Result<usize> {
        rusqlite::Connection::execute(self, sql, params)
    }
}

impl TextIndexConnection for rusqlite::Transaction<'_> {
    fn execute(&self, sql: &str, params: &[&dyn rusqlite::ToSql]) -> rusqlite::Result<usize> {
        // 注意：这里调用的是 Connection 的 execute，不是 Transaction 自己的
        // 因为 trait 方法和 impl 方法同名，会导致递归调用
        rusqlite::Connection::execute(self, sql, params)
    }
}

#[async_trait]
impl Bm25Store for SqliteVecStore {
    async fn bm25_search(&self, query: &str, k: usize) -> Result<Vec<SearchResult>> {
        SqliteVecStore::bm25_search(self, query, k).await
    }
}
