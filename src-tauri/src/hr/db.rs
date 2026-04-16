//! HR 模块内存数据库
//!
//! 提供员工、部门、岗位的内存存储（后续可替换为 SQLite）

use crate::hr::types::*;
use std::collections::HashMap;
use std::sync::RwLock;
use tracing::info;

/// HR 数据库状态
pub struct HrDatabase {
    /// 员工存储
    employees: RwLock<HashMap<String, Employee>>,
    /// 部门存储
    departments: RwLock<HashMap<String, HrDepartment>>,
    /// 岗位存储
    positions: RwLock<HashMap<String, Position>>,
    /// 工号索引
    employee_code_index: RwLock<HashMap<String, String>>,
    /// 部门代码索引
    department_code_index: RwLock<HashMap<String, String>>,
    /// 岗位代码索引
    position_code_index: RwLock<HashMap<String, String>>,
}

impl HrDatabase {
    /// 创建新的数据库实例
    pub fn new() -> Self {
        info!("初始化 HR 内存数据库");
        Self {
            employees: RwLock::new(HashMap::new()),
            departments: RwLock::new(HashMap::new()),
            positions: RwLock::new(HashMap::new()),
            employee_code_index: RwLock::new(HashMap::new()),
            department_code_index: RwLock::new(HashMap::new()),
            position_code_index: RwLock::new(HashMap::new()),
        }
    }

