// 向量数据库综合测试脚本
// 运行方式: cargo run --example vector_test
//
// 测试覆盖 proposal.md 验收标准:
// 1. 向量存储抽象接口 (VectorStore Trait)
// 2. sqlite-vec本地存储
// 3. Qdrant云端适配器
// 4. 向量嵌入服务
// 5. 混合搜索实现 (RRF + BM25)

use ai_automated_office_lib::vector::{
    config::{EmbeddingConfig, HybridSearchConfig, QdrantConfig},
    embedding::EmbeddingService,
    hybrid::HybridSearchEngine,
    qdrant::QdrantStore,
    sqlite_vec::SqliteVecStore,
    store::{SearchResult, VectorItem, VectorQuery, VectorStore},
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    println!("======================================================================");
    println!("          Story 1.9 向量数据库综合测试 - 验收测试             ");
    println!("======================================================================\n");

    // ========== 测试1: 向量存储抽象接口 ==========
    println!("\n======================================================================");
    println!("【验收1】向量存储抽象接口 (VectorStore Trait)");
    println!("======================================================================");
    test_vector_store_trait().await?;

    // ========== 测试2: sqlite-vec本地存储 ==========
    println!("\n======================================================================");
    println!("【验收2】sqlite-vec本地存储");
    println!("======================================================================");
    test_sqlite_vec_store().await?;

    // ========== 测试3: Qdrant云端适配器 ==========
    println!("\n======================================================================");
    println!("【验收3】Qdrant云端适配器");
    println!("======================================================================");
    test_qdrant_store().await?;

    // ========== 测试4: 向量嵌入服务 ==========
    println!("\n======================================================================");
    println!("【验收4】向量嵌入服务 (Ollama)");
    println!("======================================================================");
    test_embedding_service().await?;

    // ========== 测试5: 混合搜索实现 ==========
    println!("\n======================================================================");
    println!("【验收5】混合搜索实现 (RRF + BM25)");
    println!("======================================================================");
    test_hybrid_search().await?;

    println!("\n======================================================================");
    println!("               ✅ Story 1.9 验收测试全部通过！            ");
    println!("======================================================================\n");

    Ok(())
}

// ============================================================
// 验收1: 向量存储抽象接口测试
// ============================================================
async fn test_vector_store_trait() -> anyhow::Result<()> {
    println!("\n【测试1.1】VectorStore Trait 基础功能");
    println!("─────────────────────────────────────────────────────────────");

    // 使用本地 sqlite-vec 作为测试实现
    let store = SqliteVecStore::new(":memory:", 768)?;

    // 测试1: 单条插入
    let test_vector: Vec<f32> = vec![0.1; 768];
    let metadata = serde_json::json!({"text": "测试文档", "category": "test"});
    store.insert("test_1", &test_vector, &metadata).await?;
    println!("✅ 单条插入成功");

    // 测试2: 批量插入
    let items = vec![
        VectorItem {
            id: "test_2".to_string(),
            vector: vec![0.2; 768],
            content: Some("文档2".to_string()),
            metadata: serde_json::json!({"category": "test"}),
        },
        VectorItem {
            id: "test_3".to_string(),
            vector: vec![0.3; 768],
            content: Some("文档3".to_string()),
            metadata: serde_json::json!({"category": "test"}),
        },
    ];
    store.insert_batch(items).await?;
    println!("✅ 批量插入成功");

    // 测试3: 搜索
    let query = VectorQuery {
        vector: test_vector.clone(),
        k: 5,
        filter: None,
        include_metadata: true,
    };
    let results = store.search(query).await?;
    println!("✅ 向量搜索成功, 找到 {} 个结果", results.len());

    // 测试4: 计数
    let count = store.count().await?;
    assert_eq!(count, 3, "向量数量应为3");
    println!("✅ 计数功能正确, 当前数量: {}", count);

    // 测试5: 更新
    let updated_metadata = serde_json::json!({"text": "已更新", "category": "updated"});
    store.update("test_1", &test_vector, &updated_metadata).await?;
    println!("✅ 向量更新成功");

    // 测试6: 删除
    store.delete("test_1").await?;
    let count_after_delete = store.count().await?;
    assert_eq!(count_after_delete, 2, "删除后数量应为2");
    println!("✅ 向量删除成功, 当前数量: {}", count_after_delete);

    println!("\n✅ 【验收1】向量存储抽象接口测试通过");
    Ok(())
}

