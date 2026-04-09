//! WorkCard Message System Backend
//!
//! Implements work card data model, generation API, action processing,
//! result feedback, and template system for FR607-FR614.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

// ============================================================================
// Types
// ============================================================================

/// Card status enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CardStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Cancelled,
}

impl std::fmt::Display for CardStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CardStatus::Pending => write!(f, "pending"),
            CardStatus::InProgress => write!(f, "in_progress"),
            CardStatus::Completed => write!(f, "completed"),
            CardStatus::Failed => write!(f, "failed"),
            CardStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// Card priority enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CardPriority {
    Low,
    Normal,
    High,
    Urgent,
}

impl std::fmt::Display for CardPriority {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CardPriority::Low => write!(f, "low"),
            CardPriority::Normal => write!(f, "normal"),
            CardPriority::High => write!(f, "high"),
            CardPriority::Urgent => write!(f, "urgent"),
        }
    }
}

/// Card action type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CardActionType {
    Approve,
    Reject,
    Edit,
    Delete,
    Confirm,
    Cancel,
    Custom,
}

impl std::fmt::Display for CardActionType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CardActionType::Approve => write!(f, "approve"),
            CardActionType::Reject => write!(f, "reject"),
            CardActionType::Edit => write!(f, "edit"),
            CardActionType::Delete => write!(f, "delete"),
            CardActionType::Confirm => write!(f, "confirm"),
            CardActionType::Cancel => write!(f, "cancel"),
            CardActionType::Custom => write!(f, "custom"),
        }
    }
}

/// Result type for action feedback
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ResultType {
    Success,
    Warning,
    Error,
    Info,
}

/// Field type for card fields
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FieldType {
    Text,
    Number,
    Date,
    Status,
    Link,
    User,
    Currency,
}

/// Card field definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardField {
    pub label: String,
    pub value: String,
    #[serde(rename = "type")]
    pub field_type: FieldType,
    #[serde(default)]
    pub editable: bool,
}

/// Action result feedback
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionResult {
    #[serde(rename = "type")]
    pub result_type: ResultType,
    pub message: String,
}

/// Card action definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardAction {
    pub id: String,
    pub label: String,
    #[serde(rename = "type")]
    pub action_type: CardActionType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variant: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loading: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<ActionResult>,
}

/// Audit trail entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditTrailEntry {
    pub action: String,
    pub actor: String,
    pub timestamp: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

/// Work card data model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkCard {
    pub id: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub card_type: String,
    pub status: CardStatus,
    pub priority: CardPriority,
    pub sender_id: String,
    pub sender_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sender_avatar: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sender_role: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recipient_id: Option<String>,
    pub fields: Vec<CardField>,
    pub actions: Vec<CardAction>,
    pub created_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub attachment_count: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thread_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub related_card_ids: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub audit_trail: Option<Vec<AuditTrailEntry>>,
}

impl WorkCard {
    /// Create a new work card with generated ID and timestamps
    pub fn new(
        title: String,
        card_type: String,
        priority: CardPriority,
        sender_id: String,
        sender_name: String,
        fields: Vec<CardField>,
        actions: Vec<CardAction>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            description: None,
            card_type,
            status: CardStatus::Pending,
            priority,
            sender_id,
            sender_name,
            sender_avatar: None,
            sender_role: None,
            recipient_id: None,
            fields,
            actions,
            created_at: Utc::now(),
            updated_at: None,
            expires_at: None,
            attachment_count: 0,
            thread_id: None,
            related_card_ids: None,
            audit_trail: Some(Vec::new()),
        }
    }

    /// Add audit trail entry
    pub fn add_audit_entry(&mut self, action: String, actor: String, details: Option<String>) {
        let entry = AuditTrailEntry {
            action,
            actor,
            timestamp: Utc::now(),
            details,
        };
        if let Some(ref mut trail) = self.audit_trail {
            trail.push(entry);
        }
    }

    /// Update card status
    pub fn update_status(&mut self, status: CardStatus) {
        self.status = status;
        self.updated_at = Some(Utc::now());
    }
}

// ============================================================================
// WorkCard Template System
// ============================================================================

