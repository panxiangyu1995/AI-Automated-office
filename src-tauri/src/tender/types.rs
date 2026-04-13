//! Tender 模块类型定义

use serde::{Deserialize, Serialize};

// ==================== 资质类型 ====================

/// 资质类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum QualificationType {
    BusinessLicense,
    IndustryLicense,
    SafetyCert,
    QualityCert,
    TaxCert,
    OrganizationCode,
    Other,
}

impl Default for QualificationType {
    fn default() -> Self {
        Self::BusinessLicense
    }
}

impl std::fmt::Display for QualificationType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::BusinessLicense => write!(f, "business_license"),
            Self::IndustryLicense => write!(f, "industry_license"),
            Self::SafetyCert => write!(f, "safety_cert"),
            Self::QualityCert => write!(f, "quality_cert"),
            Self::TaxCert => write!(f, "tax_cert"),
            Self::OrganizationCode => write!(f, "organization_code"),
            Self::Other => write!(f, "other"),
        }
    }
}

/// 资质状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum QualificationStatus {
    Valid,
    Expiring,
    Expired,
}

impl Default for QualificationStatus {
    fn default() -> Self {
        Self::Valid
    }
}

/// 资质
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Qualification {
    pub id: String,
    pub name: String,
    pub qualification_type: QualificationType,
    pub cert_number: Option<String>,
    pub issue_date: String,
    pub expiry_date: String,
    pub status: QualificationStatus,
    pub reminder_enabled: bool,
    pub reminder_days: i32,
    pub attachments: Vec<String>,
    pub notes: Option<String>,
    pub tenant_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for Qualification {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: String::new(),
            qualification_type: QualificationType::default(),
            cert_number: None,
            issue_date: String::new(),
            expiry_date: String::new(),
            status: QualificationStatus::default(),
            reminder_enabled: true,
            reminder_days: 30,
            attachments: Vec::new(),
            notes: None,
            tenant_id: String::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

impl Qualification {
    pub fn new(
        name: String,
        qualification_type: QualificationType,
        issue_date: String,
        expiry_date: String,
        tenant_id: String,
    ) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            qualification_type,
            cert_number: None,
            issue_date,
            expiry_date,
            status: QualificationStatus::Valid,
            reminder_enabled: true,
            reminder_days: 30,
            attachments: Vec::new(),
            notes: None,
            tenant_id,
            created_at: now,
            updated_at: now,
        }
    }
}

// ==================== 业绩类型 ====================

/// 业绩状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CaseStatus {
    InProgress,
    Completed,
    Archived,
}

impl Default for CaseStatus {
    fn default() -> Self {
        Self::InProgress
    }
}

