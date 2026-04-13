//! Tender 模块数据库操作

use crate::tender::types::*;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tracing::info;

/// Tender 数据库状态
pub struct TenderDatabase {
    /// 资质存储
    qualifications: RwLock<HashMap<String, Qualification>>,
    /// 业绩存储
    cases: RwLock<HashMap<String, Case>>,
    /// 资质 ID 索引
    qualification_id_index: RwLock<HashMap<String, String>>,
    /// 业绩 ID 索引
    case_id_index: RwLock<HashMap<String, String>>,
}

impl TenderDatabase {
    /// 创建新的数据库实例
    pub fn new() -> Self {
        info!("初始化 Tender 数据库");
        Self {
            qualifications: RwLock::new(HashMap::new()),
            cases: RwLock::new(HashMap::new()),
            qualification_id_index: RwLock::new(HashMap::new()),
            case_id_index: RwLock::new(HashMap::new()),
        }
    }

    /// 初始化默认数据
    pub fn init_defaults(&self) {
        info!("Tender 数据库初始化完成");
    }

    // ==================== 资质操作 ====================

    /// 创建资质
    pub fn create_qualification(&self, qualification: Qualification) -> Result<Qualification, String> {
        let mut qualifications = self.qualifications.write().map_err(|_| "获取写入锁失败".to_string())?;
        let id = qualification.id.clone();
        qualifications.insert(id.clone(), qualification.clone());
        
        if let Ok(mut index) = self.qualification_id_index.write() {
            let _ = index.insert(id.clone(), id);
        }
        
        info!("创建资质成功: {}", qualification.name);
        Ok(qualification)
    }

    /// 获取资质
    pub fn get_qualification(&self, id: &str) -> Option<Qualification> {
        self.qualifications.read().ok()?.get(id).cloned()
    }

