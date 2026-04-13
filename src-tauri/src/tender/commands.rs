//! Tender 模块 Tauri 命令

use crate::tender::db::TenderDatabase;
use crate::tender::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::info;

/// Tender 状态
pub struct TenderState {
    pub db: Arc<TenderDatabase>,
}

impl TenderState {
    pub fn new() -> Self {
        let db = Arc::new(TenderDatabase::new());
        db.init_defaults();
        Self { db }
    }
}

impl Default for TenderState {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== 资质命令 ====================

#[tauri::command]
pub async fn tender_create_qualification(
    state: State<'_, TenderState>,
    request: CreateQualificationRequest,
    tenant_id: Option<String>,
) -> Result<Qualification, String> {
    info!("创建资质: {}", request.name);
    
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    
    let qualification = Qualification::new(
        request.name,
        request.qualification_type,
        request.issue_date,
        request.expiry_date,
        tenant_id,
    );
    qualification.cert_number = request.cert_number;
    
    state.db.create_qualification(qualification)
}

#[tauri::command]
pub async fn tender_get_qualification(
    state: State<'_, TenderState>,
    id: String,
) -> Result<Qualification, String> {
    info!("获取资质: {}", id);
    state.db.get_qualification(&id).ok_or_else(|| "资质不存在".to_string())
}

#[tauri::command]
pub async fn tender_list_qualifications(
    state: State<'_, TenderState>,
    params: Option<QueryQualificationsParams>,
) -> Result<PagedResult<QualificationListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_qualifications(&params))
}

#[tauri::command]
pub async fn tender_update_qualification(
    state: State<'_, TenderState>,
    id: String,
    request: UpdateQualificationRequest,
) -> Result<Qualification, String> {
    info!("更新资质: {}", id);
    state.db.update_qualification(&id, request)
}

#[tauri::command]
pub async fn tender_delete_qualification(
    state: State<'_, TenderState>,
    id: String,
) -> Result<(), String> {
    info!("删除资质: {}", id);
    state.db.delete_qualification(&id)
}

// ==================== 业绩命令 ====================

#[tauri::command]
pub async fn tender_create_case(
    state: State<'_, TenderState>,
    request: CreateCaseRequest,
    tenant_id: Option<String>,
) -> Result<Case, String> {
    info!("创建业绩: {}", request.project_name);
    
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let case_data = Case {
        id: uuid::Uuid::new_v4().to_string(),
        project_name: request.project_name,
        customer_name: request.customer_name,
        contract_amount: request.contract_amount,
        actual_amount: None,
        start_date: request.start_date,
        end_date: None,
        status: CaseStatus::InProgress,
        description: request.description,
        achievements: Vec::new(),
        attachments: Vec::new(),
        tenant_id,
        created_at: now,
        updated_at: now,
    };
    
    state.db.create_case(case_data)
}

#[tauri::command]
pub async fn tender_get_case(
    state: State<'_, TenderState>,
    id: String,
) -> Result<Case, String> {
    info!("获取业绩: {}", id);
    state.db.get_case(&id).ok_or_else(|| "业绩不存在".to_string())
}

#[tauri::command]
pub async fn tender_list_cases(
    state: State<'_, TenderState>,
    params: Option<QueryCasesParams>,
) -> Result<PagedResult<CaseListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_cases(&params))
}

#[tauri::command]
pub async fn tender_update_case(
    state: State<'_, TenderState>,
    id: String,
    request: UpdateCaseRequest,
) -> Result<Case, String> {
    info!("更新业绩: {}", id);
    state.db.update_case(&id, request)
}

#[tauri::command]
pub async fn tender_delete_case(
    state: State<'_, TenderState>,
    id: String,
) -> Result<(), String> {
    info!("删除业绩: {}", id);
    state.db.delete_case(&id)
}

// ==================== 投标项目命令 ====================

#[tauri::command]
pub async fn tender_create_project(
    state: State<'_, TenderState>,
    request: CreateTenderProjectRequest,
    tenant_id: Option<String>,
) -> Result<TenderProject, String> {
    info!("创建投标项目: {}", request.project_name);
    
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    
    let project = TenderProject::new(
        request.project_name,
        request.customer_name,
        tenant_id,
    );
    let mut project = project;
    project.customer_contact = request.customer_contact;
    project.bidding_amount = request.bidding_amount;
    project.deadline = request.deadline;
    project.notes = request.notes;
    
    state.db.create_project(project)
}

#[tauri::command]
pub async fn tender_get_project(
    state: State<'_, TenderState>,
    id: String,
) -> Result<TenderProject, String> {
    info!("获取投标项目: {}", id);
    state.db.get_project(&id).ok_or_else(|| "投标项目不存在".to_string())
}

#[tauri::command]
pub async fn tender_list_projects(
    state: State<'_, TenderState>,
    params: Option<QueryTenderProjectsParams>,
) -> Result<PagedResult<TenderProjectListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_projects(&params))
}

