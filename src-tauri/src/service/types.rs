//! Service 模块数据类型定义

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 工单类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TicketType {
    /// 维修
    Repair,
    /// 咨询
    Consultation,
    /// 投诉
    Complaint,
}

impl Default for TicketType {
    fn default() -> Self {
        Self::Repair
    }
}

impl std::fmt::Display for TicketType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Repair => write!(f, "repair"),
            Self::Consultation => write!(f, "consultation"),
            Self::Complaint => write!(f, "complaint"),
        }
    }
}

impl std::str::FromStr for TicketType {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "repair" => Ok(Self::Repair),
            "consultation" => Ok(Self::Consultation),
            "complaint" => Ok(Self::Complaint),
            _ => Err(format!("Unknown ticket type: {}", s)),
        }
    }
}

/// 工单状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TicketStatus {
    /// 新建
    New,
    /// 处理中
    Processing,
    /// 待确认
    PendingConfirm,
    /// 已完成
    Completed,
    /// 已取消
    Cancelled,
}

impl Default for TicketStatus {
    fn default() -> Self {
        Self::New
    }
}

impl std::fmt::Display for TicketStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::New => write!(f, "new"),
            Self::Processing => write!(f, "processing"),
            Self::PendingConfirm => write!(f, "pending_confirm"),
            Self::Completed => write!(f, "completed"),
            Self::Cancelled => write!(f, "cancelled"),
        }
    }
}

impl std::str::FromStr for TicketStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "new" => Ok(Self::New),
            "processing" => Ok(Self::Processing),
            "pending_confirm" => Ok(Self::PendingConfirm),
            "completed" => Ok(Self::Completed),
            "cancelled" => Ok(Self::Cancelled),
            _ => Err(format!("Unknown ticket status: {}", s)),
        }
    }
}

/// 工单优先级
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TicketPriority {
    /// 低
    Low,
    /// 中
    Medium,
    /// 高
    High,
    /// 紧急
    Urgent,
}

impl Default for TicketPriority {
    fn default() -> Self {
        Self::Medium
    }
}

impl std::fmt::Display for TicketPriority {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Low => write!(f, "low"),
            Self::Medium => write!(f, "medium"),
            Self::High => write!(f, "high"),
            Self::Urgent => write!(f, "urgent"),
        }
    }
}

impl std::str::FromStr for TicketPriority {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "low" => Ok(Self::Low),
            "medium" => Ok(Self::Medium),
            "high" => Ok(Self::High),
            "urgent" => Ok(Self::Urgent),
            _ => Err(format!("Unknown ticket priority: {}", s)),
        }
    }
}

/// 服务人员状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PersonnelStatus {
    /// 可用
    Available,
    /// 忙碌
    Busy,
    /// 离线
    Offline,
}

impl Default for PersonnelStatus {
    fn default() -> Self {
        Self::Available
    }
}

impl std::fmt::Display for PersonnelStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Available => write!(f, "available"),
            Self::Busy => write!(f, "busy"),
            Self::Offline => write!(f, "offline"),
        }
    }
}

impl std::str::FromStr for PersonnelStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "available" => Ok(Self::Available),
            "busy" => Ok(Self::Busy),
            "offline" => Ok(Self::Offline),
            _ => Err(format!("Unknown personnel status: {}", s)),
        }
    }
}

/// 售后工单
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceTicket {
    /// 工单 ID
    pub id: String,
    /// 工单标题
    pub title: String,
    /// 工单描述
    pub description: Option<String>,
    /// 工单类型
    pub ticket_type: TicketType,
    /// 工单状态
    pub status: TicketStatus,
    /// 优先级
    pub priority: TicketPriority,
    /// 客户 ID
    pub customer_id: Option<String>,
    /// 客户姓名
    pub customer_name: String,
    /// 客户联系方式
    pub customer_contact: Option<String>,
    /// 客户邮箱
    pub customer_email: Option<String>,
    /// 分配给
    pub assigned_to: Option<String>,
    /// 分配人姓名
    pub assigned_name: Option<String>,
    /// 关联知识库 ID
    pub knowledge_id: Option<String>,
    /// 创建时间
    pub created_at: i64,
    /// 更新时间
    pub updated_at: i64,
    /// 完成时间
    pub completed_at: Option<i64>,
    /// 租户 ID
    pub tenant_id: String,
    /// 元数据
    pub metadata: HashMap<String, serde_json::Value>,
}

