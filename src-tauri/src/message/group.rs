//! 群组管理模块
//!
//! 实现FR631-FR649: 群聊功能
//! - 群组CRUD
//! - 成员管理
//! - Agent跟随入群
//! - @提及检测和响应

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 群组类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum GroupType {
    /// 公开群 - 任何人都可以加入
    Public,
    /// 私有群 - 需要邀请才能加入
    Private,
}

impl Default for GroupType {
    fn default() -> Self {
        Self::Public
    }
}

/// 成员角色
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MemberRole {
    /// 群主
    Owner,
    /// 管理员
    Admin,
    /// 普通成员
    Member,
}

impl Default for MemberRole {
    fn default() -> Self {
        Self::Member
    }
}

/// 群组成员
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupMember {
    /// 用户ID
    pub user_id: String,
    /// 角色
    pub role: MemberRole,
    /// Agent是否自动入群
    pub agent_enabled: bool,
    /// 加入时间
    pub joined_at: DateTime<Utc>,
    /// 离开时间
    pub left_at: Option<DateTime<Utc>>,
    /// Agent ID (如果Agent入群)
    pub agent_id: Option<String>,
}

impl GroupMember {
    pub fn new(user_id: String, role: MemberRole) -> Self {
        Self {
            user_id,
            role,
            agent_enabled: true,
            joined_at: Utc::now(),
            left_at: None,
            agent_id: None,
        }
    }

    pub fn is_active(&self) -> bool {
        self.left_at.is_none()
    }

    pub fn is_owner(&self) -> bool {
        self.role == MemberRole::Owner
    }

    pub fn is_admin(&self) -> bool {
        matches!(self.role, MemberRole::Owner | MemberRole::Admin)
    }
}

/// 群组
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Group {
    /// 群组ID (UUID)
    pub id: String,
    /// 群名称
    pub name: String,
    /// 群公告
    pub announcement: String,
    /// 群主ID
    pub owner_id: String,
    /// 群类型
    pub group_type: GroupType,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 成员数量
    pub member_count: usize,
    /// 成员列表
    pub members: Vec<GroupMember>,
}

impl Group {
    pub fn new(name: String, owner_id: String, group_type: GroupType) -> Self {
        let id = Uuid::new_v4().to_string();
        let mut members = vec![GroupMember::new(owner_id.clone(), MemberRole::Owner)];
        
        Self {
            id,
            name,
            announcement: String::new(),
            owner_id,
            group_type,
            created_at: Utc::now(),
            member_count: 1,
            members,
        }
    }

    pub fn add_member(&mut self, member: GroupMember) -> bool {
        // 检查是否已在群中
        if self.members.iter().any(|m| m.user_id == member.user_id && m.is_active()) {
            return false;
        }
        
        self.members.push(member);
        self.member_count = self.members.iter().filter(|m| m.is_active()).count();
        true
    }

    pub fn remove_member(&mut self, user_id: &str) -> bool {
        if let Some(member) = self.members.iter_mut().find(|m| m.user_id == user_id) {
            member.left_at = Some(Utc::now());
            self.member_count = self.members.iter().filter(|m| m.is_active()).count();
            return true;
        }
        false
    }

    pub fn get_member(&self, user_id: &str) -> Option<&GroupMember> {
        self.members.iter().find(|m| m.user_id == user_id && m.is_active())
    }

    pub fn get_member_mut(&mut self, user_id: &str) -> Option<&mut GroupMember> {
        self.members.iter_mut().find(|m| m.user_id == user_id && m.is_active())
    }

    pub fn is_member(&self, user_id: &str) -> bool {
        self.get_member(user_id).is_some()
    }

    pub fn is_admin(&self, user_id: &str) -> bool {
        self.get_member(user_id).map(|m| m.is_admin()).unwrap_or(false)
    }

    pub fn can_manage_member(&self, user_id: &str, target_user_id: &str) -> bool {
        // 群主可以管理任何人
        if self.get_member(user_id).map(|m| m.is_owner()).unwrap_or(false) {
            return true;
        }
        // 管理员可以管理普通成员
        if self.get_member(user_id).map(|m| m.role == MemberRole::Admin).unwrap_or(false) {
            if let Some(target) = self.get_member(target_user_id) {
                return target.role == MemberRole::Member;
            }
        }
        false
    }
}