#[tauri::command]
pub async fn tender_update_project(
    state: State<'_, TenderState>,
    id: String,
    request: UpdateTenderProjectRequest,
) -> Result<TenderProject, String> {
    info!("更新投标项目: {}", id);
    state.db.update_project(&id, request)
}

#[tauri::command]
pub async fn tender_update_project_status(
    state: State<'_, TenderState>,
    id: String,
    request: UpdateTenderStatusRequest,
) -> Result<TenderProject, String> {
    info!("更新投标项目状态: {}", id);
    state.db.update_project_status(&id, request.status)
}

#[tauri::command]
pub async fn tender_delete_project(
    state: State<'_, TenderState>,
    id: String,
) -> Result<(), String> {
    info!("删除投标项目: {}", id);
    state.db.delete_project(&id)
}

#[tauri::command]
pub async fn tender_get_statistics(
    state: State<'_, TenderState>,
) -> Result<TenderStatistics, String> {
    info!("获取投标统计");
    Ok(state.db.get_statistics())
}

// ==================== 模板命令 ====================

#[tauri::command]
pub async fn tender_create_template(
    state: State<'_, TenderState>,
    request: CreateTemplateRequest,
    tenant_id: Option<String>,
) -> Result<BidTemplate, String> {
    info!("创建模板: {}", request.name);
    
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let template = BidTemplate {
        id: uuid::Uuid::new_v4().to_string(),
        name: request.name,
        description: request.description,
        category: request.category,
        content: request.content,
        variables: request.variables,
        is_default: request.is_default.unwrap_or(false),
        usage_count: 0,
        tenant_id,
        created_at: now,
        updated_at: now,
    };
    
    state.db.create_template(template)
}

#[tauri::command]
pub async fn tender_get_template(
    state: State<'_, TenderState>,
    id: String,
) -> Result<BidTemplate, String> {
    info!("获取模板: {}", id);
    state.db.get_template(&id).ok_or_else(|| "模板不存在".to_string())
}

#[tauri::command]
pub async fn tender_list_templates(
    state: State<'_, TenderState>,
    params: Option<QueryTemplatesParams>,
) -> Result<PagedResult<TemplateListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_templates(&params))
}

#[tauri::command]
pub async fn tender_update_template(
    state: State<'_, TenderState>,
    id: String,
    request: UpdateTemplateRequest,
) -> Result<BidTemplate, String> {
    info!("更新模板: {}", id);
    state.db.update_template(&id, request)
}

#[tauri::command]
pub async fn tender_delete_template(
    state: State<'_, TenderState>,
    id: String,
) -> Result<(), String> {
    info!("删除模板: {}", id);
    state.db.delete_template(&id)
}

// ==================== 文档命令 ====================

#[tauri::command]
pub async fn tender_create_document(
    state: State<'_, TenderState>,
    request: CreateDocumentRequest,
    tenant_id: Option<String>,
) -> Result<TenderDocument, String> {
    info!("创建文档: {}", request.title);
    
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let document = TenderDocument {
        id: uuid::Uuid::new_v4().to_string(),
        project_id: request.project_id,
        template_id: request.template_id,
        title: request.title,
        content: String::new(),
        variables: std::collections::HashMap::new(),
        version: 1,
        status: DocumentStatus::Draft,
        tenant_id,
        created_at: now,
        updated_at: now,
    };
    
    state.db.create_document(document)
}

#[tauri::command]
pub async fn tender_get_document(
    state: State<'_, TenderState>,
    id: String,
) -> Result<TenderDocument, String> {
    info!("获取文档: {}", id);
    state.db.get_document(&id).ok_or_else(|| "文档不存在".to_string())
}

#[tauri::command]
pub async fn tender_list_documents(
    state: State<'_, TenderState>,
    params: Option<QueryDocumentsParams>,
) -> Result<PagedResult<DocumentListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_documents(&params))
}

#[tauri::command]
pub async fn tender_update_document(
    state: State<'_, TenderState>,
    id: String,
    request: UpdateDocumentRequest,
) -> Result<TenderDocument, String> {
    info!("更新文档: {}", id);
    state.db.update_document(&id, request)
}

#[tauri::command]
pub async fn tender_delete_document(
    state: State<'_, TenderState>,
    id: String,
) -> Result<(), String> {
    info!("删除文档: {}", id);
    state.db.delete_document(&id)
}

#[tauri::command]
pub async fn tender_generate_document(
    state: State<'_, TenderState>,
    document_id: String,
    request: GenerateDocumentRequest,
) -> Result<TenderDocument, String> {
    info!("生成文档内容: {}", document_id);
    
    let content = state.db.generate_document_content(&request.template_id, &request.variables)?;
    
    let mut document = state.db.get_document(&document_id).ok_or("文档不存在")?;
    document.content = content;
    document.template_id = Some(request.template_id);
    document.variables = request.variables;
    document.status = DocumentStatus::Generated;
    document.updated_at = chrono::Utc::now().timestamp();
    
    let mut documents = state.documents.write().map_err(|_| "获取写入锁失败".to_string())?;
    documents.insert(document_id.clone(), document.clone());
    
    Ok(document)
}
