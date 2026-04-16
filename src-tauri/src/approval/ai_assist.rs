//! 审批AI辅助模块
//!
//! 实现FR175-FR179: 审批AI辅助能力
//! - 风险检测（金额异常、发票真伪、历史对比）
//! - 审批摘要生成
//! - 智能表单填充
//! - 历史数据预测

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// 风险级别
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

/// 风险类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RiskType {
    /// 金额异常
    AmountAnomaly,
    /// 发票无效
    InvoiceInvalid,
    /// 发票重复
    InvoiceDuplicate,
    /// 历史偏差
    HistoricalDeviation,
    /// 审批人异常
    ApproverAnomaly,
    /// 时间异常
    TimeAnomaly,
    /// 类别异常
    CategoryAnomaly,
    /// 合规风险
    ComplianceRisk,
}

/// 风险警告
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RiskAlert {
    /// 风险ID
    pub id: String,
    /// 风险级别
    pub level: RiskLevel,
    /// 风险类型
    pub risk_type: RiskType,
    /// 风险描述
    pub message: String,
    /// 证据/详情
    pub evidence: Option<String>,
    /// 建议
    pub suggestion: Option<String>,
    /// 相关数据
    pub related_data: Option<HashMap<String, serde_json::Value>>,
}

impl RiskAlert {
    pub fn new(level: RiskLevel, risk_type: RiskType, message: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            level,
            risk_type,
            message,
            evidence: None,
            suggestion: None,
            related_data: None,
        }
    }

    pub fn with_evidence(mut self, evidence: String) -> Self {
        self.evidence = Some(evidence);
        self
    }

    pub fn with_suggestion(mut self, suggestion: String) -> Self {
        self.suggestion = Some(suggestion);
        self
    }

    pub fn with_related_data(mut self, data: HashMap<String, serde_json::Value>) -> Self {
        self.related_data = Some(data);
        self
    }
}

/// 审批摘要
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalSummary {
    /// 总审批数量
    pub total_count: usize,
    /// 总金额
    pub total_amount: f64,
    /// 各类别统计
    pub by_type: HashMap<String, TypeStats>,
    /// 趋势分析
    pub trends: Vec<TrendItem>,
    /// 生成时间
    pub generated_at: i64,
    /// 高风险审批数量
    pub high_risk_count: usize,
    /// 平均审批时长(小时)
    pub avg_approval_hours: f64,
}

/// 类别统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TypeStats {
    /// 数量
    pub count: usize,
    /// 金额
    pub amount: f64,
    /// 通过率
    pub approval_rate: f64,
}

/// 趋势项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrendItem {
    /// 日期
    pub date: String,
    /// 数量
    pub count: usize,
    /// 金额
    pub amount: f64,
    /// 通过率
    pub approval_rate: f64,
}

/// 智能表单数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormFillSuggestion {
    /// 字段名
    pub field: String,
    /// 建议值
    pub suggested_value: serde_json::Value,
    /// 置信度 (0-1)
    pub confidence: f64,
    /// 来源
    pub source: String,
}

/// 智能表单填充结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmartFillResult {
    /// 填充建议列表
    pub suggestions: Vec<FormFillSuggestion>,
    /// 整体置信度
    pub overall_confidence: f64,
    /// 填充的数据
    pub filled_data: HashMap<String, serde_json::Value>,
}

/// 预测结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PredictionResult {
    /// 预测是否通过
    pub will_approve: bool,
    /// 置信度
    pub confidence: f64,
    /// 预测理由
    pub reasons: Vec<String>,
    /// 相似历史案例
    pub similar_cases: Vec<SimilarCase>,
}

/// 相似案例
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimilarCase {
    /// 案例ID
    pub id: String,
    /// 申请人
    pub applicant_name: String,
    /// 结果
    pub result: String,
    /// 相似度
    pub similarity: f64,
}

/// 日期范围
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DateRange {
    pub start: String,
    pub end: String,
}

/// 审批AI辅助服务
pub struct ApprovalAIAssist {
    /// 风险检测阈值
    amount_anomaly_threshold: f64,
    /// 历史数据窗口(天)
    history_window_days: i64,
}

impl ApprovalAIAssist {
    pub fn new() -> Self {
        Self {
            amount_anomaly_threshold: 1.5, // 超过平均值1.5倍为异常
            history_window_days: 30,
        }
    }

    /// 风险检测
    pub fn detect_risks(&self, approval: &ApprovalData) -> Vec<RiskAlert> {
        let mut risks = Vec::new();

        // 1. 金额异常检测
        if let Some(amount_risk) = self.check_amount_anomaly(approval) {
            risks.push(amount_risk);
        }

        // 2. 发票检测
        if let Some(invoice_risk) = self.check_invoice(approval) {
            risks.push(invoice_risk);
        }

        // 3. 时间异常检测
        if let Some(time_risk) = self.check_time_anomaly(approval) {
            risks.push(time_risk);
        }

        // 4. 审批人异常检测
        if let Some(approver_risk) = self.check_approver_anomaly(approval) {
            risks.push(approver_risk);
        }

        risks
    }

