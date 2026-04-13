//! Marketing 模块 Tauri 命令

use crate::marketing::db::MarketingDatabase;
use crate::marketing::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::info;

/// Marketing 状态
pub struct MarketingState {
    pub db: Arc<MarketingDatabase>,
}

impl MarketingState {
    pub fn new() -> Self {
        let db = Arc::new(MarketingDatabase::new());
        db.init_defaults();
        Self { db }
    }
}

impl Default for MarketingState {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== 活动命令 ====================

#[tauri::command]
pub async fn marketing_create_campaign(
    state: State<'_, MarketingState>,
    request: CreateCampaignRequest,
    tenant_id: Option<String>,
) -> Result<Campaign, String> {
    info!("创建营销活动: {}", request.name);
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let campaign = Campaign {
        id: uuid::Uuid::new_v4().to_string(),
        name: request.name,
        campaign_type: request.campaign_type,
        status: CampaignStatus::Draft,
        description: request.description,
        start_date: request.start_date,
        end_date: request.end_date,
        budget: request.budget,
        actual_cost: None,
        channel_ids: Vec::new(),
        content_ids: Vec::new(),
        target_audience: request.target_audience,
        expected_reach: request.expected_reach,
        actual_reach: None,
        conversion_count: None,
        notes: None,
        tenant_id,
        created_at: now,
        updated_at: now,
    };
    
    state.db.create_campaign(campaign)
}

#[tauri::command]
pub async fn marketing_get_campaign(
    state: State<'_, MarketingState>,
    id: String,
) -> Result<Campaign, String> {
    info!("获取营销活动: {}", id);
    state.db.get_campaign(&id).ok_or_else(|| "活动不存在".to_string())
}

#[tauri::command]
pub async fn marketing_list_campaigns(
    state: State<'_, MarketingState>,
    params: Option<QueryCampaignsParams>,
) -> Result<PagedResult<CampaignListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_campaigns(&params))
}

#[tauri::command]
pub async fn marketing_update_campaign(
    state: State<'_, MarketingState>,
    id: String,
    request: UpdateCampaignRequest,
) -> Result<Campaign, String> {
    info!("更新营销活动: {}", id);
    state.db.update_campaign(&id, request)
}

#[tauri::command]
pub async fn marketing_delete_campaign(
    state: State<'_, MarketingState>,
    id: String,
) -> Result<(), String> {
    info!("删除营销活动: {}", id);
    state.db.delete_campaign(&id)
}

// ==================== 内容命令 ====================

#[tauri::command]
pub async fn marketing_create_content(
    state: State<'_, MarketingState>,
    request: CreateContentRequest,
    tenant_id: Option<String>,
) -> Result<MarketingContent, String> {
    info!("创建营销内容: {}", request.title);
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let content = MarketingContent {
        id: uuid::Uuid::new_v4().to_string(),
        title: request.title,
        content_type: request.content_type,
        status: ContentStatus::Draft,
        body: request.body,
        summary: request.summary,
        thumbnail: None,
        tags: request.tags.unwrap_or_default(),
        channel_ids: Vec::new(),
        campaign_id: request.campaign_id,
        published_at: None,
        views: 0,
        likes: 0,
        shares: 0,
        tenant_id,
        created_at: now,
        updated_at: now,
    };
    
    state.db.create_content(content)
}

#[tauri::command]
pub async fn marketing_get_content(
    state: State<'_, MarketingState>,
    id: String,
) -> Result<MarketingContent, String> {
    info!("获取营销内容: {}", id);
    state.db.get_content(&id).ok_or_else(|| "内容不存在".to_string())
}

#[tauri::command]
pub async fn marketing_list_contents(
    state: State<'_, MarketingState>,
    params: Option<QueryContentsParams>,
) -> Result<PagedResult<ContentListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_contents(&params))
}

#[tauri::command]
pub async fn marketing_update_content(
    state: State<'_, MarketingState>,
    id: String,
    request: UpdateContentRequest,
) -> Result<MarketingContent, String> {
    info!("更新营销内容: {}", id);
    state.db.update_content(&id, request)
}

#[tauri::command]
pub async fn marketing_delete_content(
    state: State<'_, MarketingState>,
    id: String,
) -> Result<(), String> {
    info!("删除营销内容: {}", id);
    state.db.delete_content(&id)
}

// ==================== 渠道命令 ====================

#[tauri::command]
pub async fn marketing_create_channel(
    state: State<'_, MarketingState>,
    request: CreateChannelRequest,
    tenant_id: Option<String>,
) -> Result<Channel, String> {
    info!("创建营销渠道: {}", request.name);
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let channel = Channel {
        id: uuid::Uuid::new_v4().to_string(),
        name: request.name,
        channel_type: request.channel_type,
        account_id: request.account_id,
        account_name: request.account_name,
        followers: None,
        engagement_rate: None,
        is_active: true,
        notes: request.notes,
        tenant_id,
        created_at: now,
        updated_at: now,
    };
    
    state.db.create_channel(channel)
}

#[tauri::command]
pub async fn marketing_get_channel(
    state: State<'_, MarketingState>,
    id: String,
) -> Result<Channel, String> {
    info!("获取营销渠道: {}", id);
    state.db.get_channel(&id).ok_or_else(|| "渠道不存在".to_string())
}

#[tauri::command]
pub async fn marketing_list_channels(
    state: State<'_, MarketingState>,
    params: Option<QueryChannelsParams>,
) -> Result<PagedResult<ChannelListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_channels(&params))
}

#[tauri::command]
pub async fn marketing_update_channel(
    state: State<'_, MarketingState>,
    id: String,
    request: UpdateChannelRequest,
) -> Result<Channel, String> {
    info!("更新营销渠道: {}", id);
    state.db.update_channel(&id, request)
}

#[tauri::command]
pub async fn marketing_delete_channel(
    state: State<'_, MarketingState>,
    id: String,
) -> Result<(), String> {
    info!("删除营销渠道: {}", id);
    state.db.delete_channel(&id)
}
