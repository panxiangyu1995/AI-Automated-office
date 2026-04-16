//! Approval template builtin definitions
//!
//! Contains 20+ preset templates for common approval scenarios.

use super::template::{ApprovalTemplate, TemplateCategory};
use std::collections::HashMap;

/// Get 20+ builtin templates
pub fn get_builtin_templates() -> Vec<ApprovalTemplate> {
    let mut templates = Vec::new();

    // === Leave Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-leave-annual",
        "年假申请",
        "员工申请年假",
        TemplateCategory::Leave,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "EMP001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "请假原因", "required": true})),
        ]),
        vec!["请假", "年假", "假期"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-leave-sick",
        "病假申请",
        "员工申请病假",
        TemplateCategory::Leave,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "hr-001".to_string(), name: "HR".to_string(), employee_id: "HR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("diagnosis".to_string(), serde_json::json!({"type": "textarea", "label": "病情说明", "required": false})),
            ("attachment".to_string(), serde_json::json!({"type": "file", "label": "证明材料", "required": false})),
        ]),
        vec!["病假", "生病", "医疗"],
    ));

    // === Expense Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-expense-general",
        "一般报销",
        "员工提交日常费用报销",
        TemplateCategory::Expense,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "fin-001".to_string(), name: "财务".to_string(), employee_id: "FIN001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("amount".to_string(), serde_json::json!({"type": "number", "label": "报销金额", "required": true})),
            ("category".to_string(), serde_json::json!({"type": "select", "label": "费用类别", "options": ["交通", "餐饮", "办公", "通讯", "其他"], "required": true})),
            ("date".to_string(), serde_json::json!({"type": "date", "label": "发生日期", "required": true})),
            ("description".to_string(), serde_json::json!({"type": "textarea", "label": "费用说明", "required": true})),
            ("receipts".to_string(), serde_json::json!({"type": "file", "label": "发票收据", "required": true, "multiple": true})),
        ]),
        vec!["报销", "费用", "发票"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-expense-travel",
        "差旅报销",
        "员工提交出差费用报销",
        TemplateCategory::Expense,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "fin-001".to_string(), name: "财务".to_string(), employee_id: "FIN001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("travel_date".to_string(), serde_json::json!({"type": "date", "label": "出差日期", "required": true})),
            ("destination".to_string(), serde_json::json!({"type": "text", "label": "目的地", "required": true})),
            ("transportation".to_string(), serde_json::json!({"type": "select", "label": "交通方式", "options": ["飞机", "火车", "汽车", "其他"], "required": true})),
            ("accommodation".to_string(), serde_json::json!({"type": "number", "label": "住宿费", "required": true})),
            ("meals".to_string(), serde_json::json!({"type": "number", "label": "餐饮费", "required": true})),
            ("other".to_string(), serde_json::json!({"type": "number", "label": "其他费用", "required": false})),
            ("total".to_string(), serde_json::json!({"type": "number", "label": "总计", "required": true})),
        ]),
        vec!["差旅", "报销", "出差"],
    ));

    // === Purchase Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-purchase-office",
        "办公用品采购",
        "申请采购办公用品",
        TemplateCategory::Purchase,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "admin-001".to_string(), name: "行政".to_string(), employee_id: "ADM001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: Some(super::types::ApprovalCondition {
                    field: "amount".to_string(),
                    operator: "lte".to_string(),
                    value: serde_json::json!(1000),
                }),
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: Some(super::types::ApprovalCondition {
                    field: "amount".to_string(),
                    operator: "gt".to_string(),
                    value: serde_json::json!(1000),
                }),
            },
        ],
        HashMap::from([
            ("items".to_string(), serde_json::json!({"type": "textarea", "label": "采购物品清单", "required": true})),
            ("amount".to_string(), serde_json::json!({"type": "number", "label": "预算金额", "required": true})),
            ("supplier".to_string(), serde_json::json!({"type": "text", "label": "供应商", "required": false})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "采购原因", "required": true})),
        ]),
        vec!["采购", "办公", "用品"],
    ));

    // === Travel Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-travel-domestic",
        "国内出差",
        "员工申请国内出差",
        TemplateCategory::Travel,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("destination".to_string(), serde_json::json!({"type": "text", "label": "目的地", "required": true})),
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("purpose".to_string(), serde_json::json!({"type": "textarea", "label": "出差目的", "required": true})),
            ("budget".to_string(), serde_json::json!({"type": "number", "label": "预算", "required": true})),
        ]),
        vec!["出差", "国内", "差旅"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-travel-abroad",
        "国外出差",
        "员工申请国外出差",
        TemplateCategory::Travel,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "dir-001".to_string(), name: "总监".to_string(), employee_id: "DIR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("destination".to_string(), serde_json::json!({"type": "text", "label": "目的地", "required": true})),
            ("country".to_string(), serde_json::json!({"type": "text", "label": "国家", "required": true})),
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("purpose".to_string(), serde_json::json!({"type": "textarea", "label": "出差目的", "required": true})),
            ("budget".to_string(), serde_json::json!({"type": "number", "label": "预算", "required": true})),
            ("visa".to_string(), serde_json::json!({"type": "file", "label": "签证材料", "required": false})),
        ]),
        vec!["出差", "国外", "海外"],
    ));

    // === Overtime Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-overtime-weekday",
        "工作日加班",
        "员工申请工作日加班",
        TemplateCategory::Overtime,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("date".to_string(), serde_json::json!({"type": "date", "label": "加班日期", "required": true})),
            ("start_time".to_string(), serde_json::json!({"type": "time", "label": "开始时间", "required": true})),
            ("end_time".to_string(), serde_json::json!({"type": "time", "label": "结束时间", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "加班原因", "required": true})),
            ("meal_allowance".to_string(), serde_json::json!({"type": "checkbox", "label": "是否需要餐补", "required": false})),
        ]),
        vec!["加班", "延长", "工作日"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-overtime-weekend",
        "周末加班",
        "员工申请周末加班",
        TemplateCategory::Overtime,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("date".to_string(), serde_json::json!({"type": "date", "label": "加班日期", "required": true})),
            ("start_time".to_string(), serde_json::json!({"type": "time", "label": "开始时间", "required": true})),
            ("end_time".to_string(), serde_json::json!({"type": "time", "label": "结束时间", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "加班原因", "required": true})),
            ("meal_allowance".to_string(), serde_json::json!({"type": "checkbox", "label": "是否需要餐补", "required": false})),
        ]),
        vec!["加班", "周末", "休息日"],
    ));

    // === Equipment Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-equipment-laptop",
        "笔记本电脑申请",
        "申请公司配备笔记本电脑",
        TemplateCategory::Equipment,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "it-001".to_string(), name: "IT".to_string(), employee_id: "IT001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "fin-001".to_string(), name: "财务".to_string(), employee_id: "FIN001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("laptop_type".to_string(), serde_json::json!({"type": "select", "label": "电脑型号", "options": ["MacBook Pro", "ThinkPad X1", "Dell XPS", "其他"], "required": true})),
            ("specs".to_string(), serde_json::json!({"type": "textarea", "label": "配置要求", "required": false})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "申请原因", "required": true})),
        ]),
        vec!["电脑", "笔记本", "设备"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-equipment-monitor",
        "显示器申请",
        "申请外接显示器",
        TemplateCategory::Equipment,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "it-001".to_string(), name: "IT".to_string(), employee_id: "IT001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("monitor_type".to_string(), serde_json::json!({"type": "select", "label": "显示器类型", "options": ["24寸", "27寸", "32寸"], "required": true})),
            ("quantity".to_string(), serde_json::json!({"type": "number", "label": "数量", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "申请原因", "required": true})),
        ]),
        vec!["显示器", "屏幕", "设备"],
    ));

    // === General Templates ===
    templates.push(ApprovalTemplate::builtin(
        "tpl-general-remote",
        "远程办公申请",
        "申请远程办公",
        TemplateCategory::General,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "申请原因", "required": true})),
            ("work_location".to_string(), serde_json::json!({"type": "text", "label": "工作地点", "required": true})),
        ]),
        vec!["远程", "在家", "办公"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-general-certificate",
        "证明申请",
        "申请工作证明",
        TemplateCategory::General,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "hr-001".to_string(), name: "HR".to_string(), employee_id: "HR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("certificate_type".to_string(), serde_json::json!({"type": "select", "label": "证明类型", "options": ["在职证明", "收入证明", "离职证明"], "required": true})),
            ("purpose".to_string(), serde_json::json!({"type": "textarea", "label": "用途说明", "required": true})),
            ("delivery_method".to_string(), serde_json::json!({"type": "select", "label": "领取方式", "options": ["自取", "邮寄"], "required": true})),
        ]),
        vec!["证明", "在职", "收入"],
    ));

    // Add more templates to reach 20+
    templates.push(ApprovalTemplate::builtin(
        "tpl-leave-personal",
        "事假申请",
        "员工申请事假",
        TemplateCategory::Leave,
        vec![super::types::ApprovalStep {
            id: "step-1".to_string(),
            order: 1,
            approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
            step_type: super::types::StepType::Sequential,
            condition: None,
        }],
        HashMap::from([
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "请假原因", "required": true})),
        ]),
        vec!["事假", "请假", "私人"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-leave-maternity",
        "产假申请",
        "员工申请产假",
        TemplateCategory::Leave,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "hr-001".to_string(), name: "HR".to_string(), employee_id: "HR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("attachment".to_string(), serde_json::json!({"type": "file", "label": "证明材料", "required": true})),
        ]),
        vec!["产假", "生育", "请假"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-leave-funeral",
        "丧假申请",
        "员工申请丧假",
        TemplateCategory::Leave,
        vec![super::types::ApprovalStep {
            id: "step-1".to_string(),
            order: 1,
            approvers: vec![super::types::Approver { id: "hr-001".to_string(), name: "HR".to_string(), employee_id: "HR001".to_string() }],
            step_type: super::types::StepType::Sequential,
            condition: None,
        }],
        HashMap::from([
            ("relationship".to_string(), serde_json::json!({"type": "select", "label": "与逝者关系", "options": ["配偶", "父母", "子女", "兄弟姐妹", "祖父母", "其他"], "required": true})),
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("days".to_string(), serde_json::json!({"type": "number", "label": "天数", "required": true})),
        ]),
        vec!["丧假", "请假", "奔丧"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-expense-entertainment",
        "招待费报销",
        "业务招待费用报销",
        TemplateCategory::Expense,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "fin-001".to_string(), name: "财务".to_string(), employee_id: "FIN001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("amount".to_string(), serde_json::json!({"type": "number", "label": "金额", "required": true})),
            ("guest_name".to_string(), serde_json::json!({"type": "text", "label": "客人姓名", "required": true})),
            ("guest_company".to_string(), serde_json::json!({"type": "text", "label": "客人公司", "required": true})),
            ("date".to_string(), serde_json::json!({"type": "date", "label": "日期", "required": true})),
            ("purpose".to_string(), serde_json::json!({"type": "textarea", "label": "招待目的", "required": true})),
            ("receipts".to_string(), serde_json::json!({"type": "file", "label": "发票收据", "required": true})),
        ]),
        vec!["招待", "应酬", "报销"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-purchase-fixed",
        "固定资产采购",
        "申请采购固定资产",
        TemplateCategory::Purchase,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "fin-001".to_string(), name: "财务".to_string(), employee_id: "FIN001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-3".to_string(),
                order: 3,
                approvers: vec![super::types::Approver { id: "ceo-001".to_string(), name: "CEO".to_string(), employee_id: "CEO001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: Some(super::types::ApprovalCondition {
                    field: "amount".to_string(),
                    operator: "gte".to_string(),
                    value: serde_json::json!(50000),
                }),
            },
        ],
        HashMap::from([
            ("item_name".to_string(), serde_json::json!({"type": "text", "label": "资产名称", "required": true})),
            ("category".to_string(), serde_json::json!({"type": "select", "label": "资产类别", "options": ["电子设备", "家具", "车辆", "其他"], "required": true})),
            ("amount".to_string(), serde_json::json!({"type": "number", "label": "金额", "required": true})),
            ("supplier".to_string(), serde_json::json!({"type": "text", "label": "供应商", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "采购原因", "required": true})),
        ]),
        vec!["固定资产", "采购", "资产"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-travel-meeting",
        "会议出差",
        "参加外部会议出差",
        TemplateCategory::Travel,
        vec![super::types::ApprovalStep {
            id: "step-1".to_string(),
            order: 1,
            approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
            step_type: super::types::StepType::Sequential,
            condition: None,
        }],
        HashMap::from([
            ("meeting_name".to_string(), serde_json::json!({"type": "text", "label": "会议名称", "required": true})),
            ("organizer".to_string(), serde_json::json!({"type": "text", "label": "主办方", "required": true})),
            ("destination".to_string(), serde_json::json!({"type": "text", "label": "会议地点", "required": true})),
            ("start_date".to_string(), serde_json::json!({"type": "date", "label": "开始日期", "required": true})),
            ("end_date".to_string(), serde_json::json!({"type": "date", "label": "结束日期", "required": true})),
            ("budget".to_string(), serde_json::json!({"type": "number", "label": "预算", "required": true})),
        ]),
        vec!["会议", "出差", "外部"],
    ));

    templates.push(ApprovalTemplate::builtin(
        "tpl-general-resignation",
        "离职申请",
        "员工提交离职申请",
        TemplateCategory::General,
        vec![
            super::types::ApprovalStep {
                id: "step-1".to_string(),
                order: 1,
                approvers: vec![super::types::Approver { id: "mgr-001".to_string(), name: "部门经理".to_string(), employee_id: "MGR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
            super::types::ApprovalStep {
                id: "step-2".to_string(),
                order: 2,
                approvers: vec![super::types::Approver { id: "hr-001".to_string(), name: "HR".to_string(), employee_id: "HR001".to_string() }],
                step_type: super::types::StepType::Sequential,
                condition: None,
            },
        ],
        HashMap::from([
            ("last_day".to_string(), serde_json::json!({"type": "date", "label": "最后工作日", "required": true})),
            ("reason".to_string(), serde_json::json!({"type": "textarea", "label": "离职原因", "required": true})),
            ("handover".to_string(), serde_json::json!({"type": "textarea", "label": "工作交接说明", "required": true})),
        ]),
        vec!["离职", "辞职", "离开"],
    ));

    templates
}