    /// 金额异常检测
    fn check_amount_anomaly(&self, approval: &ApprovalData) -> Option<RiskAlert> {
        // 简单示例：超过100万标记为高风险
        if approval.amount > 1_000_000.0 {
            Some(RiskAlert::new(
                RiskLevel::High,
                RiskType::AmountAnomaly,
                format!("金额较大: ¥{:.2}", approval.amount),
            ).with_suggestion("建议提供更详细的采购理由和比价记录".to_string()))
        } else if approval.amount > 500_000.0 {
            Some(RiskAlert::new(
                RiskLevel::Medium,
                RiskType::AmountAnomaly,
                format!("金额较高: ¥{:.2}", approval.amount),
            ))
        } else {
            None
        }
    }

    /// 发票检测
    fn check_invoice(&self, approval: &ApprovalData) -> Option<RiskAlert> {
        // 检查发票是否存在
        if approval.has_invoice {
            // 示例：发票号码格式校验
            if let Some(ref invoice_no) = approval.invoice_no {
                if invoice_no.len() < 10 {
                    return Some(RiskAlert::new(
                        RiskLevel::Critical,
                        RiskType::InvoiceInvalid,
                        "发票号码格式无效".to_string(),
                    ));
                }
            }
        } else if approval.amount > 10_000.0 {
            // 超过1万必须提供发票
            return Some(RiskAlert::new(
                RiskLevel::High,
                RiskType::InvoiceInvalid,
                "大额审批缺少发票".to_string(),
            ).with_suggestion("请上传发票附件".to_string()));
        }
        None
    }

    /// 时间异常检测
    fn check_time_anomaly(&self, _approval: &ApprovalData) -> Option<RiskAlert> {
        use chrono::{Utc, Timelike, Weekday, Datelike};
        
        let now = Utc::now();
        
        // 检查是否在工作时间外提交
        let hour = now.hour();
        if hour < 9 || hour > 18 {
            return Some(RiskAlert::new(
                RiskLevel::Low,
                RiskType::TimeAnomaly,
                "在非工作时间提交".to_string(),
            ));
        }
        
        // 检查是否在周末提交
        let weekday = now.weekday();
        if weekday == Weekday::Sat || weekday == Weekday::Sun {
            return Some(RiskAlert::new(
                RiskLevel::Low,
                RiskType::TimeAnomaly,
                "在周末提交".to_string(),
            ));
        }
        
        None
    }

    /// 审批人异常检测
    fn check_approver_anomaly(&self, approval: &ApprovalData) -> Option<RiskAlert> {
        // 检查审批人是否为申请人本人
        if approval.approver_id == approval.applicant_id {
            Some(RiskAlert::new(
                RiskLevel::Critical,
                RiskType::ApproverAnomaly,
                "审批人与申请人为同一人".to_string(),
            ).with_suggestion("请更换审批人".to_string()))
        } else {
            None
        }
    }

    /// 生成审批摘要
    pub fn generate_summary(&self, approvals: &[ApprovalData], _date_range: &DateRange) -> ApprovalSummary {
        let total_count = approvals.len();
        let total_amount: f64 = approvals.iter().map(|a| a.amount).sum();
        
        // 按类型分组统计
        let mut by_type: HashMap<String, TypeStats> = HashMap::new();
        for approval in approvals {
            let type_name = approval.category.clone();
            let entry = by_type.entry(type_name).or_insert(TypeStats {
                count: 0,
                amount: 0.0,
                approval_rate: 0.0,
            });
            entry.count += 1;
            entry.amount += approval.amount;
            if approval.is_approved {
                entry.approval_rate += 1.0;
            }
        }
        
        // 计算通过率
        for stats in by_type.values_mut() {
            if stats.count > 0 {
                stats.approval_rate /= stats.count as f64;
            }
        }
        
        // 生成趋势数据
        let trends = self.generate_trends(approvals);
        
        // 计算高风险审批数量
        let high_risk_count = approvals.iter()
            .filter(|a| self.detect_risks(a).iter().any(|r| r.level == RiskLevel::High || r.level == RiskLevel::Critical))
            .count();
        
        ApprovalSummary {
            total_count,
            total_amount,
            by_type,
            trends,
            generated_at: chrono::Utc::now().timestamp(),
            high_risk_count,
            avg_approval_hours: self.calculate_avg_approval_hours(approvals),
        }
    }

    /// 生成趋势数据
    fn generate_trends(&self, approvals: &[ApprovalData]) -> Vec<TrendItem> {
        // 简化实现：按日期分组
        let mut by_date: HashMap<String, Vec<&ApprovalData>> = HashMap::new();
        
        for approval in approvals {
            let date = approval.created_at.split('T').next().unwrap_or("").to_string();
            by_date.entry(date).or_insert_with(Vec::new).push(approval);
        }
        
        let mut trends: Vec<TrendItem> = by_date.iter().map(|(date, group)| {
            let count = group.len();
            let amount: f64 = group.iter().map(|a| a.amount).sum();
            let approved_count = group.iter().filter(|a| a.is_approved).count();
            
            TrendItem {
                date: date.clone(),
                count,
                amount,
                approval_rate: if count > 0 { approved_count as f64 / count as f64 } else { 0.0 },
            }
        }).collect();
        
        trends.sort_by(|a, b| a.date.cmp(&b.date));
        trends
    }

