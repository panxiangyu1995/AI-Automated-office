//! Marketing 模块 API 封装

import { safeInvoke } from '@/lib/tauri';
import type {
  Campaign,
  MarketingContent,
  Channel,
  CampaignListItem,
  ContentListItem,
  ChannelListItem,
  GenerateContentRequest,
  GenerateContentResult,
  PlatformAdaptation,
  MarketingStats,
  ChannelDistribution,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  QueryCampaignsParams,
  CreateContentRequest,
  UpdateContentRequest,
  QueryContentsParams,
  CreateChannelRequest,
  UpdateChannelRequest,
  QueryChannelsParams,
  PagedResult,
} from '../types/marketing';

// ==================== 活动 API ====================

export async function createCampaign(request: CreateCampaignRequest, tenantId?: string): Promise<Campaign> {
  const result = await safeInvoke<Campaign>('marketing_create_campaign', { request, tenantId });
  return result ?? ({} as Campaign);
}

export async function getCampaign(id: string): Promise<Campaign> {
  const result = await safeInvoke<Campaign>('marketing_get_campaign', { id });
  return result ?? ({} as Campaign);
}

export async function listCampaigns(params?: QueryCampaignsParams): Promise<PagedResult<CampaignListItem>> {
  const result = await safeInvoke<PagedResult<CampaignListItem>>('marketing_list_campaigns', { params });
  return result ?? ({} as PagedResult<CampaignListItem>);
}

export async function updateCampaign(id: string, request: UpdateCampaignRequest): Promise<Campaign> {
  const result = await safeInvoke<Campaign>('marketing_update_campaign', { id, request });
  return result ?? ({} as Campaign);
}

export async function deleteCampaign(id: string): Promise<void> {
  await safeInvoke('marketing_delete_campaign', { id });
}

// ==================== 内容 API ====================

export async function createContent(request: CreateContentRequest, tenantId?: string): Promise<MarketingContent> {
  const result = await safeInvoke<MarketingContent>('marketing_create_content', { request, tenantId });
  return result ?? ({} as MarketingContent);
}

export async function getContent(id: string): Promise<MarketingContent> {
  const result = await safeInvoke<MarketingContent>('marketing_get_content', { id });
  return result ?? ({} as MarketingContent);
}

export async function listContents(params?: QueryContentsParams): Promise<PagedResult<ContentListItem>> {
  const result = await safeInvoke<PagedResult<ContentListItem>>('marketing_list_contents', { params });
  return result ?? ({} as PagedResult<ContentListItem>);
}

export async function updateContent(id: string, request: UpdateContentRequest): Promise<MarketingContent> {
  const result = await safeInvoke<MarketingContent>('marketing_update_content', { id, request });
  return result ?? ({} as MarketingContent);
}

export async function deleteContent(id: string): Promise<void> {
  await safeInvoke('marketing_delete_content', { id });
}

// ==================== 渠道 API ====================

export async function createChannel(request: CreateChannelRequest, tenantId?: string): Promise<Channel> {
  const result = await safeInvoke<Channel>('marketing_create_channel', { request, tenantId });
  return result ?? ({} as Channel);
}

export async function getChannel(id: string): Promise<Channel> {
  const result = await safeInvoke<Channel>('marketing_get_channel', { id });
  return result ?? ({} as Channel);
}

export async function listChannels(params?: QueryChannelsParams): Promise<PagedResult<ChannelListItem>> {
  const result = await safeInvoke<PagedResult<ChannelListItem>>('marketing_list_channels', { params });
  return result ?? ({} as PagedResult<ChannelListItem>);
}

export async function updateChannel(id: string, request: UpdateChannelRequest): Promise<Channel> {
  const result = await safeInvoke<Channel>('marketing_update_channel', { id, request });
  return result ?? ({} as Channel);
}

export async function deleteChannel(id: string): Promise<void> {
  await safeInvoke('marketing_delete_channel', { id });
}

// ==================== AI 内容生成 API ====================

export async function generateContent(request: GenerateContentRequest, tenantId?: string): Promise<GenerateContentResult> {
  const result = await safeInvoke<GenerateContentResult>('marketing_generate_content', { request, tenantId });
  return result ?? ({} as GenerateContentResult);
}

export async function getPlatformAdaptation(platform: string): Promise<PlatformAdaptation> {
  const result = await safeInvoke<PlatformAdaptation>('marketing_get_platform_adaptation', { platform });
  return result ?? ({} as PlatformAdaptation);
}

// ==================== 数据分析 API ====================

export async function getMarketingStats(): Promise<MarketingStats> {
  const result = await safeInvoke<MarketingStats>('marketing_get_stats');
  return result ?? ({} as MarketingStats);
}

export async function getChannelDistribution(): Promise<ChannelDistribution[]> {
  const result = await safeInvoke<ChannelDistribution[]>('marketing_get_channel_distribution');
  return result ?? [];
}