/// 业绩案例
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Case {
    pub id: String,
    pub project_name: String,
    pub customer_name: String,
    pub contract_amount: f64,
    pub actual_amount: Option<f64>,
    pub start_date: String,
    pub end_date: Option<String>,
    pub status: CaseStatus,
    pub description: Option<String>,
    pub achievements: Vec<String>,
    pub attachments: Vec<String>,
    pub tenant_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for Case {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            project_name: String::new(),
            customer_name: String::new(),
            contract_amount: 0.0,
            actual_amount: None,
            start_date: String::new(),
            end_date: None,
            status: CaseStatus::default(),
            description: None,
            achievements: Vec::new(),
            attachments: Vec::new(),
            tenant_id: String::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

// ==================== 请求/响应类型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateQualificationRequest {
    pub name: String,
    pub qualification_type: QualificationType,
    pub cert_number: Option<String>,
    pub issue_date: String,
    pub expiry_date: String,
    pub reminder_enabled: Option<bool>,
    pub reminder_days: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateQualificationRequest {
    pub name: Option<String>,
    pub cert_number: Option<String>,
    pub issue_date: Option<String>,
    pub expiry_date: Option<String>,
    pub reminder_enabled: Option<bool>,
    pub reminder_days: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct QueryQualificationsParams {
    pub qualification_type: Option<QualificationType>,
    pub status: Option<QualificationStatus>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCaseRequest {
    pub project_name: String,
    pub customer_name: String,
    pub contract_amount: f64,
    pub start_date: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCaseRequest {
    pub project_name: Option<String>,
    pub customer_name: Option<String>,
    pub contract_amount: Option<f64>,
    pub actual_amount: Option<f64>,
    pub end_date: Option<String>,
    pub status: Option<CaseStatus>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct QueryCasesParams {
    pub status: Option<CaseStatus>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedResult<T> {
    pub items: Vec<T>,
    pub total: u32,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QualificationListItem {
    pub id: String,
    pub name: String,
    pub qualification_type: QualificationType,
    pub cert_number: Option<String>,
    pub expiry_date: String,
    pub status: QualificationStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaseListItem {
    pub id: String,
    pub project_name: String,
    pub customer_name: String,
    pub contract_amount: f64,
    pub start_date: String,
    pub end_date: Option<String>,
    pub status: CaseStatus,
}

// ==================== 投标项目类型 ====================

/// 投标项目状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TenderStatus {
    Preparing,
    Bidding,
    WaitingResult,
    Won,
    Lost,
    Cancelled,
}

impl Default for TenderStatus {
    fn default() -> Self {
        Self::Preparing
    }
}

impl std::fmt::Display for TenderStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Preparing => write!(f, "preparing"),
            Self::Bidding => write!(f, "bidding"),
            Self::WaitingResult => write!(f, "waiting_result"),
            Self::Won => write!(f, "won"),
            Self::Lost => write!(f, "lost"),
            Self::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// 投标项目
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenderProject {
    pub id: String,
    pub project_name: String,
    pub customer_name: String,
    pub customer_contact: Option<String>,
    pub bidding_amount: Option<f64>,
    pub status: TenderStatus,
    pub qualification_ids: Vec<String>,
    pub case_ids: Vec<String>,
    pub deadline: Option<String>,
    pub bidding_date: Option<String>,
    pub result_date: Option<String>,
    pub progress: i32,
    pub attachments: Vec<String>,
    pub notes: Option<String>,
    pub tenant_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for TenderProject {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            project_name: String::new(),
            customer_name: String::new(),
            customer_contact: None,
            bidding_amount: None,
            status: TenderStatus::default(),
            qualification_ids: Vec::new(),
            case_ids: Vec::new(),
            deadline: None,
            bidding_date: None,
            result_date: None,
            progress: 0,
            attachments: Vec::new(),
            notes: None,
            tenant_id: String::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

impl TenderProject {
    pub fn new(
        project_name: String,
        customer_name: String,
        tenant_id: String,
    ) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            project_name,
            customer_name,
            customer_contact: None,
            bidding_amount: None,
            status: TenderStatus::Preparing,
            qualification_ids: Vec::new(),
            case_ids: Vec::new(),
            deadline: None,
            bidding_date: None,
            result_date: None,
            progress: 0,
            attachments: Vec::new(),
            notes: None,
            tenant_id,
            created_at: now,
            updated_at: now,
        }
    }
}

// ==================== 投标项目请求/响应类型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTenderProjectRequest {
    pub project_name: String,
    pub customer_name: String,
    pub customer_contact: Option<String>,
    pub bidding_amount: Option<f64>,
    pub deadline: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTenderProjectRequest {
    pub project_name: Option<String>,
    pub customer_name: Option<String>,
    pub customer_contact: Option<String>,
    pub bidding_amount: Option<f64>,
    pub deadline: Option<String>,
    pub bidding_date: Option<String>,
    pub result_date: Option<String>,
    pub qualification_ids: Option<Vec<String>>,
    pub case_ids: Option<Vec<String>>,
    pub progress: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct QueryTenderProjectsParams {
    pub status: Option<TenderStatus>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTenderStatusRequest {
    pub status: TenderStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenderProjectListItem {
    pub id: String,
    pub project_name: String,
    pub customer_name: String,
    pub bidding_amount: Option<f64>,
    pub status: TenderStatus,
    pub deadline: Option<String>,
    pub progress: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TenderStatistics {
    pub total: u32,
    pub preparing: u32,
    pub bidding: u32,
    pub waiting_result: u32,
    pub won: u32,
    pub lost: u32,
    pub cancelled: u32,
    pub total_bidding_amount: f64,
    pub win_rate: f64,
}
