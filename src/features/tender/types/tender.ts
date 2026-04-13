//! Tender 模块类型定义

// ==================== 资质类型 ====================

export type QualificationType = 
  | 'business_license' 
  | 'industry_license' 
  | 'safety_cert' 
  | 'quality_cert' 
  | 'tax_cert' 
  | 'organization_code' 
  | 'other';

export type QualificationStatus = 'valid' | 'expiring' | 'expired';

export interface Qualification {
  id: string;
  name: string;
  qualificationType: QualificationType;
  certNumber?: string;
  issueDate: string;
  expiryDate: string;
  status: QualificationStatus;
  reminderEnabled: boolean;
  reminderDays: number;
  attachments: string[];
  notes?: string;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

export interface QualificationListItem {
  id: string;
  name: string;
  qualificationType: QualificationType;
  certNumber?: string;
  expiryDate: string;
  status: QualificationStatus;
}

// ==================== 业绩类型 ====================

export type CaseStatus = 'in_progress' | 'completed' | 'archived';

export interface Case {
  id: string;
  projectName: string;
  customerName: string;
  contractAmount: number;
  actualAmount?: number;
  startDate: string;
  endDate?: string;
  status: CaseStatus;
  description?: string;
  achievements: string[];
  attachments: string[];
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

export interface CaseListItem {
  id: string;
  projectName: string;
  customerName: string;
  contractAmount: number;
  startDate: string;
  endDate?: string;
  status: CaseStatus;
}

// ==================== 请求类型 ====================

export interface CreateQualificationRequest {
  name: string;
  qualificationType: QualificationType;
  certNumber?: string;
  issueDate: string;
  expiryDate: string;
  reminderEnabled?: boolean;
  reminderDays?: number;
  notes?: string;
}

export interface UpdateQualificationRequest {
  name?: string;
  certNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  reminderEnabled?: boolean;
  reminderDays?: number;
  notes?: string;
}

export interface QueryQualificationsParams {
  qualificationType?: QualificationType;
  status?: QualificationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateCaseRequest {
  projectName: string;
  customerName: string;
  contractAmount: number;
  startDate: string;
  description?: string;
}

export interface UpdateCaseRequest {
  projectName?: string;
  customerName?: string;
  contractAmount?: number;
  actualAmount?: number;
  endDate?: string;
  status?: CaseStatus;
  description?: string;
}

export interface QueryCasesParams {
  status?: CaseStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ==================== 响应类型 ====================

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== 辅助类型 ====================

export const qualificationTypeMeta: Record<QualificationType, { label: string; validityYears: number }> = {
  business_license: { label: '营业执照', validityYears: 5 },
  industry_license: { label: '行业许可证', validityYears: 4 },
  safety_cert: { label: '安全许可证', validityYears: 3 },
  quality_cert: { label: '质量认证', validityYears: 3 },
  tax_cert: { label: '税务登记证', validityYears: 5 },
  organization_code: { label: '组织机构代码', validityYears: 5 },
  other: { label: '其他', validityYears: 1 },
};

export const qualificationStatusMeta: Record<QualificationStatus, { label: string; color: string }> = {
  valid: { label: '有效', color: 'bg-green-100 text-green-800' },
  expiring: { label: '即将到期', color: 'bg-orange-100 text-orange-800' },
  expired: { label: '已过期', color: 'bg-red-100 text-red-800' },
};

export const caseStatusMeta: Record<CaseStatus, { label: string; color: string }> = {
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  archived: { label: '已归档', color: 'bg-gray-100 text-gray-800' },
};

// ==================== 投标项目类型 ====================

export type TenderStatus = 
  | 'preparing' 
  | 'bidding' 
  | 'waiting_result' 
  | 'won' 
  | 'lost' 
  | 'cancelled';

export interface TenderProject {
  id: string;
  projectName: string;
  customerName: string;
  customerContact?: string;
  biddingAmount?: number;
  status: TenderStatus;
  qualificationIds: string[];
  caseIds: string[];
  deadline?: string;
  biddingDate?: string;
  resultDate?: string;
  progress: number;
  attachments: string[];
  notes?: string;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

export interface TenderProjectListItem {
  id: string;
  projectName: string;
  customerName: string;
  biddingAmount?: number;
  status: TenderStatus;
  deadline?: string;
  progress: number;
}

export interface CreateTenderProjectRequest {
  projectName: string;
  customerName: string;
  customerContact?: string;
  biddingAmount?: number;
  deadline?: string;
  notes?: string;
}

export interface UpdateTenderProjectRequest {
  projectName?: string;
  customerName?: string;
  customerContact?: string;
  biddingAmount?: number;
  deadline?: string;
  biddingDate?: string;
  resultDate?: string;
  qualificationIds?: string[];
  caseIds?: string[];
  progress?: number;
  notes?: string;
}

export interface UpdateTenderStatusRequest {
  status: TenderStatus;
}

export interface QueryTenderProjectsParams {
  status?: TenderStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TenderStatistics {
  total: number;
  preparing: number;
  bidding: number;
  waitingResult: number;
  won: number;
  lost: number;
  cancelled: number;
  totalBiddingAmount: number;
  winRate: number;
}

export const tenderStatusMeta: Record<TenderStatus, { label: string; color: string }> = {
  preparing: { label: '筹备中', color: 'bg-gray-100 text-gray-800' },
  bidding: { label: '投标中', color: 'bg-blue-100 text-blue-800' },
  waiting_result: { label: '待开标', color: 'bg-yellow-100 text-yellow-800' },
  won: { label: '已中标', color: 'bg-green-100 text-green-800' },
  lost: { label: '已失标', color: 'bg-red-100 text-red-800' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600' },
};

// ==================== 模板和文档类型 ====================

export type VariableType = 'text' | 'number' | 'date' | 'select' | 'richtext';

export interface TemplateVariable {
  key: string;
  label: string;
  variableType: VariableType;
  required: boolean;
  defaultValue?: string;
  options: string[];
  placeholder?: string;
}

export interface BidTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
  isDefault: boolean;
  usageCount: number;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

export type DocumentStatus = 'draft' | 'generated' | 'approved' | 'submitted';

export interface TenderDocument {
  id: string;
  projectId: string;
  templateId?: string;
  title: string;
  content: string;
  variables: Record<string, string>;
  version: number;
  status: DocumentStatus;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
  isDefault?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  category?: string;
  content?: string;
  variables?: TemplateVariable[];
  isDefault?: boolean;
}

export interface QueryTemplatesParams {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateDocumentRequest {
  projectId: string;
  templateId?: string;
  title: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  variables?: Record<string, string>;
}

export interface GenerateDocumentRequest {
  templateId: string;
  variables: Record<string, string>;
}

export interface QueryDocumentsParams {
  projectId?: string;
  status?: DocumentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TemplateListItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  isDefault: boolean;
  usageCount: number;
}

export interface DocumentListItem {
  id: string;
  projectId: string;
  templateId?: string;
  title: string;
  version: number;
  status: DocumentStatus;
  createdAt: number;
  updatedAt: number;
}

export const documentStatusMeta: Record<DocumentStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  generated: { label: '已生成', color: 'bg-blue-100 text-blue-800' },
  approved: { label: '已审核', color: 'bg-green-100 text-green-800' },
  submitted: { label: '已提交', color: 'bg-purple-100 text-purple-800' },
};
