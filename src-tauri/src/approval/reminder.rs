//! 审批催办模块
//!
//! 实现FR154-FR163: 催办功能
//! - 催办频率限制 (每天最多3次，间隔2小时)
//! - 紧急催办分级
//! - 自动抄送上级的逻辑

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc, Timelike, Weekday};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 催办级别
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ReminderLevel {
    /// 普通催办
    Normal,
    /// 紧急催办 (第2次催办)
    Urgent,
    /// 超紧急催办 (第3次催办)
    Critical,
}

/// 催办记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReminderRecord {
    /// 催办ID
    pub id: String,
    /// 审批ID
    pub approval_id: String,
    /// 催办人ID
    pub reminder_id: String,
    /// 催办人姓名
    pub reminder_name: String,
    /// 催办级别
    pub level: ReminderLevel,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 是否发送成功
    pub sent: bool,
}

/// 催办结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReminderResult {
    /// 是否成功
    pub success: bool,
    /// 今日催办次数
    pub today_count: usize,
    /// 剩余催办次数
    pub remaining: usize,
    /// 下次可催办时间
    pub next_reminder_at: Option<DateTime<Utc>>,
    /// 抄送列表
    pub cc_list: Vec<String>,
    /// 错误信息
    pub error: Option<String>,
}

/// 催办设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReminderSettings {
    /// 是否启用催办
    pub enabled: bool,
    /// 工作日开始时间
    pub work_start: String,
    /// 工作日结束时间
    pub work_end: String,
    /// 允许催办的星期 (0=周日, 1=周一, ..., 6=周六)
    pub allowed_days: Vec<u8>,
}

impl Default for ReminderSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            work_start: "09:00".to_string(),
            work_end: "18:00".to_string(),
            allowed_days: vec![1, 2, 3, 4, 5], // 周一到周五
        }
    }
}

/// 催办服务
pub struct ReminderService {
    /// 催办记录
    records: Arc<RwLock<HashMap<String, Vec<ReminderRecord>>>>,
    /// 催办设置
    settings: Arc<RwLock<HashMap<String, ReminderSettings>>>,
    /// 每天催办计数 (approver_id -> count)
    daily_counts: Arc<RwLock<HashMap<String, (usize, DateTime<Utc>)>>>,
}

