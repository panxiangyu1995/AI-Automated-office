//! Marketing 模块数据库操作

use crate::marketing::types::*;
use std::collections::HashMap;
use std::sync::RwLock;
use tracing::info;

/// Marketing 数据库状态
pub struct MarketingDatabase {
    campaigns: RwLock<HashMap<String, Campaign>>,
    contents: RwLock<HashMap<String, MarketingContent>>,
    channels: RwLock<HashMap<String, Channel>>,
    campaign_id_index: RwLock<HashMap<String, String>>,
    content_id_index: RwLock<HashMap<String, String>>,
    channel_id_index: RwLock<HashMap<String, String>>,
}

impl MarketingDatabase {
    pub fn new() -> Self {
        info!("初始化 Marketing 数据库");
        Self {
            campaigns: RwLock::new(HashMap::new()),
            contents: RwLock::new(HashMap::new()),
            channels: RwLock::new(HashMap::new()),
            campaign_id_index: RwLock::new(HashMap::new()),
            content_id_index: RwLock::new(HashMap::new()),
            channel_id_index: RwLock::new(HashMap::new()),
        }
    }

    pub fn init_defaults(&self) {
        info!("Marketing 数据库初始化完成");
    }

    // ==================== 活动操作 ====================

    pub fn create_campaign(&self, campaign: Campaign) -> Result<Campaign, String> {
        let mut campaigns = self.campaigns.write().map_err(|_| "获取写入锁失败".to_string())?;
        let id = campaign.id.clone();
        campaigns.insert(id.clone(), campaign.clone());
        if let Ok(mut index) = self.campaign_id_index.write() {
            let _ = index.insert(id.clone(), id);
        }
        info!("创建营销活动成功: {}", campaign.name);
        Ok(campaign)
    }

    pub fn get_campaign(&self, id: &str) -> Option<Campaign> {
        self.campaigns.read().ok()?.get(id).cloned()
    }

    pub fn list_campaigns(&self, params: &QueryCampaignsParams) -> PagedResult<CampaignListItem> {
        let campaigns = self.campaigns.read().unwrap_or_else(|e| e.into_inner());

        let mut items: Vec<CampaignListItem> = campaigns
            .values()
            .filter(|c| {
                if let Some(ref ct) = params.campaign_type {
                    if &c.campaign_type != ct { return false; }
                }
                if let Some(ref status) = params.status {
                    if &c.status != status { return false; }
                }
                if let Some(ref search) = params.search {
                    let search_lower = search.to_lowercase();
                    if !c.name.to_lowercase().contains(&search_lower) { return false; }
                }
                true
            })
            .map(|c| CampaignListItem {
                id: c.id.clone(),
                name: c.name.clone(),
                campaign_type: c.campaign_type,
                status: c.status,
                start_date: c.start_date.clone(),
                end_date: c.end_date.clone(),
                budget: c.budget,
                created_at: c.created_at,
                updated_at: c.updated_at,
            })
            .collect();

        items.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        let page = params.page.unwrap_or(1).max(1);
        let page_size = params.page_size.unwrap_or(20).min(100);
        let total = items.len() as u32;
        let start = ((page - 1) * page_size) as usize;
        let end = (start + page_size as usize).min(items.len());
        let page_items = if start < items.len() { items[start..end].to_vec() } else { Vec::new() };

        PagedResult { items: page_items, total, page, page_size }
    }

    pub fn update_campaign(&self, id: &str, request: UpdateCampaignRequest) -> Result<Campaign, String> {
        let mut campaigns = self.campaigns.write().map_err(|_| "获取写入锁失败".to_string())?;
        let campaign = campaigns.get_mut(id).ok_or("活动不存在")?;
        
        if let Some(name) = request.name { campaign.name = name; }
        if let Some(ct) = request.campaign_type { campaign.campaign_type = ct; }
        if let Some(status) = request.status { campaign.status = status; }
        if let Some(desc) = request.description { campaign.description = Some(desc); }
        if let Some(start) = request.start_date { campaign.start_date = Some(start); }
        if let Some(end) = request.end_date { campaign.end_date = Some(end); }
        if let Some(budget) = request.budget { campaign.budget = Some(budget); }
        if let Some(cost) = request.actual_cost { campaign.actual_cost = Some(cost); }
        if let Some(channels) = request.channel_ids { campaign.channel_ids = channels; }
        if let Some(contents) = request.content_ids { campaign.content_ids = contents; }
        if let Some(audience) = request.target_audience { campaign.target_audience = Some(audience); }
        if let Some(reach) = request.expected_reach { campaign.expected_reach = Some(reach); }
        if let Some(actual) = request.actual_reach { campaign.actual_reach = Some(actual); }
        if let Some(conv) = request.conversion_count { campaign.conversion_count = Some(conv); }
        if let Some(notes) = request.notes { campaign.notes = Some(notes); }
        campaign.updated_at = chrono::Utc::now().timestamp();
        
        info!("更新营销活动成功: {}", id);
        Ok(campaign.clone())
    }

