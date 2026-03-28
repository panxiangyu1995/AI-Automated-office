# Knowledge Base RAG - 技术设计

## 1. 数据结构设计

### 1.1 文档模型

```rust
/// 文档状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DocumentStatus {
    Pending,
    Processing,
    Indexed,
    Failed,
    Archived,
}

/// 文档类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DocumentType {
    Pdf,
    Word,
    Excel,
    Txt,
    Markdown,
    Html,
    Json,
    Csv,
}

/// 文档元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub document_id: String,
    pub filename: String,
    pub document_type: DocumentType,
    pub file_size: u64,
    pub mime_type: String,
    pub checksum: String,
    pub tenant_id: String,
    pub department_id: Option<String>,
    pub uploaded_by: String,
    pub uploaded_at: i64,
    pub indexed_at: Option<i64>,
    pub status: DocumentStatus,
    pub chunk_count: usize,
    pub total_tokens: usize,
    pub tags: Vec<String>,
    pub custom_metadata: Option<serde_json::Value>,
}

/// 文档块
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentChunk {
    pub chunk_id: String,
    pub document_id: String,
    pub chunk_index: usize,
    pub content: String,
    pub token_count: usize,
    pub start_offset: usize,
    pub end_offset: usize,
    pub embedding: Option<Vec<f32>>,
    pub metadata: ChunkMetadata,
}

/// 块元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkMetadata {
    pub heading: Option<String>,
    pub page_number: Option<usize>,
    pub section: Option<String>,
    pub parent_chunk_id: Option<String>,
    pub child_chunk_ids: Vec<String>,
}
```

### 1.2 分块策略

```rust
/// 分块策略类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ChunkingStrategy {
    FixedSize {
        chunk_size: usize,
        overlap: usize,
    },
    Semantic {
        min_chunk_size: usize,
        max_chunk_size: usize,
        similarity_threshold: f32,
    },
    Sentence {
        max_sentences: usize,
        overlap_sentences: usize,
    },
    Paragraph {
        max_paragraphs: usize,
    },
    Recursive {
        chunk_size: usize,
        chunk_overlap: usize,
        separators: Vec<String>,
    },
    Custom {
        strategy_name: String,
        config: serde_json::Value,
    },
}

/// 分块配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkingConfig {
    pub strategy: ChunkingStrategy,
    pub preserve_formatting: bool,
    pub include_metadata: bool,
    pub generate_summary: bool,
}
```

### 1.3 文档处理管道

```rust
/// 处理管道阶段
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PipelineStage {
    Upload,
    Validate,
    Parse,
    Chunk,
    Embed,
    Index,
    Complete,
}

/// 处理任务
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingTask {
    pub task_id: String,
    pub document_id: String,
    pub stage: PipelineStage,
    pub progress: f32,
    pub status: TaskStatus,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub error: Option<String>,
    pub retry_count: usize,
}

/// 处理管道配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineConfig {
    pub max_concurrent_tasks: usize,
    pub timeout_seconds: u64,
    pub retry_count: usize,
    pub retry_delay_ms: u64,
    pub enable_ocr: bool,
    pub enable_table_extraction: bool,
    pub enable_image_extraction: bool,
}
```

### 1.4 检索配置

```rust
/// RAG检索配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagRetrievalConfig {
    pub max_chunks: usize,
    pub min_relevance_score: f32,
    pub max_tokens: usize,
    pub rerank_enabled: bool,
    pub rerank_model: Option<String>,
    pub hybrid_search: HybridSearchConfig,
    pub scope_filters: Vec<ScopeFilter>,
}

/// 作用域过滤器
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScopeFilter {
    pub field: String,
    pub operator: FilterOperator,
    pub value: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FilterOperator {
    Eq,
    Ne,
    In,
    NotIn,
    Gt,
    Gte,
    Lt,
    Lte,
    Contains,
    StartsWith,
    EndsWith,
}
```

## 2. 核心组件设计

### 2.1 文档处理管道

