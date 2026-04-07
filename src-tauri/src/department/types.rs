//! 部门模块数据类型定义
//!
//! 包含所有部门相关的核心类型定义

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 部门代码枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum DepartmentCode {
    /// 人事部门
    Hr,
    /// 审批中心
    Approval,
    /// 销售部门
    Sales,
    /// 财务部门
    Finance,
    /// 仓储部门
    Warehouse,
    /// 管理层
    Management,
    /// 自定义部门
    Custom(String),
}

impl Default for DepartmentCode {
    fn default() -> Self {
        Self::Hr
    }
}

impl std::fmt::Display for DepartmentCode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Hr => write!(f, "hr"),
            Self::Approval => write!(f, "approval"),
            Self::Sales => write!(f, "sales"),
            Self::Finance => write!(f, "finance"),
            Self::Warehouse => write!(f, "warehouse"),
            Self::Management => write!(f, "management"),
            Self::Custom(code) => write!(f, "{}", code),
        }
    }
}

/// 部门状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DepartmentStatus {
    /// 活跃状态
    Active,
    /// 非活跃状态
    Inactive,
    /// 加载中
    Loading,
    /// 卸载中
    Unloading,
    /// 错误状态
    Error,
}

impl Default for DepartmentStatus {
    fn default() -> Self {
        Self::Inactive
    }
}

/// 消息类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MessageType {
    /// 数据请求
    DataRequest,
    /// 数据响应
    DataResponse,
    /// 事件通知
    Event,
    /// 委派请求
    Delegate,
    /// 跨部门查询
    CrossQuery,
    /// 状态变更
    StatusChange,
}

/// 部门能力描述
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Capability {
    /// 能力 ID
    pub id: String,
    /// 能力名称
    pub name: String,
    /// 能力描述
    pub description: String,
    /// 能力类型
    pub capability_type: String,
    /// 是否启用
    pub enabled: bool,
    /// 能力配置
    pub config: HashMap<String, serde_json::Value>,
}

impl Default for Capability {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            description: String::new(),
            capability_type: String::new(),
            enabled: true,
            config: HashMap::new(),
        }
    }
}

/// 工具描述
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolDescriptor {
    /// 工具 ID
    pub id: String,
    /// 工具名称
    pub name: String,
    /// 工具描述
    pub description: String,
    /// 工具参数 Schema
    pub parameters: serde_json::Value,
    /// 权限要求
    pub permissions: Vec<String>,
}

impl Default for ToolDescriptor {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            description: String::new(),
            parameters: serde_json::json!({}),
            permissions: Vec::new(),
        }
    }
}

/// 技能描述
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillDescriptor {
    /// 技能 ID
    pub id: String,
    /// 技能名称
    pub name: String,
    /// 技能描述
    pub description: String,
    /// 技能文件路径
    pub skill_file: String,
    /// 依赖工具
    pub required_tools: Vec<String>,
}

impl Default for SkillDescriptor {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            description: String::new(),
            skill_file: String::new(),
            required_tools: Vec::new(),
        }
    }
}

/// 路由配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RouteConfig {
    /// 路由路径
    pub path: String,
    /// 路由名称
    pub name: String,
    /// 组件路径
    pub component: String,
    /// 权限要求
    pub permissions: Vec<String>,
}

impl Default for RouteConfig {
    fn default() -> Self {
        Self {
            path: String::new(),
            name: String::new(),
            component: String::new(),
            permissions: Vec::new(),
        }
    }
}

/// 入口点配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryPoint {
    /// 入口 ID
    pub id: String,
    /// 入口名称
    pub name: String,
    /// 入口图标
    pub icon: String,
    /// 入口路由
    pub route: String,
    /// 排序权重
    pub weight: i32,
}

impl Default for EntryPoint {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            icon: String::new(),
            route: String::new(),
            weight: 0,
        }
    }
}

/// 部门能力包
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DepartmentPackage {
    /// 唯一标识 (UUID)
    pub id: String,
    /// 部门代码
    pub code: DepartmentCode,
    /// 部门名称
    pub name: String,
    /// 版本号 (SemVer)
    pub version: String,
    /// 部门描述
    pub description: String,
    /// 能力列表
    pub capabilities: Vec<Capability>,
    /// 依赖的其他部门代码
    pub dependencies: Vec<DepartmentCode>,
    /// 工具列表
    pub tools: Vec<ToolDescriptor>,
    /// 技能列表
    pub skills: Vec<SkillDescriptor>,
    /// 路由配置
    pub routes: Vec<RouteConfig>,
    /// 入口点配置
    pub entry_points: Vec<EntryPoint>,
    /// 部门状态
    pub status: DepartmentStatus,
    /// 加载时间戳
    pub loaded_at: Option<i64>,
    /// 初始化时间戳
    pub created_at: i64,
    /// 更新时间戳
    pub updated_at: i64,
}

