//! Tender 模块 API 封装

import { invoke } from '@tauri-apps/api/core';
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
  return invoke('tender_create_qualification', { request, tenantId });
}

export async function getQualification(id: string): Promise<Qualification> {
  return invoke('tender_get_qualification', { id });
}

export async function listQualifications(params?: QueryQualificationsParams): Promise<PagedResult<QualificationListItem>> {
  return invoke('tender_list_qualifications', { params });
}

export async function updateQualification(id: string, request: UpdateQualificationRequest): Promise<Qualification> {
  return invoke('tender_update_qualification', { id, request });
}

export async function deleteQualification(id: string): Promise<void> {
  return invoke('tender_delete_qualification', { id });
}

// ==================== 业绩 API ====================

export async function createCase(request: CreateCaseRequest, tenantId?: string): Promise<Case> {
  return invoke('tender_create_case', { request, tenantId });
}

export async function getCase(id: string): Promise<Case> {
  return invoke('tender_get_case', { id });
}

export async function listCases(params?: QueryCasesParams): Promise<PagedResult<CaseListItem>> {
  return invoke('tender_list_cases', { params });
}

export async function updateCase(id: string, request: UpdateCaseRequest): Promise<Case> {
  return invoke('tender_update_case', { id, request });
}

export async function deleteCase(id: string): Promise<void> {
  return invoke('tender_delete_case', { id });
}

// ==================== 投标项目 API ====================

export async function createTenderProject(request: CreateTenderProjectRequest, tenantId?: string): Promise<TenderProject> {
  return invoke('tender_create_project', { request, tenantId });
}

export async function getTenderProject(id: string): Promise<TenderProject> {
  return invoke('tender_get_project', { id });
}

export async function listTenderProjects(params?: QueryTenderProjectsParams): Promise<PagedResult<TenderProjectListItem>> {
  return invoke('tender_list_projects', { params });
}

export async function updateTenderProject(id: string, request: UpdateTenderProjectRequest): Promise<TenderProject> {
  return invoke('tender_update_project', { id, request });
}

export async function updateTenderProjectStatus(id: string, request: UpdateTenderStatusRequest): Promise<TenderProject> {
  return invoke('tender_update_project_status', { id, request });
}

export async function deleteTenderProject(id: string): Promise<void> {
  return invoke('tender_delete_project', { id });
}

export async function getTenderStatistics(): Promise<TenderStatistics> {
  return invoke('tender_get_statistics');
}

// ==================== 模板 API ====================

export async function createTemplate(request: CreateTemplateRequest, tenantId?: string): Promise<BidTemplate> {
  return invoke('tender_create_template', { request, tenantId });
}

export async function getTemplate(id: string): Promise<BidTemplate> {
  return invoke('tender_get_template', { id });
}

export async function listTemplates(params?: QueryTemplatesParams): Promise<PagedResult<TemplateListItem>> {
  return invoke('tender_list_templates', { params });
}

export async function updateTemplate(id: string, request: UpdateTemplateRequest): Promise<BidTemplate> {
  return invoke('tender_update_template', { id, request });
}

export async function deleteTemplate(id: string): Promise<void> {
  return invoke('tender_delete_template', { id });
}

// ==================== 文档 API ====================

export async function createDocument(request: CreateDocumentRequest, tenantId?: string): Promise<TenderDocument> {
  return invoke('tender_create_document', { request, tenantId });
}

export async function getDocument(id: string): Promise<TenderDocument> {
  return invoke('tender_get_document', { id });
}

export async function listDocuments(params?: QueryDocumentsParams): Promise<PagedResult<DocumentListItem>> {
  return invoke('tender_list_documents', { params });
}

export async function updateDocument(id: string, request: UpdateDocumentRequest): Promise<TenderDocument> {
  return invoke('tender_update_document', { id, request });
}

export async function deleteDocument(id: string): Promise<void> {
  return invoke('tender_delete_document', { id });
}

export async function generateDocument(documentId: string, request: GenerateDocumentRequest): Promise<TenderDocument> {
  return invoke('tender_generate_document', { documentId, request });
}