/// Work card template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkCardTemplate {
    pub id: String,
    pub name: String,
    pub card_type: String,
    pub priority: CardPriority,
    pub fields: Vec<TemplateField>,
    pub actions: Vec<TemplateAction>,
    pub description_template: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateField {
    pub label: String,
    #[serde(rename = "type")]
    pub field_type: FieldType,
    pub value_path: String,
    pub editable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateAction {
    pub label: String,
    #[serde(rename = "type")]
    pub action_type: CardActionType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variant: Option<String>,
}

/// Template variables context
pub type TemplateContext = HashMap<String, serde_json::Value>;

impl WorkCardTemplate {
    /// Generate a work card from this template with given context
    pub fn generate_card(
        &self,
        title: String,
        sender_id: String,
        sender_name: String,
        context: &TemplateContext,
    ) -> WorkCard {
        // Generate fields from template
        let fields = self
            .fields
            .iter()
            .map(|tf| {
                let value = context
                    .get(&tf.value_path)
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                CardField {
                    label: tf.label.clone(),
                    value,
                    field_type: tf.field_type.clone(),
                    editable: tf.editable,
                }
            })
            .collect();

        // Generate actions from template
        let actions = self
            .actions
            .iter()
            .map(|ta| CardAction {
                id: Uuid::new_v4().to_string(),
                label: ta.label.clone(),
                action_type: ta.action_type,
                icon: ta.icon.clone(),
                variant: ta.variant.clone(),
                disabled: Some(false),
                loading: Some(false),
                result: None,
            })
            .collect();

        let description = self.description_template.as_ref().map(|t| {
            let mut desc = t.clone();
            for (key, value) in context {
                if let Some(val_str) = value.as_str() {
                    desc = desc.replace(&format!("{{{}}}", key), val_str);
                }
            }
            desc
        });

        let mut card = WorkCard::new(
            title,
            self.card_type.clone(),
            self.priority,
            sender_id,
            sender_name,
            fields,
            actions,
        );
        card.description = description;
        card
    }
}

// ============================================================================
// WorkCard Store
// ============================================================================

/// In-memory work card storage
#[derive(Debug, Default)]
pub struct WorkCardStore {
    cards: HashMap<String, WorkCard>,
    templates: HashMap<String, WorkCardTemplate>,
}

impl WorkCardStore {
    pub fn new() -> Self {
        Self::default()
    }

    /// Save a work card
    pub fn save(&mut self, card: WorkCard) {
        self.cards.insert(card.id.clone(), card);
    }

    /// Get a work card by ID
    pub fn get(&self, id: &str) -> Option<&WorkCard> {
        self.cards.get(id)
    }

    /// Get a mutable work card by ID
    pub fn get_mut(&mut self, id: &str) -> Option<&mut WorkCard> {
        self.cards.get_mut(id)
    }

    /// List all work cards
    pub fn list(&self) -> Vec<&WorkCard> {
        self.cards.values().collect()
    }

    /// Delete a work card
    pub fn delete(&mut self, id: &str) -> bool {
        self.cards.remove(id).is_some()
    }

    /// Save a template
    pub fn save_template(&mut self, template: WorkCardTemplate) {
        self.templates.insert(template.id.clone(), template);
    }

    /// Get a template by ID
    pub fn get_template(&self, id: &str) -> Option<&WorkCardTemplate> {
        self.templates.get(id)
    }

    /// List all templates
    pub fn list_templates(&self) -> Vec<&WorkCardTemplate> {
        self.templates.values().collect()
    }
}

// ============================================================================
// WorkCard Service
// ============================================================================

/// Work card service for managing cards
#[derive(Debug, Clone)]
pub struct WorkCardService {
    store: Arc<RwLock<WorkCardStore>>,
}

impl WorkCardService {
    pub fn new() -> Self {
        let mut store = WorkCardStore::new();
        // Initialize with default templates
        Self::init_default_templates(&mut store);
        Self {
            store: Arc::new(RwLock::new(store)),
        }
    }

    /// Initialize default templates
    fn init_default_templates(store: &mut WorkCardStore) {
        // Task card template
        let task_template = WorkCardTemplate {
            id: "task_default".to_string(),
            name: "任务卡片".to_string(),
            card_type: "task".to_string(),
            priority: CardPriority::Normal,
            fields: vec![
                TemplateField {
                    label: "负责人".to_string(),
                    field_type: FieldType::User,
                    value_path: "assignee".to_string(),
                    editable: true,
                },
                TemplateField {
                    label: "截止日期".to_string(),
                    field_type: FieldType::Date,
                    value_path: "due_date".to_string(),
                    editable: true,
                },
            ],
            actions: vec![
                TemplateAction {
                    label: "确认".to_string(),
                    action_type: CardActionType::Confirm,
                    icon: Some("check".to_string()),
                    variant: Some("default".to_string()),
                },
                TemplateAction {
                    label: "取消".to_string(),
                    action_type: CardActionType::Cancel,
                    icon: Some("x".to_string()),
                    variant: Some("outline".to_string()),
                },
            ],
            description_template: Some("任务描述: {description}".to_string()),
        };
        store.save_template(task_template);

        // Approval card template
        let approval_template = WorkCardTemplate {
            id: "approval_default".to_string(),
            name: "审批卡片".to_string(),
            card_type: "approval".to_string(),
            priority: CardPriority::High,
            fields: vec![
                TemplateField {
                    label: "申请人".to_string(),
                    field_type: FieldType::User,
                    value_path: "applicant".to_string(),
                    editable: false,
                },
                TemplateField {
                    label: "金额".to_string(),
                    field_type: FieldType::Currency,
                    value_path: "amount".to_string(),
                    editable: false,
                },
            ],
            actions: vec![
                TemplateAction {
                    label: "批准".to_string(),
                    action_type: CardActionType::Approve,
                    icon: Some("check".to_string()),
                    variant: Some("default".to_string()),
                },
                TemplateAction {
                    label: "拒绝".to_string(),
                    action_type: CardActionType::Reject,
                    icon: Some("x".to_string()),
                    variant: Some("destructive".to_string()),
                },
            ],
            description_template: Some("审批事由: {reason}".to_string()),
        };
        store.save_template(approval_template);

        // Alert card template
        let alert_template = WorkCardTemplate {
            id: "alert_default".to_string(),
            name: "告警卡片".to_string(),
            card_type: "alert".to_string(),
            priority: CardPriority::Urgent,
            fields: vec![
                TemplateField {
                    label: "告警级别".to_string(),
                    field_type: FieldType::Status,
                    value_path: "level".to_string(),
                    editable: false,
                },
                TemplateField {
                    label: "详情链接".to_string(),
                    field_type: FieldType::Link,
                    value_path: "link".to_string(),
                    editable: false,
                },
            ],
            actions: vec![
                TemplateAction {
                    label: "确认".to_string(),
                    action_type: CardActionType::Confirm,
                    icon: Some("check".to_string()),
                    variant: Some("default".to_string()),
                },
            ],
            description_template: Some("告警信息: {message}".to_string()),
        };
        store.save_template(alert_template);
    }

    /// Create a new work card
    pub async fn create_card(&self, card: WorkCard) -> Result<WorkCard, String> {
        let mut store = self.store.write().await;
        let id = card.id.clone();
        store.save(card.clone());
        tracing::info!("Created work card: {}", id);
        Ok(card)
    }

    /// Get a work card by ID
    pub async fn get_card(&self, id: &str) -> Result<Option<WorkCard>, String> {
        let store = self.store.read().await;
        Ok(store.get(id).cloned())
    }

    /// List all work cards
    pub async fn list_cards(&self) -> Result<Vec<WorkCard>, String> {
        let store = self.store.read().await;
        Ok(store.list().into_iter().cloned().collect())
    }

    /// Execute a card action
    pub async fn execute_action(
        &self,
        card_id: &str,
        action_id: &str,
        actor_id: &str,
        actor_name: &str,
    ) -> Result<ActionResult, String> {
        let mut store = self.store.write().await;

        let card = store.get_mut(card_id).ok_or("Card not found")?;

        // Find the action index
        let action_index = card
            .actions
            .iter_mut()
            .position(|a| a.id == action_id)
            .ok_or("Action not found")?;

        // Copy action type and clone label to avoid borrow conflict
        let action_type = card.actions[action_index].action_type;
        let action_label = card.actions[action_index].label.clone();

        // Execute the action based on type
        let (result, new_status) = match action_type {
            CardActionType::Approve => (
                ActionResult {
                    result_type: ResultType::Success,
                    message: "已批准".to_string(),
                },
                Some(CardStatus::Completed),
            ),
            CardActionType::Reject => (
                ActionResult {
                    result_type: ResultType::Warning,
                    message: "已拒绝".to_string(),
                },
                Some(CardStatus::Failed),
            ),
            CardActionType::Confirm => (
                ActionResult {
                    result_type: ResultType::Success,
                    message: "已确认".to_string(),
                },
                Some(CardStatus::InProgress),
            ),
            CardActionType::Cancel => (
                ActionResult {
                    result_type: ResultType::Info,
                    message: "已取消".to_string(),
                },
                Some(CardStatus::Cancelled),
            ),
            CardActionType::Edit => (
                ActionResult {
                    result_type: ResultType::Info,
                    message: "请编辑卡片内容".to_string(),
                },
                None,
            ),
            CardActionType::Delete => (
                ActionResult {
                    result_type: ResultType::Warning,
                    message: "确认删除此卡片？".to_string(),
                },
                None,
            ),
            CardActionType::Custom => (
                ActionResult {
                    result_type: ResultType::Info,
                    message: "操作已执行".to_string(),
                },
                None,
            ),
        };

        // Update card status if needed
        if let Some(status) = new_status {
            card.update_status(status);
        }

        // Update action result
        card.actions[action_index].result = Some(result.clone());

        // Add audit trail
        card.add_audit_entry(
            format!("执行操作: {}", action_label),
            actor_name.to_string(),
            Some(format!("操作类型: {}", action_type)),
        );

        tracing::info!(
            "Executed action {} on card {} by {}",
            action_id,
            card_id,
            actor_name
        );

        Ok(result)
    }

    /// Delete a work card
    pub async fn delete_card(&self, id: &str) -> Result<bool, String> {
        let mut store = self.store.write().await;
        Ok(store.delete(id))
    }

    /// Generate card from template
    pub async fn generate_from_template(
        &self,
        template_id: &str,
        title: String,
        sender_id: String,
        sender_name: String,
        context: TemplateContext,
    ) -> Result<WorkCard, String> {
        let store = self.store.read().await;
        let template = store
            .get_template(template_id)
            .ok_or("Template not found")?
            .clone();
        drop(store);

        let card = template.generate_card(title, sender_id, sender_name, &context);
        Ok(card)
    }

    /// List all templates
    pub async fn list_templates(&self) -> Result<Vec<WorkCardTemplate>, String> {
        let store = self.store.read().await;
        Ok(store.list_templates().into_iter().cloned().collect())
    }
}

impl Default for WorkCardService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_and_get_card() {
        let service = WorkCardService::new();

        let card = WorkCard::new(
            "Test Card".to_string(),
            "task".to_string(),
            CardPriority::Normal,
            "user1".to_string(),
            "User One".to_string(),
            vec![CardField {
                label: "Test".to_string(),
                value: "Value".to_string(),
                field_type: FieldType::Text,
                editable: false,
            }],
            vec![],
        );

        let created = service.create_card(card.clone()).await.unwrap();
        assert_eq!(created.title, "Test Card");

        let retrieved = service.get_card(&created.id).await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().title, "Test Card");
    }

    #[tokio::test]
    async fn test_execute_action() {
        let service = WorkCardService::new();

        let mut card = WorkCard::new(
            "Test Card".to_string(),
            "task".to_string(),
            CardPriority::Normal,
            "user1".to_string(),
            "User One".to_string(),
            vec![],
            vec![CardAction {
                id: "action1".to_string(),
                label: "批准".to_string(),
                action_type: CardActionType::Approve,
                icon: None,
                variant: None,
                disabled: Some(false),
                loading: Some(false),
                result: None,
            }],
        );

        let created = service.create_card(card.clone()).await.unwrap();

        let result = service
            .execute_action(&created.id, "action1", "user2", "User Two")
            .await
            .unwrap();

        assert_eq!(result.result_type, ResultType::Success);
        assert_eq!(result.message, "已批准");
    }

    #[tokio::test]
    async fn test_generate_from_template() {
        let service = WorkCardService::new();

        let mut context = TemplateContext::new();
        context.insert(
            "assignee".to_string(),
            serde_json::json!("张三"),
        );
        context.insert(
            "due_date".to_string(),
            serde_json::json!("2024-12-31"),
        );
        context.insert(
            "description".to_string(),
            serde_json::json!("这是一个测试任务"),
        );

        let card = service
            .generate_from_template(
                "task_default",
                "新任务".to_string(),
                "user1".to_string(),
                "User One".to_string(),
                context,
            )
            .await
            .unwrap();

        assert_eq!(card.title, "新任务");
        assert_eq!(card.card_type, "task");
        assert_eq!(card.fields.len(), 2);
    }
}