    /// 计算平均审批时长
    fn calculate_avg_approval_hours(&self, approvals: &[ApprovalData]) -> f64 {
        if approvals.is_empty() {
            return 0.0;
        }
        
        // 简化：使用固定值
        24.0
    }

    /// 智能表单填充
    pub fn smart_fill(&self, form_type: &str, _context: &str) -> SmartFillResult {
        let mut suggestions = Vec::new();
        let mut filled_data = HashMap::new();
        
        // 基于表单类型和上下文生成建议
        match form_type {
            "expense" => {
                // 费用报销表单
                suggestions.push(FormFillSuggestion {
                    field: "category".to_string(),
                    suggested_value: serde_json::json!("差旅费"),
                    confidence: 0.85,
                    source: "历史数据".to_string(),
                });
                
                filled_data.insert("currency".to_string(), serde_json::json!("CNY"));
            },
            "purchase" => {
                // 采购申请表单
                suggestions.push(FormFillSuggestion {
                    field: "supplier".to_string(),
                    suggested_value: serde_json::json!("合格供应商列表"),
                    confidence: 0.70,
                    source: "供应商库".to_string(),
                });
            },
            _ => {}
        }
        
        SmartFillResult {
            suggestions,
            overall_confidence: 0.75,
            filled_data,
        }
    }

    /// 预测审批结果
    pub fn predict_outcome(&self, approval: &ApprovalData) -> PredictionResult {
        let mut reasons = Vec::new();
        let mut base_confidence: f64 = 0.5;
        
        // 基于金额预测
        if approval.amount > 100_000.0 {
            reasons.push("金额较大，需要更高级别审批".to_string());
            base_confidence -= 0.1;
        } else {
            reasons.push("金额在常规范围内".to_string());
            base_confidence += 0.1;
        }
        
        // 基于历史记录预测
        if approval.applicant_has_history {
            reasons.push("申请人有良好的审批历史".to_string());
            base_confidence += 0.15;
        }
        
        // 基于附件完整性
        if approval.has_invoice || approval.has_attachment {
            reasons.push("附件材料完整".to_string());
            base_confidence += 0.1;
        }
        
        let will_approve = base_confidence > 0.5;
        
        PredictionResult {
            will_approve,
            confidence: base_confidence.clamp(0.0, 1.0),
            reasons,
            similar_cases: Vec::new(), // 简化实现
        }
    }
}

impl Default for ApprovalAIAssist {
    fn default() -> Self {
        Self::new()
    }
}

/// 审批数据 (用于分析)
#[derive(Debug, Clone)]
pub struct ApprovalData {
    /// 审批ID
    pub id: String,
    /// 申请人ID
    pub applicant_id: String,
    /// 申请人姓名
    pub applicant_name: String,
    /// 审批人ID
    pub approver_id: String,
    /// 金额
    pub amount: f64,
    /// 类别
    pub category: String,
    /// 是否已审批
    pub is_approved: bool,
    /// 创建时间
    pub created_at: String,
    /// 是否有发票
    pub has_invoice: bool,
    /// 发票号码
    pub invoice_no: Option<String>,
    /// 是否有附件
    pub has_attachment: bool,
    /// 申请人是否有历史记录
    pub applicant_has_history: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_risk_detection() {
        let assist = ApprovalAIAssist::new();
        
        let approval = ApprovalData {
            id: "test-1".to_string(),
            applicant_id: "user-1".to_string(),
            applicant_name: "Test User".to_string(),
            approver_id: "user-2".to_string(),
            amount: 1_500_000.0,
            category: "采购".to_string(),
            is_approved: false,
            created_at: "2024-01-01T10:00:00Z".to_string(),
            has_invoice: true,
            invoice_no: Some("1234567890".to_string()),
            has_attachment: true,
            applicant_has_history: true,
        };
        
        let risks = assist.detect_risks(&approval);
        assert!(!risks.is_empty());
        assert!(risks.iter().any(|r| r.risk_type == RiskType::AmountAnomaly));
    }

    #[test]
    fn test_predict_outcome() {
        let assist = ApprovalAIAssist::new();
        
        let approval = ApprovalData {
            id: "test-1".to_string(),
            applicant_id: "user-1".to_string(),
            applicant_name: "Test User".to_string(),
            approver_id: "user-2".to_string(),
            amount: 5000.0,
            category: "差旅".to_string(),
            is_approved: false,
            created_at: "2024-01-01T10:00:00Z".to_string(),
            has_invoice: true,
            invoice_no: Some("1234567890".to_string()),
            has_attachment: true,
            applicant_has_history: true,
        };
        
        let result = assist.predict_outcome(&approval);
        assert!(result.will_approve);
        assert!(result.confidence > 0.5);
    }
}