impl Default for DepartmentPackage {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            code: DepartmentCode::Hr,
            name: String::new(),
            version: "1.0.0".to_string(),
            description: String::new(),
            capabilities: Vec::new(),
            dependencies: Vec::new(),
            tools: Vec::new(),
            skills: Vec::new(),
            routes: Vec::new(),
            entry_points: Vec::new(),
            status: DepartmentStatus::Inactive,
            loaded_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

/// 部门消息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DepartmentMessage {
    /// 消息 ID
    pub id: String,
    /// 来源部门代码
    pub from: DepartmentCode,
    /// 目标部门代码
    pub to: DepartmentCode,
    /// 消息类型
    pub message_type: MessageType,
    /// 消息内容
    pub payload: serde_json::Value,
    /// 关联 ID (用于请求/响应对)
    pub correlation_id: Option<String>,
    /// 时间戳
    pub timestamp: i64,
    /// 状态
    pub status: MessageStatus,
}

impl Default for DepartmentMessage {
    fn default() -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            from: DepartmentCode::Hr,
            to: DepartmentCode::Hr,
            message_type: MessageType::Event,
            payload: serde_json::json!({}),
            correlation_id: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
            status: MessageStatus::Pending,
        }
    }
}

/// 消息状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MessageStatus {
    /// 待处理
    Pending,
    /// 处理中
    Processing,
    /// 已完成
    Completed,
    /// 失败
    Failed,
}

impl Default for MessageStatus {
    fn default() -> Self {
        Self::Pending
    }
}

/// 部门创建请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDepartmentRequest {
    /// 部门代码
    pub code: DepartmentCode,
    /// 部门名称
    pub name: String,
    /// 版本号
    pub version: Option<String>,
    /// 部门描述
    pub description: Option<String>,
    /// 依赖部门
    pub dependencies: Option<Vec<DepartmentCode>>,
}

/// 部门更新请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDepartmentRequest {
    /// 部门名称
    pub name: Option<String>,
    /// 版本号
    pub version: Option<String>,
    /// 部门描述
    pub description: Option<String>,
    /// 状态
    pub status: Option<DepartmentStatus>,
}

/// 部门查询结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DepartmentListItem {
    /// 部门 ID
    pub id: String,
    /// 部门代码
    pub code: String,
    /// 部门名称
    pub name: String,
    /// 状态
    pub status: DepartmentStatus,
    /// 版本号
    pub version: String,
    /// 描述
    pub description: String,
    /// 能力数量
    pub capability_count: usize,
    /// 工具数量
    pub tool_count: usize,
    /// 加载时间
    pub loaded_at: Option<i64>,
}

/// 部门详情响应
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DepartmentDetailResponse {
    /// 部门包完整信息
    pub department: DepartmentPackage,
    /// 能力列表
    pub capabilities: Vec<Capability>,
    /// 工具列表
    pub tools: Vec<ToolDescriptor>,
    /// 技能列表
    pub skills: Vec<SkillDescriptor>,
    /// 路由配置
    pub routes: Vec<RouteConfig>,
}

/// 部门间通信响应
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageResponse {
    /// 消息 ID
    pub message_id: String,
    /// 状态
    pub status: MessageStatus,
    /// 响应数据
    pub response_data: Option<serde_json::Value>,
    /// 错误信息
    pub error: Option<String>,
}

/// 部门错误类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DepartmentErrorCode {
    /// 部门代码已存在
    CodeExists,
    /// 部门不存在
    NotFound,
    /// 依赖部门未加载
    DependencyNotLoaded,
    /// 加载失败
    LoadFailed,
    /// 卸载失败
    UnloadFailed,
    /// 消息发送失败
    MessageSendFailed,
    /// 内部错误
    InternalError,
}

impl std::fmt::Display for DepartmentErrorCode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::CodeExists => write!(f, "DEPT_001"),
            Self::NotFound => write!(f, "DEPT_002"),
            Self::DependencyNotLoaded => write!(f, "DEPT_003"),
            Self::LoadFailed => write!(f, "DEPT_004"),
            Self::UnloadFailed => write!(f, "DEPT_005"),
            Self::MessageSendFailed => write!(f, "DEPT_006"),
            Self::InternalError => write!(f, "DEPT_999"),
        }
    }
}
