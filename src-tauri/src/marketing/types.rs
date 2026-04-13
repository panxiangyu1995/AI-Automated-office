//! Marketing 模块类型定义

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ==================== 营销活动类型 ====================

/// 活动状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CampaignStatus {
    Draft,
    Published,
    InProgress,
    Paused,
    Completed,
    Cancelled,
}

impl Default for CampaignStatus {
    fn default() -> Self {
        Self::Draft
    }
}

impl std::fmt::Display for CampaignStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Draft => write!(f, "draft"),
            Self::Published => write!(f, "published"),
            Self::InProgress => write!(f, "in_progress"),
            Self::Paused => write!(f, "paused"),
            Self::Completed => write!(f, "completed"),
            Self::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// 活动类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CampaignType {
    Promotion,
    Webinar,
    Exhibition,
    Content,
    Social,
    Email,
    Other,
}

impl Default for CampaignType {
    fn default() -> Self {
        Self::Promotion
    }
}

/// 营销活动
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Campaign {
    pub id: String,
    pub name: String,
    pub campaign_type: CampaignType,
    pub status: CampaignStatus,
    pub description: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub budget: Option<f64>,
    pub actual_cost: Option<f64>,
    pub channel_ids: Vec<String>,
    pub content_ids: Vec<String>,
    pub target_audience: Option<String>,
    pub expected_reach: Option<i32>,
    pub actual_reach: Option<i32>,
    pub conversion_count: Option<i32>,
    pub notes: Option<String>,
    pub tenant_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for Campaign {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: String::new(),
            campaign_type: CampaignType::default(),
            status: CampaignStatus::default(),
            description: None,
            start_date: None,
            end_date: None,
            budget: None,
            actual_cost: None,
            channel_ids: Vec::new(),
            content_ids: Vec::new(),
            target_audience: None,
            expected_reach: None,
            actual_reach: None,
            conversion_count: None,
            notes: None,
            tenant_id: String::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

// ==================== 内容类型 ====================

/// 内容类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ContentType {
    Article,
    Video,
    Image,
    Infographic,
    Podcast,
    Webinar,
    Other,
}

impl Default for ContentType {
    fn default() -> Self {
        Self::Article
    }
}

/// 内容状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ContentStatus {
    Draft,
    Review,
    Published,
    Archived,
}

impl Default for ContentStatus {
    fn default() -> Self {
        Self::Draft
    }
}

