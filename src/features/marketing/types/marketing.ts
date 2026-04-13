//! Marketing 模块类型定义

export type CampaignStatus = 'draft' | 'published' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
export type CampaignType = 'promotion' | 'webinar' | 'exhibition' | 'content' | 'social' | 'email' | 'other';
export type ContentType = 'article' | 'video' | 'image' | 'infographic' | 'podcast' | 'webinar' | 'other';
export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';
export type ChannelType = 'wechat' | 'weibo' | 'douyin' | 'xiaohongshu' | 'baidu' | 'zhihu' | 'email' | 'website' | 'app' | 'other';

export interface Campaign {
  id: string;
  name: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  actualCost?: number;
  channelIds: string[];
  contentIds: string[];
  targetAudience?: string;
  expectedReach?: number;
  actualReach?: number;
  conversionCount?: number;
  notes?: string;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

export interface MarketingContent {
  id: string;
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  body?: string;
  summary?: string;
  thumbnail?: string;
  tags: string[];
  channelIds: string[];
  campaignId?: string;
  publishedAt?: number;
  views: number;
  likes: number;
  shares: number;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Channel {
  id: string;
  name: string;
  channelType: ChannelType;
  accountId?: string;
  accountName?: string;
  followers?: number;
  engagementRate?: number;
  isActive: boolean;
  notes?: string;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateCampaignRequest {
  name: string;
  campaignType: CampaignType;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  targetAudience?: string;
  expectedReach?: number;
}

export interface UpdateCampaignRequest {
  name?: string;
  campaignType?: CampaignType;
  status?: CampaignStatus;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  actualCost?: number;
  channelIds?: string[];
  contentIds?: string[];
  targetAudience?: string;
  expectedReach?: number;
  actualReach?: number;
  conversionCount?: number;
  notes?: string;
}

export interface QueryCampaignsParams {
  campaignType?: CampaignType;
  status?: CampaignStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateContentRequest {
  title: string;
  contentType: ContentType;
  body?: string;
  summary?: string;
  tags?: string[];
  campaignId?: string;
}

export interface UpdateContentRequest {
  title?: string;
  contentType?: ContentType;
  status?: ContentStatus;
  body?: string;
  summary?: string;
  thumbnail?: string;
  tags?: string[];
  channelIds?: string[];
}

export interface QueryContentsParams {
  contentType?: ContentType;
  status?: ContentStatus;
  campaignId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateChannelRequest {
  name: string;
  channelType: ChannelType;
  accountId?: string;
  accountName?: string;
  notes?: string;
}

export interface UpdateChannelRequest {
  name?: string;
  channelType?: ChannelType;
  accountId?: string;
  accountName?: string;
  followers?: number;
  engagementRate?: number;
  isActive?: boolean;
  notes?: string;
}

export interface QueryChannelsParams {
  channelType?: ChannelType;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CampaignListItem {
  id: string;
  name: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  budget?: number;
}

export interface ContentListItem {
  id: string;
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  campaignId?: string;
  views: number;
  publishedAt?: number;
}

export interface ChannelListItem {
  id: string;
  name: string;
  channelType: ChannelType;
  accountName?: string;
  followers?: number;
  isActive: boolean;
}

export const campaignStatusMeta: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  published: { label: '已发布', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '进行中', color: 'bg-green-100 text-green-800' },
  paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '已完成', color: 'bg-purple-100 text-purple-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
};

export const campaignTypeMeta: Record<CampaignType, { label: string; color: string }> = {
  promotion: { label: '促销活动', color: 'bg-orange-100 text-orange-800' },
  webinar: { label: '网络研讨会', color: 'bg-blue-100 text-blue-800' },
  exhibition: { label: '展会活动', color: 'bg-purple-100 text-purple-800' },
  content: { label: '内容营销', color: 'bg-green-100 text-green-800' },
  social: { label: '社交媒体', color: 'bg-pink-100 text-pink-800' },
  email: { label: '邮件营销', color: 'bg-cyan-100 text-cyan-800' },
  other: { label: '其他', color: 'bg-gray-100 text-gray-800' },
};

export const contentTypeMeta: Record<ContentType, { label: string; color: string }> = {
  article: { label: '文章', color: 'bg-blue-100 text-blue-800' },
  video: { label: '视频', color: 'bg-red-100 text-red-800' },
  image: { label: '图片', color: 'bg-green-100 text-green-800' },
  infographic: { label: '信息图', color: 'bg-purple-100 text-purple-800' },
  podcast: { label: '播客', color: 'bg-orange-100 text-orange-800' },
  webinar: { label: '网络研讨会', color: 'bg-cyan-100 text-cyan-800' },
  other: { label: '其他', color: 'bg-gray-100 text-gray-800' },
};

export const channelTypeMeta: Record<ChannelType, { label: string; color: string }> = {
  wechat: { label: '微信', color: 'bg-green-500 text-white' },
  weibo: { label: '微博', color: 'bg-red-500 text-white' },
  douyin: { label: '抖音', color: 'bg-black text-white' },
  xiaohongshu: { label: '小红书', color: 'bg-red-400 text-white' },
  baidu: { label: '百度', color: 'bg-blue-500 text-white' },
  zhihu: { label: '知乎', color: 'bg-blue-400 text-white' },
  email: { label: '邮件', color: 'bg-gray-500 text-white' },
  website: { label: '官网', color: 'bg-blue-600 text-white' },
  app: { label: 'APP', color: 'bg-purple-500 text-white' },
  other: { label: '其他', color: 'bg-gray-400 text-white' },
};