/// 群组存储服务
pub struct GroupStore {
    /// 群组映射
    groups: Arc<RwLock<HashMap<String, Group>>>,
    /// 用户所在群组映射
    user_groups: Arc<RwLock<HashMap<String, Vec<String>>>>,
}

impl GroupStore {
    pub fn new() -> Self {
        Self {
            groups: Arc::new(RwLock::new(HashMap::new())),
            user_groups: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 创建群组
    pub async fn create_group(
        &self,
        name: String,
        owner_id: String,
        group_type: GroupType,
    ) -> Group {
        let group = Group::new(name, owner_id.clone(), group_type);
        let group_id = group.id.clone();
        
        // 保存群组
        let mut groups = self.groups.write().await;
        groups.insert(group_id.clone(), group.clone());
        
        // 更新用户群组映射
        let mut user_groups = self.user_groups.write().await;
        user_groups
            .entry(owner_id)
            .or_insert_with(Vec::new)
            .push(group_id.clone());
        
        group
    }

    /// 更新群组
    pub async fn update_group(
        &self,
        group_id: &str,
        name: Option<String>,
        announcement: Option<String>,
        updater_id: &str,
    ) -> Result<Group, GroupError> {
        let mut groups = self.groups.write().await;
        
        let group = groups.get_mut(group_id)
            .ok_or(GroupError::GroupNotFound)?;
        
        // 检查权限
        if !group.is_admin(updater_id) {
            return Err(GroupError::PermissionDenied);
        }
        
        if let Some(name) = name {
            group.name = name;
        }
        if let Some(announcement) = announcement {
            group.announcement = announcement;
        }
        
        Ok(group.clone())
    }

    /// 删除群组
    pub async fn delete_group(
        &self,
        group_id: &str,
        user_id: &str,
    ) -> Result<(), GroupError> {
        let mut groups = self.groups.write().await;
        
        let group = groups.get(group_id)
            .ok_or(GroupError::GroupNotFound)?;
        
        // 只有群主可以删除
        if group.owner_id != user_id {
            return Err(GroupError::PermissionDenied);
        }
        
        // 移除所有用户的群组映射
        let mut user_groups = self.user_groups.write().await;
        for member in &group.members {
            if let Some(groups) = user_groups.get_mut(&member.user_id) {
                groups.retain(|g| g != group_id);
            }
        }
        
        // 删除群组
        groups.remove(group_id);
        
        Ok(())
    }

    /// 获取群组
    pub async fn get_group(&self, group_id: &str) -> Result<Group, GroupError> {
        let groups = self.groups.read().await;
        
        groups.get(group_id)
            .map(|g| g.clone())
            .ok_or(GroupError::GroupNotFound)
    }

    /// 获取用户的群组列表
    pub async fn get_user_groups(&self, user_id: &str) -> Vec<Group> {
        let user_groups = self.user_groups.read().await;
        let groups = self.groups.read().await;
        
        user_groups.get(user_id)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| groups.get(id).cloned())
                    .collect()
            })
            .unwrap_or_default()
    }

    /// 添加成员
    pub async fn add_member(
        &self,
        group_id: &str,
        user_id: String,
        role: MemberRole,
        inviter_id: &str,
    ) -> Result<GroupMember, GroupError> {
        let mut groups = self.groups.write().await;
        
        let group = groups.get_mut(group_id)
            .ok_or(GroupError::GroupNotFound)?;
        
        // 检查邀请者权限
        if !group.is_admin(inviter_id) {
            return Err(GroupError::PermissionDenied);
        }
        
        // 检查是否已在群中
        if group.is_member(&user_id) {
            return Err(GroupError::AlreadyMember);
        }
        
        let member = GroupMember::new(user_id.clone(), role);
        
        if group.add_member(member.clone()) {
            // 更新用户群组映射
            drop(groups);
            let mut user_groups = self.user_groups.write().await;
            user_groups
                .entry(user_id)
                .or_insert_with(Vec::new)
                .push(group_id.to_string());
            
            Ok(member)
        } else {
            Err(GroupError::AlreadyMember)
        }
    }

    /// 移除成员
    pub async fn remove_member(
        &self,
        group_id: &str,
        user_id: &str,
        remover_id: &str,
    ) -> Result<(), GroupError> {
        let mut groups = self.groups.write().await;
        
        let group = groups.get_mut(group_id)
            .ok_or(GroupError::GroupNotFound)?;
        
        // 检查权限
        if !group.can_manage_member(remover_id, user_id) {
            return Err(GroupError::PermissionDenied);
        }
        
        // 不能移除群主
        if group.owner_id == user_id {
            return Err(GroupError::CannotRemoveOwner);
        }
        
        group.remove_member(user_id);
        
        Ok(())
    }

    /// 设置成员Agent自动入群
    pub async fn set_agent_auto_join(
        &self,
        group_id: &str,
        user_id: &str,
        enabled: bool,
        setter_id: &str,
    ) -> Result<(), GroupError> {
        let mut groups = self.groups.write().await;
        
        let group = groups.get_mut(group_id)
            .ok_or(GroupError::GroupNotFound)?;
        
        // 只有成员自己可以设置
        if user_id != setter_id {
            return Err(GroupError::PermissionDenied);
        }
        
        let member = group.get_member_mut(user_id)
            .ok_or(GroupError::NotMember)?;
        
        member.agent_enabled = enabled;
        
        Ok(())
    }

    /// 设置管理员
    pub async fn set_admin(
        &self,
        group_id: &str,
        user_id: &str,
        is_admin: bool,
        setter_id: &str,
    ) -> Result<(), GroupError> {
        let mut groups = self.groups.write().await;
        
        let group = groups.get_mut(group_id)
            .ok_or(GroupError::GroupNotFound)?;
        
        // 只有群主可以设置管理员
        if group.owner_id != setter_id {
            return Err(GroupError::PermissionDenied);
        }
        
        let member = group.get_member_mut(user_id)
            .ok_or(GroupError::NotMember)?;
        
        member.role = if is_admin { MemberRole::Admin } else { MemberRole::Member };
        
        Ok(())
    }

    /// 获取群成员列表
    pub async fn get_members(&self, group_id: &str) -> Result<Vec<GroupMember>, GroupError> {
        let groups = self.groups.read().await;
        
        let group = groups.get(group_id)
            .ok_or(GroupError::GroupNotFound)?;
        
        Ok(group.members.iter().filter(|m| m.is_active()).cloned().collect())
    }
}

