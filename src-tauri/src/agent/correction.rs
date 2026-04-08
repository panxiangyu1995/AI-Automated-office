//! 纠偏反馈学习系统
//!
//! 实现FR81-FR89: 纠偏反馈学习功能
//! - 纠偏数据结构模型
//! - 规则提取和存储
//! - 错题集管理
//! - 规则应用追踪

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 反馈类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FeedbackType {
    /// 错误纠正
    Correction,
    /// 偏好设置
    Preference,
    /// 风格调整
    Style,
    /// 知识更新
    Knowledge,
    /// 行为禁止
    Prohibition,
}

/// 纠偏级别
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CorrectionLevel {
    /// 低 - 建议性质
    Low,
    /// 中 - 参考性质
    Medium,
    /// 高 - 必须遵守
    High,
    /// 强制 - 绝对禁止
    Forced,
}

/// 纠偏规则
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CorrectionRule {
    /// 规则ID
    pub id: String,
    /// 规则内容
    pub content: String,
    /// 触发关键词
    pub trigger_keywords: Vec<String>,
    /// 上下文模式
    pub context_pattern: Option<String>,
    /// 纠偏类型
    pub feedback_type: FeedbackType,
    /// 纠偏级别
    pub level: CorrectionLevel,
    /// 来源反馈ID
    pub source_feedback_id: Option<String>,
    /// 生效时间
    pub effective_from: DateTime<Utc>,
    /// 失效时间 (可选)
    pub effective_until: Option<DateTime<Utc>>,
    /// 状态
    pub status: RuleStatus,
    /// 应用计数
    pub application_count: u32,
    /// 成功率
    pub success_rate: f32,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 更新时间
    pub updated_at: DateTime<Utc>,
}

impl CorrectionRule {
    pub fn new(
        content: String,
        feedback_type: FeedbackType,
        level: CorrectionLevel,
    ) -> Self {
        let now = Utc::now();
        
        Self {
            id: Uuid::new_v4().to_string(),
            content,
            trigger_keywords: Vec::new(),
            context_pattern: None,
            feedback_type,
            level,
            source_feedback_id: None,
            effective_from: now,
            effective_until: None,
            status: RuleStatus::Active,
            application_count: 0,
            success_rate: 0.0,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn is_active(&self) -> bool {
        let now = Utc::now();
        if self.status != RuleStatus::Active {
            return false;
        }
        if now < self.effective_from {
            return false;
        }
        if let Some(until) = self.effective_until {
            if now > until {
                return false;
            }
        }
        true
    }
}

/// 规则状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RuleStatus {
    Active,
    Inactive,
    Archived,
}

/// 反馈记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Feedback {
    /// 反馈ID
    pub id: String,
    /// 用户ID
    pub user_id: String,
    /// 会话ID
    pub session_id: String,
    /// 反馈类型
    pub feedback_type: FeedbackType,
    /// 原始内容
    pub original_content: String,
    /// 期望内容
    pub expected_content: Option<String>,
    /// 反馈说明
    pub description: Option<String>,
    /// 是否已处理
    pub is_processed: bool,
    /// 是否生成规则
    pub rule_generated: bool,
    /// 生成规则ID
    pub generated_rule_id: Option<String>,
    /// 创建时间
    pub created_at: DateTime<Utc>,
}

/// 错题集项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorItem {
    /// 错题ID
    pub id: String,
    /// 用户ID
    pub user_id: String,
    /// 问题描述
    pub question: String,
    /// AI错误回答
    pub wrong_answer: String,
    /// 正确回答
    pub correct_answer: String,
    /// 解释
    pub explanation: Option<String>,
    /// 相关规则ID
    pub related_rule_id: Option<String>,
    /// 标签
    pub tags: Vec<String>,
    /// 复习次数
    pub review_count: u32,
    /// 下次复习时间
    pub next_review_at: Option<DateTime<Utc>>,
    /// 掌握程度 (0-1)
    pub mastery_level: f32,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 更新时间
    pub updated_at: DateTime<Utc>,
}

