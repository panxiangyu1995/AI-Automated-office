//! Tender 模块 API 封装

import { safeInvoke } from '@/lib/tauri';
import type {
  Qualification,
  QualificationListItem,
  Case,
  CaseListItem,
  TenderProject,
  TenderProjectListItem,
  TenderStatistics,
  BidTemplate,
  TenderDocument,
  TemplateListItem,
  DocumentListItem,
  CreateQualificationRequest,
  UpdateQualificationRequest,
  QueryQualificationsParams,
  CreateCaseRequest,
  UpdateCaseRequest,
  QueryCasesParams,
  CreateTenderProjectRequest,
  UpdateTenderProjectRequest,
  UpdateTenderStatusRequest,
  QueryTenderProjectsParams,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  QueryTemplatesParams,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  GenerateDocumentRequest,
  QueryDocumentsParams,
  PagedResult,
} from '../types/tender';

// ==================== 资质 API ====================

export async function createQualification(request: CreateQualificationRequest, tenantId?: string): Promise<Qualification> {
  const result = await safeInvoke<Qualification>('tender_create_qualification', { request, tenantId });
  return result ?? ({} as Qualification);
}

export async function getQualification(id: string): Promise<Qualification> {
  const result = await safeInvoke<Qualification>('tender_get_qualification', { id });
  return result ?? ({} as Qualification);
}

export async function listQualifications(params?: QueryQualificationsParams): Promise<PagedResult<QualificationListItem>> {
  const result = await safeInvoke<PagedResult<QualificationListItem>>('tender_list_qualifications', { params });
  return result ?? ({} as PagedResult<QualificationListItem>);
}

export async function updateQualification(id: string, request: UpdateQualificationRequest): Promise<Qualification> {
  const result = await safeInvoke<Qualification>('tender_update_qualification', { id, request });
  return result ?? ({} as Qualification);
}

export async function deleteQualification(id: string): Promise<void> {
  await safeInvoke('tender_delete_qualification', { id });
}

// ==================== 业绩 API ====================

export async function createCase(request: CreateCaseRequest, tenantId?: string): Promise<Case> {
  const result = await safeInvoke<Case>('tender_create_case', { request, tenantId });
  return result ?? ({} as Case);
}

export async function getCase(id: string): Promise<Case> {
  const result = await safeInvoke<Case>('tender_get_case', { id });
  return result ?? ({} as Case);
}

export async function listCases(params?: QueryCasesParams): Promise<PagedResult<CaseListItem>> {
  const result = await safeInvoke<PagedResult<CaseListItem>>('tender_list_cases', { params });
  return result ?? ({} as PagedResult<CaseListItem>);
}

export async function updateCase(id: string, request: UpdateCaseRequest): Promise<Case> {
  const result = await safeInvoke<Case>('tender_update_case', { id, request });
  return result ?? ({} as Case);
}

export async function deleteCase(id: string): Promise<void> {
  await safeInvoke('tender_delete_case', { id });
}

// ==================== 投标项目 API ====================

export async function createTenderProject(request: CreateTenderProjectRequest, tenantId?: string): Promise<TenderProject> {
  const result = await safeInvoke<TenderProject>('tender_create_project', { request, tenantId });
  return result ?? ({} as TenderProject);
}

export async function getTenderProject(id: string): Promise<TenderProject> {
  const result = await safeInvoke<TenderProject>('tender_get_project', { id });
  return result ?? ({} as TenderProject);
}

export async function listTenderProjects(params?: QueryTenderProjectsParams): Promise<PagedResult<TenderProjectListItem>> {
  const result = await safeInvoke<PagedResult<TenderProjectListItem>>('tender_list_projects', { params });
  return result ?? ({} as PagedResult<TenderProjectListItem>);
}

export async function updateTenderProject(id: string, request: UpdateTenderProjectRequest): Promise<TenderProject> {
  const result = await safeInvoke<TenderProject>('tender_update_project', { id, request });
  return result ?? ({} as TenderProject);
}

export async function updateTenderProjectStatus(id: string, request: UpdateTenderStatusRequest): Promise<TenderProject> {
  const result = await safeInvoke<TenderProject>('tender_update_project_status', { id, request });
  return result ?? ({} as TenderProject);
}

export async function deleteTenderProject(id: string): Promise<void> {
  await safeInvoke('tender_delete_project', { id });
}

export async function getTenderStatistics(): Promise<TenderStatistics> {
  const result = await safeInvoke<TenderStatistics>('tender_get_statistics');
  return result ?? ({} as TenderStatistics);
}

// ==================== 模板 API ====================

export async function createTemplate(request: CreateTemplateRequest, tenantId?: string): Promise<BidTemplate> {
  const result = await safeInvoke<BidTemplate>('tender_create_template', { request, tenantId });
  return result ?? ({} as BidTemplate);
}

export async function getTemplate(id: string): Promise<BidTemplate> {
  const result = await safeInvoke<BidTemplate>('tender_get_template', { id });
  return result ?? ({} as BidTemplate);
}

export async function listTemplates(params?: QueryTemplatesParams): Promise<PagedResult<TemplateListItem>> {
  const result = await safeInvoke<PagedResult<TemplateListItem>>('tender_list_templates', { params });
  return result ?? ({} as PagedResult<TemplateListItem>);
}

export async function updateTemplate(id: string, request: UpdateTemplateRequest): Promise<BidTemplate> {
  const result = await safeInvoke<BidTemplate>('tender_update_template', { id, request });
  return result ?? ({} as BidTemplate);
}

export async function deleteTemplate(id: string): Promise<void> {
  await safeInvoke('tender_delete_template', { id });
}

// ==================== 文档 API ====================

export async function createDocument(request: CreateDocumentRequest, tenantId?: string): Promise<TenderDocument> {
  const result = await safeInvoke<TenderDocument>('tender_create_document', { request, tenantId });
  return result ?? ({} as TenderDocument);
}

export async function getDocument(id: string): Promise<TenderDocument> {
  const result = await safeInvoke<TenderDocument>('tender_get_document', { id });
  return result ?? ({} as TenderDocument);
}

export async function listDocuments(params?: QueryDocumentsParams): Promise<PagedResult<DocumentListItem>> {
  const result = await safeInvoke<PagedResult<DocumentListItem>>('tender_list_documents', { params });
  return result ?? ({} as PagedResult<DocumentListItem>);
}

export async function updateDocument(id: string, request: UpdateDocumentRequest): Promise<TenderDocument> {
  const result = await safeInvoke<TenderDocument>('tender_update_document', { id, request });
  return result ?? ({} as TenderDocument);
}

export async function deleteDocument(id: string): Promise<void> {
  await safeInvoke('tender_delete_document', { id });
}

export async function generateDocument(documentId: string, request: GenerateDocumentRequest): Promise<TenderDocument> {
  const result = await safeInvoke<TenderDocument>('tender_generate_document', { documentId, request });
  return result ?? ({} as TenderDocument);
}
