//! Security 模块 API 封装

import { invoke } from '@tauri-apps/api/core';
import type {
  SecretKey,
  AuditLog,
  CreateKeyRequest,
  UpdateKeyRequest,
  EncryptRequest,
  EncryptResult,
  DecryptRequest,
  DecryptResult,
  QueryKeysParams,
  KeyStats,
  KeyListItem,
  PagedResult,
  DataClassification,
  DataMaskingRule,
  DataRetentionPolicy,
  SensitiveDataAccess,
  GovernanceStats,
  CreateClassificationRequest,
  UpdateClassificationRequest,
  CreateMaskingRuleRequest,
  UpdateMaskingRuleRequest,
  CreateRetentionPolicyRequest,
  MaskingRequest,
  MaskingResponse,
} from '../types/security';

// ==================== 密钥 API ====================

export async function createKey(request: CreateKeyRequest, tenantId?: string, userId?: string): Promise<SecretKey> {
  return invoke('security_create_key', { request, tenantId, userId });
}

export async function getKey(id: string): Promise<SecretKey> {
  return invoke('security_get_key', { id });
}

export async function listKeys(params?: QueryKeysParams): Promise<PagedResult<KeyListItem>> {
  return invoke('security_list_keys', { params });
}

export async function updateKey(id: string, request: UpdateKeyRequest): Promise<SecretKey> {
  return invoke('security_update_key', { id, request });
}

export async function rotateKey(id: string): Promise<SecretKey> {
  return invoke('security_rotate_key', { id });
}

export async function revokeKey(id: string): Promise<SecretKey> {
  return invoke('security_revoke_key', { id });
}

export async function deleteKey(id: string): Promise<void> {
  return invoke('security_delete_key', { id });
}

export async function getKeyStats(): Promise<KeyStats> {
  return invoke('security_get_stats');
}

// ==================== 加密 API ====================

export async function encrypt(request: EncryptRequest): Promise<EncryptResult> {
  return invoke('security_encrypt', { request });
}

export async function decrypt(request: DecryptRequest): Promise<DecryptResult> {
  return invoke('security_decrypt', { request });
}

// ==================== 审计 API ====================

export async function getAuditLogs(keyId?: string, limit?: number): Promise<AuditLog[]> {
  return invoke('security_get_audit_logs', { keyId, limit });
}

// ==================== 数据治理 API ====================

export async function createClassification(request: CreateClassificationRequest, tenantId?: string): Promise<DataClassification> {
  return invoke('security_create_classification', { request, tenantId });
}

export async function getClassification(id: string): Promise<DataClassification> {
  return invoke('security_get_classification', { id });
}

export async function listClassifications(): Promise<DataClassification[]> {
  return invoke('security_list_classifications');
}

export async function updateClassification(id: string, request: UpdateClassificationRequest): Promise<DataClassification> {
  return invoke('security_update_classification', { id, request });
}

export async function deleteClassification(id: string): Promise<void> {
  return invoke('security_delete_classification', { id });
}

export async function createMaskingRule(request: CreateMaskingRuleRequest, tenantId?: string): Promise<DataMaskingRule> {
  return invoke('security_create_masking_rule', { request, tenantId });
}

export async function listMaskingRules(): Promise<DataMaskingRule[]> {
  return invoke('security_list_masking_rules');
}

export async function updateMaskingRule(id: string, request: UpdateMaskingRuleRequest): Promise<DataMaskingRule> {
  return invoke('security_update_masking_rule', { id, request });
}

export async function deleteMaskingRule(id: string): Promise<void> {
  return invoke('security_delete_masking_rule', { id });
}

export async function applyMasking(request: MaskingRequest): Promise<MaskingResponse> {
  return invoke('security_apply_masking', { request });
}

export async function createRetentionPolicy(request: CreateRetentionPolicyRequest, tenantId?: string): Promise<DataRetentionPolicy> {
  return invoke('security_create_retention_policy', { request, tenantId });
}

export async function listRetentionPolicies(): Promise<DataRetentionPolicy[]> {
  return invoke('security_list_retention_policies');
}

export async function recordSensitiveAccess(access: SensitiveDataAccess): Promise<void> {
  return invoke('security_record_sensitive_access', { access });
}

export async function getSensitiveAccess(userId?: string, limit?: number): Promise<SensitiveDataAccess[]> {
  return invoke('security_get_sensitive_access', { userId, limit });
}

export async function getGovernanceStats(): Promise<GovernanceStats> {
  return invoke('security_get_governance_stats');
}
