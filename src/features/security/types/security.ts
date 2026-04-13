//! Security 模块类型定义

export type KeyType = 'master' | 'data_encryption' | 'signing' | 'api' | 'database';
export type KeyStatus = 'active' | 'rotating' | 'expired' | 'revoked';
export type AuditEventType = 'key_created' | 'key_accessed' | 'key_rotated' | 'key_expired' | 'key_revoked' | 'encryption_performed' | 'decryption_performed' | 'access_denied';

export interface SecretKey {
  id: string;
  name: string;
  keyType: KeyType;
  keyValue: string;
  status: KeyStatus;
  algorithm: string;
  keySize: number;
  expiresAt?: number;
  rotationPolicy?: RotationPolicy;
  metadata: Record<string, string>;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface RotationPolicy {
  enabled: boolean;
  intervalDays: number;
  lastRotated?: number;
  nextRotation?: number;
  autoRotate: boolean;
}

export interface EncryptRequest {
  plaintext: string;
  keyId?: string;
  algorithm?: string;
}

export interface EncryptResult {
  ciphertext: string;
  keyId: string;
  algorithm: string;
  iv: string;
}

export interface DecryptRequest {
  ciphertext: string;
  keyId: string;
  algorithm: string;
  iv: string;
}

export interface DecryptResult {
  plaintext: string;
}

export interface AuditLog {
  id: string;
  eventType: AuditEventType;
  keyId?: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata: Record<string, string>;
  timestamp: number;
}

export interface CreateKeyRequest {
  name: string;
  keyType: KeyType;
  algorithm?: string;
  keySize?: number;
  expiresAt?: number;
  rotationPolicy?: RotationPolicy;
  metadata?: Record<string, string>;
}

export interface UpdateKeyRequest {
  name?: string;
  expiresAt?: number;
  rotationPolicy?: RotationPolicy;
  metadata?: Record<string, string>;
}

export interface RotateKeyRequest {
  keyId: string;
}

export interface QueryKeysParams {
  keyType?: KeyType;
  status?: KeyStatus;
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

export interface KeyListItem {
  id: string;
  name: string;
  keyType: KeyType;
  status: KeyStatus;
  algorithm: string;
  expiresAt?: number;
  createdAt: number;
}

export interface KeyStats {
  totalKeys: number;
  activeKeys: number;
  expiringKeys: number;
  expiredKeys: number;
}

// ==================== 工具权限类型 ====================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ToolPermission {
  id: string;
  toolName: string;
  description: string;
  riskLevel: RiskLevel;
  requiredRoles: string[];
  isWhitelisted: boolean;
  auditRequired: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RoleToolBinding {
  id: string;
  roleId: string;
  toolPermissionIds: string[];
  createdAt: number;
  updatedAt: number;
}

export const riskLevelMeta: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: '低风险', color: 'bg-green-100 text-green-800' },
  medium: { label: '中风险', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: '高风险', color: 'bg-orange-100 text-orange-800' },
  critical: { label: '极高风险', color: 'bg-red-100 text-red-800' },
};

export const keyStatusMeta: Record<KeyStatus, { label: string; color: string }> = {
  active: { label: '活跃', color: 'bg-green-100 text-green-800' },
  rotating: { label: '轮换中', color: 'bg-yellow-100 text-yellow-800' },
  expired: { label: '已过期', color: 'bg-red-100 text-red-800' },
  revoked: { label: '已吊销', color: 'bg-gray-100 text-gray-800' },
};

export const keyTypeMeta: Record<KeyType, { label: string; color: string }> = {
  master: { label: '主密钥', color: 'bg-purple-100 text-purple-800' },
  data_encryption: { label: '数据加密', color: 'bg-blue-100 text-blue-800' },
  signing: { label: '签名', color: 'bg-orange-100 text-orange-800' },
  api: { label: 'API密钥', color: 'bg-cyan-100 text-cyan-800' },
  database: { label: '数据库', color: 'bg-pink-100 text-pink-800' },
};

// ==================== 数据治理类型 ====================

export type DataSensitivity = 'public' | 'internal' | 'confidential' | 'highly_confidential';

export interface DataClassification {
  id: string;
  name: string;
  sensitivity: DataSensitivity;
  description: string;
  retentionDays: number;
  encryptionRequired: boolean;
  metadata: Record<string, string>;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

export type MaskingType = 'full' | 'partial' | 'email' | 'phone' | 'id_card' | 'custom';

export interface DataMaskingRule {
  id: string;
  fieldName: string;
  maskingType: MaskingType;
  pattern?: string;
  enabled: boolean;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

export interface DataRetentionPolicy {
  id: string;
  name: string;
  dataType: string;
  retentionDays: number;
  autoDelete: boolean;
  archiveBeforeDelete: boolean;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

export interface SensitiveDataAccess {
  id: string;
  dataType: string;
  fieldName: string;
  accessType: string;
  userId: string;
  reason: string;
  ipAddress?: string;
  timestamp: number;
}

export interface GovernanceStats {
  totalClassifications: number;
  totalMaskingRules: number;
  totalRetentionPolicies: number;
  sensitiveAccessCount: number;
}

// Request types
export interface CreateClassificationRequest {
  name: string;
  sensitivity: DataSensitivity;
  description?: string;
  retentionDays?: number;
  encryptionRequired?: boolean;
  metadata?: Record<string, string>;
}

export interface UpdateClassificationRequest {
  name?: string;
  sensitivity?: DataSensitivity;
  description?: string;
  retentionDays?: number;
  encryptionRequired?: boolean;
  metadata?: Record<string, string>;
}

export interface CreateMaskingRuleRequest {
  fieldName: string;
  maskingType: MaskingType;
  pattern?: string;
  enabled?: boolean;
}

export interface UpdateMaskingRuleRequest {
  maskingType?: MaskingType;
  pattern?: string;
  enabled?: boolean;
}

export interface CreateRetentionPolicyRequest {
  name: string;
  dataType: string;
  retentionDays: number;
  autoDelete?: boolean;
  archiveBeforeDelete?: boolean;
}

export interface MaskingRequest {
  value: string;
  ruleId: string;
}

export interface MaskingResponse {
  originalValue: string;
  maskedValue: string;
  ruleId: string;
}

// Metadata
export const sensitivityMeta: Record<DataSensitivity, { label: string; color: string }> = {
  public: { label: '公开', color: 'bg-gray-100 text-gray-800' },
  internal: { label: '内部', color: 'bg-blue-100 text-blue-800' },
  confidential: { label: '机密', color: 'bg-orange-100 text-orange-800' },
  highly_confidential: { label: '高度机密', color: 'bg-red-100 text-red-800' },
};

export const maskingTypeMeta: Record<MaskingType, { label: string; example: string }> = {
  full: { label: '完全掩码', example: '********' },
  partial: { label: '部分掩码', example: '1234****' },
  email: { label: '邮箱掩码', example: 'jo***@***.com' },
  phone: { label: '手机掩码', example: '138****1234' },
  id_card: { label: '身份证掩码', example: '110101****1234****' },
  custom: { label: '自定义', example: 'custom pattern' },
};