    /// 查询资质列表
    pub fn list_qualifications(&self, params: &QueryQualificationsParams) -> PagedResult<QualificationListItem> {
        let qualifications = self.qualifications.read().unwrap_or_else(|e| e.into_inner());

        let mut items: Vec<QualificationListItem> = qualifications
            .values()
            .filter(|q| {
                if let Some(ref qtype) = params.qualification_type {
                    if &q.qualification_type != qtype {
                        return false;
                    }
                }
                if let Some(ref status) = params.status {
                    if &q.status != status {
                        return false;
                    }
                }
                if let Some(ref search) = params.search {
                    let search_lower = search.to_lowercase();
                    if !q.name.to_lowercase().contains(&search_lower)
                        && !q.cert_number.as_ref().map(|s| s.to_lowercase().contains(&search_lower)).unwrap_or(false)
                    {
                        return false;
                    }
                }
                true
            })
            .map(|q| QualificationListItem {
                id: q.id.clone(),
                name: q.name.clone(),
                qualification_type: q.qualification_type,
                cert_number: q.cert_number.clone(),
                expiry_date: q.expiry_date.clone(),
                status: q.status,
            })
            .collect();

        items.sort_by(|a, b| a.expiry_date.cmp(&b.expiry_date));

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

    /// 更新资质
    pub fn update_qualification(&self, id: &str, request: UpdateQualificationRequest) -> Result<Qualification, String> {
        let mut qualifications = self.qualifications.write().map_err(|_| "获取写入锁失败".to_string())?;
        
        let qualification = qualifications.get_mut(id).ok_or("资质不存在")?;
        
        if let Some(name) = request.name {
            qualification.name = name;
        }
        if let Some(cert_number) = request.cert_number {
            qualification.cert_number = Some(cert_number);
        }
        if let Some(issue_date) = request.issue_date {
            qualification.issue_date = issue_date;
        }
        if let Some(expiry_date) = request.expiry_date {
            qualification.expiry_date = expiry_date;
        }
        if let Some(reminder_enabled) = request.reminder_enabled {
            qualification.reminder_enabled = reminder_enabled;
        }
        if let Some(reminder_days) = request.reminder_days {
            qualification.reminder_days = reminder_days;
        }
        if let Some(notes) = request.notes {
            qualification.notes = Some(notes);
        }
        qualification.updated_at = chrono::Utc::now().timestamp();
        
        info!("更新资质成功: {}", id);
        Ok(qualification.clone())
    }

    /// 删除资质
    pub fn delete_qualification(&self, id: &str) -> Result<(), String> {
        let mut qualifications = self.qualifications.write().map_err(|_| "获取写入锁失败".to_string())?;
        
        if qualifications.remove(id).is_none() {
            return Err("资质不存在".to_string());
        }
        
        if let Ok(mut index) = self.qualification_id_index.write() {
            let _ = index.remove(id);
        }
        
        info!("删除资质成功: {}", id);
        Ok(())
    }

    // ==================== 业绩操作 ====================

    /// 创建业绩
    pub fn create_case(&self, case_data: Case) -> Result<Case, String> {
        let mut cases = self.cases.write().map_err(|_| "获取写入锁失败".to_string())?;
        let id = case_data.id.clone();
        cases.insert(id.clone(), case_data.clone());
        
        if let Ok(mut index) = self.case_id_index.write() {
            let _ = index.insert(id.clone(), id);
        }
        
        info!("创建业绩成功: {}", case_data.project_name);
        Ok(case_data)
    }

    /// 获取业绩
    pub fn get_case(&self, id: &str) -> Option<Case> {
        self.cases.read().ok()?.get(id).cloned()
    }

    /// 查询业绩列表
    pub fn list_cases(&self, params: &QueryCasesParams) -> PagedResult<CaseListItem> {
        let cases = self.cases.read().unwrap_or_else(|e| e.into_inner());

        let mut items: Vec<CaseListItem> = cases
            .values()
            .filter(|c| {
                if let Some(ref status) = params.status {
                    if &c.status != status {
                        return false;
                    }
                }
                if let Some(ref search) = params.search {
                    let search_lower = search.to_lowercase();
                    if !c.project_name.to_lowercase().contains(&search_lower)
                        && !c.customer_name.to_lowercase().contains(&search_lower)
                    {
                        return false;
                    }
                }
                true
            })
            .map(|c| CaseListItem {
                id: c.id.clone(),
                project_name: c.project_name.clone(),
                customer_name: c.customer_name.clone(),
                contract_amount: c.contract_amount,
                start_date: c.start_date.clone(),
                end_date: c.end_date.clone(),
                status: c.status,
            })
            .collect();

        items.sort_by(|a, b| b.start_date.cmp(&a.start_date));

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

    /// 更新业绩
    pub fn update_case(&self, id: &str, request: UpdateCaseRequest) -> Result<Case, String> {
        let mut cases = self.cases.write().map_err(|_| "获取写入锁失败".to_string())?;
        
        let case_data = cases.get_mut(id).ok_or("业绩不存在")?;
        
        if let Some(project_name) = request.project_name {
            case_data.project_name = project_name;
        }
        if let Some(customer_name) = request.customer_name {
            case_data.customer_name = customer_name;
        }
        if let Some(contract_amount) = request.contract_amount {
            case_data.contract_amount = contract_amount;
        }
        if let Some(actual_amount) = request.actual_amount {
            case_data.actual_amount = Some(actual_amount);
        }
        if let Some(end_date) = request.end_date {
            case_data.end_date = Some(end_date);
        }
        if let Some(status) = request.status {
            case_data.status = status;
        }
        if let Some(description) = request.description {
            case_data.description = Some(description);
        }
        case_data.updated_at = chrono::Utc::now().timestamp();
        
        info!("更新业绩成功: {}", id);
        Ok(case_data.clone())
    }

    /// 删除业绩
    pub fn delete_case(&self, id: &str) -> Result<(), String> {
        let mut cases = self.cases.write().map_err(|_| "获取写入锁失败".to_string())?;
        
        if cases.remove(id).is_none() {
            return Err("业绩不存在".to_string());
        }
        
        if let Ok(mut index) = self.case_id_index.write() {
            let _ = index.remove(id);
        }
        
        info!("删除业绩成功: {}", id);
        Ok(())
    }
}

impl Default for TenderDatabase {
    fn default() -> Self {
        Self::new()
    }
}
