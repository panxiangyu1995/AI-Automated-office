//! 部门间通信模块
//!
//! 提供部门间消息发送、订阅、请求/响应模式等功能

use crate::department::types::*;
use crate::department::registry::DepartmentRegistry;
use std::collections::HashMap;
use std::sync::RwLock;
use tracing::{error, info, warn};

/// 消息处理器类型
pub type MessageHandler = Box<dyn Fn(DepartmentMessage) -> Result<serde_json::Value, String> + Send + Sync>;

/// 消息订阅者
struct Subscriber {
    /// 部门代码
    department: DepartmentCode,
    /// 消息处理器
    handler: MessageHandler,
    /// 订阅的消息类型
    message_types: Vec<MessageType>,
}

/// 部门间通信管理器
pub struct DepartmentMessageBus {
    /// 消息处理器映射: target_department -> handlers
    subscribers: RwLock<HashMap<String, Vec<Subscriber>>>,
    /// 消息历史
    message_history: RwLock<Vec<DepartmentMessage>>,
    /// 挂起的请求映射: correlation_id -> response_receiver
    pending_requests: RwLock<HashMap<String, tokio::sync::oneshot::Sender<Result<serde_json::Value, String>>>>,
    /// 最大历史记录数
    max_history_size: usize,
}

impl DepartmentMessageBus {
    /// 创建新的消息总线实例
    pub fn new() -> Self {
        info!("初始化部门间消息总线");
        Self {
            subscribers: RwLock::new(HashMap::new()),
            message_history: RwLock::new(Vec::new()),
            pending_requests: RwLock::new(HashMap::new()),
            max_history_size: 1000,
        }
    }

    /// 发送消息到目标部门
    pub fn send(&self, message: DepartmentMessage) -> Result<MessageResponse, (DepartmentErrorCode, String)> {
        let message_id = message.id.clone();
        let target_code = message.to.to_string();

        info!(
            "发送消息: {} -> {} (类型: {:?})",
            message.from, message.to, message.message_type
        );

        // 查找并筛选订阅者，处理消息，同时保持锁
        let (errors, response_data) = {
            let subscribers = self.subscribers.read().unwrap();
            let matching_handlers: Vec<&Subscriber> = match subscribers.get(&target_code) {
                Some(subs) => subs
                    .iter()
                    .filter(|s| s.message_types.contains(&message.message_type) || s.message_types.is_empty())
                    .collect(),
                None => Vec::new(),
            };

            if matching_handlers.is_empty() {
                warn!("目标部门 {} 没有处理此类型消息的处理器", target_code);
            }

            // 调用处理器
            let mut errors: Vec<String> = Vec::new();
            let mut response_data: Option<serde_json::Value> = None;

            for handler_info in matching_handlers {
                let handler: &MessageHandler = &handler_info.handler;
                match handler(message.clone()) {
                    Ok(data) => {
                        if response_data.is_none() {
                            response_data = Some(data);
                        }
                    }
                    Err(e) => {
                        errors.push(e.clone());
                        error!("消息处理失败: {}", e);
                    }
                }
            }

            (errors, response_data)
        }; // Guard dropped here

        // 记录消息历史
        self.add_to_history(message);

        // 返回响应
        Ok(MessageResponse {
            message_id,
            status: if errors.is_empty() {
                MessageStatus::Completed
            } else {
                MessageStatus::Failed
            },
            response_data,
            error: if errors.is_empty() {
                None
            } else {
                Some(errors.join("; "))
            },
        })
    }

    /// 发送请求并等待响应（请求/响应模式）
    pub async fn send_request(
        &self,
        from: DepartmentCode,
        to: DepartmentCode,
        message_type: MessageType,
        payload: serde_json::Value,
    ) -> Result<serde_json::Value, (DepartmentErrorCode, String)> {
        let correlation_id = uuid::Uuid::new_v4().to_string();
        let message = DepartmentMessage {
            id: uuid::Uuid::new_v4().to_string(),
            from,
            to: to.clone(),
            message_type,
            payload,
            correlation_id: Some(correlation_id.clone()),
            timestamp: chrono::Utc::now().timestamp_millis(),
            status: MessageStatus::Pending,
        };

        // 创建响应接收器
        let (tx, rx) = tokio::sync::oneshot::channel();

        {
            let mut pending = self.pending_requests.write().unwrap();
            pending.insert(correlation_id.clone(), tx);
        }

        // 发送消息
        let response = self.send(message)?;

        if response.status == MessageStatus::Completed {
            if let Some(data) = response.response_data {
                // 清理挂起的请求
                {
                    let mut pending = self.pending_requests.write().unwrap();
                    pending.remove(&correlation_id);
                }
                return Ok(data);
            }
        }

        // 如果响应未完成，等待异步响应
        match rx.await {
            Ok(result) => result.map_err(|e| (DepartmentErrorCode::MessageSendFailed, e)),
            Err(_) => Err((
                DepartmentErrorCode::MessageSendFailed,
                "等待响应超时".to_string(),
            )),
        }
    }