    pub fn delete_campaign(&self, id: &str) -> Result<(), String> {
        let mut campaigns = self.campaigns.write().map_err(|_| "获取写入锁失败".to_string())?;
        if campaigns.remove(id).is_none() { return Err("活动不存在".to_string()); }
        if let Ok(mut index) = self.campaign_id_index.write() { let _ = index.remove(id); }
        info!("删除营销活动成功: {}", id);
        Ok(())
    }

    // ==================== 内容操作 ====================

    pub fn create_content(&self, content: MarketingContent) -> Result<MarketingContent, String> {
        let mut contents = self.contents.write().map_err(|_| "获取写入锁失败".to_string())?;
        let id = content.id.clone();
        contents.insert(id.clone(), content.clone());
        if let Ok(mut index) = self.content_id_index.write() {
            let _ = index.insert(id.clone(), id);
        }
        info!("创建营销内容成功: {}", content.title);
        Ok(content)
    }

    pub fn get_content(&self, id: &str) -> Option<MarketingContent> {
        self.contents.read().ok()?.get(id).cloned()
    }

    pub fn list_contents(&self, params: &QueryContentsParams) -> PagedResult<ContentListItem> {
        let contents = self.contents.read().unwrap_or_else(|e| e.into_inner());

        let mut items: Vec<ContentListItem> = contents
            .values()
            .filter(|c| {
                if let Some(ref ct) = params.content_type {
                    if &c.content_type != ct { return false; }
                }
                if let Some(ref status) = params.status {
                    if &c.status != status { return false; }
                }
                if let Some(ref cid) = params.campaign_id {
                    if c.campaign_id.as_ref() != Some(cid) { return false; }
                }
                if let Some(ref search) = params.search {
                    let search_lower = search.to_lowercase();
                    if !c.title.to_lowercase().contains(&search_lower) { return false; }
                }
                true
            })
            .map(|c| ContentListItem {
                id: c.id.clone(),
                title: c.title.clone(),
                content_type: c.content_type,
                status: c.status,
                campaign_id: c.campaign_id.clone(),
                views: c.views,
                created_at: c.created_at,
                updated_at: c.updated_at,
                published_at: c.published_at,
            })
            .collect();

        items.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        let page = params.page.unwrap_or(1).max(1);
        let page_size = params.page_size.unwrap_or(20).min(100);
        let total = items.len() as u32;
        let start = ((page - 1) * page_size) as usize;
        let end = (start + page_size as usize).min(items.len());
        let page_items = if start < items.len() { items[start..end].to_vec() } else { Vec::new() };

        PagedResult { items: page_items, total, page, page_size }
    }

    pub fn update_content(&self, id: &str, request: UpdateContentRequest) -> Result<MarketingContent, String> {
        let mut contents = self.contents.write().map_err(|_| "获取写入锁失败".to_string())?;
        let content = contents.get_mut(id).ok_or("内容不存在")?;
        
        if let Some(title) = request.title { content.title = title; }
        if let Some(ct) = request.content_type { content.content_type = ct; }
        if let Some(status) = request.status { content.status = status; }
        if let Some(body) = request.body { content.body = Some(body); }
        if let Some(summary) = request.summary { content.summary = Some(summary); }
        if let Some(thumb) = request.thumbnail { content.thumbnail = Some(thumb); }
        if let Some(tags) = request.tags { content.tags = tags; }
        if let Some(channels) = request.channel_ids { content.channel_ids = channels; }
        content.updated_at = chrono::Utc::now().timestamp();
        
        info!("更新营销内容成功: {}", id);
        Ok(content.clone())
    }

    pub fn delete_content(&self, id: &str) -> Result<(), String> {
        let mut contents = self.contents.write().map_err(|_| "获取写入锁失败".to_string())?;
        if contents.remove(id).is_none() { return Err("内容不存在".to_string()); }
        if let Ok(mut index) = self.content_id_index.write() { let _ = index.remove(id); }
        info!("删除营销内容成功: {}", id);
        Ok(())
    }

