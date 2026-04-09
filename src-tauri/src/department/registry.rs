//! 部门注册表 - 管理所有已注册的部门能力包
//!
//! 提供部门的注册、查询、更新、注销功能

use crate::department::types::*;
use std::collections::HashMap;
use std::sync::RwLock;
use tracing::{error, info, warn};

/// 部门注册表
pub struct DepartmentRegistry {
    /// 已注册的部门包
    departments: RwLock<HashMap<String, DepartmentPackage>>,
    /// 代码到 ID 的映射
    code_map: RwLock<HashMap<String, String>>,
}

impl DepartmentRegistry {
    /// 创建新的注册表实例
    pub fn new() -> Self {
        info!("初始化部门注册表");
        Self {
            departments: RwLock::new(HashMap::new()),
            code_map: RwLock::new(HashMap::new()),
        }
    }

    /// 注册新部门
    pub fn register(&self, package: DepartmentPackage) -> Result<String, (DepartmentErrorCode, String)> {
        let code_str = package.code.to_string();
        let id = package.id.clone();

        // 检查代码是否已存在
        {
            let code_map = self.code_map.read().unwrap();
            if code_map.contains_key(&code_str) {
                warn!("部门代码已存在: {}", code_str);
                return Err((
                    DepartmentErrorCode::CodeExists,
                    format!("部门代码 '{}' 已存在", code_str),
                ));
            }
        }

        // 添加到代码映射
        {
            let mut code_map = self.code_map.write().unwrap();
            code_map.insert(code_str.clone(), id.clone());
        }

        // 添加到部门映射
        {
            let mut departments = self.departments.write().unwrap();
            departments.insert(id.clone(), package);
        }

        info!("部门注册成功: {} ({})", code_str, id);
        Ok(id)
    }

    /// 根据 ID 获取部门包
    pub fn get_by_id(&self, id: &str) -> Option<DepartmentPackage> {
        let departments = self.departments.read().unwrap();
        departments.get(id).cloned()
    }

    /// 根据代码获取部门包
    pub fn get_by_code(&self, code: &DepartmentCode) -> Option<DepartmentPackage> {
        let code_str = code.to_string();
        let code_map = self.code_map.read().unwrap();
        if let Some(id) = code_map.get(&code_str).cloned() {
            drop(code_map);
            return self.get_by_id(&id);
        }
        None
    }

    /// 获取所有已注册的部门
    pub fn get_all(&self) -> Vec<DepartmentPackage> {
        let departments = self.departments.read().unwrap();
        departments.values().cloned().collect()
    }

    /// 获取所有已注册的部门列表（摘要）
    pub fn list(&self) -> Vec<DepartmentListItem> {
        let departments = self.departments.read().unwrap();
        departments
            .values()
            .map(|dept| DepartmentListItem {
                id: dept.id.clone(),
                code: dept.code.to_string(),
                name: dept.name.clone(),
                status: dept.status,
                version: dept.version.clone(),
                description: dept.description.clone(),
                capability_count: dept.capabilities.len(),
                tool_count: dept.tools.len(),
                loaded_at: dept.loaded_at,
            })
            .collect()
    }

    /// 更新部门信息
    pub fn update(&self, id: &str, request: UpdateDepartmentRequest) -> Result<DepartmentPackage, (DepartmentErrorCode, String)> {
        let mut departments = self.departments.write().unwrap();
        let department = departments.get_mut(id).ok_or_else(|| {
            error!("部门不存在: {}", id);
            (
                DepartmentErrorCode::NotFound,
                format!("部门 ID '{}' 不存在", id),
            )
        })?;

        // 更新字段
        if let Some(name) = request.name {
            department.name = name;
        }
        if let Some(version) = request.version {
            department.version = version;
        }
        if let Some(description) = request.description {
            department.description = description;
        }
        if let Some(status) = request.status {
            department.status = status;
        }
        department.updated_at = chrono::Utc::now().timestamp();

        info!("部门更新成功: {}", id);
        Ok(department.clone())
    }