    /// 订阅消息
    pub fn subscribe<F>(
        &self,
        department: DepartmentCode,
        message_types: Vec<MessageType>,
        handler: F,
    ) where
        F: Fn(DepartmentMessage) -> Result<serde_json::Value, String> + Send + Sync + 'static,
    {
        let dept_code = department.to_string();
        let mut subscribers = self.subscribers.write().unwrap();

        subscribers
            .entry(dept_code)
            .or_insert_with(Vec::new)
            .push(Subscriber {
                department,
                handler: Box::new(handler),
                message_types,
            });

        info!("部门订阅消息成功");
    }

    /// 取消订阅
    pub fn unsubscribe(&self, department: &DepartmentCode) {
        let dept_code = department.to_string();
        let mut subscribers = self.subscribers.write().unwrap();
        subscribers.remove(&dept_code);
        info!("部门 {} 取消订阅", dept_code);
    }

    /// 发送响应（供内部或测试使用）
    pub fn send_response(&self, correlation_id: &str, result: Result<serde_json::Value, String>) -> Result<(), (DepartmentErrorCode, String)> {
        let mut pending = self.pending_requests.write().unwrap();
        if let Some(sender) = pending.remove(correlation_id) {
            sender.send(result).map_err(|_| {
                (
                    DepartmentErrorCode::MessageSendFailed,
                    "发送响应失败".to_string(),
                )
            })?;
            Ok(())
        } else {
            Err((
                DepartmentErrorCode::NotFound,
                format!("未找到 correlation_id: {}", correlation_id),
            ))
        }
    }

    /// 获取消息历史
    pub fn get_history(&self, limit: Option<usize>) -> Vec<DepartmentMessage> {
        let history = self.message_history.read().unwrap();
        let limit = limit.unwrap_or(self.max_history_size);
        history.iter().rev().take(limit).cloned().collect()
    }

    /// 按部门获取消息历史
    pub fn get_history_by_department(&self, department: &DepartmentCode, limit: Option<usize>) -> Vec<DepartmentMessage> {
        let dept_code = department.to_string();
        let history = self.message_history.read().unwrap();
        let limit = limit.unwrap_or(100);

        history
            .iter()
            .filter(|m| m.from.to_string() == dept_code || m.to.to_string() == dept_code)
            .rev()
            .take(limit)
            .cloned()
            .collect()
    }

    /// 清空消息历史
    pub fn clear_history(&self) {
        let mut history = self.message_history.write().unwrap();
        history.clear();
        info!("消息历史已清空");
    }

    /// 获取订阅者数量
    pub fn subscriber_count(&self) -> usize {
        let subscribers = self.subscribers.read().unwrap();
        subscribers.values().map(|v| v.len()).sum()
    }

    /// 添加消息到历史记录
    fn add_to_history(&self, message: DepartmentMessage) {
        let mut history = self.message_history.write().unwrap();

        // 限制历史记录大小
        if history.len() >= self.max_history_size {
            history.remove(0);
        }

        history.push(message);
    }

    /// 广播消息到所有已加载的部门
    pub fn broadcast(&self, from: DepartmentCode, message_type: MessageType, payload: serde_json::Value, registry: &DepartmentRegistry) -> Vec<Result<MessageResponse, (DepartmentErrorCode, String)>> {
        let loaded_departments = registry.get_all()
            .into_iter()
            .filter(|d| d.status == DepartmentStatus::Active && d.code != from)
            .collect::<Vec<_>>();

        let mut results = Vec::new();

        for dept in loaded_departments {
            let message = DepartmentMessage {
                id: uuid::Uuid::new_v4().to_string(),
                from: from.clone(),
                to: dept.code.clone(),
                message_type: message_type.clone(),
                payload: payload.clone(),
                correlation_id: None,
                timestamp: chrono::Utc::now().timestamp_millis(),
                status: MessageStatus::Pending,
            };

            results.push(self.send(message));
        }

        results
    }
}

impl Default for DepartmentMessageBus {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_send() {
        let bus = DepartmentMessageBus::new();

        let message = DepartmentMessage {
            id: "test-1".to_string(),
            from: DepartmentCode::Hr,
            to: DepartmentCode::Sales,
            message_type: MessageType::Event,
            payload: serde_json::json!({"test": "data"}),
            correlation_id: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
            status: MessageStatus::Pending,
        };

        let result = bus.send(message);
        assert!(result.is_ok());
    }

    #[test]
    fn test_subscribe() {
        let bus = DepartmentMessageBus::new();

        bus.subscribe(
            DepartmentCode::Sales,
            vec![MessageType::Event],
            |msg| {
                Ok(serde_json::json!({
                    "received": true,
                    "from": msg.from.to_string()
                }))
            },
        );

        assert_eq!(bus.subscriber_count(), 1);
    }

    #[test]
    fn test_history() {
        let bus = DepartmentMessageBus::new();

        let message = DepartmentMessage {
            id: "test-1".to_string(),
            from: DepartmentCode::Hr,
            to: DepartmentCode::Sales,
            message_type: MessageType::Event,
            payload: serde_json::json!({}),
            correlation_id: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
            status: MessageStatus::Pending,
        };

        bus.send(message.clone()).unwrap();

        let history = bus.get_history(Some(10));
        assert_eq!(history.len(), 1);
    }
}
