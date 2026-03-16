use crate::vector::config::EmbeddingConfig;
use anyhow::{anyhow, Result};
use serde::Deserialize;

pub struct EmbeddingService {
    client: reqwest::Client,
    config: EmbeddingConfig,
}

#[derive(Debug, Deserialize)]
struct EmbeddingResponse {
    data: Vec<EmbeddingData>,
}

#[derive(Debug, Deserialize)]
struct EmbeddingData {
    embedding: Vec<f32>,
}

impl EmbeddingService {
    pub fn new(config: EmbeddingConfig) -> Result<Self> {
        let client = reqwest::Client::builder().build()?;
        Ok(Self { client, config })
    }

    pub async fn embed_text(&self, input: &str) -> Result<Vec<f32>> {
        let results = self.embed_texts(vec![input.to_string()]).await?;
        results
            .into_iter()
            .next()
            .ok_or_else(|| anyhow!("向量嵌入结果为空"))
    }

    pub async fn embed_texts(&self, inputs: Vec<String>) -> Result<Vec<Vec<f32>>> {
        if inputs.is_empty() {
            return Ok(Vec::new());
        }
        let url = format!("{}/v1/embeddings", self.config.base_url.trim_end_matches('/'));
        let body = serde_json::json!({
            "input": inputs,
            "model": self.config.model
        });
        let response = self
            .client
            .post(&url)
            .bearer_auth(&self.config.api_key)
            .json(&body)
            .send()
            .await?;
        if !response.status().is_success() {
            return Err(anyhow!("Embedding API 调用失败: {}", response.status()));
        }
        let payload: EmbeddingResponse = response.json().await?;
        let embeddings: Vec<Vec<f32>> =
            payload.data.into_iter().map(|d| d.embedding).collect();
        if let Some(first) = embeddings.first() {
            if first.len() != self.config.dimension {
                return Err(anyhow!(
                    "向量维度不匹配，期望 {}，实际 {}",
                    self.config.dimension,
                    first.len()
                ));
            }
        }
        Ok(embeddings)
    }
}
