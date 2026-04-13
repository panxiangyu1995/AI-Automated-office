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
