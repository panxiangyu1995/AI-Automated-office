// =============================================================================
// Knowledge Base Enterprise Types
// =============================================================================

// Permission types
export enum KnowledgePermission {
  OnlyMe = 'only_me',
  AllTeam = 'all_team',
  PartialTeam = 'partial_team',
}

export enum AccessLevel {
  Read = 'read',
  Write = 'write',
  Admin = 'admin',
}

// User context
export interface UserContext {
  user_id: string;
  tenant_id: string;
  department_id?: string;
}

// Knowledge Base types
export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  owner_id: string;
  permission: KnowledgePermission;
  tags: string[];
  embedding_model?: string;
  indexing_technique?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  document_count: number;
  chunk_count: number;
}

export interface KnowledgeBaseSummary {
  id: string;
  name: string;
  description?: string;
  permission: KnowledgePermission;
  tags: string[];
  document_count: number;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

// Document types
export enum DocumentStatus {
  Pending = 'pending',
  Processing = 'processing',
  Indexed = 'indexed',
  Failed = 'failed',
  Archived = 'archived',
}

export enum DocumentType {
  Pdf = 'pdf',
  Word = 'word',
  Excel = 'excel',
  Txt = 'txt',
  Markdown = 'markdown',
  Html = 'html',
  Json = 'json',
  Csv = 'csv',
}

export interface KnowledgeDocument {
  id: string;
  knowledge_base_id: string;
  tenant_id: string;
  name: string;
  file_path: string;
  file_type: DocumentType;
  file_size: number;
  checksum: string;
  status: DocumentStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  chunk_count: number;
  processed_at?: number;
  created_at: number;
  updated_at: number;
  created_by: string;
}

export interface DocumentSummary {
  id: string;
  name: string;
  file_type: DocumentType;
  file_size: number;
  status: DocumentStatus;
  tags: string[];
  chunk_count: number;
  created_at: number;
  updated_at: number;
}

// Segment types
export enum SegmentStatus {
  Active = 'active',
  Disabled = 'disabled',
  Archived = 'archived',
}

export interface KnowledgeSegment {
  id: string;
  document_id: string;
  knowledge_base_id: string;
  tenant_id: string;
  content: string;
  tokens: number;
  keywords: string[];
  hash: string;
  index: number;
  status: SegmentStatus;
  metadata: Record<string, unknown>;
  vector_id?: string;
  created_at: number;
  updated_at: number;
  created_by: string;
}

export interface SegmentSummary {
  id: string;
  document_id: string;
  content_preview: string;
  tokens: number;
  keywords: string[];
  status: SegmentStatus;
  index: number;
  created_at: number;
  updated_at: number;
}

// Member types
export interface KnowledgeMember {
  user_id: string;
  access_level: AccessLevel;
  is_owner: boolean;
  joined_at: string;
}

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  required_level?: AccessLevel;
}

// Request types
export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  permission: KnowledgePermission;
  tags: string[];
  embedding_model?: string;
  indexing_technique?: string;
}

export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
  permission?: KnowledgePermission;
  tags?: string[];
}

export interface KnowledgeBaseFilter {
  search?: string;
  tags?: string[];
  permission?: KnowledgePermission;
}

export interface UploadDocumentRequest {
  knowledge_base_id: string;
  name: string;
  file_path: string;
  file_type: DocumentType;
  file_size: number;
  checksum: string;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateDocumentRequest {
  name?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  status?: DocumentStatus;
}

export interface DocumentFilter {
  search?: string;
  status?: DocumentStatus;
  file_type?: DocumentType;
  tags?: string[];
}

export interface UpdateSegmentRequest {
  content?: string;
  keywords?: string[];
  status?: SegmentStatus;
  metadata?: Record<string, unknown>;
}

export interface SegmentFilter {
  document_id?: string;
  status?: SegmentStatus;
  search?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  page_size: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Audit Log types
export enum AuditAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Upload = 'upload',
  Download = 'download',
  Share = 'share',
  PermissionChange = 'permission_change',
}

export enum AuditEntityType {
  KnowledgeBase = 'knowledge_base',
  Document = 'document',
  Segment = 'segment',
  Member = 'member',
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  entity_name?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogFilter {
  entity_type?: AuditEntityType;
  entity_id?: string;
  action?: AuditAction;
  start_date?: string;
  end_date?: string;
  user_id?: string;
}