impl Default for ServiceTicket {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title: String::new(),
            description: None,
            ticket_type: TicketType::default(),
            status: TicketStatus::default(),
            priority: TicketPriority::default(),
            customer_id: None,
            customer_name: String::new(),
            customer_contact: None,
            customer_email: None,
            assigned_to: None,
            assigned_name: None,
            knowledge_id: None,
            created_at: now,
            updated_at: now,
            completed_at: None,
            tenant_id: String::new(),
            metadata: HashMap::new(),
        }
    }
}

impl ServiceTicket {
    /// 创建新工单
    pub fn new(
        title: String,
        description: Option<String>,
        ticket_type: TicketType,
        priority: TicketPriority,
        customer_name: String,
        customer_contact: Option<String>,
        customer_email: Option<String>,
        tenant_id: String,
        customer_id: Option<String>,
    ) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            description,
            ticket_type,
            status: TicketStatus::New,
            priority,
            customer_id,
            customer_name,
            customer_contact,
            customer_email: None,
            assigned_to: None,
            assigned_name: None,
            knowledge_id: None,
            created_at: now,
            updated_at: now,
            completed_at: None,
            tenant_id,
            metadata: HashMap::new(),
        }
    }

    /// 检查是否可以转换到指定状态
    pub fn can_transition_to(&self, new_status: TicketStatus) -> bool {
        match (self.status, new_status) {
            // 新建 -> 处理中 或 已取消
            (TicketStatus::New, TicketStatus::Processing) => true,
            (TicketStatus::New, TicketStatus::Cancelled) => true,
            // 处理中 -> 待确认 或 已取消
            (TicketStatus::Processing, TicketStatus::PendingConfirm) => true,
            (TicketStatus::Processing, TicketStatus::Cancelled) => true,
            // 待确认 -> 处理中 或 已完成
            (TicketStatus::PendingConfirm, TicketStatus::Processing) => true,
            (TicketStatus::PendingConfirm, TicketStatus::Completed) => true,
            // 已完成/已取消 - 不可转换
            _ => false,
        }
    }

    /// 更新状态
    pub fn update_status(&mut self, new_status: TicketStatus) -> bool {
        if self.can_transition_to(new_status) {
            self.status = new_status;
            self.updated_at = chrono::Utc::now().timestamp();
            if new_status == TicketStatus::Completed {
                self.completed_at = Some(chrono::Utc::now().timestamp());
            }
            true
        } else {
            false
        }
    }

    /// 分配处理人
    pub fn assign(&mut self, assigned_to: String, assigned_name: String) {
        self.assigned_to = Some(assigned_to);
        self.assigned_name = Some(assigned_name);
        self.updated_at = chrono::Utc::now().timestamp();
    }
}

/// 服务人员
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServicePersonnel {
    /// 人员 ID
    pub id: String,
    /// 用户 ID
    pub user_id: String,
    /// 用户姓名
    pub user_name: String,
    /// 部门
    pub department: Option<String>,
    /// 专长领域 (JSON array)
    pub specializations: Vec<String>,
    /// 状态
    pub status: PersonnelStatus,
    /// 当前工单数
    pub current_ticket_count: i32,
    /// 最大工单数
    pub max_ticket_count: i32,
    /// 创建时间
    pub created_at: i64,
    /// 更新时间
    pub updated_at: i64,
    /// 租户 ID
    pub tenant_id: String,
}