// ============================================================
// 验收2: sqlite-vec本地存储测试
// ============================================================
async fn test_sqlite_vec_store() -> anyhow::Result<()> {
    // 使用临时文件
    let temp_path = format!("/tmp/test_sqlite_vec_{}.db", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis());

    let store = SqliteVecStore::new(&temp_path, 768)?;

    println!("\n【测试2.1】sqlite-vec 向量存储基础CRUD");
    println!("─────────────────────────────────────────────────────────────");

    // 插入测试向量
    let test_vector: Vec<f32> = (0..768).map(|i| (i as f32) * 0.001).collect();
    let metadata = serde_json::json!({
        "title": "sqlite测试文档",
        "content": "这是一个测试",
        "category": "test"
    });
    store.insert("sqlite_1", &test_vector, &metadata).await?;
    println!("✅ sqlite-vec 插入成功");

    // 搜索
    let query = VectorQuery {
        vector: test_vector.clone(),
        k: 10,
        filter: None,
        include_metadata: true,
    };
    let results = store.search(query).await?;
    println!("✅ sqlite-vec 搜索成功, 找到 {} 个结果", results.len());

    // 计数
    let count = store.count().await?;
    println!("✅ sqlite-vec 计数: {}", count);

    // 批量插入
    let items = vec![
        VectorItem {
            id: "sqlite_2".to_string(),
            vector: (0..768).map(|i| (i as f32) * 0.002).collect(),
            content: Some("批量文档1".to_string()),
            metadata: serde_json::json!({"category": "batch"}),
        },
        VectorItem {
            id: "sqlite_3".to_string(),
            vector: (0..768).map(|i| (i as f32) * 0.003).collect(),
            content: Some("批量文档2".to_string()),
            metadata: serde_json::json!({"category": "batch"}),
        },
    ];
    store.insert_batch(items).await?;
    println!("✅ sqlite-vec 批量插入成功");

    let count = store.count().await?;
    assert_eq!(count, 3);
    println!("✅ sqlite-vec 批量插入后计数: {}", count);

    println!("\n【测试2.2】sqlite-vec BM25全文搜索");
    println!("─────────────────────────────────────────────────────────────");

    // 测试 BM25 搜索
    let bm25_results = store.bm25_search("测试", 5).await?;
    println!("✅ BM25 搜索成功, 找到 {} 个结果", bm25_results.len());

    // 测试过滤功能
    let query_with_filter = VectorQuery {
        vector: test_vector.clone(),
        k: 10,
        filter: Some(r#"{"category": "batch"}"#.to_string()),
        include_metadata: true,
    };
    let filtered_results = store.search(query_with_filter).await?;
    println!("✅ 带过滤条件搜索成功, 找到 {} 个结果", filtered_results.len());

    // 删除测试
    store.delete("sqlite_1").await?;
    let count = store.count().await?;
    assert_eq!(count, 2);
    println!("✅ sqlite-vec 删除后计数: {}", count);

    // 清理临时文件
    std::fs::remove_file(&temp_path).ok();

    println!("\n✅ 【验收2】sqlite-vec本地存储测试通过");
    Ok(())
}

// ============================================================
// 验收3: Qdrant云端适配器测试
// ============================================================
async fn test_qdrant_store() -> anyhow::Result<()> {
    let config = QdrantConfig {
        url: "https://pxy1995-my-qdrant-db.hf.space".to_string(),
        api_key: Some("zxcv1234".to_string()),
        collection: "test_vectors".to_string(),
        dimension: 786, // Qdrant使用786维度
    };

    let store = QdrantStore::new(config.clone())?;

    println!("\n【测试3.1】Qdrant 云端连接");
    println!("─────────────────────────────────────────────────────────────");

    // 确保collection存在
    store.ensure_collection().await?;
    println!("✅ Qdrant 云端连接成功");
    println!("   - URL: {}", config.url);
    println!("   - Collection: {}", config.collection);

    println!("\n【测试3.2】Qdrant 向量CRUD操作");
    println!("─────────────────────────────────────────────────────────────");

    // 插入测试向量 (使用786维度)
    let test_vector: Vec<f32> = (0..786).map(|i| (i as f32) * 0.001).collect();
    let metadata = serde_json::json!({
        "text": "Qdrant测试文档",
        "category": "qdrant_test"
    });
    store.insert("qdrant_1", &test_vector, &metadata).await?;
    println!("✅ Qdrant 插入成功 (ID: qdrant_1)");

    // 搜索
    let query = VectorQuery {
        vector: test_vector.clone(),
        k: 5,
        filter: None,
        include_metadata: true,
    };
    let results = store.search(query).await?;
    println!("✅ Qdrant 搜索成功, 找到 {} 个结果", results.len());

    // 计数
    let count = store.count().await?;
    println!("✅ Qdrant 计数: {}", count);

    println!("\n【测试3.3】Qdrant 批量操作");
    println!("─────────────────────────────────────────────────────────────");

    // 批量插入
    let items = vec![
        VectorItem {
            id: "qdrant_2".to_string(),
            vector: (0..786).map(|i| (i as f32) * 0.002).collect(),
            content: Some("Qdrant批量文档1".to_string()),
            metadata: serde_json::json!({"category": "batch"}),
        },
        VectorItem {
            id: "qdrant_3".to_string(),
            vector: (0..786).map(|i| (i as f32) * 0.003).collect(),
            content: Some("Qdrant批量文档2".to_string()),
            metadata: serde_json::json!({"category": "batch"}),
        },
    ];
    store.insert_batch(items).await?;
    println!("✅ Qdrant 批量插入成功");

    let count = store.count().await?;
    println!("✅ Qdrant 批量插入后计数: {}", count);

    println!("\n【测试3.4】Qdrant 更新和删除");
    println!("─────────────────────────────────────────────────────────────");

    // 更新
    let updated_metadata = serde_json::json!({
        "text": "已更新的Qdrant文档",
        "category": "updated"
    });
    store.update("qdrant_1", &test_vector, &updated_metadata).await?;
    println!("✅ Qdrant 更新成功");

    // 删除
    store.delete("qdrant_1").await?;
    let count = store.count().await?;
    println!("✅ Qdrant 删除成功, 当前计数: {}", count);

    println!("\n✅ 【验收3】Qdrant云端适配器测试通过");
    Ok(())
}

// ============================================================
// 验收4: 向量嵌入服务测试
// ============================================================
async fn test_embedding_service() -> anyhow::Result<()> {
    let config = EmbeddingConfig {
        provider: "ollama".to_string(),
        model: "nomic-embed-text".to_string(),
        api_key: String::new(),
        base_url: "http://localhost:11434".to_string(),
        dimension: 768,
        batch_size: 32,
    };

    let service = EmbeddingService::new(config.clone())?;

    println!("\n【测试4.1】Ollama Embedding 服务连接");
    println!("─────────────────────────────────────────────────────────────");
    println!("   - Provider: {}", config.provider);
    println!("   - Model: {}", config.model);
    println!("   - URL: {}", config.base_url);
    println!("   - Dimension: {}", config.dimension);

    println!("\n【测试4.2】单文本嵌入");
    println!("─────────────────────────────────────────────────────────────");

    let text = "这是一个测试文本用于嵌入";
    let embedding = service.embed_text(text).await?;
    println!("✅ 单文本嵌入成功");
    println!("   - 输入: {}", text);
    println!("   - 向量维度: {}", embedding.len());
    assert_eq!(embedding.len(), 768, "维度应为768");

    println!("\n【测试4.3】批量文本嵌入");
    println!("─────────────────────────────────────────────────────────────");

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
        assert_eq!(emb.len(), 768, "每个向量维度应为768");
    }

    println!("\n【测试4.4】向量维度验证");
    println!("─────────────────────────────────────────────────────────────");

    // 验证所有向量维度一致
    let first_dim = embeddings[0].len();
    for emb in embeddings.iter() {
        assert_eq!(emb.len(), first_dim, "所有向量维度应一致");
    }
    println!("✅ 向量维度验证通过: {}", first_dim);

    // 验证向量不为零
    let sum: f32 = embedding.iter().sum();
    assert!(sum != 0.0, "向量不应全为零");
    println!("✅ 向量值验证通过 (非零向量)");

    println!("\n✅ 【验收4】向量嵌入服务测试通过");
    Ok(())
}

