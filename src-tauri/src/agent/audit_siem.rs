//! 审计 SIEM 集成模块
//!
//! J4: Webhook 接入审计 SIEM
//! - 将审计事件（ToolAudit, StepLog, Failure, Confirmation）转发到 SIEM 系统
//! - 通过 WebhookService 实现 HTTP 推送
//! - 支持 CEF (Common Event Format) 和 JSON 两种格式
//! - 可配置事件过滤规则

use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tracing::info;
use tokio::sync::RwLock;

use crate::webhook::WebhookService;
use crate::agent::audit::{
    ToolAuditEntry, FailureRecord, ConfirmationAuditEntry,
};

/// SIEM 事件格式
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SiemFormat {
    /// JSON 格式 (默认)
    Json,
    /// Common Event Format (ArcSight 兼容)
    Cef,
}

/// SIEM 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiemConfig {
    /// 是否启用 SIEM 推送
    pub enabled: bool,
    /// 事件格式
    pub format: SiemFormat,
    /// 需要推送的事件类型
    pub event_types: Vec<SiemEventType>,
    /// 最小严重级别 (低于此级别不推送)
    pub min_severity: SiemSeverity,
    /// 批量推送间隔 (毫秒), 0 = 即时推送
    pub batch_interval_ms: u64,
    /// 批量最大数量
    pub batch_size: usize,
}

impl Default for SiemConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            format: SiemFormat::Json,
            event_types: vec![
                SiemEventType::ToolCall,
                SiemEventType::Failure,
                SiemEventType::Confirmation,
            ],
            min_severity: SiemSeverity::Info,
            batch_interval_ms: 5000,
            batch_size: 100,
        }
    }
}

/// SIEM 事件类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SiemEventType {
    ToolCall,
    StepLog,
    Failure,
    Confirmation,
}

/// SIEM 严重级别
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "snake_case")]
pub enum SiemSeverity {
    Debug,
    Info,
    Warning,
    Error,
    Critical,
}

impl std::fmt::Display for SiemSeverity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Debug => write!(f, "Debug"),
            Self::Info => write!(f, "Info"),
            Self::Warning => write!(f, "Warning"),
            Self::Error => write!(f, "Error"),
            Self::Critical => write!(f, "Critical"),
        }
    }
}

/// SIEM 推送的事件负载
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiemEvent {
    /// 事件 ID
    pub id: String,
    /// 事件时间戳
    pub timestamp: i64,
    /// 事件类型
    pub event_type: SiemEventType,
    /// 严重级别
    pub severity: SiemSeverity,
    /// 会话 ID
    pub session_id: String,
    /// 追踪 ID
    pub trace_id: String,
    /// 事件详情 (JSON)
    pub payload: serde_json::Value,
}

/// 审计 SIEM 桥接器
pub struct AuditSiemBridge {
    webhook_service: Arc<WebhookService>,
    config: Arc<RwLock<SiemConfig>>,
    pending_batch: Arc<RwLock<Vec<SiemEvent>>>,
}

