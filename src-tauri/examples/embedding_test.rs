// Embedding 服务测试脚本
// 运行方式: cargo run --example embedding_test

use anyhow::anyhow;
use ai_automated_office_lib::vector::{
    config::EmbeddingConfig,
    embedding::EmbeddingService,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    println!("╔══════════════════════════════════════════════════════════════╗");
    println!("║           Embedding 服务测试 - Story 1.9 验收              ║");
    println!("╚══════════════════════════════════════════════════════════════╝\n");

    // 测试1: Ollama 本地 embedding 服务
    test_ollama_embedding().await?;

    // 测试2: 批量文本嵌入
    test_batch_embedding().await?;

    // 测试3: 验证向量维度
    test_dimension().await?;

    println!("\n╔══════════════════════════════════════════════════════════════╗");
    println!("║                    ✅ 所有测试通过！                        ║");
    println!("╚══════════════════════════════════════════════════════════════╝\n");

    Ok(())
}

async fn test_ollama_embedding() -> anyhow::Result<()> {
    println!("【测试1】Ollama 本地 Embedding 服务");
    println!("─────────────────────────────────────────────────────────────");

    let config = EmbeddingConfig {
        provider: "ollama".to_string(),
        model: "nomic-embed-text".to_string(),
        api_key: String::new(), // Ollama 不需要 API key
        base_url: "http://localhost:11434".to_string(),
        dimension: 768, // nomic-embed-text 实际维度是 768
        batch_size: 32,
    };

    let service = EmbeddingService::new(config.clone())?;

    // 测试单文本嵌入
    let text = "这是一个测试文本";
    let embedding = service.embed_text(text).await?;

    println!("✅ 单文本嵌入成功");
    println!("   - 输入文本: {}", text);
    println!("   - 向量维度: {}", embedding.len());
    println!();

    Ok(())
}

async fn test_batch_embedding() -> anyhow::Result<()> {
    println!("【测试2】批量文本嵌入");
    println!("─────────────────────────────────────────────────────────────");

    let config = EmbeddingConfig {
        provider: "ollama".to_string(),
        model: "nomic-embed-text".to_string(),
        api_key: String::new(),
        base_url: "http://localhost:11434".to_string(),
        dimension: 768,
        batch_size: 32,
    };

    let service = EmbeddingService::new(config)?;

    let texts = vec![
        "第一个测试文档".to_string(),
        "第二个测试文档".to_string(),
        "第三个测试文档".to_string(),
    ];

    let embeddings = service.embed_texts(texts.clone()).await?;

    println!("✅ 批量嵌入成功");
    println!("   - 输入文档数: {}", texts.len());
    println!("   - 输出向量数: {}", embeddings.len());
    for (i, emb) in embeddings.iter().enumerate() {
        println!("   - 文档{} 向量维度: {}", i + 1, emb.len());
    }
    println!();

    Ok(())
}

async fn test_dimension() -> anyhow::Result<()> {
    println!("【测试3】向量维度验证");
    println!("─────────────────────────────────────────────────────────────");

    let config = EmbeddingConfig {
        provider: "ollama".to_string(),
        model: "nomic-embed-text".to_string(),
        api_key: String::new(),
        base_url: "http://localhost:11434".to_string(),
        dimension: 768,
        batch_size: 32,
    };

    let service = EmbeddingService::new(config)?;

    let text = "测试文本用于验证维度";
    let embedding = service.embed_text(text).await?;

    if embedding.len() == 768 {
        println!("✅ 向量维度验证通过: {}", embedding.len());
    } else {
        return Err(anyhow!(
            "向量维度不匹配，期望 768，实际 {}",
            embedding.len()
        ));
    }
    println!();

    Ok(())
}
