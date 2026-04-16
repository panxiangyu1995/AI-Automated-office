//! Knowledge 模块 Tauri 命令
//!
//! 提供知识库管理的 IPC 命令接口

use crate::auth::{AuthService, verify_and_check, Permission};
use crate::knowledge::crud::{
    CreateKnowledgeBaseRequest, KnowledgeBaseService, PaginationParams,
    KnowledgeBaseFilter,
};
use crate::knowledge::document_crud::{
    DocumentFilter, DocumentService, UploadDocumentRequest,
};
use crate::knowledge::permission::UserContext;
use crate::knowledge::segment::SegmentService;
use std::sync::Arc;
use tauri::State;
use tracing::info;

/// Knowledge 状态
pub struct KnowledgeState {
    pub kb_service: Arc<KnowledgeBaseService>,
    pub doc_service: Arc<DocumentService>,
    pub segment_service: Arc<SegmentService>,
}

impl KnowledgeState {
    pub fn new() -> Self {
        let kb_service = Arc::new(KnowledgeBaseService::new());
        let doc_service = Arc::new(DocumentService::new(kb_service.clone()));
        let segment_service = Arc::new(SegmentService::new(kb_service.clone()));
        Self {
            kb_service,
            doc_service,
            segment_service,
        }
    }
}

impl Default for KnowledgeState {
    fn default() -> Self {
        Self::new()
    }
}

fn default_user() -> UserContext {
    UserContext {
        user_id: "current".to_string(),
        tenant_id: "default".to_string(),
        department_id: None,
    }
}

// ==================== 知识库命令 ====================

/// 创建知识库 (Write)
#[tauri::command]
pub async fn knowledge_create_base(
    state: State<'_, KnowledgeState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: CreateKnowledgeBaseRequest,
) -> Result<serde_json::Value, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("创建知识库: {}", request.name);
    let user = default_user();
    let kb = state
        .kb_service
        .create(&user, request)
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(kb).map_err(|e| e.to_string())
}

/// 列出知识库 (Read)
#[tauri::command]
pub async fn knowledge_list_bases(
    state: State<'_, KnowledgeState>,
    auth_service: State<'_, AuthService>,
    token: String,
    page: Option<usize>,
    page_size: Option<usize>,
) -> Result<serde_json::Value, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    let user = default_user();
    let pagination = PaginationParams {
        page: page.unwrap_or(1),
        page_size: page_size.unwrap_or(20),
    };
    let filter = KnowledgeBaseFilter::default();
    let result = state
        .kb_service
        .list(&user, pagination, filter)
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(result).map_err(|e| e.to_string())
}

/// 获取知识库详情 (Read)
#[tauri::command]
pub async fn knowledge_get_base(
    state: State<'_, KnowledgeState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<serde_json::Value, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    info!("获取知识库详情: {}", id);
    let user = default_user();
    let kb = state
        .kb_service
        .get(&user, &id)
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(kb).map_err(|e| e.to_string())
}

/// 删除知识库 (Admin)
#[tauri::command]
pub async fn knowledge_delete_base(
    state: State<'_, KnowledgeState>,
    auth_service: State<'_, AuthService>,
    token: String,
    id: String,
) -> Result<(), String> {
    verify_and_check(&token, &auth_service, Permission::Admin).await?;
    info!("删除知识库: {}", id);
    let user = default_user();
    state
        .kb_service
        .delete(&user, &id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// 上传文档到知识库 (Write)
#[tauri::command]
pub async fn knowledge_upload_document(
    state: State<'_, KnowledgeState>,
    auth_service: State<'_, AuthService>,
    token: String,
    request: UploadDocumentRequest,
) -> Result<serde_json::Value, String> {
    verify_and_check(&token, &auth_service, Permission::Write).await?;
    info!("上传文档: {}", request.name);
    let doc = state
        .doc_service
        .upload("current", "default", request)
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(doc).map_err(|e| e.to_string())
}

/// 列出知识库文档 (Read)
#[tauri::command]
pub async fn knowledge_list_documents(
    state: State<'_, KnowledgeState>,
    auth_service: State<'_, AuthService>,
    token: String,
    knowledge_base_id: String,
    page: Option<usize>,
    page_size: Option<usize>,
) -> Result<serde_json::Value, String> {
    verify_and_check(&token, &auth_service, Permission::Read).await?;
    let pagination = PaginationParams {
        page: page.unwrap_or(1),
        page_size: page_size.unwrap_or(20),
    };
    let filter = DocumentFilter::default();
    let result = state
        .doc_service
        .list("current", "default", &knowledge_base_id, pagination, filter)
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(result).map_err(|e| e.to_string())
}
