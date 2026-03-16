use crate::vector::config::QdrantConfig;
use crate::vector::store::{SearchResult, VectorItem, VectorQuery, VectorStore};
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};

pub struct QdrantStore {
    client: reqwest::Client,
    config: QdrantConfig,
}

impl QdrantStore {
    pub fn new(config: QdrantConfig) -> Result<Self> {
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        if let Some(api_key) = &config.api_key {
            if !api_key.is_empty() {
                let value = format!("Bearer {}", api_key);
                headers.insert(AUTHORIZATION, HeaderValue::from_str(&value)?);
            }
        }
        let client = reqwest::Client::builder()
            .default_headers(headers)
            .build()?;
        Ok(Self { client, config })
    }

    pub async fn ensure_collection(&self) -> Result<()> {
        let url = format!(
            "{}/collections/{}",
            self.config.url.trim_end_matches('/'),
            self.config.collection
        );
        let response = self.client.get(&url).send().await?;
        if response.status().is_success() {
            return Ok(());
        }
        if response.status().as_u16() != 404 {
            return Err(anyhow!("Qdrant 集合检查失败: {}", response.status()));
        }
        let body = serde_json::json!({
            "vectors": {
                "size": self.config.dimension,
                "distance": "Cosine"
            }
        });
        let create = self.client.put(&url).json(&body).send().await?;
        if !create.status().is_success() {
            return Err(anyhow!("创建 Qdrant 集合失败: {}", create.status()));
        }
        Ok(())
    }

    fn parse_filter(filter: &Option<String>) -> Result<Option<serde_json::Value>> {
        match filter {
            Some(raw) => {
                let value: serde_json::Value =
                    serde_json::from_str(raw).map_err(|_| anyhow!("过滤条件必须是 JSON"))?;
                Ok(Some(value))
            }
            None => Ok(None),
        }
    }
}

#[async_trait]
impl VectorStore for QdrantStore {
    async fn insert(&self, id: &str, vector: &[f32], metadata: &serde_json::Value) -> Result<()> {
        self.ensure_collection().await?;
        let url = format!(
            "{}/collections/{}/points?wait=true",
            self.config.url.trim_end_matches('/'),
            self.config.collection
        );
        let body = serde_json::json!({
            "points": [{
                "id": id,
                "vector": vector,
                "payload": metadata
            }]
        });
        let response = self.client.put(&url).json(&body).send().await?;
        if !response.status().is_success() {
            return Err(anyhow!("Qdrant 插入失败: {}", response.status()));
        }
        Ok(())
    }

    async fn insert_batch(&self, items: Vec<VectorItem>) -> Result<()> {
        self.ensure_collection().await?;
        let url = format!(
            "{}/collections/{}/points?wait=true",
            self.config.url.trim_end_matches('/'),
            self.config.collection
        );
        let points: Vec<serde_json::Value> = items
            .into_iter()
            .map(|item| {
                serde_json::json!({
                    "id": item.id,
                    "vector": item.vector,
                    "payload": item.metadata
                })
            })
            .collect();
        let body = serde_json::json!({ "points": points });
        let response = self.client.put(&url).json(&body).send().await?;
        if !response.status().is_success() {
            return Err(anyhow!("Qdrant 批量插入失败: {}", response.status()));
        }
        Ok(())
    }

    async fn search(&self, query: VectorQuery) -> Result<Vec<SearchResult>> {
        self.ensure_collection().await?;
        let url = format!(
            "{}/collections/{}/points/search",
            self.config.url.trim_end_matches('/'),
            self.config.collection
        );
        let filter = Self::parse_filter(&query.filter)?;
        let body = serde_json::json!({
            "vector": query.vector,
            "limit": query.k,
            "filter": filter
        });
        let response = self.client.post(&url).json(&body).send().await?;
        if !response.status().is_success() {
            return Err(anyhow!("Qdrant 搜索失败: {}", response.status()));
        }
        let payload: serde_json::Value = response.json().await?;
        let results = payload
            .get("result")
            .and_then(|v| v.as_array())
            .ok_or_else(|| anyhow!("Qdrant 响应格式不正确"))?;
        let mut output = Vec::new();
        for item in results {
            let id = item.get("id").ok_or_else(|| anyhow!("缺少 id"))?;
            let id = if let Some(value) = id.as_str() {
                value.to_string()
            } else if let Some(value) = id.as_i64() {
                value.to_string()
            } else if let Some(value) = id.as_u64() {
                value.to_string()
            } else {
                return Err(anyhow!("Qdrant id 类型不支持"));
            };
            let score = item.get("score").and_then(|v| v.as_f64()).unwrap_or(0.0);
            let metadata = item.get("payload").cloned().unwrap_or_default();
            output.push(SearchResult {
                id,
                score: score as f32,
                metadata,
            });
        }
        Ok(output)
    }

    async fn delete(&self, id: &str) -> Result<()> {
        self.ensure_collection().await?;
        let url = format!(
            "{}/collections/{}/points/delete?wait=true",
            self.config.url.trim_end_matches('/'),
            self.config.collection
        );
        let body = serde_json::json!({ "points": [id] });
        let response = self.client.post(&url).json(&body).send().await?;
        if !response.status().is_success() {
            return Err(anyhow!("Qdrant 删除失败: {}", response.status()));
        }
        Ok(())
    }

    async fn update(&self, id: &str, vector: &[f32], metadata: &serde_json::Value) -> Result<()> {
        self.insert(id, vector, metadata).await
    }

    async fn count(&self) -> Result<usize> {
        self.ensure_collection().await?;
        let url = format!(
            "{}/collections/{}/points/count",
            self.config.url.trim_end_matches('/'),
            self.config.collection
        );
        let response = self.client.post(&url).json(&serde_json::json!({})).send().await?;
        if !response.status().is_success() {
            return Err(anyhow!("Qdrant 计数失败: {}", response.status()));
        }
        let payload: serde_json::Value = response.json().await?;
        let count = payload
            .get("result")
            .and_then(|r| r.get("count"))
            .and_then(|v| v.as_u64())
            .ok_or_else(|| anyhow!("Qdrant 响应格式不正确"))?;
        Ok(count as usize)
    }
}