    /// 注销部门
    pub fn unregister(&self, id: &str) -> Result<(), (DepartmentErrorCode, String)> {
        // 获取部门信息用于清理代码映射
        let code_str = {
            let departments = self.departments.read().unwrap();
            departments.get(id).map(|d| d.code.to_string())
        };

        if code_str.is_none() {
            return Err((
                DepartmentErrorCode::NotFound,
                format!("部门 ID '{}' 不存在", id),
            ));
        }

        // 从代码映射中移除
        {
            let mut code_map = self.code_map.write().unwrap();
            code_map.remove(&code_str.unwrap());
        }

        // 从部门映射中移除
        {
            let mut departments = self.departments.write().unwrap();
            departments.remove(id);
        }

        info!("部门注销成功: {}", id);
        Ok(())
    }

    /// 更新部门状态
    pub fn update_status(&self, id: &str, status: DepartmentStatus) -> Result<(), (DepartmentErrorCode, String)> {
        let mut departments = self.departments.write().unwrap();
        let department = departments.get_mut(id).ok_or_else(|| {
            (
                DepartmentErrorCode::NotFound,
                format!("部门 ID '{}' 不存在", id),
            )
        })?;

        department.status = status;
        department.updated_at = chrono::Utc::now().timestamp();
        Ok(())
    }

    /// 设置加载时间
    pub fn set_loaded(&self, id: &str, loaded: bool) -> Result<(), (DepartmentErrorCode, String)> {
        let mut departments = self.departments.write().unwrap();
        let department = departments.get_mut(id).ok_or_else(|| {
            (
                DepartmentErrorCode::NotFound,
                format!("部门 ID '{}' 不存在", id),
            )
        })?;

        if loaded {
            department.loaded_at = Some(chrono::Utc::now().timestamp_millis());
            department.status = DepartmentStatus::Active;
        } else {
            department.loaded_at = None;
            department.status = DepartmentStatus::Inactive;
        }
        department.updated_at = chrono::Utc::now().timestamp();
        Ok(())
    }

    /// 检查部门是否存在
    pub fn exists(&self, id: &str) -> bool {
        let departments = self.departments.read().unwrap();
        departments.contains_key(id)
    }

    /// 检查代码是否存在
    pub fn code_exists(&self, code: &DepartmentCode) -> bool {
        let code_str = code.to_string();
        let code_map = self.code_map.read().unwrap();
        code_map.contains_key(&code_str)
    }

    /// 获取已加载的部门数量
    pub fn loaded_count(&self) -> usize {
        let departments = self.departments.read().unwrap();
        departments.values().filter(|d| d.status == DepartmentStatus::Active).count()
    }

    /// 获取已注册的部门总数
    pub fn total_count(&self) -> usize {
        let departments = self.departments.read().unwrap();
        departments.len()
    }

    /// 注册默认核心部门
    pub fn register_defaults(&self) {
        let defaults = vec![
            self.create_hr_package(),
            self.create_approval_package(),
            self.create_sales_package(),
            self.create_finance_package(),
            self.create_warehouse_package(),
            self.create_management_package(),
        ];

        for package in defaults {
            if let Err((code, msg)) = self.register(package) {
                warn!("注册默认部门失败: {} - {}", code, msg);
            }
        }
    }

    fn create_hr_package(&self) -> DepartmentPackage {
        DepartmentPackage {
            id: uuid::Uuid::new_v4().to_string(),
            code: DepartmentCode::Hr,
            name: "人事部".to_string(),
            version: "1.0.0".to_string(),
            description: "人事管理核心部门，提供员工管理、部门架构、岗位管理等能力".to_string(),
            capabilities: vec![
                Capability {
                    id: "hr.employee".to_string(),
                    name: "员工管理".to_string(),
                    description: "员工信息管理能力".to_string(),
                    capability_type: "core".to_string(),
                    enabled: true,
                    config: HashMap::new(),
                },
                Capability {
                    id: "hr.organization".to_string(),
                    name: "组织架构".to_string(),
                    description: "组织架构管理能力".to_string(),
                    capability_type: "core".to_string(),
                    enabled: true,
                    config: HashMap::new(),
                },
                Capability {
                    id: "hr.position".to_string(),
                    name: "岗位管理".to_string(),
                    description: "岗位信息管理能力".to_string(),
                    capability_type: "core".to_string(),
                    enabled: true,
                    config: HashMap::new(),
                },
            ],
            dependencies: vec![],
            tools: vec![
                ToolDescriptor {
                    id: "hr_employee_query".to_string(),
                    name: "hr_employee_query".to_string(),
                    description: "查询员工信息".to_string(),
                    parameters: serde_json::json!({
                        "type": "object",
                        "properties": {
                            "employee_id": {"type": "string", "description": "员工ID"}
                        }
                    }),
                    permissions: vec!["hr:read".to_string()],
                },
            ],
            skills: vec![],
            routes: vec![
                RouteConfig {
                    path: "/hr/employees".to_string(),
                    name: "员工管理".to_string(),
                    component: "@/features/hr/components/EmployeeList".to_string(),
                    permissions: vec!["hr:read".to_string()],
                },
            ],
            entry_points: vec![
                EntryPoint {
                    id: "hr".to_string(),
                    name: "人事部".to_string(),
                    icon: "Users".to_string(),
                    route: "/hr".to_string(),
                    weight: 10,
                },
            ],
            status: DepartmentStatus::Inactive,
            loaded_at: None,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        }
    }