impl Default for ServicePersonnel {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            user_id: String::new(),
            user_name: String::new(),
            department: None,
            specializations: Vec::new(),
            status: PersonnelStatus::default(),
            current_ticket_count: 0,
            max_ticket_count: 10,
            created_at: now,
            updated_at: now,
            tenant_id: String::new(),
        }
    }
}

impl ServicePersonnel {
    /// 创建新服务人员
    pub fn new(user_id: String, user_name: String, tenant_id: String) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            user_id,
            user_name,
            department: None,
            specializations: Vec::new(),
            status: PersonnelStatus::Available,
            current_ticket_count: 0,
            max_ticket_count: 10,
            created_at: now,
            updated_at: now,
            tenant_id,
        }
    }

    /// 检查是否可以接新工单
    pub fn can_accept_ticket(&self) -> bool {
        self.status == PersonnelStatus::Available
            && self.current_ticket_count < self.max_ticket_count
    }

    /// 增加工单数
    pub fn add_ticket(&mut self) {
        self.current_ticket_count += 1;
        self.updated_at = chrono::Utc::now().timestamp();
    }

    /// 减少工单数
    pub fn remove_ticket(&mut self) {
        if self.current_ticket_count > 0 {
            self.current_ticket_count -= 1;
        }
        self.updated_at = chrono::Utc::now().timestamp();
    }

    /// 更新状态
    pub fn update_status(&mut self, status: PersonnelStatus) {
        self.status = status;
        self.updated_at = chrono::Utc::now().timestamp();
    }
}

// ==================== 请求/响应类型 ====================

/// 创建工单请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTicketRequest {
    pub title: String,
    pub description: Option<String>,
    pub ticket_type: TicketType,
    pub priority: TicketPriority,
    pub customer_id: Option<String>,
    pub customer_name: String,
    pub customer_contact: Option<String>,
    pub customer_email: Option<String>,
}

/// 更新工单请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTicketRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub priority: Option<TicketPriority>,
    pub customer_contact: Option<String>,
    pub customer_email: Option<String>,
}

/// 更新工单状态请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTicketStatusRequest {
    pub status: TicketStatus,
}

/// 分配工单请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignTicketRequest {
    pub assigned_to: String,
    pub assigned_name: String,
}

/// 查询工单参数
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct QueryTicketsParams {
    pub status: Option<Vec<TicketStatus>>,
    pub ticket_type: Option<Vec<TicketType>>,
    pub priority: Option<Vec<TicketPriority>>,
    pub assigned_to: Option<String>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

/// 分页结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedResult<T> {
    pub items: Vec<T>,
    pub total: u32,
    pub page: u32,
    pub page_size: u32,
}

/// 工单列表项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketListItem {
    pub id: String,
    pub title: String,
    pub ticket_type: TicketType,
    pub status: TicketStatus,
    pub priority: TicketPriority,
    pub customer_name: String,
    pub assigned_name: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 查询服务人员参数
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct QueryPersonnelParams {
    pub status: Option<PersonnelStatus>,
    pub department: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

/// 服务人员列表项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonnelListItem {
    pub id: String,
    pub user_name: String,
    pub department: Option<String>,
    pub status: PersonnelStatus,
    pub current_ticket_count: i32,
    pub max_ticket_count: i32,
}

/// 更新服务人员请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePersonnelRequest {
    pub department: Option<String>,
    pub specializations: Option<Vec<String>>,
    pub max_ticket_count: Option<i32>,
}

/// 更新服务人员状态请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePersonnelStatusRequest {
    pub status: PersonnelStatus,
}

/// 错误类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceError {
    pub code: String,
    pub message: String,
}

