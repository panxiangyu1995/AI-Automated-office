//! Approval 模块内存数据库

use crate::approval::types::*;
use std::collections::HashMap;
use tracing::info;

pub struct ApprovalDatabase {
    flows: std::sync::RwLock<HashMap<String, ApprovalFlow>>,
    records: std::sync::RwLock<HashMap<String, ApprovalRecord>>,
}

impl ApprovalDatabase {
    pub fn new() -> Self {
        info!("初始化审批内存数据库");
        Self {
            flows: std::sync::RwLock::new(HashMap::new()),
            records: std::sync::RwLock::new(HashMap::new()),
        }
    }

    pub fn init_defaults(&self) {
        // 创建示例审批流程
        let leave_flow = ApprovalFlow {
            id: "flow-001".to_string(),
            name: "请假申请".to_string(),
            description: "员工请假审批流程".to_string(),
            steps: vec![
                ApprovalStep {
                    id: "step-001".to_string(),
                    order: 1,
                    approvers: vec![
                        Approver { id: "emp-001".to_string(), name: "张三".to_string(), employee_id: "E001".to_string() }
                    ],
                    step_type: StepType::Sequential,
                    condition: None,
                }
            ],
            form_schema: HashMap::from([
                ("type".to_string(), serde_json::json!({"type": "select", "label": "请假类型", "options": ["事假", "病假", "年假"]})),
                ("days".to_string(), serde_json::json!({"type": "number", "label": "请假天数"})),
                ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "请假原因"})),
            ]),
            status: FlowStatus::Active,
            created_by: "system".to_string(),
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        };

        self.flows.write().unwrap().insert("flow-001".to_string(), leave_flow);

        // 创建示例待审批记录
        let record = ApprovalRecord {
            id: "record-001".to_string(),
            flow_id: "flow-001".to_string(),
            flow_name: "请假申请".to_string(),
            applicant_id: "emp-002".to_string(),
            applicant_name: "李四".to_string(),
            status: RecordStatus::Pending,
            current_step: 1,
            form_data: HashMap::from([
                ("type".to_string(), serde_json::json!("年假")),
                ("days".to_string(), serde_json::json!(3)),
                ("reason".to_string(), serde_json::json!("回家探亲")),
            ]),
            history: Vec::new(),
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
        };

        self.records.write().unwrap().insert("record-001".to_string(), record);
        info!("审批默认数据初始化完成");
    }

    // ==================== 流程操作 ====================

    pub fn create_flow(&self, req: CreateFlowRequest, created_by: String) -> Result<ApprovalFlow, String> {
        let now = chrono::Utc::now().timestamp();
        let flow = ApprovalFlow {
            id: uuid::Uuid::new_v4().to_string(),
            name: req.name,
            description: req.description,
            steps: req.steps,
            form_schema: req.form_schema,
            status: FlowStatus::Draft,
            created_by,
            created_at: now,
            updated_at: now,
        };
        self.flows.write().unwrap().insert(flow.id.clone(), flow.clone());
        Ok(flow)
    }

    pub fn list_flows(&self) -> Vec<FlowListItem> {
        self.flows.read().unwrap()
            .values()
            .map(|f| FlowListItem {
                id: f.id.clone(),
                name: f.name.clone(),
                description: f.description.clone(),
                status: f.status,
                step_count: f.steps.len(),
                created_by: f.created_by.clone(),
                created_at: f.created_at,
            })
            .collect()
    }

    pub fn get_flow(&self, id: &str) -> Option<ApprovalFlow> {
        self.flows.read().unwrap().get(id).cloned()
    }

    pub fn update_flow(&self, id: &str, req: UpdateFlowRequest) -> Result<ApprovalFlow, String> {
        let mut flows = self.flows.write().unwrap();
        let flow = flows.get_mut(id).ok_or("流程不存在")?;
        if let Some(name) = req.name { flow.name = name; }
        if let Some(desc) = req.description { flow.description = desc; }
        if let Some(steps) = req.steps { flow.steps = steps; }
        if let Some(schema) = req.form_schema { flow.form_schema = schema; }
        if let Some(status) = req.status { flow.status = status; }
        flow.updated_at = chrono::Utc::now().timestamp();
        Ok(flow.clone())
    }

    pub fn delete_flow(&self, id: &str) -> Result<(), String> {
        let mut flows = self.flows.write().unwrap();
        flows.remove(id).ok_or("流程不存在")?;
        Ok(())
    }

    // ==================== 记录操作 ====================

    pub fn create_record(&self, req: CreateRecordRequest) -> Result<ApprovalRecord, String> {
        let flow = self.flows.read().unwrap().get(&req.flow_id).cloned()
            .ok_or("流程不存在")?;
        
        let now = chrono::Utc::now().timestamp();
        let record = ApprovalRecord {
            id: uuid::Uuid::new_v4().to_string(),
            flow_id: req.flow_id,
            flow_name: flow.name,
            applicant_id: req.applicant_id,
            applicant_name: req.applicant_name,
            status: RecordStatus::Pending,
            current_step: 1,
            form_data: req.form_data,
            history: Vec::new(),
            created_at: now,
            updated_at: now,
        };
        self.records.write().unwrap().insert(record.id.clone(), record.clone());
        Ok(record)
    }

    pub fn list_records(&self, status: Option<RecordStatus>) -> Vec<RecordListItem> {
        self.records.read().unwrap()
            .values()
            .filter(|r| status.map(|s| r.status == s).unwrap_or(true))
            .map(|r| RecordListItem {
                id: r.id.clone(),
                flow_name: r.flow_name.clone(),
                applicant_name: r.applicant_name.clone(),
                status: r.status,
                current_step: r.current_step,
                created_at: r.created_at,
            })
            .collect()
    }

    pub fn get_record(&self, id: &str) -> Option<ApprovalRecord> {
        self.records.read().unwrap().get(id).cloned()
    }

    pub fn approve_record(&self, id: &str, req: ApproveRequest) -> Result<ApprovalRecord, String> {
        let mut records = self.records.write().unwrap();
        let record = records.get_mut(id).ok_or("记录不存在")?;
        
        if record.status != RecordStatus::Pending {
            return Err("只能审批待处理记录".to_string());
        }

        let flow = self.flows.read().unwrap().get(&record.flow_id).cloned()
            .ok_or("流程不存在")?;

        let history = ApprovalHistory {
            id: uuid::Uuid::new_v4().to_string(),
            step_id: format!("step-{}", record.current_step),
            approver_id: req.approver_id,
            approver_name: req.approver_name,
            action: "approved".to_string(),
            comment: req.comment,
            timestamp: chrono::Utc::now().timestamp_millis(),
        };
        record.history.push(history);

        // 检查是否完成所有步骤
        if (record.current_step as usize) >= flow.steps.len() {
            record.status = RecordStatus::Approved;
        } else {
            record.current_step += 1;
        }
        record.updated_at = chrono::Utc::now().timestamp();
        Ok(record.clone())
    }

    pub fn reject_record(&self, id: &str, req: ApproveRequest) -> Result<ApprovalRecord, String> {
        let mut records = self.records.write().unwrap();
        let record = records.get_mut(id).ok_or("记录不存在")?;
        
        if record.status != RecordStatus::Pending {
            return Err("只能驳回待处理记录".to_string());
        }

        let history = ApprovalHistory {
            id: uuid::Uuid::new_v4().to_string(),
            step_id: format!("step-{}", record.current_step),
            approver_id: req.approver_id,
            approver_name: req.approver_name,
            action: "rejected".to_string(),
            comment: req.comment,
            timestamp: chrono::Utc::now().timestamp_millis(),
        };
        record.history.push(history);
        record.status = RecordStatus::Rejected;
        record.updated_at = chrono::Utc::now().timestamp();
        Ok(record.clone())
    }

    pub fn cancel_record(&self, id: &str) -> Result<ApprovalRecord, String> {
        let mut records = self.records.write().unwrap();
        let record = records.get_mut(id).ok_or("记录不存在")?;
        record.status = RecordStatus::Cancelled;
        record.updated_at = chrono::Utc::now().timestamp();
        Ok(record.clone())
    }

    pub fn get_stats(&self) -> ApprovalStats {
        let records = self.records.read().unwrap();
        let pending = records.values().filter(|r| r.status == RecordStatus::Pending).count() as i64;
        let approved = records.values().filter(|r| r.status == RecordStatus::Approved).count() as i64;
        let rejected = records.values().filter(|r| r.status == RecordStatus::Rejected).count() as i64;
        ApprovalStats {
            pending,
            approved,
            rejected,
            total: records.len() as i64,
        }
    }
}

impl Default for ApprovalDatabase {
    fn default() -> Self {
        Self::new()
    }
}