impl ErrorItem {
    pub fn new(
        user_id: String,
        question: String,
        wrong_answer: String,
        correct_answer: String,
    ) -> Self {
        let now = Utc::now();
        
        Self {
            id: Uuid::new_v4().to_string(),
            user_id,
            question,
            wrong_answer,
            correct_answer,
            explanation: None,
            related_rule_id: None,
            tags: Vec::new(),
            review_count: 0,
            next_review_at: None,
            mastery_level: 0.0,
            created_at: now,
            updated_at: now,
        }
    }

    /// 基于艾宾浩斯遗忘曲线更新掌握程度
    pub fn update_mastery(&mut self, recalled: bool) {
        self.review_count += 1;
        
        // 简化算法：每次回忆正确增加15%，错误减少20%
        if recalled {
            self.mastery_level = (self.mastery_level + 0.15).min(1.0);
            
            // 设置下次复习时间（根据掌握程度调整）
            let days = match self.mastery_level {
                x if x < 0.3 => 1,
                x if x < 0.5 => 3,
                x if x < 0.7 => 7,
                x if x < 0.9 => 14,
                _ => 30,
            };
            self.next_review_at = Some(Utc::now() + chrono::Duration::days(days));
        } else {
            self.mastery_level = (self.mastery_level - 0.2).max(0.0);
            self.next_review_at = Some(Utc::now() + chrono::Duration::days(1));
        }
        
        self.updated_at = Utc::now();
    }
}

/// 规则应用追踪
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuleApplication {
    /// 应用ID
    pub id: String,
    /// 规则ID
    pub rule_id: String,
    /// 会话ID
    pub session_id: String,
    /// 触发内容
    pub triggered_content: String,
    /// 应用结果
    pub result: ApplicationResult,
    /// 用户反馈
    pub user_feedback: Option<bool>,
    /// 创建时间
    pub created_at: DateTime<Utc>,
}

/// 应用结果
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ApplicationResult {
    Applied,
    Rejected,
    Skipped,
}

/// 纠偏服务
pub struct CorrectionService {
    /// 纠偏规则存储
    rules: Arc<RwLock<HashMap<String, CorrectionRule>>>,
    /// 反馈记录存储
    feedbacks: Arc<RwLock<HashMap<String, Feedback>>>,
    /// 错题集存储
    error_items: Arc<RwLock<HashMap<String, Vec<ErrorItem>>>>,
    /// 规则应用追踪
    applications: Arc<RwLock<Vec<RuleApplication>>>,
    /// 用户规则索引
    user_rules: Arc<RwLock<HashMap<String, Vec<String>>>>,
}

