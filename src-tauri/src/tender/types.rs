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