```rust
/// 文档处理管道
pub struct DocumentPipeline {
    parser_registry: ParserRegistry,
    chunker: DocumentChunker,
    embedding_service: Arc<EmbeddingService>,
    vector_store: Arc<dyn VectorStore>,
    config: PipelineConfig,
}

impl DocumentPipeline {
    pub async fn process(&self, document: &DocumentMetadata, content: &[u8]) -> Result<ProcessingResult> {
        let task_id = generate_task_id();
        
        self.update_stage(&task_id, PipelineStage::Validate).await?;
        self.validate_document(document, content).await?;
        
        self.update_stage(&task_id, PipelineStage::Parse).await?;
        let parsed = self.parse_document(document, content).await?;
        
        self.update_stage(&task_id, PipelineStage::Chunk).await?;
        let chunks = self.chunk_document(&parsed).await?;
        
        self.update_stage(&task_id, PipelineStage::Embed).await?;
        let embedded_chunks = self.embed_chunks(&chunks).await?;
        
        self.update_stage(&task_id, PipelineStage::Index).await?;
        self.index_chunks(&embedded_chunks).await?;
        
        self.update_stage(&task_id, PipelineStage::Complete).await?;
        
        Ok(ProcessingResult {
            document_id: document.document_id.clone(),
            chunk_count: chunks.len(),
            total_tokens: embedded_chunks.iter().map(|c| c.token_count).sum(),
        })
    }
}
```

### 2.2 文档解析器

```rust
/// 文档解析器trait
#[async_trait]
pub trait DocumentParser: Send + Sync {
    fn supported_types(&self) -> Vec<DocumentType>;
    async fn parse(&self, content: &[u8], metadata: &DocumentMetadata) -> Result<ParsedDocument>;
}

/// PDF解析器
pub struct PdfParser {
    enable_ocr: bool,
    enable_table_extraction: bool,
}

/// Word解析器
pub struct WordParser {
    preserve_formatting: bool,
}

/// Markdown解析器
pub struct MarkdownParser {
    extract_frontmatter: bool,
    heading_levels: Vec<u8>,
}

/// 解析器注册表
pub struct ParserRegistry {
    parsers: HashMap<DocumentType, Box<dyn DocumentParser>>,
}

impl ParserRegistry {
    pub fn get_parser(&self, doc_type: DocumentType) -> Option<&dyn DocumentParser> {
        self.parsers.get(&doc_type).map(|p| p.as_ref())
    }
}
```

### 2.3 智能分块器

```rust
/// 文档分块器
pub struct DocumentChunker {
    strategy: ChunkingStrategy,
    tokenizer: Tokenizer,
}

impl DocumentChunker {
    pub async fn chunk(&self, document: &ParsedDocument) -> Result<Vec<DocumentChunk>> {
        match &self.strategy {
            ChunkingStrategy::FixedSize { chunk_size, overlap } => {
                self.chunk_fixed_size(document, *chunk_size, *overlap).await
            }
            ChunkingStrategy::Semantic { min_chunk_size, max_chunk_size, similarity_threshold } => {
                self.chunk_semantic(document, *min_chunk_size, *max_chunk_size, *similarity_threshold).await
            }
            ChunkingStrategy::Recursive { chunk_size, chunk_overlap, separators } => {
                self.chunk_recursive(document, *chunk_size, *chunk_overlap, separators).await
            }
            _ => self.chunk_default(document).await,
        }
    }
    
    fn chunk_recursive(&self, document: &ParsedDocument, chunk_size: usize, overlap: usize, separators: &[String]) -> Result<Vec<DocumentChunk>> {
        let mut chunks = Vec::new();
        let mut current_chunk = String::new();
        let mut current_tokens = 0;
        let mut start_offset = 0;
        
        for separator in separators {
            let parts: Vec<&str> = document.content.split(separator).collect();
            for part in parts {
                let part_tokens = self.tokenizer.count_tokens(part);
                if current_tokens + part_tokens > chunk_size && !current_chunk.is_empty() {
                    chunks.push(self.create_chunk(&current_chunk, start_offset, current_tokens));
                    current_chunk = String::new();
                    current_tokens = 0;
                    start_offset += current_chunk.len();
                }
                current_chunk.push_str(part);
                current_chunk.push_str(separator);
                current_tokens += part_tokens;
            }
        }
        
        if !current_chunk.is_empty() {
            chunks.push(self.create_chunk(&current_chunk, start_offset, current_tokens));
        }
        
        Ok(chunks)
    }
}
```

### 2.4 RAG上下文构建器