impl CorrectionService {
    pub fn new() -> Self {
        Self {
            rules: Arc::new(RwLock::new(HashMap::new())),
            feedbacks: Arc::new(RwLock::new(HashMap::new())),
            error_items: Arc::new(RwLock::new(HashMap::new())),
            applications: Arc::new(RwLock::new(Vec::new())),
            user_rules: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 提交反馈
    pub async fn submit_feedback(&self, feedback: Feedback) -> Result<Feedback, String> {
        let mut feedbacks = self.feedbacks.write().await;
        
        feedbacks.insert(feedback.id.clone(), feedback.clone());
        
        Ok(feedback)
    }

    /// 从反馈生成规则
    pub async fn generate_rule_from_feedback(
        &self,
        feedback_id: &str,
    ) -> Result<CorrectionRule, String> {
        let feedbacks = self.feedbacks.read().await;
        let feedback = feedbacks.get(feedback_id)
            .ok_or("反馈不存在")?
            .clone();
        drop(feedbacks);
        
        // 创建规则
        let mut rule = CorrectionRule::new(
            feedback.expected_content.clone().unwrap_or_default(),
            feedback.feedback_type,
            CorrectionLevel::Medium,
        );
        rule.source_feedback_id = Some(feedback_id.to_string());
        
        // 提取触发关键词
        rule.trigger_keywords = self.extract_keywords(&feedback.original_content);
        
        // 保存规则
        let mut rules = self.rules.write().await;
        rules.insert(rule.id.clone(), rule.clone());
        
        // 更新用户规则索引
        let mut user_rules = self.user_rules.write().await;
        user_rules
            .entry(feedback.user_id.clone())
            .or_insert_with(Vec::new)
            .push(rule.id.clone());
        
        // 更新反馈状态
        let mut feedbacks = self.feedbacks.write().await;
        if let Some(fb) = feedbacks.get_mut(feedback_id) {
            fb.is_processed = true;
            fb.rule_generated = true;
            fb.generated_rule_id = Some(rule.id.clone());
        }
        
        Ok(rule)
    }

    /// 提取关键词
    fn extract_keywords(&self, content: &str) -> Vec<String> {
        let stop_words = vec![
            "的", "了", "在", "是", "我", "你", "他", "她", "它",
            "这个", "那个", "一个", "什么", "怎么", "如何",
        ];
        
        let words: Vec<String> = content
            .split(|c: char| !c.is_alphanumeric() && c != '_')
            .filter(|w| w.len() >= 2)
            .filter(|w| !stop_words.contains(w))
            .map(|w| w.to_string())
            .take(5)
            .collect();
        
        words
    }

    /// 添加错题
    pub async fn add_error_item(&self, item: ErrorItem) -> Result<ErrorItem, String> {
        let mut error_items = self.error_items.write().await;
        
        error_items
            .entry(item.user_id.clone())
            .or_insert_with(Vec::new)
            .push(item.clone());
        
        Ok(item)
    }

    /// 获取用户的错题集
    pub async fn get_error_items(&self, user_id: &str) -> Vec<ErrorItem> {
        let error_items = self.error_items.read().await;
        error_items.get(user_id)
            .map(|items| items.clone())
            .unwrap_or_default()
    }

    /// 获取待复习的错题
    pub async fn get_due_items(&self, user_id: &str) -> Vec<ErrorItem> {
        let now = Utc::now();
        
        self.get_error_items(user_id).await
            .into_iter()
            .filter(|item| {
                item.next_review_at
                    .map(|dt| dt <= now)
                    .unwrap_or(true)
            })
            .collect()
    }

    /// 更新错题掌握程度
    pub async fn update_mastery(
        &self,
        user_id: &str,
        item_id: &str,
        recalled: bool,
    ) -> Result<(), String> {
        let mut error_items = self.error_items.write().await;
        
        if let Some(items) = error_items.get_mut(user_id) {
            if let Some(item) = items.iter_mut().find(|i| i.id == item_id) {
                item.update_mastery(recalled);
                return Ok(());
            }
        }
        
        Err("错题不存在")
    }

    /// 检查内容触发规则
    pub async fn check_content(
        &self,
        user_id: &str,
        content: &str,
    ) -> Vec<CorrectionRule> {
        let rules = self.rules.read().await;
        let user_rules = self.user_rules.read().await;
        
        let user_rule_ids = user_rules.get(user_id)
            .map(|ids| ids.clone())
            .unwrap_or_default();
        
        rules.values()
            .filter(|rule| {
                // 检查规则是否激活
                if !rule.is_active() {
                    return false;
                }
                
                // 检查是否是用户的规则
                if !user_rule_ids.contains(&rule.id) {
                    return false;
                }
                
                // 检查触发关键词
                for keyword in &rule.trigger_keywords {
                    if content.contains(keyword) {
                        return true;
                    }
                }
                
                false
            })
            .cloned()
            .collect()
    }

    /// 记录规则应用
    pub async fn record_application(
        &self,
        rule_id: &str,
        session_id: &str,
        triggered_content: String,
        result: ApplicationResult,
    ) -> RuleApplication {
        let application = RuleApplication {
            id: Uuid::new_v4().to_string(),
            rule_id: rule_id.to_string(),
            session_id: session_id.to_string(),
            triggered_content,
            result,
            user_feedback: None,
            created_at: Utc::now(),
        };
        
        let mut applications = self.applications.write().await;
        applications.push(application.clone());
        
        // 更新规则统计
        drop(applications);
        self.update_rule_stats(rule_id, result).await;
        
        application
    }

    /// 更新规则统计
    async fn update_rule_stats(&self, rule_id: &str, result: ApplicationResult) {
        let mut rules = self.rules.write().await;
        
        if let Some(rule) = rules.get_mut(rule_id) {
            rule.application_count += 1;
            
            // 更新成功率
            let total = rule.application_count as f32;
            let current_success = rule.success_rate * (total - 1.0);
            let new_success = match result {
                ApplicationResult::Applied => 1.0,
                ApplicationResult::Rejected => 0.0,
                ApplicationResult::Skipped => 0.5,
            };
            rule.success_rate = (current_success + new_success) / total;
        }
    }

    /// 获取用户的所有规则
    pub async fn get_user_rules(&self, user_id: &str) -> Vec<CorrectionRule> {
        let rules = self.rules.read().await;
        let user_rules = self.user_rules.read().await;
        
        let user_rule_ids = user_rules.get(user_id)
            .map(|ids| ids.clone())
            .unwrap_or_default();
        
        rules.values()
            .filter(|rule| user_rule_ids.contains(&rule.id))
            .cloned()
            .collect()
    }

    /// 删除规则
    pub async fn delete_rule(&self, user_id: &str, rule_id: &str) -> Result<(), String> {
        let mut user_rules = self.user_rules.write().await;
        
        if let Some(ids) = user_rules.get_mut(user_id) {
            ids.retain(|id| id != rule_id);
        }
        
        let mut rules = self.rules.write().await;
        rules.remove(rule_id);
        
        Ok(())
    }

    /// 获取应用统计
    pub async fn get_stats(&self) -> CorrectionStats {
        let rules = self.rules.read().await;
        let applications = self.applications.read().await;
        
        let total_rules = rules.len();
        let active_rules = rules.values()
            .filter(|r| r.is_active())
            .count();
        
        let total_applications = applications.len();
        let successful = applications.iter()
            .filter(|a| a.result == ApplicationResult::Applied)
            .count();
        
        CorrectionStats {
            total_rules,
            active_rules,
            total_applications,
            success_rate: if total_applications > 0 {
                successful as f32 / total_applications as f32
            } else {
                0.0
            },
        }
    }
}

impl Default for CorrectionService {
    fn default() -> Self {
        Self::new()
    }
}

/// 纠偏统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CorrectionStats {
    pub total_rules: usize,
    pub active_rules: usize,
    pub total_applications: usize,
    pub success_rate: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_add_error_item() {
        let service = CorrectionService::new();
        
        let item = ErrorItem::new(
            "user-1".to_string(),
            "如何创建函数?".to_string(),
            "使用 def 创建".to_string(),
            "使用 function 关键字创建".to_string(),
        );
        
        let result = service.add_error_item(item).await;
        assert!(result.is_ok());
        
        let items = service.get_error_items("user-1").await;
        assert_eq!(items.len(), 1);
    }

    #[tokio::test]
    async fn test_update_mastery() {
        let service = CorrectionService::new();
        
        let item = ErrorItem::new(
            "user-1".to_string(),
            "测试问题".to_string(),
            "错误答案".to_string(),
            "正确答案".to_string(),
        );
        
        let item = service.add_error_item(item).await.unwrap();
        
        // 回忆正确
        service.update_mastery("user-1", &item.id, true).await.unwrap();
        
        let items = service.get_error_items("user-1").await;
        assert!(items[0].mastery_level > 0.0);
    }

    #[tokio::test]
    async fn test_check_content() {
        let service = CorrectionService::new();
        
        // 添加规则
        let mut rule = CorrectionRule::new(
            "使用双引号".to_string(),
            FeedbackType::Correction,
            CorrectionLevel::Medium,
        );
        rule.trigger_keywords = vec!["字符串".to_string()];
        
        let mut rules = service.rules.write().await;
        rules.insert(rule.id.clone(), rule);
        
        let mut user_rules = service.user_rules.write().await;
        user_rules.insert("user-1".to_string(), vec![rule.id.clone()]);
        
        // 检查触发
        let matched = service.check_content("user-1", "这是一个字符串测试").await;
        assert_eq!(matched.len(), 1);
    }
}