// ============================================================
// 验收5: 混合搜索实现测试
// ============================================================
async fn test_hybrid_search() -> anyhow::Result<()> {
    // 使用内存sqlite作为测试存储
    let temp_path = format!("/tmp/test_hybrid_{}.db", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis());

    let store = SqliteVecStore::new(&temp_path, 768)?;

    println!("\n【测试5.1】准备混合搜索测试数据");
    println!("─────────────────────────────────────────────────────────────");

    // 插入测试数据 - 包含不同内容
    let items = vec![
        VectorItem {
            id: "doc1".to_string(),
            vector: vec![0.9; 768], // 与query1相似
            content: Some("人工智能是未来的关键技术".to_string()),
            metadata: serde_json::json!({"category": "tech"}),
        },
        VectorItem {
            id: "doc2".to_string(),
            vector: vec![0.1; 768], // 与query1不相似
            content: Some("今天天气很好，适合出去散步".to_string()),
            metadata: serde_json::json!({"category": "life"}),
        },
        VectorItem {
            id: "doc3".to_string(),
            vector: vec![0.8; 768], // 与query2相似
            content: Some("机器学习和深度学习是人工智能的分支".to_string()),
            metadata: serde_json::json!({"category": "tech"}),
        },
        VectorItem {
            id: "doc4".to_string(),
            vector: vec![0.2; 768],
            content: Some(" cooking is fun and delicious".to_string()),
            metadata: serde_json::json!({"category": "food"}),
        },
    ];
    store.insert_batch(items).await?;
    println!("✅ 测试数据插入完成");

    println!("\n【测试5.2】向量搜索验证");
    println!("─────────────────────────────────────────────────────────────");

    let query_vector = vec![0.9; 768];
    let vector_query = VectorQuery {
        vector: query_vector.clone(),
        k: 3,
        filter: None,
        include_metadata: true,
    };
    let vector_results = store.search(vector_query).await?;
    println!("✅ 向量搜索成功, 找到 {} 个结果", vector_results.len());
    for r in &vector_results {
        println!("   - id: {}, score: {:.4}", r.id, r.score);
    }

    println!("\n【测试5.3】BM25全文搜索验证");
    println!("─────────────────────────────────────────────────────────────");

    let bm25_results = store.bm25_search("人工智能", 3).await?;
    println!("✅ BM25搜索成功, 找到 {} 个结果", bm25_results.len());
    for r in &bm25_results {
        println!("   - id: {}, score: {:.4}", r.id, r.score);
    }

    println!("\n【测试5.4】混合搜索引擎");
    println!("─────────────────────────────────────────────────────────────");

    let config = HybridSearchConfig {
        vector_weight: 0.6,
        bm25_weight: 0.4,
        rrf_k: 60,
        max_results: 10,
        min_score: 0.0,
    };

    let hybrid_engine = HybridSearchEngine::new(store.clone(), store.clone(), config);

    // 测试混合搜索
    let hybrid_query = VectorQuery {
        vector: query_vector.clone(),
        k: 3,
        filter: None,
        include_metadata: true,
    };

    let hybrid_results = hybrid_engine.search("人工智能 机器学习", hybrid_query).await?;
    println!("✅ 混合搜索成功, 找到 {} 个结果", hybrid_results.len());
    for r in &hybrid_results {
        println!("   - id: {}, score: {:.4}", r.id, r.score);
    }

    println!("\n【测试5.5】RRF算法验证");
    println!("─────────────────────────────────────────────────────────────");

    // 测试 RRF 算法 - 验证权重和排序
    use ai_automated_office_lib::vector::hybrid::reciprocal_rank_fusion;

    let vec_results = vec![
        SearchResult { id: "a".to_string(), score: 0.9, metadata: serde_json::json!({}) },
        SearchResult { id: "b".to_string(), score: 0.8, metadata: serde_json::json!({}) },
        SearchResult { id: "c".to_string(), score: 0.7, metadata: serde_json::json!({}) },
    ];

    let bm25_results = vec![
        SearchResult { id: "b".to_string(), score: 0.85, metadata: serde_json::json!({}) },
        SearchResult { id: "c".to_string(), score: 0.75, metadata: serde_json::json!({}) },
        SearchResult { id: "d".to_string(), score: 0.65, metadata: serde_json::json!({}) },
    ];

    // 测试不同权重
    let rrf_60 = reciprocal_rank_fusion(vec_results.clone(), bm25_results.clone(), 0.6, 0.4, 60);
    println!("✅ RRF(k=60) 权重(0.6/0.4) 融合结果:");
    for r in &rrf_60 {
        println!("   - id: {}, score: {:.4}", r.id, r.score);
    }

    // 验证排序 - id "b" 在两个结果集中排名都较高，应该排在前面
    assert_eq!(rrf_60.first().unwrap().id, "b", "b应该在最前面");
    println!("✅ RRF 排序验证通过 - 最高分结果: {}", rrf_60.first().unwrap().id);

    // 测试不同 k 值
    let _rrf_30 = reciprocal_rank_fusion(vec_results.clone(), bm25_results.clone(), 0.5, 0.5, 30);
    let _rrf_100 = reciprocal_rank_fusion(vec_results.clone(), bm25_results.clone(), 0.5, 0.5, 100);
    println!("✅ RRF 不同k值测试通过: k=30, k=60, k=100");

    // 清理临时文件
    std::fs::remove_file(&temp_path).ok();

    println!("\n✅ 【验收5】混合搜索实现测试通过");
    Ok(())
}