/// 营销内容
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketingContent {
    pub id: String,
    pub title: String,
    pub content_type: ContentType,
    pub status: ContentStatus,
    pub body: Option<String>,
    pub summary: Option<String>,
    pub thumbnail: Option<String>,
    pub tags: Vec<String>,
    pub channel_ids: Vec<String>,
    pub campaign_id: Option<String>,
    pub published_at: Option<i64>,
    pub views: i32,
    pub likes: i32,
    pub shares: i32,
    pub tenant_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for MarketingContent {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title: String::new(),
            content_type: ContentType::default(),
            status: ContentStatus::default(),
            body: None,
            summary: None,
            thumbnail: None,
            tags: Vec::new(),
            channel_ids: Vec::new(),
            campaign_id: None,
            published_at: None,
            views: 0,
            likes: 0,
            shares: 0,
            tenant_id: String::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

// ==================== 渠道类型 ====================

/// 渠道类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum ChannelType {
    Wechat,
    Weibo,
    Douyin,
    Xiaohongshu,
    Baidu,
    Zhihu,
    Email,
    Website,
    App,
    Other,
}

impl Default for ChannelType {
    fn default() -> Self {
        Self::Wechat
    }
}

/// 营销渠道
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Channel {
    pub id: String,
    pub name: String,
    pub channel_type: ChannelType,
    pub account_id: Option<String>,
    pub account_name: Option<String>,
    pub followers: Option<i32>,
    pub engagement_rate: Option<f64>,
    pub is_active: bool,
    pub notes: Option<String>,
    pub tenant_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for Channel {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: String::new(),
            channel_type: ChannelType::default(),
            account_id: None,
            account_name: None,
            followers: None,
            engagement_rate: None,
            is_active: true,
            notes: None,
            tenant_id: String::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

// ==================== 请求/响应类型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCampaignRequest {
    pub name: String,
    pub campaign_type: CampaignType,
    pub description: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub budget: Option<f64>,
    pub target_audience: Option<String>,
    pub expected_reach: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCampaignRequest {
    pub name: Option<String>,
    pub campaign_type: Option<CampaignType>,
    pub status: Option<CampaignStatus>,
    pub description: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub budget: Option<f64>,
    pub actual_cost: Option<f64>,
    pub channel_ids: Option<Vec<String>>,
    pub content_ids: Option<Vec<String>>,
    pub target_audience: Option<String>,
    pub expected_reach: Option<i32>,
    pub actual_reach: Option<i32>,
    pub conversion_count: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct QueryCampaignsParams {
    pub campaign_type: Option<CampaignType>,
    pub status: Option<CampaignStatus>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateContentRequest {
    pub title: String,
    pub content_type: ContentType,
    pub body: Option<String>,
    pub summary: Option<String>,
    pub tags: Option<Vec<String>>,
    pub campaign_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateContentRequest {
    pub title: Option<String>,
    pub content_type: Option<ContentType>,
    pub status: Option<ContentStatus>,
    pub body: Option<String>,
    pub summary: Option<String>,
    pub thumbnail: Option<String>,
    pub tags: Option<Vec<String>>,
    pub channel_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct QueryContentsParams {
    pub content_type: Option<ContentType>,
    pub status: Option<ContentStatus>,
    pub campaign_id: Option<String>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateChannelRequest {
    pub name: String,
    pub channel_type: ChannelType,
    pub account_id: Option<String>,
    pub account_name: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateChannelRequest {
    pub name: Option<String>,
    pub channel_type: Option<ChannelType>,
    pub account_id: Option<String>,
    pub account_name: Option<String>,
    pub followers: Option<i32>,
    pub engagement_rate: Option<f64>,
    pub is_active: Option<bool>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct QueryChannelsParams {
    pub channel_type: Option<ChannelType>,
    pub is_active: Option<bool>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedResult<T> {
    pub items: Vec<T>,
    pub total: u32,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignListItem {
    pub id: String,
    pub name: String,
    pub campaign_type: CampaignType,
    pub status: CampaignStatus,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub budget: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentListItem {
    pub id: String,
    pub title: String,
    pub content_type: ContentType,
    pub status: ContentStatus,
    pub campaign_id: Option<String>,
    pub views: i32,
    pub published_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChannelListItem {
    pub id: String,
    pub name: String,
    pub channel_type: ChannelType,
    pub account_name: Option<String>,
    pub followers: Option<i32>,
    pub is_active: bool,
}

// ==================== AI 内容生成类型 ====================

/// 内容模板
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentTemplate {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub content_type: ContentType,
    pub template_content: String,
    pub variables: Vec<TemplateVariable>,
    pub is_default: bool,
    pub usage_count: i32,
    pub tenant_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 模板变量
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateVariable {
    pub key: String,
    pub label: String,
    pub variable_type: String,
    pub required: bool,
    pub default_value: Option<String>,
    pub options: Vec<String>,
    pub placeholder: Option<String>,
}

/// AI 生成请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateContentRequest {
    pub template_id: Option<String>,
    pub content_type: ContentType,
    pub title: String,
    pub target_platform: Option<ChannelType>,
    pub keywords: Vec<String>,
    pub tone: Option<String>,
    pub length: Option<String>,
}

/// AI 生成结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateContentResult {
    pub content: String,
    pub title: String,
    pub suggestions: Vec<String>,
    pub hashtags: Vec<String>,
}

/// 平台适配规则
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformAdaptation {
    pub platform: ChannelType,
    pub max_length: i32,
    pub recommended_length: i32,
    pub hashtag_count: i32,
    pub emoji_allowed: bool,
}

impl Default for ContentTemplate {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: String::new(),
            description: None,
            content_type: ContentType::Article,
            template_content: String::new(),
            variables: Vec::new(),
            is_default: false,
            usage_count: 0,
            tenant_id: String::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

// ==================== 数据分析类型 ====================

/// 营销统计数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketingStats {
    pub total_campaigns: u32,
    pub active_campaigns: u32,
    pub completed_campaigns: u32,
    pub total_content: u32,
    pub published_content: u32,
    pub total_views: u64,
    pub total_likes: u64,
    pub total_shares: u64,
    pub total_channels: u32,
    pub active_channels: u32,
    pub total_budget: f64,
    pub total_spend: f64,
    pub roi: f64,
    pub ctr: f64,
    pub cvr: f64,
}

/// 活动效果数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignEffectiveness {
    pub campaign_id: String,
    pub campaign_name: String,
    pub status: CampaignStatus,
    pub budget: f64,
    pub actual_spend: f64,
    pub expected_reach: i32,
    pub actual_reach: i32,
    pub impressions: u64,
    pub clicks: u64,
    pub conversions: i32,
    pub roi: f64,
}

/// 内容效果数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentEffectiveness {
    pub content_id: String,
    pub content_title: String,
    pub content_type: ContentType,
    pub views: u64,
    pub likes: u64,
    pub shares: u64,
    pub engagement_rate: f64,
    pub published_at: Option<i64>,
}

/// 渠道效果数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChannelEffectiveness {
    pub channel_id: String,
    pub channel_name: String,
    pub channel_type: ChannelType,
    pub followers: i32,
    pub impressions: u64,
    pub clicks: u64,
    pub ctr: f64,
    pub engagement_rate: f64,
}

/// 时间范围
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TimeRange {
    Today,
    Yesterday,
    Last7Days,
    Last30Days,
    ThisMonth,
    LastMonth,
    ThisYear,
    Custom,
}

impl Default for TimeRange {
    fn default() -> Self {
        Self::Last30Days
    }
}

/// 数据趋势点
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataTrendPoint {
    pub date: String,
    pub views: u64,
    pub likes: u64,
    pub shares: u64,
    pub conversions: i32,
}

/// 渠道分布
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChannelDistribution {
    pub channel_type: ChannelType,
    pub count: u32,
    pub percentage: f64,
}