impl ServiceError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
        }
    }

    pub fn ticket_not_found() -> Self {
        Self::new("SERVICE_001", "工单不存在")
    }

    pub fn invalid_status_transition() -> Self {
        Self::new("SERVICE_002", "状态转换无效")
    }

    pub fn permission_denied() -> Self {
        Self::new("SERVICE_003", "权限不足")
    }

    pub fn personnel_not_found() -> Self {
        Self::new("SERVICE_004", "服务人员不存在")
    }

    pub fn personnel_busy() -> Self {
        Self::new("SERVICE_005", "服务人员忙碌")
    }

    pub fn invalid_params(msg: &str) -> Self {
        Self::new("SERVICE_006", msg)
    }

    pub fn database_error(msg: &str) -> Self {
        Self::new("SERVICE_007", msg)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ticket_type_default() {
        assert_eq!(TicketType::default(), TicketType::Repair);
    }

    #[test]
    fn test_ticket_status_default() {
        assert_eq!(TicketStatus::default(), TicketStatus::New);
    }

    #[test]
    fn test_ticket_priority_default() {
        assert_eq!(TicketPriority::default(), TicketPriority::Medium);
    }

    #[test]
    fn test_ticket_type_from_str() {
        assert_eq!("repair".parse::<TicketType>().unwrap(), TicketType::Repair);
        assert_eq!("consultation".parse::<TicketType>().unwrap(), TicketType::Consultation);
        assert_eq!("complaint".parse::<TicketType>().unwrap(), TicketType::Complaint);
        assert!("unknown".parse::<TicketType>().is_err());
    }

    #[test]
    fn test_ticket_new() {
        let ticket = ServiceTicket::new(
            "测试工单".to_string(),
            Some("描述".to_string()),
            TicketType::Repair,
            TicketPriority::High,
            "张三".to_string(),
            Some("13800000000".to_string()),
            None,
            "tenant-1".to_string(),
            None,
        );
        assert!(!ticket.id.is_empty());
        assert_eq!(ticket.title, "测试工单");
        assert_eq!(ticket.status, TicketStatus::New);
        assert!(ticket.assigned_to.is_none());
    }

    #[test]
    fn test_ticket_status_transition_new_to_processing() {
        let mut ticket = ServiceTicket::default();
        assert!(ticket.can_transition_to(TicketStatus::Processing));
        assert!(ticket.update_status(TicketStatus::Processing));
        assert_eq!(ticket.status, TicketStatus::Processing);
    }

    #[test]
    fn test_ticket_status_transition_processing_to_pending() {
        let mut ticket = ServiceTicket::default();
        ticket.update_status(TicketStatus::Processing);
        assert!(ticket.can_transition_to(TicketStatus::PendingConfirm));
        assert!(ticket.update_status(TicketStatus::PendingConfirm));
    }

    #[test]
    fn test_ticket_status_transition_invalid() {
        let ticket = ServiceTicket::default();
        // New -> Completed is invalid
        assert!(!ticket.can_transition_to(TicketStatus::Completed));
    }

    #[test]
    fn test_ticket_assign() {
        let mut ticket = ServiceTicket::default();
        ticket.assign("user-001".to_string(), "李四".to_string());
        assert_eq!(ticket.assigned_to.as_ref().unwrap(), "user-001");
        assert_eq!(ticket.assigned_name.as_ref().unwrap(), "李四");
    }

    #[test]
    fn test_ticket_complete_sets_completed_at() {
        let mut ticket = ServiceTicket::default();
        ticket.update_status(TicketStatus::Processing);
        ticket.update_status(TicketStatus::PendingConfirm);
        ticket.update_status(TicketStatus::Completed);
        assert!(ticket.completed_at.is_some());
    }

    #[test]
    fn test_service_personnel_default() {
        let p = ServicePersonnel::default();
        assert!(!p.id.is_empty());
        assert_eq!(p.current_ticket_count, 0);
        assert_eq!(p.max_ticket_count, 10);
    }

    #[test]
    fn test_service_error_codes() {
        let e = ServiceError::ticket_not_found();
        assert_eq!(e.code, "SERVICE_001");
        let e = ServiceError::invalid_status();
        assert_eq!(e.code, "SERVICE_002");
    }
}
