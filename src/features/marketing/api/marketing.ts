//! Marketing 模块 API 封装

import { invoke } from '@tauri-apps/api/core';
import type {
  Campaign,
  MarketingContent,
  Channel,
  CampaignListItem,
  ContentListItem,
  ChannelListItem,
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
  return invoke('marketing_create_campaign', { request, tenantId });
}

export async function getCampaign(id: string): Promise<Campaign> {
  return invoke('marketing_get_campaign', { id });
}

export async function listCampaigns(params?: QueryCampaignsParams): Promise<PagedResult<CampaignListItem>> {
  return invoke('marketing_list_campaigns', { params });
}

export async function updateCampaign(id: string, request: UpdateCampaignRequest): Promise<Campaign> {
  return invoke('marketing_update_campaign', { id, request });
}

export async function deleteCampaign(id: string): Promise<void> {
  return invoke('marketing_delete_campaign', { id });
}

// ==================== 内容 API ====================

export async function createContent(request: CreateContentRequest, tenantId?: string): Promise<MarketingContent> {
  return invoke('marketing_create_content', { request, tenantId });
}

export async function getContent(id: string): Promise<MarketingContent> {
  return invoke('marketing_get_content', { id });
}

export async function listContents(params?: QueryContentsParams): Promise<PagedResult<ContentListItem>> {
  return invoke('marketing_list_contents', { params });
}

export async function updateContent(id: string, request: UpdateContentRequest): Promise<MarketingContent> {
  return invoke('marketing_update_content', { id, request });
}

export async function deleteContent(id: string): Promise<void> {
  return invoke('marketing_delete_content', { id });
}

// ==================== 渠道 API ====================

export async function createChannel(request: CreateChannelRequest, tenantId?: string): Promise<Channel> {
  return invoke('marketing_create_channel', { request, tenantId });
}

export async function getChannel(id: string): Promise<Channel> {
  return invoke('marketing_get_channel', { id });
}

export async function listChannels(params?: QueryChannelsParams): Promise<PagedResult<ChannelListItem>> {
  return invoke('marketing_list_channels', { params });
}

export async function updateChannel(id: string, request: UpdateChannelRequest): Promise<Channel> {
  return invoke('marketing_update_channel', { id, request });
}

export async function deleteChannel(id: string): Promise<void> {
  return invoke('marketing_delete_channel', { id });
}
