//! Intent Classifier
//!
//! Classifies user intent using keyword matching and semantic analysis.
//! Keywords provide fast, deterministic classification for common intents.
//! Semantic analysis handles ambiguous or complex queries.

use std::sync::Arc;
use serde::{Deserialize, Serialize};

use crate::agent::llm_provider::LlmClient;

/// Keyword rule for intent matching
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeywordRule {
    /// Keywords that trigger this rule
    pub keywords: Vec<String>,
    /// Primary intent name
    pub intent: String,
    /// Sub-intent (optional)
    pub sub_intent: Option<String>,
    /// Suggested tools for this intent
    pub tools: Vec<String>,
    /// Whether this requires a subagent
    pub requires_subagent: bool,
    /// Priority (higher = checked first)
    pub priority: i32,
}

impl KeywordRule {
    /// Check if message matches any keyword
    pub fn matches(&self, message: &str) -> bool {
        let message_lower = message.to_lowercase();
        self.keywords.iter().any(|kw| message_lower.contains(&kw.to_lowercase()))
    }
}

/// Intent classification result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntentResult {
    /// Primary intent
    pub intent: String,
    /// Sub-intent (optional)
    pub sub_intent: Option<String>,
    /// Confidence score (0.0 - 1.0)
    pub confidence: f32,
    /// Suggested tools
    pub suggested_tools: Vec<String>,
    /// Whether this requires a subagent
    pub requires_subagent: bool,
    /// Intent type
    pub intent_type: String,
}

impl IntentResult {
    /// Create a new intent result
    pub fn new(intent: String) -> Self {
        Self {
            intent: intent.clone(),
            sub_intent: None,
            confidence: 0.5,
            suggested_tools: vec![],
            requires_subagent: false,
            intent_type: intent,
        }
    }

    /// Set confidence
    pub fn with_confidence(mut self, confidence: f32) -> Self {
        self.confidence = confidence;
        self
    }

    /// Set sub-intent
    pub fn with_sub_intent(mut self, sub_intent: String) -> Self {
        self.sub_intent = Some(sub_intent);
        self
    }

    /// Set suggested tools
    pub fn with_tools(mut self, tools: Vec<String>) -> Self {
        self.suggested_tools = tools;
        self
    }

    /// Mark as requiring subagent
    pub fn with_subagent(mut self) -> Self {
        self.requires_subagent = true;
        self
    }
}

/// User context for classification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserContext {
    /// User ID
    pub user_id: String,
    /// Tenant ID
    pub tenant_id: String,
    /// User roles
    pub roles: Vec<String>,
    /// Department ID
    pub department_id: Option<String>,
    /// User permissions
    pub permissions: Vec<String>,
}

impl Default for UserContext {
    fn default() -> Self {
        Self {
            user_id: "anonymous".to_string(),
            tenant_id: "default".to_string(),
            roles: vec!["guest".to_string()],
            department_id: None,
            permissions: vec![],
        }
    }
}

/// Intent classifier
pub struct IntentClassifier {
    keyword_rules: Vec<KeywordRule>,
    llm_client: Option<Arc<dyn LlmClient>>,
    default_intent: String,
}

impl IntentClassifier {
    /// Create a new intent classifier
    pub fn new() -> Self {
        let mut classifier = Self {
            keyword_rules: Vec::new(),
            llm_client: None,
            default_intent: "general.query".to_string(),
        };
        
        // Register default keyword rules
        classifier.register_default_rules();
        
        classifier
    }

    /// Set LLM client for semantic classification
    pub fn with_llm_client(mut self, client: Arc<dyn LlmClient>) -> Self {
        self.llm_client = Some(client);
        self
    }

    /// Register a keyword rule
    pub fn register_rule(&mut self, rule: KeywordRule) {
        self.keyword_rules.push(rule);
        // Sort by priority (descending)
        self.keyword_rules.sort_by(|a, b| b.priority.cmp(&a.priority));
    }

    /// Register multiple keyword rules
    pub fn register_rules(&mut self, rules: Vec<KeywordRule>) {
        self.keyword_rules.extend(rules);
        self.keyword_rules.sort_by(|a, b| b.priority.cmp(&a.priority));
    }

