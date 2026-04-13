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

// ==================== AI 内容生成命令 ====================

#[tauri::command]
pub async fn marketing_generate_content(
    state: State<'_, MarketingState>,
    request: GenerateContentRequest,
    tenant_id: Option<String>,
) -> Result<GenerateContentResult, String> {
    info!("AI生成营销内容: {}", request.title);
    
    // 模拟 AI 生成
    let platform = request.target_platform.unwrap_or(ChannelType::Wechat);
    let hashtags = request.keywords.iter().map(|k| format!("#{}", k)).collect();
    
    let content = format!(
        "【{}】\n\n亲爱的用户：\n\n{} 是我们为您精心准备的内容。\n\n主要内容：\n{}\n\n了解更多，请访问我们的官方网站。\n\n{}",
        request.title,
        request.title,
        request.keywords.iter().map(|k| format!("- {}", k)).collect::<Vec<_>>().join("\n"),
        hashtags.iter().map(|h| h.as_str()).collect::<Vec<_>>().join(" ")
    );
    
    let suggestions = vec![
        "建议在黄金时段发布以获得更多曝光".to_string(),
        "配合相关话题可提升互动率".to_string(),
        "添加配图可提升阅读体验".to_string(),
    ];
    
    Ok(GenerateContentResult {
        content,
        title: request.title,
        suggestions,
        hashtags,
    })
}

#[tauri::command]
pub async fn marketing_get_platform_adaptation(
    platform: ChannelType,
) -> Result<PlatformAdaptation, String> {
    info!("获取平台适配规则: {:?}", platform);
    
    let adaptation = match platform {
        ChannelType::Wechat => PlatformAdaptation {
            platform,
            max_length: 20000,
            recommended_length: 2000,
            hashtag_count: 10,
            emoji_allowed: true,
        },
        ChannelType::Weibo => PlatformAdaptation {
            platform,
            max_length: 2000,
            recommended_length: 140,
            hashtag_count: 5,
            emoji_allowed: true,
        },
        ChannelType::Douyin => PlatformAdaptation {
            platform,
            max_length: 2000,
            recommended_length: 100,
            hashtag_count: 3,
            emoji_allowed: true,
        },
        ChannelType::Xiaohongshu => PlatformAdaptation {
            platform,
            max_length: 1000,
            recommended_length: 500,
            hashtag_count: 10,
            emoji_allowed: true,
        },
        _ => PlatformAdaptation {
            platform,
            max_length: 5000,
            recommended_length: 500,
            hashtag_count: 5,
            emoji_allowed: true,
        },
    };
    
    Ok(adaptation)
}

// ==================== 数据分析命令 ====================

#[tauri::command]
pub async fn marketing_get_stats(
    state: State<'_, MarketingState>,
) -> Result<MarketingStats, String> {
    info!("获取营销统计数据");
    
    let campaigns = state.db.get_campaigns();
    let contents = state.db.get_contents();
    let channels = state.db.get_channels();
    
    let total_campaigns = campaigns.len() as u32;
    let active_campaigns = campaigns.values().filter(|c| c.status == CampaignStatus::InProgress || c.status == CampaignStatus::Published).count() as u32;
    let completed_campaigns = campaigns.values().filter(|c| c.status == CampaignStatus::Completed).count() as u32;
    
    let total_content = contents.len() as u32;
    let published_content = contents.values().filter(|c| c.status == ContentStatus::Published).count() as u32;
    
    let total_views: u64 = contents.values().map(|c| c.views as u64).sum();
    let total_likes: u64 = contents.values().map(|c| c.likes as u64).sum();
    let total_shares: u64 = contents.values().map(|c| c.shares as u64).sum();
    
    let total_channels = channels.len() as u32;
    let active_channels = channels.values().filter(|c| c.is_active).count() as u32;
    
    let total_budget: f64 = campaigns.values().filter_map(|c| c.budget).sum();
    let total_spend: f64 = campaigns.values().filter_map(|c| c.actual_cost).sum();
    
    let total_conversions: u64 = campaigns.values().filter_map(|c| c.conversion_count).map(|v| v as u64).sum();
    
    let roi = if total_spend > 0.0 { (total_conversions as f64 / total_spend) * 100.0 } else { 0.0 };
    let ctr = if total_views > 0 { (total_shares as f64 / total_views as f64) * 100.0 } else { 0.0 };
    let cvr = if total_shares > 0 { (total_conversions as f64 / total_shares as f64) * 100.0 } else { 0.0 };
    
    Ok(MarketingStats {
        total_campaigns,
        active_campaigns,
        completed_campaigns,
        total_content,
        published_content,
        total_views,
        total_likes,
        total_shares,
        total_channels,
        active_channels,
        total_budget,
        total_spend,
        roi,
        ctr,
        cvr,
    })
}

#[tauri::command]
pub async fn marketing_get_channel_distribution(
    state: State<'_, MarketingState>,
) -> Result<Vec<ChannelDistribution>, String> {
    info!("获取渠道分布");
    
    let channels = state.db.get_channels();
    let total = channels.len() as f64;
    
    let mut distribution: std::collections::HashMap<ChannelType, u32> = std::collections::HashMap::new();
    for channel in channels.values() {
        *distribution.entry(channel.channel_type).or_insert(0) += 1;
    }
    
    let result: Vec<ChannelDistribution> = distribution.into_iter()
        .map(|(ct, count)| ChannelDistribution {
            channel_type: ct,
            count,
            percentage: if total > 0.0 { (count as f64 / total) * 100.0 } else { 0.0 },
        })
        .collect();
    
    Ok(result)
}
