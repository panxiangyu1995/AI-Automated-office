//! Service 模块数据库操作

use crate::service::types::*;
use std::collections::{HashMap, VecDeque};
use std::sync::RwLock;
use tracing::info;

/// Service 数据库状态
pub struct ServiceDatabase {
    /// 工单存储
    tickets: RwLock<HashMap<String, ServiceTicket>>,
    /// 服务人员存储
    personnel: RwLock<HashMap<String, ServicePersonnel>>,
    /// 工单 ID 索引
    ticket_id_index: RwLock<HashMap<String, String>>,
    /// 服务人员用户 ID 索引
    personnel_user_id_index: RwLock<HashMap<String, String>>,
    /// 租户工单索引
    tenant_ticket_index: RwLock<HashMap<String, VecDeque<String>>>,
    /// 租户人员索引
    tenant_personnel_index: RwLock<HashMap<String, VecDeque<String>>>,
}

impl ServiceDatabase {
    /// 创建新的数据库实例
    pub fn new() -> Self {
        info!("初始化 Service 数据库");
        Self {
            tickets: RwLock::new(HashMap::new()),
            personnel: RwLock::new(HashMap::new()),
            ticket_id_index: RwLock::new(HashMap::new()),
            personnel_user_id_index: RwLock::new(HashMap::new()),
            tenant_ticket_index: RwLock::new(HashMap::new()),
            tenant_personnel_index: RwLock::new(HashMap::new()),
        }
    }

    /// 初始化默认数据
    pub fn init_defaults(&self) {
        info!("Service 数据库初始化完成");
    }

    // ==================== 工单操作 ====================

    /// 创建工单
    pub fn create_ticket(&self, ticket: ServiceTicket) -> Result<ServiceTicket, ServiceError> {
        let mut tickets = self.tickets.write().map_err(|_| {
            ServiceError::database_error("获取写入锁失败")
        })?;

        let id = ticket.id.clone();
        tickets.insert(id.clone(), ticket.clone());

        // 更新索引
        if let Ok(mut index) = self.ticket_id_index.write() {
            let _ = index.insert(id.clone(), id);
        }

        // 更新租户索引
        if let Ok(mut tenant_index) = self.tenant_ticket_index.write() {
            let queue = tenant_index.entry(ticket.tenant_id.clone()).or_insert_with(VecDeque::new);
            queue.push_back(ticket.id.clone());
        }

        info!("创建工单成功: {}", ticket.id);
        Ok(ticket)
    }

    /// 获取工单
    pub fn get_ticket(&self, id: &str) -> Option<ServiceTicket> {
        self.tickets.read().ok()?.get(id).cloned()
    }

    /// 查询工单列表
    pub fn list_tickets(&self, params: &QueryTicketsParams) -> PagedResult<TicketListItem> {
        let tickets = self.tickets.read().unwrap_or_else(|e| e.into_inner());

        let mut items: Vec<TicketListItem> = tickets
            .values()
            .filter(|ticket| {
                // 状态过滤
                if let Some(ref statuses) = params.status {
                    if !statuses.contains(&ticket.status) {
                        return false;
                    }
                }
                // 类型过滤
                if let Some(ref types) = params.ticket_type {
                    if !types.contains(&ticket.ticket_type) {
                        return false;
                    }
                }
                // 优先级过滤
                if let Some(ref priorities) = params.priority {
                    if !priorities.contains(&ticket.priority) {
                        return false;
                    }
                }
                // 分配人过滤
                if let Some(ref assigned_to) = params.assigned_to {
                    if ticket.assigned_to.as_ref() != Some(assigned_to) {
                        return false;
                    }
                }
                // 搜索过滤
                if let Some(ref search) = params.search {
                    let search_lower = search.to_lowercase();
                    if !ticket.title.to_lowercase().contains(&search_lower)
                        && !ticket.customer_name.to_lowercase().contains(&search_lower)
                    {
                        return false;
                    }
                }
                true
            })
            .map(|ticket| TicketListItem {
                id: ticket.id.clone(),
                title: ticket.title.clone(),
                ticket_type: ticket.ticket_type,
                status: ticket.status,
                priority: ticket.priority,
                customer_name: ticket.customer_name.clone(),
                assigned_name: ticket.assigned_name.clone(),
                created_at: ticket.created_at,
                updated_at: ticket.updated_at,
            })
            .collect();

        // 排序
        let sort_by = params.sort_by.as_deref().unwrap_or("created_at");
        let sort_order = params.sort_order.as_deref().unwrap_or("desc");
        let ascending = sort_order == "asc";

        items.sort_by(|a, b| {
            let cmp = match sort_by {
                "created_at" => a.created_at.cmp(&b.created_at),
                "updated_at" => a.updated_at.cmp(&b.updated_at),
                "priority" => {
                    let priority_order = |p: &TicketPriority| match p {
                        TicketPriority::Urgent => 0,
                        TicketPriority::High => 1,
                        TicketPriority::Medium => 2,
                        TicketPriority::Low => 3,
                    };
                    priority_order(&a.priority).cmp(&priority_order(&b.priority))
                }
                _ => a.created_at.cmp(&b.created_at),
            };
            if ascending { cmp } else { cmp.reverse() }
        });

        // 分页
        let page = params.page.unwrap_or(1).max(1);
        let page_size = params.page_size.unwrap_or(20).min(100);
        let total = items.len() as u32;
        let start = ((page - 1) * page_size) as usize;
        let end = (start + page_size as usize).min(items.len());

        let page_items = if start < items.len() {
            items[start..end].to_vec()
        } else {
            Vec::new()
        };

        PagedResult {
            items: page_items,
            total,
            page,
            page_size,
        }
    }