impl ReminderService {
    pub fn new() -> Self {
        Self {
            records: Arc::new(RwLock::new(HashMap::new())),
            settings: Arc::new(RwLock::new(HashMap::new())),
            daily_counts: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 发送催办
    pub async fn send_reminder(
        &self,
        approval_id: String,
        approver_id: String,
        approver_name: String,
        reminder_id: String,
        reminder_name: String,
        level: ReminderLevel,
    ) -> ReminderResult {
        // 1. 检查催办频率 (每天最多3次)
        let (today_count, remaining) = match self.check_frequency(&approver_id).await {
            Ok((count, remaining)) => (count, remaining),
            Err(e) => return ReminderResult {
                success: false,
                today_count: 0,
                remaining: 0,
                next_reminder_at: None,
                cc_list: vec![],
                error: Some(e),
            },
        };

        // 2. 检查催办间隔 (至少2小时)
        let next_reminder_at = match self.check_interval(&approval_id).await {
            Ok(next) => next,
            Err(e) => return ReminderResult {
                success: false,
                today_count,
                remaining,
                next_reminder_at: None,
                cc_list: vec![],
                error: Some(e),
            },
        };

        // 3. 检查工作时间
        if let Some(error) = self.check_work_hours(&approver_id).await {
            return ReminderResult {
                success: false,
                today_count,
                remaining,
                next_reminder_at,
                cc_list: vec![],
                error: Some(error),
            };
        }

        // 4. 创建催办记录
        let record = ReminderRecord {
            id: Uuid::new_v4().to_string(),
            approval_id: approval_id.clone(),
            reminder_id,
            reminder_name,
            level,
            created_at: Utc::now(),
            sent: true,
        };

        // 5. 保存催办记录
        let mut records = self.records.write().await;
        records
            .entry(approval_id.clone())
            .or_insert_with(Vec::new)
            .push(record);

        // 6. 更新每日计数
        self.update_daily_count(&approver_id).await;

        // 7. 确定抄送列表
        let cc_list = self.get_cc_list(level, today_count).await;

        ReminderResult {
            success: true,
            today_count: today_count + 1,
            remaining: remaining.saturating_sub(1),
            next_reminder_at,
            cc_list,
            error: None,
        }
    }

    /// 检查催办频率 (每天最多3次)
    async fn check_frequency(&self, approver_id: &str) -> Result<(usize, usize), String> {
        let mut daily_counts = self.daily_counts.write().await;
        
        // 获取或初始化计数
        let (count, date) = daily_counts
            .entry(approver_id.to_string())
            .or_insert((0, Utc::now()));
        
        // 检查是否跨天
        if date.date_naive() != Utc::now().date_naive() {
            *count = 0;
        }
        
        const MAX_DAILY: usize = 3;
        
        if *count >= MAX_DAILY {
            Err("REM_001: 今日催办次数已用完".to_string())
        } else {
            Ok((*count, MAX_DAILY - *count))
        }
    }

    /// 检查催办间隔 (至少2小时)
    async fn check_interval(&self, approval_id: &str) -> Result<Option<DateTime<Utc>>, String> {
        let records = self.records.read().await;
        
        if let Some(reminders) = records.get(approval_id) {
            if let Some(last) = reminders.last() {
                let hours_since = (Utc::now() - last.created_at).num_hours();
                if hours_since < 2 {
                    let next = last.created_at + chrono::Duration::hours(2);
                    return Err(format!("REM_002: 距离上次催办不足2小时，下次可催办时间: {}", next));
                }
            }
        }
        
        Ok(None)
    }

    /// 检查工作时间
    async fn check_work_hours(&self, user_id: &str) -> Option<String> {
        let settings = self.settings.read().await;
        let setting = settings.get(user_id).cloned().unwrap_or_default();
        
        if !setting.enabled {
            return Some("催办功能已禁用".to_string());
        }
        
        let now = Utc::now();
        let weekday = now.weekday().num_days_from_sunday() as u8;
        
        // 检查是否在允许的星期
        if !setting.allowed_days.contains(&weekday) {
            return Some("REM_003: 非工作日不允许催办".to_string());
        }
        
        // 检查是否在工作时间内
        let current_time = format!("{:02}:{:02}", now.hour(), now.minute());
        if current_time < setting.work_start || current_time > setting.work_end {
            return Some("REM_003: 非工作时间不允许催办".to_string());
        }
        
        None
    }

    /// 更新每日催办计数
    async fn update_daily_count(&self, approver_id: &str) {
        let mut daily_counts = self.daily_counts.write().await;
        let entry = daily_counts.entry(approver_id.to_string()).or_insert((0, Utc::now()));
        entry.0 += 1;
    }

    /// 获取抄送列表
    async fn get_cc_list(&self, level: ReminderLevel, today_count: usize) -> Vec<String> {
        let mut cc_list = Vec::new();
        
        // FR160: 第2次催办(urgent)自动抄送审批人上级
        if level == ReminderLevel::Urgent || today_count >= 1 {
            cc_list.push("supervisor".to_string());
        }
        
        // FR161: 第3次催办(critical)自动抄送部门负责人
        if level == ReminderLevel::Critical || today_count >= 2 {
            cc_list.push("department_head".to_string());
        }
        
        cc_list
    }

    /// 获取审批的催办记录
    pub async fn get_reminders(&self, approval_id: &str) -> Vec<ReminderRecord> {
        let records = self.records.read().await;
        records.get(approval_id).cloned().unwrap_or_default()
    }

    /// 获取用户的催办统计
    pub async fn get_reminder_stats(&self, approver_id: &str) -> ReminderStats {
        let daily_counts = self.daily_counts.read().await;
        let (count, _) = daily_counts.get(approver_id).cloned().unwrap_or((0, Utc::now()));
        
        ReminderStats {
            today_count: count,
            remaining: 3.saturating_sub(count),
            next_reset_at: self.get_next_reset_time(),
        }
    }

    /// 获取下次重置时间 (次日0点)
    fn get_next_reset_time(&self) -> DateTime<Utc> {
        let now = Utc::now();
        let tomorrow = now.date_naive() + chrono::NaiveDate::from_ymd_opt(1, 1, 1).unwrap();
        tomorrow.and_hms_opt(0, 0, 0).unwrap().and_utc()
    }

    /// 设置催办设置
    pub async fn set_settings(&self, user_id: &str, settings: ReminderSettings) {
        let mut settings_store = self.settings.write().await;
        settings_store.insert(user_id.to_string(), settings);
    }

    /// 获取催办设置
    pub async fn get_settings(&self, user_id: &str) -> ReminderSettings {
        let settings = self.settings.read().await;
        settings.get(user_id).cloned().unwrap_or_default()
    }
}

impl Default for ReminderService {
    fn default() -> Self {
        Self::new()
    }
}

/// 催办统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReminderStats {
    pub today_count: usize,
    pub remaining: usize,
    pub next_reset_at: DateTime<Utc>,
}

/// 催办错误
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ReminderError {
    /// 催办次数超限
    LimitReached,
    /// 催办间隔不足
    IntervalTooShort,
    /// 非工作时间
    OutsideWorkingHours,
}

impl std::fmt::Display for ReminderError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::LimitReached => write!(f, "REM_001: 催办次数超限"),
            Self::IntervalTooShort => write!(f, "REM_002: 催办间隔不足"),
            Self::OutsideWorkingHours => write!(f, "REM_003: 非工作时间"),
        }
    }
}

impl std::error::Error for ReminderError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_reminder_frequency() {
        let service = ReminderService::new();
        
        // 第一次催办应该成功
        let result = service.send_reminder(
            "approval-1".to_string(),
            "approver-1".to_string(),
            "Approver".to_string(),
            "reminder-1".to_string(),
            "Remider".to_string(),
            ReminderLevel::Normal,
        ).await;
        
        assert!(result.success);
        assert_eq!(result.today_count, 1);
        assert_eq!(result.remaining, 2);
    }

    #[tokio::test]
    async fn test_work_hours_check() {
        let service = ReminderService::new();
        
        // 设置工作时间为 23:00-23:59 (模拟非工作时间)
        let settings = ReminderSettings {
            enabled: true,
            work_start: "23:00".to_string(),
            work_end: "23:59".to_string(),
            allowed_days: vec![0, 1, 2, 3, 4, 5, 6],
        };
        service.set_settings("user-1", settings).await;
        
        // 获取当前设置
        let retrieved = service.get_settings("user-1").await;
        assert_eq!(retrieved.work_start, "23:00");
    }
}