    /// Set default intent
    pub fn with_default_intent(mut self, intent: String) -> Self {
        self.default_intent = intent;
        self
    }

    /// Classify user intent
    pub async fn classify(
        &self,
        message: &str,
        context: &UserContext,
    ) -> Result<IntentResult, super::ClassificationError> {
        // 1. Try keyword matching first (fast, deterministic)
        if let Some(result) = self.keyword_match(message) {
            tracing::debug!("Keyword matched: {} with confidence {}", result.intent, result.confidence);
            return Ok(result);
        }

        // 2. Try semantic classification if LLM client is available
        if let Some(ref client) = self.llm_client {
            match self.semantic_classify(message, context, client).await {
                Ok(result) => {
                    tracing::debug!("Semantic classified: {} with confidence {}", result.intent, result.confidence);
                    return Ok(result);
                }
                Err(e) => {
                    tracing::warn!("Semantic classification failed: {}", e);
                }
            }
        }

        // 3. Fall back to default intent
        Ok(IntentResult::new(self.default_intent.clone())
            .with_confidence(0.3)
            .with_sub_intent("fallback".to_string()))
    }

    /// Keyword matching
    fn keyword_match(&self, message: &str) -> Option<IntentResult> {
        for rule in &self.keyword_rules {
            if rule.matches(message) {
                return Some(IntentResult::new(rule.intent.clone())
                    .with_confidence(0.9)
                    .with_sub_intent(rule.sub_intent.clone().unwrap_or_default())
                    .with_tools(rule.tools.clone())
                    .with_subagent()
                );
            }
        }
        None
    }

    /// Semantic classification using LLM
    async fn semantic_classify(
        &self,
        message: &str,
        context: &UserContext,
        client: &Arc<dyn LlmClient>,
    ) -> Result<IntentResult, super::ClassificationError> {
        let prompt = format!(
            r#"Classify the following user message into one of these intents:
- finance.ocr: Financial document OCR and extraction
- finance.query: Financial data queries and reports
- finance.report: Financial report generation
- sales.order: Sales order processing
- sales.query: Sales data queries
- hr.onboard: HR onboarding processes
- hr.query: HR information queries
- cross.department: Tasks involving multiple departments
- general.query: General questions and conversations

User message: {}

Consider the user's context (roles: {:?}) in your classification.

Respond with ONLY a JSON object in this format:
{{"intent": "intent_name", "confidence": 0.0-1.0, "reasoning": "brief explanation"}}"#,
            message,
            context.roles
        );

        let request = crate::agent::llm_provider::LlmRequest {
            session_id: "classifier".to_string(),
            trace_id: "classifier".to_string(),
            messages: vec![
                crate::agent::llm_provider::LlmMessage { role: "user".to_string(), content: prompt, tool_calls: None }
            ],
            tools: None,
            stream: false,
            metadata: None,
        };
        let response = client.as_ref().complete(request).await
            .map_err(|e| super::ClassificationError::SemanticFailed(e.to_string()))?;

        // Parse JSON response
        let json_str = if response.content.is_empty() {
            return Err(super::ClassificationError::SemanticFailed("Empty response".to_string()).into());
        } else {
            response.content
        };

        let parsed: serde_json::Value = serde_json::from_str(&json_str)
            .map_err(|e| super::ClassificationError::SemanticFailed(format!("JSON parse error: {}", e)))?;

        let intent = parsed.get("intent")
            .and_then(|v| v.as_str())
            .unwrap_or("general.query")
            .to_string();

        let confidence = parsed.get("confidence")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.5) as f32;

