use crate::vector::config::EmbeddingConfig;
use anyhow::{anyhow, Result};
use serde::Deserialize;

pub struct EmbeddingService {
    client: reqwest::Client,
    config: EmbeddingConfig,
}

/// OpenAI 格式的响应
#[derive(Debug, Deserialize)]
struct OpenAIEmbeddingResponse {
    data: Vec<OpenAIEmbeddingData>,
}

#[derive(Debug, Deserialize)]
struct OpenAIEmbeddingData {
    embedding: Vec<f32>,
}

/// Ollama 格式的响应
#[derive(Debug, Deserialize)]
struct OllamaEmbeddingResponse {
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

        // 检测是否为 Ollama API（本地服务）
        let base_url = self.config.base_url.trim_end_matches('/');
        let is_ollama = base_url.contains("localhost") || base_url.contains("127.0.0.1");

        if is_ollama {
            // 使用 Ollama API 格式
            self.embed_texts_ollama(inputs).await
        } else {
            // 使用 OpenAI API 格式
            self.embed_texts_openai(inputs).await
        }
    }

    /// OpenAI 兼容格式的嵌入调用
    async fn embed_texts_openai(&self, inputs: Vec<String>) -> Result<Vec<Vec<f32>>> {
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
        let payload: OpenAIEmbeddingResponse = response.json().await?;
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

    /// Ollama 格式的嵌入调用（单请求）
    async fn embed_texts_ollama(&self, inputs: Vec<String>) -> Result<Vec<Vec<f32>>> {
        let mut embeddings = Vec::new();

        for input in inputs {
            let url = format!("{}/api/embeddings", self.config.base_url.trim_end_matches('/'));
            let body = serde_json::json!({
                "model": self.config.model,
                "prompt": input
            });
            let response = self
                .client
                .post(&url)
                .json(&body)
                .send()
                .await?;
            if !response.status().is_success() {
                return Err(anyhow!("Ollama Embedding API 调用失败: {}", response.status()));
            }
            let payload: OllamaEmbeddingResponse = response.json().await?;
            if payload.embedding.len() != self.config.dimension {
                return Err(anyhow!(
                    "向量维度不匹配，期望 {}，实际 {}",
                    self.config.dimension,
                    payload.embedding.len()
                ));
            }
            embeddings.push(payload.embedding);
        }

        Ok(embeddings)
    }
}