impl AuditSiemBridge {
    pub fn new(webhook_service: Arc<WebhookService>, config: SiemConfig) -> Self {
        Self {
            webhook_service,
            config: Arc::new(RwLock::new(config)),
            pending_batch: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// 推送工具审计事件到 SIEM
    pub async fn on_tool_audit(&self, entry: &ToolAuditEntry) {
        let config = self.config.read().await;
        if !config.enabled || !config.event_types.contains(&SiemEventType::ToolCall) {
            return;
        }
        let severity = match entry.status.as_str() {
            "failed" => SiemSeverity::Error,
            _ => SiemSeverity::Info,
        };
        if severity < config.min_severity {
            return;
        }
        drop(config);

        let event = SiemEvent {
            id: entry.id.clone(),
            timestamp: entry.started_at,
            event_type: SiemEventType::ToolCall,
            severity,
            session_id: entry.session_id.clone(),
            trace_id: entry.trace_id.clone(),
            payload: serde_json::to_value(entry).unwrap_or_default(),
        };

        self.push_event(event).await;
    }

    /// 推送失败记录到 SIEM
    pub async fn on_failure(&self, record: &FailureRecord) {
        let config = self.config.read().await;
        if !config.enabled || !config.event_types.contains(&SiemEventType::Failure) {
            return;
        }
        let severity = match record.severity.as_str() {
            "critical" => SiemSeverity::Critical,
            "high" | "error" => SiemSeverity::Error,
            "medium" | "warning" => SiemSeverity::Warning,
            _ => SiemSeverity::Info,
        };
        if severity < config.min_severity {
            return;
        }
        drop(config);

        let event = SiemEvent {
            id: record.id.clone(),
            timestamp: record.created_at,
            event_type: SiemEventType::Failure,
            severity,
            session_id: record.session_id.clone(),
            trace_id: record.trace_id.clone(),
            payload: serde_json::to_value(record).unwrap_or_default(),
        };

        self.push_event(event).await;
    }

    /// 推送确认审计事件到 SIEM
    pub async fn on_confirmation(&self, entry: &ConfirmationAuditEntry) {
        let config = self.config.read().await;
        if !config.enabled || !config.event_types.contains(&SiemEventType::Confirmation) {
            return;
        }
        drop(config);

        let event = SiemEvent {
            id: entry.id.clone(),
            timestamp: entry.requested_at,
            event_type: SiemEventType::Confirmation,
            severity: SiemSeverity::Info,
            session_id: entry.session_id.clone(),
            trace_id: entry.trace_id.clone(),
            payload: serde_json::to_value(entry).unwrap_or_default(),
        };

        self.push_event(event).await;
    }

    /// 更新 SIEM 配置
    pub async fn update_config(&self, new_config: SiemConfig) {
        let mut config = self.config.write().await;
        info!("Updating SIEM config: enabled={}", new_config.enabled);
        *config = new_config;
    }

    /// 获取当前配置
    pub async fn get_config(&self) -> SiemConfig {
        self.config.read().await.clone()
    }

    /// 获取待推送批量数
    pub async fn pending_count(&self) -> usize {
        self.pending_batch.read().await.len()
    }

    /// 刷新批量推送
    pub async fn flush(&self) {
        let mut batch = self.pending_batch.write().await;
        if batch.is_empty() {
            return;
        }
        let events: Vec<SiemEvent> = std::mem::take(&mut *batch);
        drop(batch);

        for event in &events {
            self.send_to_webhook(event).await;
        }
        info!("Flushed {} SIEM events", events.len());
    }

    // ---- 内部方法 ----

    async fn push_event(&self, event: SiemEvent) {
        let config = self.config.read().await;

        if config.batch_interval_ms == 0 {
            // 即时推送
            drop(config);
            self.send_to_webhook(&event).await;
            return;
        }

        // 批量模式
        let batch_size = config.batch_size;
        drop(config);

        let mut batch = self.pending_batch.write().await;
        batch.push(event);

        if batch.len() >= batch_size {
            let events: Vec<SiemEvent> = std::mem::take(&mut *batch);
            drop(batch);
            for ev in &events {
                self.send_to_webhook(ev).await;
            }
        }
    }

    async fn send_to_webhook(&self, event: &SiemEvent) {
        let config = self.config.read().await;
        let event_type = format!("siem.{}", match event.event_type {
            SiemEventType::ToolCall => "tool_call",
            SiemEventType::StepLog => "step_log",
            SiemEventType::Failure => "failure",
            SiemEventType::Confirmation => "confirmation",
        });

        let payload = match config.format {
            SiemFormat::Json => serde_json::to_value(event).unwrap_or_default(),
            SiemFormat::Cef => serde_json::to_value(&self.to_cef(event)).unwrap_or_default(),
        };
        drop(config);

        let results = self.webhook_service.trigger_event(&event_type, payload).await;
        if results.is_empty() {
            // 无 SIEM webhook 注册，静默忽略
        } else {
            info!("SIEM event {} pushed to {} webhook(s)", event.id, results.len());
        }
    }

    /// 转换为 CEF 格式字符串
    fn to_cef(&self, event: &SiemEvent) -> String {
        let severity_num = match event.severity {
            SiemSeverity::Debug => 0,
            SiemSeverity::Info => 2,
            SiemSeverity::Warning => 4,
            SiemSeverity::Error => 6,
            SiemSeverity::Critical => 8,
        };
        format!(
            "CEF:0|AI-Office|Audit|1.0|{}|{}|{}|session_id={} trace_id={} payload={}",
            match event.event_type {
                SiemEventType::ToolCall => "ToolCall",
                SiemEventType::StepLog => "StepLog",
                SiemEventType::Failure => "Failure",
                SiemEventType::Confirmation => "Confirmation",
            },
            event.id,
            severity_num,
            event.session_id,
            event.trace_id,
            event.payload.to_string().chars().take(500).collect::<String>(),
        )
    }
}

// ============ 单元测试 ============

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_siem_severity_ordering() {
        assert!(SiemSeverity::Debug < SiemSeverity::Info);
        assert!(SiemSeverity::Info < SiemSeverity::Warning);
        assert!(SiemSeverity::Warning < SiemSeverity::Error);
        assert!(SiemSeverity::Error < SiemSeverity::Critical);
    }

    #[test]
    fn test_siem_config_default() {
        let config = SiemConfig::default();
        assert!(!config.enabled);
        assert_eq!(config.format, SiemFormat::Json);
        assert!(config.event_types.contains(&SiemEventType::ToolCall));
        assert!(config.event_types.contains(&SiemEventType::Failure));
    }

    #[test]
    fn test_siem_event_serialization() {
        let event = SiemEvent {
            id: "evt-1".to_string(),
            timestamp: 1000,
            event_type: SiemEventType::ToolCall,
            severity: SiemSeverity::Info,
            session_id: "sess-1".to_string(),
            trace_id: "trace-1".to_string(),
            payload: serde_json::json!({"tool": "read_file"}),
        };
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("evt-1"));
        assert!(json.contains("tool_call"));
    }

    #[test]
    fn test_cef_format() {
        let webhook_service = Arc::new(WebhookService::new());
        let bridge = AuditSiemBridge::new(webhook_service, SiemConfig::default());

        let event = SiemEvent {
            id: "evt-1".to_string(),
            timestamp: 1000,
            event_type: SiemEventType::Failure,
            severity: SiemSeverity::Error,
            session_id: "sess-1".to_string(),
            trace_id: "trace-1".to_string(),
            payload: serde_json::json!({"error": "test"}),
        };

        let cef = bridge.to_cef(&event);
        assert!(cef.starts_with("CEF:0|AI-Office|Audit|1.0|Failure|evt-1|6|"));
    }

    #[test]
    fn test_siem_format_serde() {
        assert_eq!(serde_json::to_string(&SiemFormat::Json).unwrap(), "\"json\"");
        assert_eq!(serde_json::to_string(&SiemFormat::Cef).unwrap(), "\"cef\"");
    }
}
