//! 群消息模块
//!
//! 实现FR640-FR641: @提及检测和响应

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::group::GroupStore;

/// 群消息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupMessage {
    /// 消息ID
    pub id: String,
    /// 群组ID
    pub group_id: String,
    /// 发送者ID
    pub sender_id: String,
    /// 发送者类型 (user/agent)
    pub sender_type: String,
    /// 消息内容
    pub content: String,
    /// @提及的用户列表
    pub mentions: Vec<String>,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 引用回复的消息ID
    pub reply_to: Option<String>,
    /// Agent响应ID (如果有)
    pub agent_response_id: Option<String>,
}

impl GroupMessage {
    pub fn new(group_id: String, sender_id: String, sender_type: String, content: String) -> Self {
        let mentions = Self::parse_mentions(&content);
        
        Self {
            id: Uuid::new_v4().to_string(),
            group_id,
            sender_id,
            sender_type,
            content,
            mentions,
            created_at: Utc::now(),
            reply_to: None,
            agent_response_id: None,
        }
    }

    /// 解析@提及
    pub fn parse_mentions(content: &str) -> Vec<String> {
        let mut mentions = Vec::new();
        let mut word = String::new();
        let mut in_mention = false;
        
        for ch in content.chars() {
            if ch == '@' {
                in_mention = true;
                word.clear();
            } else if in_mention {
                if ch.is_alphanumeric() || ch == '_' || ch == '-' {
                    word.push(ch);
                } else {
                    if !word.is_empty() {
                        mentions.push(word.clone());
                    }
                    in_mention = false;
                    word.clear();
                }
            }
        }
        
        // 处理末尾的@
        if in_mention && !word.is_empty() {
            mentions.push(word);
        }
        
        mentions
    }

    pub fn is_agent_message(&self) -> bool {
        self.sender_type == "agent"
    }
}

/// 群消息存储
pub struct GroupMessageStore {
    /// 群组消息映射
    messages: Arc<RwLock<HashMap<String, Vec<GroupMessage>>>>,
    /// @提及记录
    mentions: Arc<RwLock<HashMap<String, Vec<String>>>>,
}

impl GroupMessageStore {
    pub fn new() -> Self {
        Self {
            messages: Arc::new(RwLock::new(HashMap::new())),
            mentions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 发送群消息
    pub async fn send_message(&self, message: GroupMessage) -> GroupMessage {
        let group_id = message.group_id.clone();
        let message_id = message.id.clone();
        let mentions = message.mentions.clone();
        
        // 保存消息
        let mut messages = self.messages.write().await;
        messages
            .entry(group_id.clone())
            .or_insert_with(Vec::new)
            .push(message.clone());
        
        // 记录@提及
        if !mentions.is_empty() {
            let mut mentions_store = self.mentions.write().await;
            for user_id in &mentions {
                mentions_store
                    .entry(user_id.clone())
                    .or_insert_with(Vec::new)
                    .push(message_id.clone());
            }
        }
        
        message
    }

    /// 获取群消息
    pub async fn get_messages(
        &self,
        group_id: &str,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Vec<GroupMessage> {
        let messages = self.messages.read().await;
        
        let limit = limit.unwrap_or(50);
        let offset = offset.unwrap_or(0);
        
        messages.get(group_id)
            .map(|msgs| {
                let start = offset.min(msgs.len());
                let end = (offset + limit).min(msgs.len());
                msgs[start..end].to_vec()
            })
            .unwrap_or_default()
    }

    /// 获取用户被@的消息
    pub async fn get_mentions(&self, user_id: &str) -> Vec<GroupMessage> {
        let mentions_store = self.mentions.read().await;
        let messages = self.messages.read().await;
        
        mentions_store.get(user_id)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| {
                        messages.values()
                            .flatten()
                            .find(|m| m.id == *id)
                    })
                    .cloned()
                    .collect()
            })
            .unwrap_or_default()
    }

    /// 获取未读的@消息
    pub async fn get_unread_mentions(
        &self,
        user_id: &str,
        since: DateTime<Utc>,
    ) -> Vec<GroupMessage> {
        self.get_mentions(user_id).await
            .into_iter()
            .filter(|m| m.created_at > since)
            .collect()
    }
}

impl Default for GroupMessageStore {
    fn default() -> Self {
        Self::new()
    }
}

/// @提及处理器
pub struct MentionHandler {
    /// 群组存储
    group_store: Arc<GroupStore>,
    /// 消息存储
    message_store: Arc<GroupMessageStore>,
    /// Agent服务引用
    agent_service: Option<Arc<dyn AgentGroupResponder>>,
}

impl MentionHandler {
    pub fn new(
        group_store: Arc<GroupStore>,
        message_store: Arc<GroupMessageStore>,
    ) -> Self {
        Self {
            group_store,
            message_store,
            agent_service: None,
        }
    }

    pub fn with_agent_service(
        mut self,
        service: Arc<dyn AgentGroupResponder>,
    ) -> Self {
        self.agent_service = Some(service);
        self
    }

    /// 处理群消息中的@提及
    pub async fn handle_message(
        &self,
        message: &GroupMessage,
    ) -> Vec<GroupMessage> {
        let mut responses = Vec::new();
        
        for mentioned_user in &message.mentions {
            // 查找被@用户的Agent
            if let Some(agent_response) = self.agent_service.as_ref() {
                // 检查用户Agent是否启用
                if let Ok(group) = self.group_store.get_group(&message.group_id).await {
                    if let Some(member) = group.get_member(mentioned_user) {
                        if member.agent_enabled {
                            // Agent代为响应
                            let response = agent_response.respond_to_mention(
                                mentioned_user,
                                &message.group_id,
                                message,
                            ).await;
                            
                            if let Some(response) = response {
                                responses.push(response);
                            }
                        }
                    }
                }
            }
        }
        
        responses
    }

    /// 解析@提及并获取用户
    pub async fn resolve_mentions(&self, content: &str) -> Vec<String> {
        let mentions = GroupMessage::parse_mentions(content);
        
        // 过滤出有效的群成员
        let mut valid_users = Vec::new();
        
        // TODO: 从用户服务获取用户信息验证
        // 目前返回所有解析出的提及
        for user_id in mentions {
            valid_users.push(user_id);
        }
        
        valid_users
    }
}

/// Agent群聊响应接口
pub trait AgentGroupResponder: Send + Sync {
    /// 响应@提及
    async fn respond_to_mention(
        &self,
        user_id: &str,
        group_id: &str,
        original_message: &GroupMessage,
    ) -> Option<GroupMessage>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_mentions() {
        let content = "大家好，我是@张三，请@李四帮忙看看这个文档";
        let mentions = GroupMessage::parse_mentions(content);
        
        assert_eq!(mentions.len(), 2);
        assert!(mentions.contains(&"张三".to_string()));
        assert!(mentions.contains(&"李四".to_string()));
    }

    #[tokio::test]
    async fn test_send_message() {
        let store = GroupMessageStore::new();
        
        let message = GroupMessage::new(
            "group-1".to_string(),
            "user-1".to_string(),
            "user".to_string(),
            "大家好 @张三 @李四".to_string(),
        );
        
        let saved = store.send_message(message).await;
        assert_eq!(saved.mentions.len(), 2);
        
        // 检查@提及记录
        let mentions = store.get_mentions("张三").await;
        assert!(!mentions.is_empty());
    }
}