        Ok(IntentResult::new(intent)
            .with_confidence(confidence))
    }

    /// Register default keyword rules
    fn register_default_rules(&mut self) {
        let default_rules = vec![
            // Finance rules
            KeywordRule {
                keywords: vec!["发票".to_string(), "ocr".to_string(), "识别".to_string(), "票据".to_string()],
                intent: "finance.ocr".to_string(),
                sub_intent: Some("document_extraction".to_string()),
                tools: vec!["finance_ocr_scan".to_string(), "finance_document_parse".to_string()],
                requires_subagent: true,
                priority: 100,
            },
            KeywordRule {
                keywords: vec!["财务报表".to_string(), "财务报告".to_string(), "利润".to_string(), "收入".to_string(), "支出".to_string()],
                intent: "finance.report".to_string(),
                sub_intent: Some("financial_report".to_string()),
                tools: vec!["finance_aggregate".to_string(), "finance_query".to_string()],
                requires_subagent: true,
                priority: 90,
            },
            KeywordRule {
                keywords: vec!["财务".to_string(), "账目".to_string(), "账单".to_string(), "报销".to_string()],
                intent: "finance.query".to_string(),
                sub_intent: Some("financial_query".to_string()),
                tools: vec!["finance_query".to_string()],
                requires_subagent: true,
                priority: 80,
            },
            
            // Sales rules
            KeywordRule {
                keywords: vec!["订单".to_string(), "下单".to_string(), "创建订单".to_string()],
                intent: "sales.order".to_string(),
                sub_intent: Some("order_creation".to_string()),
                tools: vec!["sales_create_order".to_string()],
                requires_subagent: true,
                priority: 95,
            },
            KeywordRule {
                keywords: vec!["销售".to_string(), "客户".to_string(), "销售额".to_string(), "业绩".to_string()],
                intent: "sales.query".to_string(),
                sub_intent: Some("sales_query".to_string()),
                tools: vec!["sales_query".to_string()],
                requires_subagent: true,
                priority: 80,
            },
            
            // HR rules
            KeywordRule {
                keywords: vec!["入职".to_string(), "新员工".to_string(), "招聘".to_string(), "录用".to_string()],
                intent: "hr.onboard".to_string(),
                sub_intent: Some("onboarding".to_string()),
                tools: vec!["hr_create_employee".to_string(), "hr_setup_account".to_string()],
                requires_subagent: true,
                priority: 95,
            },
            KeywordRule {
                keywords: vec!["人事".to_string(), "员工".to_string(), "考勤".to_string(), "请假".to_string()],
                intent: "hr.query".to_string(),
                sub_intent: Some("hr_query".to_string()),
                tools: vec!["hr_query".to_string()],
                requires_subagent: true,
                priority: 80,
            },
            
            // Cross-department rules
            KeywordRule {
                keywords: vec!["协作".to_string(), "协调".to_string(), "跨部门".to_string(), "多个部门".to_string()],
                intent: "cross.department".to_string(),
                sub_intent: Some("coordination".to_string()),
                tools: vec![],
                requires_subagent: true,
                priority: 70,
            },
        ];

        self.register_rules(default_rules);
    }
}

impl Default for IntentClassifier {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keyword_matching() {
        let mut classifier = IntentClassifier::new();
        
        classifier.register_rule(KeywordRule {
            keywords: vec!["发票".to_string(), "ocr".to_string()],
            intent: "finance.ocr".to_string(),
            sub_intent: Some("document_extraction".to_string()),
            tools: vec!["finance_ocr_scan".to_string()],
            requires_subagent: true,
            priority: 100,
        });

        let result = classifier.classify_sync("扫描发票", &UserContext::default()).unwrap();
        assert_eq!(result.intent, "finance.ocr");
        assert!(result.confidence >= 0.9);
    }

    #[test]
    fn test_priority_ordering() {
        let mut classifier = IntentClassifier::new();
        
        classifier.register_rule(KeywordRule {
            keywords: vec!["测试".to_string()],
            intent: "test.low_priority".to_string(),
            tools: vec![],
            requires_subagent: false,
            priority: 1,
        });
        
        classifier.register_rule(KeywordRule {
            keywords: vec!["测试".to_string()],
            intent: "test.high_priority".to_string(),
            tools: vec![],
            requires_subagent: false,
            priority: 100,
        });

        let result = classifier.classify_sync("这是测试", &UserContext::default()).unwrap();
        assert_eq!(result.intent, "test.high_priority");
    }
}

impl IntentClassifier {
    /// Synchronous classify (for testing)
    fn classify_sync(&self, message: &str, context: &UserContext) -> Result<IntentResult, super::ClassificationError> {
        // Try keyword matching first
        if let Some(result) = self.keyword_match(message) {
            return Ok(result);
        }
        
        // Fall back to default
        Ok(IntentResult::new(self.default_intent.clone())
            .with_confidence(0.3))
    }
}
