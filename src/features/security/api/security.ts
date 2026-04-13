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