    fn create_approval_package(&self) -> DepartmentPackage {
        DepartmentPackage {
            id: uuid::Uuid::new_v4().to_string(),
            code: DepartmentCode::Approval,
            name: "审批中心".to_string(),
            version: "1.0.0".to_string(),
            description: "审批流程管理核心部门，提供流程设计、审批执行、历史记录等能力".to_string(),
            capabilities: vec![
                Capability {
                    id: "approval.workflow".to_string(),
                    name: "审批流程".to_string(),
                    description: "审批流程管理能力".to_string(),
                    capability_type: "core".to_string(),
                    enabled: true,
                    config: HashMap::new(),
                },
            ],
            dependencies: vec![DepartmentCode::Hr],
            tools: vec![
                ToolDescriptor {
                    id: "approval_pending_query".to_string(),
                    name: "approval_pending_query".to_string(),
                    description: "查询待审批项".to_string(),
                    parameters: serde_json::json!({
                        "type": "object",
                        "properties": {}
                    }),
                    permissions: vec!["approval:read".to_string()],
                },
            ],
            skills: vec![],
            routes: vec![
                RouteConfig {
                    path: "/approval/list".to_string(),
                    name: "审批列表".to_string(),
                    component: "@/features/approval/components/ApprovalList".to_string(),
                    permissions: vec!["approval:read".to_string()],
                },
            ],
            entry_points: vec![
                EntryPoint {
                    id: "approval".to_string(),
                    name: "审批中心".to_string(),
                    icon: "FileCheck".to_string(),
                    route: "/approval".to_string(),
                    weight: 20,
                },
            ],
            status: DepartmentStatus::Inactive,
            loaded_at: None,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        }
    }

    fn create_sales_package(&self) -> DepartmentPackage {
        DepartmentPackage {
            id: uuid::Uuid::new_v4().to_string(),
            code: DepartmentCode::Sales,
            name: "销售部".to_string(),
            version: "1.0.0".to_string(),
            description: "销售管理核心部门，提供报价单、合同、订单、客户管理等能力".to_string(),
            capabilities: vec![
                Capability {
                    id: "sales.quote".to_string(),
                    name: "报价单管理".to_string(),
                    description: "销售报价单管理能力".to_string(),
                    capability_type: "core".to_string(),
                    enabled: true,
                    config: HashMap::new(),
                },
            ],
            dependencies: vec![],
            tools: vec![],
            skills: vec![],
            routes: vec![
                RouteConfig {
                    path: "/sales/quotes".to_string(),
                    name: "报价单管理".to_string(),
                    component: "@/features/sales/components/QuoteList".to_string(),
                    permissions: vec!["sales:read".to_string()],
                },
            ],
            entry_points: vec![
                EntryPoint {
                    id: "sales".to_string(),
                    name: "销售部".to_string(),
                    icon: "TrendingUp".to_string(),
                    route: "/sales".to_string(),
                    weight: 30,
                },
            ],
            status: DepartmentStatus::Inactive,
            loaded_at: None,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        }
    }

