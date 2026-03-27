use super::descriptor::ToolDescriptor;

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SensitiveActionAssessment {
    pub risk_level: RiskLevel,
    pub requires_confirmation: bool,
    pub blocked: bool,
    pub reason: Option<String>,
    pub matched_rules: Vec<String>,
}

pub fn assess_sensitivity(
    descriptor: &ToolDescriptor,
    params: &serde_json::Map<String, serde_json::Value>,
) -> SensitiveActionAssessment {
    let mut matched_rules = Vec::new();
    let mut risk = RiskLevel::Low;
    let mut requires_confirmation = false;

    let tool_id = descriptor.id.to_lowercase();

    if tool_id.contains("delete") || tool_id.contains("remove") {
        risk = RiskLevel::High;
        requires_confirmation = true;
        matched_rules.push("tool_id_delete".to_string());
    }

    if tool_id.contains("http") {
        if let Some(method) = params
            .get("method")
            .and_then(|value| value.as_str())
            .map(|value| value.to_uppercase())
        {
            if method != "GET" {
                risk = RiskLevel::Medium;
                requires_confirmation = true;
                matched_rules.push("http_non_get".to_string());
            }
        }
    }

    if params.contains_key("bulk") || params.contains_key("batch") || params.contains_key("ids") {
        risk = RiskLevel::Medium;
        requires_confirmation = true;
        matched_rules.push("bulk_operation".to_string());
    }

    if descriptor.capabilities.requires_confirmation {
        requires_confirmation = true;
        matched_rules.push("descriptor_requires_confirmation".to_string());
    }

    SensitiveActionAssessment {
        risk_level: risk,
        requires_confirmation,
        blocked: matches!(risk, RiskLevel::Critical),
        reason: None,
        matched_rules,
    }
}