impl Default for GroupStore {
    fn default() -> Self {
        Self::new()
    }
}

/// 群组错误
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum GroupError {
    /// GC_001: 群不存在
    GroupNotFound,
    /// GC_002: 无权限操作
    PermissionDenied,
    /// GC_003: 用户已在群中
    AlreadyMember,
    /// GC_004: 用户不在群中
    NotMember,
    /// GC_005: 不能移除群主
    CannotRemoveOwner,
}

impl std::fmt::Display for GroupError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::GroupNotFound => write!(f, "GC_001: 群组不存在"),
            Self::PermissionDenied => write!(f, "GC_002: 无权限操作"),
            Self::AlreadyMember => write!(f, "GC_003: 用户已在群中"),
            Self::NotMember => write!(f, "GC_004: 用户不在群中"),
            Self::CannotRemoveOwner => write!(f, "GC_005: 不能移除群主"),
        }
    }
}

impl std::error::Error for GroupError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_group() {
        let store = GroupStore::new();
        
        let group = store.create_group(
            "测试群".to_string(),
            "user-1".to_string(),
            GroupType::Public,
        ).await;
        
        assert_eq!(group.name, "测试群");
        assert_eq!(group.owner_id, "user-1");
        assert_eq!(group.member_count, 1);
    }

    #[tokio::test]
    async fn test_add_member() {
        let store = GroupStore::new();
        
        let group = store.create_group(
            "测试群".to_string(),
            "user-1".to_string(),
            GroupType::Public,
        ).await;
        
        let member = store.add_member(
            &group.id,
            "user-2".to_string(),
            MemberRole::Member,
            "user-1",
        ).await.unwrap();
        
        assert_eq!(member.user_id, "user-2");
        assert_eq!(member.role, MemberRole::Member);
    }

    #[tokio::test]
    async fn test_remove_member() {
        let store = GroupStore::new();
        
        let group = store.create_group(
            "测试群".to_string(),
            "user-1".to_string(),
            GroupType::Public,
        ).await;
        
        let _member = store.add_member(
            &group.id,
            "user-2".to_string(),
            MemberRole::Member,
            "user-1",
        ).await.unwrap();
        
        store.remove_member(&group.id, "user-2", "user-1").await.unwrap();
        
        let group = store.get_group(&group.id).await.unwrap();
        assert!(!group.is_member("user-2"));
    }
}