    fn create_finance_package(&self) -> DepartmentPackage {
        DepartmentPackage {
            id: uuid::Uuid::new_v4().to_string(),
            code: DepartmentCode::Finance,
            name: "财务部".to_string(),
            version: "1.0.0".to_string(),
            description: "财务管理核心部门，提供发票OCR、台账、应收应付等能力".to_string(),
            capabilities: vec![
                Capability {
                    id: "finance.invoice".to_string(),
                    name: "发票管理".to_string(),
                    description: "发票OCR识别与管理能力".to_string(),
                    capability_type: "core".to_string(),
                    enabled: true,
                    config: HashMap::new(),
                },
            ],
            dependencies: vec![DepartmentCode::Sales],
            tools: vec![],
            skills: vec![],
            routes: vec![
                RouteConfig {
                    path: "/finance/invoices".to_string(),
                    name: "发票管理".to_string(),
                    component: "@/features/finance/components/InvoiceList".to_string(),
                    permissions: vec!["finance:read".to_string()],
                },
            ],
            entry_points: vec![
                EntryPoint {
                    id: "finance".to_string(),
                    name: "财务部".to_string(),
                    icon: "Wallet".to_string(),
                    route: "/finance".to_string(),
                    weight: 40,
                },
            ],
            status: DepartmentStatus::Inactive,
            loaded_at: None,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        }
    }

    fn create_warehouse_package(&self) -> DepartmentPackage {
        DepartmentPackage {
            id: uuid::Uuid::new_v4().to_string(),
            code: DepartmentCode::Warehouse,
            name: "仓储部".to_string(),
            version: "1.0.0".to_string(),
            description: "仓储管理核心部门，提供入库、出库、库存管理等能力".to_string(),
            capabilities: vec![
                Capability {
                    id: "warehouse.inventory".to_string(),
                    name: "库存管理".to_string(),
                    description: "库存管理能力".to_string(),
                    capability_type: "core".to_string(),
                    enabled: true,
                    config: HashMap::new(),
                },
            ],
            dependencies: vec![],
            tools: vec![],
            skills: vec![],
            routes: vec![
                RouteConfig {
                    path: "/warehouse/inventory".to_string(),
                    name: "库存管理".to_string(),
                    component: "@/features/warehouse/components/InventoryList".to_string(),
                    permissions: vec!["warehouse:read".to_string()],
                },
            ],
            entry_points: vec![
                EntryPoint {
                    id: "warehouse".to_string(),
                    name: "仓储部".to_string(),
                    icon: "Package".to_string(),
                    route: "/warehouse".to_string(),
                    weight: 50,
                },
            ],
            status: DepartmentStatus::Inactive,
            loaded_at: None,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        }
    }

    fn create_management_package(&self) -> DepartmentPackage {
        DepartmentPackage {
            id: uuid::Uuid::new_v4().to_string(),
            code: DepartmentCode::Management,
            name: "管理层".to_string(),
            version: "1.0.0".to_string(),
            description: "管理决策核心部门，提供数据看板、经营分析、预警机制等能力".to_string(),
            capabilities: vec![
                Capability {
                    id: "management.dashboard".to_string(),
                    name: "数据看板".to_string(),
                    description: "跨部门数据汇总看板能力".to_string(),
                    capability_type: "core".to_string(),
                    enabled: true,
                    config: HashMap::new(),
                },
            ],
            dependencies: vec![
                DepartmentCode::Hr,
                DepartmentCode::Sales,
                DepartmentCode::Finance,
                DepartmentCode::Warehouse,
            ],
            tools: vec![],
            skills: vec![],
            routes: vec![
                RouteConfig {
                    path: "/management/dashboard".to_string(),
                    name: "管理看板".to_string(),
                    component: "@/features/management/components/Dashboard".to_string(),
                    permissions: vec!["management:read".to_string()],
                },
            ],
            entry_points: vec![
                EntryPoint {
                    id: "management".to_string(),
                    name: "管理层".to_string(),
                    icon: "BarChart3".to_string(),
                    route: "/management".to_string(),
                    weight: 100,
                },
            ],
            status: DepartmentStatus::Inactive,
            loaded_at: None,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        }
    }
}

impl Default for DepartmentRegistry {
    fn default() -> Self {
        Self::new()
    }
}