    /// 更新工单
    pub fn update_ticket(
        &self,
        id: &str,
        request: UpdateTicketRequest,
    ) -> Result<ServiceTicket, ServiceError> {
        let mut tickets = self.tickets.write().map_err(|_| {
            ServiceError::database_error("获取写入锁失败")
        })?;

        let ticket = tickets.get_mut(id).ok_or_else(ServiceError::ticket_not_found)?;

        if let Some(title) = request.title {
            ticket.title = title;
        }
        if let Some(description) = request.description {
            ticket.description = Some(description);
        }
        if let Some(priority) = request.priority {
            ticket.priority = priority;
        }
        if let Some(contact) = request.customer_contact {
            ticket.customer_contact = Some(contact);
        }
        if let Some(email) = request.customer_email {
            ticket.customer_email = Some(email);
        }
        ticket.updated_at = chrono::Utc::now().timestamp();

        info!("更新工单成功: {}", id);
        Ok(ticket.clone())
    }

    /// 更新工单状态
    pub fn update_ticket_status(
        &self,
        id: &str,
        new_status: TicketStatus,
    ) -> Result<ServiceTicket, ServiceError> {
        let mut tickets = self.tickets.write().map_err(|_| {
            ServiceError::database_error("获取写入锁失败")
        })?;

        let ticket = tickets.get_mut(id).ok_or_else(ServiceError::ticket_not_found)?;

        if !ticket.update_status(new_status) {
            return Err(ServiceError::invalid_status_transition());
        }

        info!("更新工单状态成功: {} -> {:?}", id, new_status);
        Ok(ticket.clone())
    }

    /// 分配工单
    pub fn assign_ticket(
        &self,
        id: &str,
        assigned_to: String,
        assigned_name: String,
    ) -> Result<ServiceTicket, ServiceError> {
        let mut tickets = self.tickets.write().map_err(|_| {
            ServiceError::database_error("获取写入锁失败")
        })?;

        let ticket = tickets.get_mut(id).ok_or_else(ServiceError::ticket_not_found)?;

        ticket.assign(assigned_to, assigned_name);

        info!("分配工单成功: {}", id);
        Ok(ticket.clone())
    }

    /// 删除工单
    pub fn delete_ticket(&self, id: &str) -> Result<(), ServiceError> {
        let mut tickets = self.tickets.write().map_err(|_| {
            ServiceError::database_error("获取写入锁失败")
        })?;

        if tickets.remove(id).is_none() {
            return Err(ServiceError::ticket_not_found());
        }

        // 更新索引
        if let Ok(mut index) = self.ticket_id_index.write() {
            let _ = index.remove(id);
        }

        info!("删除工单成功: {}", id);
        Ok(())
    }

    // ==================== 服务人员操作 ====================

    /// 创建服务人员
    pub fn create_personnel(&self, personnel: ServicePersonnel) -> Result<ServicePersonnel, ServiceError> {
        let mut personnel_store = self.personnel.write().map_err(|_| {
            ServiceError::database_error("获取写入锁失败")
        })?;

        let id = personnel.id.clone();
        personnel_store.insert(id.clone(), personnel.clone());

        // 更新索引
        if let Ok(mut index) = self.personnel_user_id_index.write() {
            let _ = index.insert(personnel.user_id.clone(), id);
        }

        // 更新租户索引
        if let Ok(mut tenant_index) = self.tenant_personnel_index.write() {
            let queue = tenant_index.entry(personnel.tenant_id.clone()).or_insert_with(VecDeque::new);
            queue.push_back(personnel.id.clone());
        }

        info!("创建服务人员成功: {}", personnel.id);
        Ok(personnel)
    }

    /// 获取服务人员
    pub fn get_personnel(&self, id: &str) -> Option<ServicePersonnel> {
        self.personnel.read().ok()?.get(id).cloned()
    }