    /// 初始化默认数据
    pub fn init_defaults(&self) {
        // 创建默认岗位
        let positions = vec![
            Position {
                id: "pos-001".to_string(),
                code: "CEO".to_string(),
                name: "首席执行官".to_string(),
                level: 1,
                department_id: None,
                permissions: vec!["*".to_string()],
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
            Position {
                id: "pos-002".to_string(),
                code: "CTO".to_string(),
                name: "首席技术官".to_string(),
                level: 2,
                department_id: None,
                permissions: vec!["tech:*".to_string()],
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
            Position {
                id: "pos-003".to_string(),
                code: "HR_DIR".to_string(),
                name: "人事总监".to_string(),
                level: 3,
                department_id: None,
                permissions: vec!["hr:*".to_string()],
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
            Position {
                id: "pos-004".to_string(),
                code: "HR_SPEC".to_string(),
                name: "人事专员".to_string(),
                level: 5,
                department_id: None,
                permissions: vec!["hr:read".to_string(), "hr:write".to_string()],
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
            Position {
                id: "pos-005".to_string(),
                code: "DEV".to_string(),
                name: "开发工程师".to_string(),
                level: 5,
                department_id: None,
                permissions: vec!["dev:*".to_string()],
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
        ];

        for pos in positions {
            let code = pos.code.clone();
            let id = pos.id.clone();
            self.positions.write().unwrap().insert(id.clone(), pos);
            self.position_code_index.write().unwrap().insert(code, id);
        }

        // 创建默认部门
        let departments = vec![
            HrDepartment {
                id: "dept-001".to_string(),
                code: "ROOT".to_string(),
                name: "总公司".to_string(),
                parent_id: None,
                manager_id: None,
                level: 1,
                sort_order: 0,
                children: Vec::new(),
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
            HrDepartment {
                id: "dept-002".to_string(),
                code: "HR".to_string(),
                name: "人事部".to_string(),
                parent_id: Some("dept-001".to_string()),
                manager_id: None,
                level: 2,
                sort_order: 10,
                children: Vec::new(),
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
            HrDepartment {
                id: "dept-003".to_string(),
                code: "TECH".to_string(),
                name: "技术部".to_string(),
                parent_id: Some("dept-001".to_string()),
                manager_id: None,
                level: 2,
                sort_order: 20,
                children: Vec::new(),
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
            HrDepartment {
                id: "dept-004".to_string(),
                code: "SALES".to_string(),
                name: "销售部".to_string(),
                parent_id: Some("dept-001".to_string()),
                manager_id: None,
                level: 2,
                sort_order: 30,
                children: Vec::new(),
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
            HrDepartment {
                id: "dept-005".to_string(),
                code: "FINANCE".to_string(),
                name: "财务部".to_string(),
                parent_id: Some("dept-001".to_string()),
                manager_id: None,
                level: 2,
                sort_order: 40,
                children: Vec::new(),
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
        ];

        for dept in departments {
            let code = dept.code.clone();
            let id = dept.id.clone();
            self.departments.write().unwrap().insert(id.clone(), dept);
            self.department_code_index.write().unwrap().insert(code, id);
        }

        // 创建示例员工
        let employees = vec![
            Employee {
                id: "emp-001".to_string(),
                employee_code: "E001".to_string(),
                name: "张三".to_string(),
                email: "zhangsan@example.com".to_string(),
                phone: Some("13800138000".to_string()),
                department_id: "dept-002".to_string(),
                position_id: "pos-003".to_string(),
                manager_id: None,
                hire_date: chrono::Utc::now().timestamp() - 86400 * 365,
                status: EmployeeStatus::Active,
                avatar: None,
                metadata: HashMap::new(),
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
            Employee {
                id: "emp-002".to_string(),
                employee_code: "E002".to_string(),
                name: "李四".to_string(),
                email: "lisi@example.com".to_string(),
                phone: Some("13800138001".to_string()),
                department_id: "dept-003".to_string(),
                position_id: "pos-005".to_string(),
                manager_id: Some("emp-001".to_string()),
                hire_date: chrono::Utc::now().timestamp() - 86400 * 180,
                status: EmployeeStatus::Active,
                avatar: None,
                metadata: HashMap::new(),
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
            Employee {
                id: "emp-003".to_string(),
                employee_code: "E003".to_string(),
                name: "王五".to_string(),
                email: "wangwu@example.com".to_string(),
                phone: Some("13800138002".to_string()),
                department_id: "dept-003".to_string(),
                position_id: "pos-005".to_string(),
                manager_id: Some("emp-002".to_string()),
                hire_date: chrono::Utc::now().timestamp() - 86400 * 30,
                status: EmployeeStatus::Probation,
                avatar: None,
                metadata: HashMap::new(),
                created_at: chrono::Utc::now().timestamp(),
                updated_at: chrono::Utc::now().timestamp(),
            },
        ];

        for emp in employees {
            let code = emp.employee_code.clone();
            let id = emp.id.clone();
            self.employees.write().unwrap().insert(id.clone(), emp);
            self.employee_code_index.write().unwrap().insert(code, id);
        }

        info!("HR 默认数据初始化完成");
    }

    // ==================== 员工操作 ====================

    /// 创建员工
    pub fn create_employee(&self, req: CreateEmployeeRequest) -> Result<Employee, String> {
        // 检查工号唯一性
        {
            let index = self.employee_code_index.read().unwrap();
            if index.contains_key(&req.employee_code) {
                return Err(format!("工号 '{}' 已存在", req.employee_code));
            }
        }

        let now = chrono::Utc::now().timestamp();
        let employee = Employee {
            id: uuid::Uuid::new_v4().to_string(),
            employee_code: req.employee_code,
            name: req.name,
            email: req.email,
            phone: req.phone,
            department_id: req.department_id,
            position_id: req.position_id,
            manager_id: req.manager_id,
            hire_date: req.hire_date.unwrap_or(now),
            status: req.status.unwrap_or(EmployeeStatus::Probation),
            avatar: None,
            metadata: HashMap::new(),
            created_at: now,
            updated_at: now,
        };

        let code = employee.employee_code.clone();
        let id = employee.id.clone();

        self.employees.write().unwrap().insert(id.clone(), employee.clone());
        self.employee_code_index.write().unwrap().insert(code, id);

        Ok(employee)
    }

    /// 获取员工列表
    pub fn list_employees(&self, params: &EmployeeQueryParams) -> PagedResult<EmployeeListItem> {
        let employees = self.employees.read().unwrap();
        let departments = self.departments.read().unwrap();
        let positions = self.positions.read().unwrap();

        let page = params.page.unwrap_or(1).max(1);
        let page_size = params.page_size.unwrap_or(20).min(100);

        let filtered: Vec<_> = employees
            .values()
            .filter(|emp| {
                // 关键字过滤
                if let Some(keyword) = &params.keyword {
                    let kw = keyword.to_lowercase();
                    emp.name.to_lowercase().contains(&kw)
                        || emp.employee_code.to_lowercase().contains(&kw)
                        || emp.email.to_lowercase().contains(&kw)
                } else {
                    true
                }
            })
            .filter(|emp| {
                // 部门过滤
                if let Some(dept_id) = &params.department_id {
                    &emp.department_id == dept_id
                } else {
                    true
                }
            })
            .filter(|emp| {
                // 岗位过滤
                if let Some(pos_id) = &params.position_id {
                    &emp.position_id == pos_id
                } else {
                    true
                }
            })
            .filter(|emp| {
                // 状态过滤
                if let Some(status) = &params.status {
                    emp.status == *status
                } else {
                    true
                }
            })
            .collect();

        let total = filtered.len() as i64;
        let start = ((page - 1) * page_size) as usize;
        let end = (start + page_size as usize).min(filtered.len());

        let items: Vec<EmployeeListItem> = filtered[start..end]
            .iter()
            .map(|emp| {
                let dept_name = departments.get(&emp.department_id).map(|d| d.name.clone());
                let pos_name = positions.get(&emp.position_id).map(|p| p.name.clone());
                let manager_name = emp
                    .manager_id
                    .as_ref()
                    .and_then(|mid| employees.get(mid))
                    .map(|m| m.name.clone());

                EmployeeListItem {
                    id: emp.id.clone(),
                    employee_code: emp.employee_code.clone(),
                    name: emp.name.clone(),
                    email: emp.email.clone(),
                    department_name: dept_name,
                    position_name: pos_name,
                    manager_name,
                    hire_date: emp.hire_date,
                    status: emp.status,
                }
            })
            .collect();

        PagedResult::new(items, total, page, page_size)
    }

    /// 获取员工详情
    pub fn get_employee(&self, id: &str) -> Option<EmployeeDetail> {
        let employees = self.employees.read().unwrap();
        let departments = self.departments.read().unwrap();
        let positions = self.positions.read().unwrap();

        let employee = employees.get(id)?;

        let department = departments.get(&employee.department_id).cloned();
        let position = positions.get(&employee.position_id).cloned();
        let manager = employee
            .manager_id
            .as_ref()
            .and_then(|mid| employees.get(mid))
            .cloned();

        let subordinates: Vec<EmployeeListItem> = employees
            .values()
            .filter(|emp| emp.manager_id.as_ref() == Some(&id.to_string()))
            .map(|emp| {
                let dept_name = departments.get(&emp.department_id).map(|d| d.name.clone());
                let pos_name = positions.get(&emp.position_id).map(|p| p.name.clone());
                EmployeeListItem {
                    id: emp.id.clone(),
                    employee_code: emp.employee_code.clone(),
                    name: emp.name.clone(),
                    email: emp.email.clone(),
                    department_name: dept_name,
                    position_name: pos_name,
                    manager_name: None,
                    hire_date: emp.hire_date,
                    status: emp.status,
                }
            })
            .collect();

        Some(EmployeeDetail {
            employee: employee.clone(),
            department,
            position,
            manager,
            subordinates,
        })
    }

    /// 更新员工
    pub fn update_employee(&self, id: &str, req: UpdateEmployeeRequest) -> Result<Employee, String> {
        let mut employees = self.employees.write().unwrap();
        let employee = employees.get_mut(id).ok_or_else(|| "员工不存在".to_string())?;

        if let Some(name) = req.name {
            employee.name = name;
        }
        if let Some(email) = req.email {
            employee.email = email;
        }
        if let Some(phone) = req.phone {
            employee.phone = Some(phone);
        }
        if let Some(department_id) = req.department_id {
            employee.department_id = department_id;
        }
        if let Some(position_id) = req.position_id {
            employee.position_id = position_id;
        }
        if let Some(manager_id) = req.manager_id {
            employee.manager_id = Some(manager_id);
        }
        if let Some(hire_date) = req.hire_date {
            employee.hire_date = hire_date;
        }
        if let Some(status) = req.status {
            employee.status = status;
        }
        employee.updated_at = chrono::Utc::now().timestamp();

        Ok(employee.clone())
    }

    /// 删除员工
    pub fn delete_employee(&self, id: &str) -> Result<(), String> {
        let mut employees = self.employees.write().unwrap();
        let employee = employees.remove(id).ok_or_else(|| "员工不存在".to_string())?;

        self.employee_code_index
            .write()
            .unwrap()
            .remove(&employee.employee_code);

        Ok(())
    }

    // ==================== 部门操作 ====================

    /// 创建部门
    pub fn create_department(&self, req: CreateDepartmentRequest) -> Result<HrDepartment, String> {
        // 检查代码唯一性
        {
            let index = self.department_code_index.read().unwrap();
            if index.contains_key(&req.code) {
                return Err(format!("部门代码 '{}' 已存在", req.code));
            }
        }

        // 计算层级
        let level = if let Some(parent_id) = &req.parent_id {
            let departments = self.departments.read().unwrap();
            departments
                .get(parent_id)
                .map(|d| d.level + 1)
                .unwrap_or(1)
        } else {
            1
        };

        let now = chrono::Utc::now().timestamp();
        let department = HrDepartment {
            id: uuid::Uuid::new_v4().to_string(),
            code: req.code,
            name: req.name,
            parent_id: req.parent_id,
            manager_id: req.manager_id,
            level,
            sort_order: req.sort_order.unwrap_or(0),
            children: Vec::new(),
            created_at: now,
            updated_at: now,
        };

        let code = department.code.clone();
        let id = department.id.clone();

        self.departments
            .write()
            .unwrap()
            .insert(id.clone(), department.clone());
        self.department_code_index
            .write()
            .unwrap()
            .insert(code, id);

        Ok(department)
    }

    /// 获取部门树
    pub fn get_department_tree(&self) -> Vec<DepartmentTreeNode> {
        let departments = self.departments.read().unwrap();
        let employees = self.employees.read().unwrap();

        // 找出所有根部门
        let roots: Vec<_> = departments
            .values()
            .filter(|d| d.parent_id.is_none())
            .collect();

        roots.iter()
            .map(|root| self.build_tree_node(root, &departments, &employees))
            .collect()
    }

    fn build_tree_node(
        &self,
        dept: &HrDepartment,
        departments: &HashMap<String, HrDepartment>,
        employees: &HashMap<String, Employee>,
    ) -> DepartmentTreeNode {
        let employee_count = employees
            .values()
            .filter(|e| e.department_id == dept.id)
            .count();

        let children: Vec<DepartmentTreeNode> = departments
            .values()
            .filter(|d| d.parent_id.as_ref() == Some(&dept.id))
            .map(|child| self.build_tree_node(child, departments, employees))
            .collect();

        DepartmentTreeNode {
            department: dept.clone(),
            employee_count,
            children,
        }
    }

    /// 获取部门详情
    pub fn get_department(&self, id: &str) -> Option<HrDepartment> {
        self.departments.read().unwrap().get(id).cloned()
    }

    /// 更新部门
    pub fn update_department(
        &self,
        id: &str,
        req: UpdateDepartmentRequest,
    ) -> Result<HrDepartment, String> {
        let mut departments = self.departments.write().unwrap();
        let department = departments
            .get_mut(id)
            .ok_or_else(|| "部门不存在".to_string())?;

        if let Some(name) = req.name {
            department.name = name;
        }
        if let Some(parent_id) = req.parent_id {
            department.parent_id = Some(parent_id);
        }
        if let Some(manager_id) = req.manager_id {
            department.manager_id = Some(manager_id);
        }
        if let Some(sort_order) = req.sort_order {
            department.sort_order = sort_order;
        }
        department.updated_at = chrono::Utc::now().timestamp();

        Ok(department.clone())
    }

    /// 删除部门
    pub fn delete_department(&self, id: &str) -> Result<(), String> {
        let departments = self.departments.read().unwrap();

        // 检查是否有子部门
        let has_children = departments.values().any(|d| d.parent_id.as_ref() == Some(&id.to_string()));
        if has_children {
            return Err("无法删除：存在子部门".to_string());
        }

        // 检查是否有员工
        drop(departments);
        let employees = self.employees.read().unwrap();
        let has_employees = employees.values().any(|e| e.department_id == id);
        if has_employees {
            return Err("无法删除：部门存在员工".to_string());
        }

        let mut departments = self.departments.write().unwrap();
        let department = departments.remove(id).ok_or_else(|| "部门不存在".to_string())?;

        self.department_code_index
            .write()
            .unwrap()
            .remove(&department.code);

        Ok(())
    }

    // ==================== 岗位操作 ====================

    /// 创建岗位
    pub fn create_position(&self, req: CreatePositionRequest) -> Result<Position, String> {
        // 检查代码唯一性
        {
            let index = self.position_code_index.read().unwrap();
            if index.contains_key(&req.code) {
                return Err(format!("岗位代码 '{}' 已存在", req.code));
            }
        }

        let now = chrono::Utc::now().timestamp();
        let position = Position {
            id: uuid::Uuid::new_v4().to_string(),
            code: req.code,
            name: req.name,
            level: req.level.unwrap_or(1),
            department_id: req.department_id,
            permissions: req.permissions.unwrap_or_default(),
            created_at: now,
            updated_at: now,
        };

        let code = position.code.clone();
        let id = position.id.clone();

        self.positions.write().unwrap().insert(id.clone(), position.clone());
        self.position_code_index
            .write()
            .unwrap()
            .insert(code, id);

        Ok(position)
    }

    /// 获取岗位列表
    pub fn list_positions(&self) -> Vec<PositionListItem> {
        let positions = self.positions.read().unwrap();
        let departments = self.departments.read().unwrap();
        let employees = self.employees.read().unwrap();

        positions
            .values()
            .map(|pos| {
                let dept_name = pos.department_id.as_ref().and_then(|did| departments.get(did)).map(|d| d.name.clone());
                let employee_count = employees.values().filter(|e| e.position_id == pos.id).count();

                PositionListItem {
                    id: pos.id.clone(),
                    code: pos.code.clone(),
                    name: pos.name.clone(),
                    level: pos.level,
                    department_name: dept_name,
                    employee_count,
                }
            })
            .collect()
    }

    /// 获取岗位详情
    pub fn get_position(&self, id: &str) -> Option<Position> {
        self.positions.read().unwrap().get(id).cloned()
    }

    /// 更新岗位
    pub fn update_position(&self, id: &str, req: UpdatePositionRequest) -> Result<Position, String> {
        let mut positions = self.positions.write().unwrap();
        let position = positions
            .get_mut(id)
            .ok_or_else(|| "岗位不存在".to_string())?;

        if let Some(name) = req.name {
            position.name = name;
        }
        if let Some(level) = req.level {
            position.level = level;
        }
        if let Some(department_id) = req.department_id {
            position.department_id = Some(department_id);
        }
        if let Some(permissions) = req.permissions {
            position.permissions = permissions;
        }
        position.updated_at = chrono::Utc::now().timestamp();

        Ok(position.clone())
    }

    /// 删除岗位
    pub fn delete_position(&self, id: &str) -> Result<(), String> {
        let employees = self.employees.read().unwrap();
        let has_employees = employees.values().any(|e| e.position_id == id);
        if has_employees {
            return Err("无法删除：岗位存在员工".to_string());
        }

        let mut positions = self.positions.write().unwrap();
        let position = positions.remove(id).ok_or_else(|| "岗位不存在".to_string())?;

        self.position_code_index
            .write()
            .unwrap()
            .remove(&position.code);

        Ok(())
    }
}

impl Default for HrDatabase {
    fn default() -> Self {
        Self::new()
    }
}