```rust
/// RAG上下文构建器
pub struct RagContextBuilder {
    vector_store: Arc<dyn VectorStore>,
    bm25_store: Arc<dyn Bm25Store>,
    embedding_service: Arc<EmbeddingService>,
    config: RagRetrievalConfig,
}

impl RagContextBuilder {
    pub async fn build_context(&self, query: &str, scope: &KnowledgeScope) -> Result<RagContext> {
        let query_embedding = self.embedding_service.embed(query).await?;
        
        let vector_query = VectorQuery {
            vector: query_embedding,
            k: self.config.max_chunks * 2,
            filter: self.build_scope_filter(scope),
            include_metadata: true,
        };
        
        let hybrid_engine = HybridSearchEngine::new(
            self.vector_store.clone(),
            self.bm25_store.clone(),
            self.config.hybrid_search.clone(),
        );
        
        let results = hybrid_engine.search(query, vector_query).await?;
        
        let mut context_chunks = Vec::new();
        let mut total_tokens = 0;
        
        for result in results {
            if total_tokens >= self.config.max_tokens {
                break;
            }
            if result.score < self.config.min_relevance_score {
                continue;
            }
            
            let chunk = self.load_chunk(&result.id).await?;
            let chunk_tokens = self.count_tokens(&chunk.content);
            
            if total_tokens + chunk_tokens <= self.config.max_tokens {
                context_chunks.push(chunk);
                total_tokens += chunk_tokens;
            }
        }
        
        if self.config.rerank_enabled {
            context_chunks = self.rerank_chunks(query, context_chunks).await?;
        }
        
        Ok(RagContext {
            query: query.to_string(),
            chunks: context_chunks,
            total_tokens,
            retrieval_time_ms: 0,
        })
    }
    
    fn format_for_prompt(&self, context: &RagContext) -> String {
        let mut formatted = String::new();
        formatted.push_str("## 相关知识上下文\n\n");
        
        for (i, chunk) in context.chunks.iter().enumerate() {
            formatted.push_str(&format!("### 来源 {} (相关度: {:.2})\n", i + 1, chunk.score));
            formatted.push_str(&chunk.content);
            formatted.push_str("\n\n");
        }
        
        formatted
    }
}
```

## 3. Tauri命令接口

```rust
#[tauri::command]
pub async fn upload_document(
    file_path: String,
    tenant_id: String,
    department_id: Option<String>,
    tags: Vec<String>,
    app_handle: tauri::AppHandle,
) -> Result<DocumentMetadata, String> {
    let pipeline = app_handle.state::<DocumentPipeline>();
    pipeline.upload_and_process(&file_path, &tenant_id, department_id, tags)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_knowledge(
    query: String,
    scope: KnowledgeScope,
    tenant_id: String,
    department_id: Option<String>,
    max_results: usize,
    app_handle: tauri::AppHandle,
) -> Result<Vec<RetrievedItem>, String> {
    let builder = app_handle.state::<RagContextBuilder>();
    builder.search(&query, &scope, &tenant_id, department_id, max_results)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_document_status(
    document_id: String,
    app_handle: tauri::AppHandle,
) -> Result<DocumentProcessingStatus, String> {
    let pipeline = app_handle.state::<DocumentPipeline>();
    pipeline.get_status(&document_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_document(
    document_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let pipeline = app_handle.state::<DocumentPipeline>();
    pipeline.delete(&document_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn rebuild_document_index(
    document_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let pipeline = app_handle.state::<DocumentPipeline>();
    pipeline.rebuild_index(&document_id)
        .await
        .map_err(|e| e.to_string())
}
```

## 4. 前端集成

```typescript
interface KnowledgeBaseRagService {
  uploadDocument(file: File, options: UploadOptions): Promise<DocumentMetadata>;
  searchKnowledge(query: string, scope: KnowledgeScope): Promise<RetrievedItem[]>;
  getDocumentStatus(documentId: string): Promise<DocumentProcessingStatus>;
  deleteDocument(documentId: string): Promise<void>;
  rebuildIndex(documentId: string): Promise<void>;
}

interface UploadOptions {
  tenantId: string;
  departmentId?: string;
  tags?: string[];
  chunkingStrategy?: ChunkingStrategy;
}

interface RetrievedItem {
  itemId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
  highlights?: Highlight[];
}
```

## 5. 性能指标

| 指标 | 目标值 |
|------|--------|
| 文档上传处理时间 | < 30s (10MB文档) |
| 向量检索延迟 | < 100ms |
| 混合搜索延迟 | < 200ms |
| 分块吞吐量 | > 100 chunks/s |
| Embedding吞吐量 | > 50 chunks/s |
| 最大文档大小 | 100MB |
| 最大块大小 | 8KB |
| 最小块大小 | 100B |