    // ==================== 渠道操作 ====================

    pub fn create_channel(&self, channel: Channel) -> Result<Channel, String> {
        let mut channels = self.channels.write().map_err(|_| "获取写入锁失败".to_string())?;
        let id = channel.id.clone();
        channels.insert(id.clone(), channel.clone());
        if let Ok(mut index) = self.channel_id_index.write() {
            let _ = index.insert(id.clone(), id);
        }
        info!("创建营销渠道成功: {}", channel.name);
        Ok(channel)
    }

    pub fn get_channel(&self, id: &str) -> Option<Channel> {
        self.channels.read().ok()?.get(id).cloned()
    }

    pub fn list_channels(&self, params: &QueryChannelsParams) -> PagedResult<ChannelListItem> {
        let channels = self.channels.read().unwrap_or_else(|e| e.into_inner());

        let mut items: Vec<ChannelListItem> = channels
            .values()
            .filter(|c| {
                if let Some(ref ct) = params.channel_type {
                    if &c.channel_type != ct { return false; }
                }
                if let Some(active) = params.is_active {
                    if c.is_active != active { return false; }
                }
                if let Some(ref search) = params.search {
                    let search_lower = search.to_lowercase();
                    if !c.name.to_lowercase().contains(&search_lower) { return false; }
                }
                true
            })
            .map(|c| ChannelListItem {
                id: c.id.clone(),
                name: c.name.clone(),
                channel_type: c.channel_type,
                account_name: c.account_name.clone(),
                followers: c.followers,
                is_active: c.is_active,
            })
            .collect();

        items.sort_by(|a, b| a.name.cmp(&b.name));

        let page = params.page.unwrap_or(1).max(1);
        let page_size = params.page_size.unwrap_or(20).min(100);
        let total = items.len() as u32;
        let start = ((page - 1) * page_size) as usize;
        let end = (start + page_size as usize).min(items.len());
        let page_items = if start < items.len() { items[start..end].to_vec() } else { Vec::new() };

        PagedResult { items: page_items, total, page, page_size }
    }

    pub fn update_channel(&self, id: &str, request: UpdateChannelRequest) -> Result<Channel, String> {
        let mut channels = self.channels.write().map_err(|_| "获取写入锁失败".to_string())?;
        let channel = channels.get_mut(id).ok_or("渠道不存在")?;
        
        if let Some(name) = request.name { channel.name = name; }
        if let Some(ct) = request.channel_type { channel.channel_type = ct; }
        if let Some(acc_id) = request.account_id { channel.account_id = Some(acc_id); }
        if let Some(acc_name) = request.account_name { channel.account_name = Some(acc_name); }
        if let Some(followers) = request.followers { channel.followers = Some(followers); }
        if let Some(rate) = request.engagement_rate { channel.engagement_rate = Some(rate); }
        if let Some(active) = request.is_active { channel.is_active = active; }
        if let Some(notes) = request.notes { channel.notes = Some(notes); }
        channel.updated_at = chrono::Utc::now().timestamp();
        
        info!("更新营销渠道成功: {}", id);
        Ok(channel.clone())
    }

    pub fn delete_channel(&self, id: &str) -> Result<(), String> {
        let mut channels = self.channels.write().map_err(|_| "获取写入锁失败".to_string())?;
        if channels.remove(id).is_none() { return Err("渠道不存在".to_string()); }
        if let Ok(mut index) = self.channel_id_index.write() { let _ = index.remove(id); }
        info!("删除营销渠道成功: {}", id);
        Ok(())
    }

    // ==================== 统计方法 ====================

    pub fn get_campaigns(&self) -> std::sync::RwLockReadGuard<'_, HashMap<String, Campaign>> {
        self.campaigns.read().unwrap_or_else(|e| e.into_inner())
    }

    pub fn get_contents(&self) -> std::sync::RwLockReadGuard<'_, HashMap<String, MarketingContent>> {
        self.contents.read().unwrap_or_else(|e| e.into_inner())
    }

    pub fn get_channels(&self) -> std::sync::RwLockReadGuard<'_, HashMap<String, Channel>> {
        self.channels.read().unwrap_or_else(|e| e.into_inner())
    }

    pub fn get_channels_mut(&self) -> std::sync::RwLockWriteGuard<'_, HashMap<String, Channel>> {
        self.channels.write().unwrap_or_else(|e| e.into_inner())
    }
}

impl Default for MarketingDatabase {
    fn default() -> Self {
        Self::new()
    }
}
