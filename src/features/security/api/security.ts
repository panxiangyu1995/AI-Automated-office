//! Security 模块 API 封装

import { safeInvoke } from '@/lib/tauri';
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
  const result = await safeInvoke<SecretKey>('security_create_key', { request, tenantId, userId });
  return result ?? ({} as SecretKey);
}

export async function getKey(id: string): Promise<SecretKey> {
  const result = await safeInvoke<SecretKey>('security_get_key', { id });
  return result ?? ({} as SecretKey);
}

export async function listKeys(params?: QueryKeysParams): Promise<PagedResult<KeyListItem>> {
  const result = await safeInvoke<PagedResult<KeyListItem>>('security_list_keys', { params });
  return result ?? ({} as PagedResult<KeyListItem>);
}

export async function updateKey(id: string, request: UpdateKeyRequest): Promise<SecretKey> {
  const result = await safeInvoke<SecretKey>('security_update_key', { id, request });
  return result ?? ({} as SecretKey);
}

export async function rotateKey(id: string): Promise<SecretKey> {
  const result = await safeInvoke<SecretKey>('security_rotate_key', { id });
  return result ?? ({} as SecretKey);
}

export async function revokeKey(id: string): Promise<SecretKey> {
  const result = await safeInvoke<SecretKey>('security_revoke_key', { id });
  return result ?? ({} as SecretKey);
}

export async function deleteKey(id: string): Promise<void> {
  await safeInvoke('security_delete_key', { id });
}

export async function getKeyStats(): Promise<KeyStats> {
  const result = await safeInvoke<KeyStats>('security_get_stats');
  return result ?? ({} as KeyStats);
}

// ==================== 加密 API ====================

export async function encrypt(request: EncryptRequest): Promise<EncryptResult> {
  const result = await safeInvoke<EncryptResult>('security_encrypt', { request });
  return result ?? ({} as EncryptResult);
}

export async function decrypt(request: DecryptRequest): Promise<DecryptResult> {
  const result = await safeInvoke<DecryptResult>('security_decrypt', { request });
  return result ?? ({} as DecryptResult);
}

// ==================== 审计 API ====================

export async function getAuditLogs(keyId?: string, limit?: number): Promise<AuditLog[]> {
  const result = await safeInvoke<AuditLog[]>('security_get_audit_logs', { keyId, limit });
  return result ?? [];
}

// ==================== 数据治理 API ====================

export async function createClassification(request: CreateClassificationRequest, tenantId?: string): Promise<DataClassification> {
  const result = await safeInvoke<DataClassification>('security_create_classification', { request, tenantId });
  return result ?? ({} as DataClassification);
}

export async function getClassification(id: string): Promise<DataClassification> {
  const result = await safeInvoke<DataClassification>('security_get_classification', { id });
  return result ?? ({} as DataClassification);
}

export async function listClassifications(): Promise<DataClassification[]> {
  const result = await safeInvoke<DataClassification[]>('security_list_classifications');
  return result ?? [];
}

export async function updateClassification(id: string, request: UpdateClassificationRequest): Promise<DataClassification> {
  const result = await safeInvoke<DataClassification>('security_update_classification', { id, request });
  return result ?? ({} as DataClassification);
}

export async function deleteClassification(id: string): Promise<void> {
  await safeInvoke('security_delete_classification', { id });
}

export async function createMaskingRule(request: CreateMaskingRuleRequest, tenantId?: string): Promise<DataMaskingRule> {
  const result = await safeInvoke<DataMaskingRule>('security_create_masking_rule', { request, tenantId });
  return result ?? ({} as DataMaskingRule);
}

export async function listMaskingRules(): Promise<DataMaskingRule[]> {
  const result = await safeInvoke<DataMaskingRule[]>('security_list_masking_rules');
  return result ?? [];
}

export async function updateMaskingRule(id: string, request: UpdateMaskingRuleRequest): Promise<DataMaskingRule> {
  const result = await safeInvoke<DataMaskingRule>('security_update_masking_rule', { id, request });
  return result ?? ({} as DataMaskingRule);
}

export async function deleteMaskingRule(id: string): Promise<void> {
  await safeInvoke('security_delete_masking_rule', { id });
}

export async function applyMasking(request: MaskingRequest): Promise<MaskingResponse> {
  const result = await safeInvoke<MaskingResponse>('security_apply_masking', { request });
  return result ?? ({} as MaskingResponse);
}

export async function createRetentionPolicy(request: CreateRetentionPolicyRequest, tenantId?: string): Promise<DataRetentionPolicy> {
  const result = await safeInvoke<DataRetentionPolicy>('security_create_retention_policy', { request, tenantId });
  return result ?? ({} as DataRetentionPolicy);
}

export async function listRetentionPolicies(): Promise<DataRetentionPolicy[]> {
  const result = await safeInvoke<DataRetentionPolicy[]>('security_list_retention_policies');
  return result ?? [];
}

export async function recordSensitiveAccess(access: SensitiveDataAccess): Promise<void> {
  await safeInvoke('security_record_sensitive_access', { access });
}

export async function getSensitiveAccess(userId?: string, limit?: number): Promise<SensitiveDataAccess[]> {
  const result = await safeInvoke<SensitiveDataAccess[]>('security_get_sensitive_access', { userId, limit });
  return result ?? [];
}

export async function getGovernanceStats(): Promise<GovernanceStats> {
  const result = await safeInvoke<GovernanceStats>('security_get_governance_stats');
  return result ?? ({} as GovernanceStats);
}