    /// 获取服务人员（通过用户ID）
    pub fn get_personnel_by_user_id(&self, user_id: &str) -> Option<ServicePersonnel> {
        let index = self.personnel_user_id_index.read().ok()?;
        let id = index.get(user_id)?;
        self.personnel.read().ok()?.get(id).cloned()
    }

    /// 查询服务人员列表
    pub fn list_personnel(&self, params: &QueryPersonnelParams) -> PagedResult<PersonnelListItem> {
        let personnel = self.personnel.read().unwrap_or_else(|e| e.into_inner());

        let mut items: Vec<PersonnelListItem> = personnel
            .values()
            .filter(|p| {
                // 状态过滤
                if let Some(ref status) = params.status {
                    if &p.status != status {
                        return false;
                    }
                }
                // 部门过滤
                if let Some(ref dept) = params.department {
                    if p.department.as_ref() != Some(dept) {
                        return false;
                    }
                }
                true
            })
            .map(|p| PersonnelListItem {
                id: p.id.clone(),
                user_name: p.user_name.clone(),
                department: p.department.clone(),
                status: p.status,
                current_ticket_count: p.current_ticket_count,
                max_ticket_count: p.max_ticket_count,
            })
            .collect();

        // 排序
        items.sort_by(|a, b| a.user_name.cmp(&b.user_name));

        // 分页
        let page = params.page.unwrap_or(1).max(1);
        let page_size = params.page_size.unwrap_or(20).min(100);
        let total = items.len() as u32;
        let start = ((page - 1) * page_size) as usize;
        let end = (start + page_size as usize).min(items.len());

        let page_items = if start < items.len() {
            items[start..end].to_vec()
        } else {
            Vec::new()
        };

        PagedResult {
            items: page_items,
            total,
            page,
            page_size,
        }
    }

    /// 更新服务人员
    pub fn update_personnel(
        &self,
        id: &str,
        request: UpdatePersonnelRequest,
    ) -> Result<ServicePersonnel, ServiceError> {
        let mut personnel_store = self.personnel.write().map_err(|_| {
            ServiceError::database_error("获取写入锁失败")
        })?;

        let personnel = personnel_store.get_mut(id).ok_or_else(ServiceError::personnel_not_found)?;

        if let Some(department) = request.department {
            personnel.department = Some(department);
        }
        if let Some(specializations) = request.specializations {
            personnel.specializations = specializations;
        }
        if let Some(max_ticket_count) = request.max_ticket_count {
            personnel.max_ticket_count = max_ticket_count;
        }
        personnel.updated_at = chrono::Utc::now().timestamp();

        info!("更新服务人员成功: {}", id);
        Ok(personnel.clone())
    }

    /// 更新服务人员状态
    pub fn update_personnel_status(
        &self,
        id: &str,
        status: PersonnelStatus,
    ) -> Result<ServicePersonnel, ServiceError> {
        let mut personnel_store = self.personnel.write().map_err(|_| {
            ServiceError::database_error("获取写入锁失败")
        })?;

        let personnel = personnel_store.get_mut(id).ok_or_else(ServiceError::personnel_not_found)?;
        personnel.update_status(status);

        info!("更新服务人员状态成功: {} -> {:?}", id, status);
        Ok(personnel.clone())
    }

    /// 增加服务人员工单数
    pub fn increment_ticket_count(&self, id: &str) -> Result<(), ServiceError> {
        let mut personnel_store = self.personnel.write().map_err(|_| {
            ServiceError::database_error("获取写入锁失败")
        })?;

        let personnel = personnel_store.get_mut(id).ok_or_else(ServiceError::personnel_not_found)?;
        personnel.add_ticket();

        Ok(())
    }

    /// 减少服务人员工单数
    pub fn decrement_ticket_count(&self, id: &str) -> Result<(), ServiceError> {
        let mut personnel_store = self.personnel.write().map_err(|_| {
            ServiceError::database_error("获取写入锁失败")
        })?;

        let personnel = personnel_store.get_mut(id).ok_or_else(ServiceError::personnel_not_found)?;
        personnel.remove_ticket();

        Ok(())
    }

    /// 删除服务人员
    pub fn delete_personnel(&self, id: &str) -> Result<(), ServiceError> {
        let mut personnel_store = self.personnel.write().map_err(|_| {
            ServiceError::database_error("获取写入锁失败")
        })?;

        if let Some(personnel) = personnel_store.remove(id) {
            // 更新索引
            if let Ok(mut index) = self.personnel_user_id_index.write() {
                let _ = index.remove(&personnel.user_id);
            }
        }

        info!("删除服务人员成功: {}", id);
        Ok(())
    }
}

impl Default for ServiceDatabase {
    fn default() -> Self {
        Self::new()
    }
}
