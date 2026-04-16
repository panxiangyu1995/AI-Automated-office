//! 纠偏反馈系统 Tauri 命令
//!
//! 暴露纠偏反馈学习的核心功能给前端

use std::sync::Arc;
use chrono::Utc;

use crate::agent::correction::{
    CorrectionService, Feedback, FeedbackType, ErrorItem, ApplicationResult,
};

/// 创建纠偏服务
fn create_correction_service() -> Arc<CorrectionService> {
    Arc::new(CorrectionService::new())
}

#[tauri::command]
pub async fn submit_feedback(
    user_id: String,
    session_id: String,
    feedback_type: String,
    original_content: String,
    expected_content: Option<String>,
    description: Option<String>,
) -> Result<serde_json::Value, String> {
    let service = create_correction_service();
    
    let feedback = Feedback {
        id: uuid::Uuid::new_v4().to_string(),
        user_id,
        session_id,
        feedback_type: match feedback_type.as_str() {
            "correction" => FeedbackType::Correction,
            "preference" => FeedbackType::Preference,
            "style" => FeedbackType::Style,
            "knowledge" => FeedbackType::Knowledge,
            "prohibition" => FeedbackType::Prohibition,
            _ => FeedbackType::Correction,
        },
        original_content,
        expected_content,
        description,
        is_processed: false,
        rule_generated: false,
        generated_rule_id: None,
        created_at: Utc::now(),
    };
    
    let result = service.submit_feedback(feedback).await?;
    
    Ok(serde_json::json!({
        "id": result.id,
        "message": "反馈已提交"
    }))
}

#[tauri::command]
pub async fn generate_rule_from_feedback(
    feedback_id: String,
) -> Result<serde_json::Value, String> {
    let service = create_correction_service();
    
    let rule = service.generate_rule_from_feedback(&feedback_id).await?;
    
    Ok(serde_json::json!({
        "id": rule.id,
        "content": rule.content,
        "feedback_type": format!("{:?}", rule.feedback_type).to_lowercase(),
        "level": format!("{:?}", rule.level).to_lowercase(),
        "trigger_keywords": rule.trigger_keywords,
        "created_at": rule.created_at.to_rfc3339()
    }))
}

#[tauri::command]
pub async fn add_error_item(
    user_id: String,
    question: String,
    wrong_answer: String,
    correct_answer: String,
    explanation: Option<String>,
    tags: Vec<String>,
) -> Result<serde_json::Value, String> {
    let service = create_correction_service();
    
    let mut item = ErrorItem::new(user_id, question, wrong_answer, correct_answer);
    item.explanation = explanation;
    item.tags = tags;
    
    let result = service.add_error_item(item).await?;
    
    Ok(serde_json::json!({
        "id": result.id,
        "message": "错题已添加"
    }))
}

#[tauri::command]
pub async fn get_error_items(
    user_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    let service = create_correction_service();
    
    let items = service.get_error_items(&user_id).await;
    
    Ok(items.into_iter().map(|item| {
        serde_json::json!({
            "id": item.id,
            "question": item.question,
            "wrong_answer": item.wrong_answer,
            "correct_answer": item.correct_answer,
            "explanation": item.explanation,
            "tags": item.tags,
            "review_count": item.review_count,
            "mastery_level": item.mastery_level,
            "next_review_at": item.next_review_at.map(|dt| dt.to_rfc3339()),
            "created_at": item.created_at.to_rfc3339()
        })
    }).collect())
}

#[tauri::command]
pub async fn get_due_error_items(
    user_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    let service = create_correction_service();
    
    let items = service.get_due_items(&user_id).await;
    
    Ok(items.into_iter().map(|item| {
        serde_json::json!({
            "id": item.id,
            "question": item.question,
            "wrong_answer": item.wrong_answer,
            "correct_answer": item.correct_answer,
            "mastery_level": item.mastery_level,
            "next_review_at": item.next_review_at.map(|dt| dt.to_rfc3339())
        })
    }).collect())
}

#[tauri::command]
pub async fn update_error_mastery(
    user_id: String,
    item_id: String,
    recalled: bool,
) -> Result<serde_json::Value, String> {
    let service = create_correction_service();
    
    service.update_mastery(&user_id, &item_id, recalled).await?;
    
    let items = service.get_error_items(&user_id).await;
    let item = items.iter().find(|i| i.id == item_id);
    
    Ok(serde_json::json!({
        "id": item_id,
        "mastery_level": item.map(|i| i.mastery_level).unwrap_or(0.0),
        "next_review_at": item.and_then(|i| i.next_review_at).map(|dt| dt.to_rfc3339())
    }))
}

#[tauri::command]
pub async fn check_correction_rules(
    user_id: String,
    content: String,
) -> Result<Vec<serde_json::Value>, String> {
    let service = create_correction_service();
    
    let rules = service.check_content(&user_id, &content).await;
    
    Ok(rules.into_iter().map(|rule| {
        serde_json::json!({
            "id": rule.id,
            "content": rule.content,
            "feedback_type": format!("{:?}", rule.feedback_type).to_lowercase(),
            "level": format!("{:?}", rule.level).to_lowercase(),
            "trigger_keywords": rule.trigger_keywords
        })
    }).collect())
}

#[tauri::command]
pub async fn record_rule_application(
    rule_id: String,
    session_id: String,
    triggered_content: String,
    result: String,
) -> Result<serde_json::Value, String> {
    let service = create_correction_service();
    
    let app_result = match result.as_str() {
        "applied" => ApplicationResult::Applied,
        "rejected" => ApplicationResult::Rejected,
        _ => ApplicationResult::Skipped,
    };
    
    let application = service.record_application(
        &rule_id,
        &session_id,
        triggered_content,
        app_result,
    ).await;
    
    Ok(serde_json::json!({
        "id": application.id,
        "result": format!("{:?}", application.result).to_lowercase()
    }))
}

#[tauri::command]
pub async fn get_user_correction_rules(
    user_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    let service = create_correction_service();
    
    let rules = service.get_user_rules(&user_id).await;
    
    Ok(rules.into_iter().map(|rule| {
        serde_json::json!({
            "id": rule.id,
            "content": rule.content,
            "feedback_type": format!("{:?}", rule.feedback_type).to_lowercase(),
            "level": format!("{:?}", rule.level).to_lowercase(),
            "trigger_keywords": rule.trigger_keywords,
            "status": format!("{:?}", rule.status).to_lowercase(),
            "application_count": rule.application_count,
            "success_rate": rule.success_rate,
            "created_at": rule.created_at.to_rfc3339()
        })
    }).collect())
}

#[tauri::command]
pub async fn delete_correction_rule(
    user_id: String,
    rule_id: String,
) -> Result<serde_json::Value, String> {
    let service = create_correction_service();
    
    service.delete_rule(&user_id, &rule_id).await?;
    
    Ok(serde_json::json!({
        "message": "规则已删除"
    }))
}

#[tauri::command]
pub async fn get_correction_stats() -> Result<serde_json::Value, String> {
    let service = create_correction_service();
    
    let stats = service.get_stats().await;
    
    Ok(serde_json::json!({
        "total_rules": stats.total_rules,
        "active_rules": stats.active_rules,
        "total_applications": stats.total_applications,
        "success_rate": stats.success_rate
    }))
}
