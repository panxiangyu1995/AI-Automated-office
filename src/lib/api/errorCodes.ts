/**
 * API Error Codes
 *
 * These error codes must match the backend error codes in cloud-server/pkg/errors/codes.go
 * Format: DOMAIN_NUMBER (e.g., AUTH_001, USER_001)
 */

// ==================== General Errors (GEN_xxx) ====================
export const ErrBadRequest = 'GEN_001'
export const ErrNotFound = 'GEN_002'
export const ErrConflict = 'GEN_003'
export const ErrInternal = 'GEN_004'
export const ErrServiceUnavailable = 'GEN_005'
export const ErrRateLimited = 'GEN_006'
export const ErrValidationFailed = 'GEN_007'

// ==================== Authentication Errors (AUTH_xxx) ====================
export const ErrAuthRequired = 'AUTH_001'
export const ErrInvalidCredentials = 'AUTH_002'
export const ErrTokenInvalid = 'AUTH_003'
export const ErrTokenExpired = 'AUTH_004'
export const ErrTokenRevoked = 'AUTH_005'
export const ErrSessionExpired = 'AUTH_006'
export const ErrAccountLocked = 'AUTH_007'
export const ErrAccountDisabled = 'AUTH_008'
export const ErrAccountInactive = 'AUTH_009'
export const ErrInvalidAuthFormat = 'AUTH_010'
export const ErrRefreshTokenInvalid = 'AUTH_011'
export const ErrMFARequired = 'AUTH_012'

// ==================== Tenant Errors (TENANT_xxx) ====================
export const ErrTenantRequired = 'TENANT_001'
export const ErrTenantInvalid = 'TENANT_002'
export const ErrTenantInactive = 'TENANT_003'
export const ErrTenantNotFound = 'TENANT_004'
export const ErrTenantExpired = 'TENANT_005'

// ==================== Permission Errors (PERM_xxx) ====================
export const ErrPermissionDenied = 'PERM_001'
export const ErrRoleNotFound = 'PERM_002'
export const ErrRoleAlreadyExists = 'PERM_003'
export const ErrPermissionNotFound = 'PERM_004'
export const ErrDataScopeDenied = 'PERM_005'
export const ErrFieldPermissionDenied = 'PERM_006'
export const ErrPermissionExpired = 'PERM_007'

// ==================== User Errors (USER_xxx) ====================
export const ErrUserNotFound = 'USER_001'
export const ErrUserAlreadyExists = 'USER_002'
export const ErrUserInactive = 'USER_003'
export const ErrUserLocked = 'USER_004'
export const ErrInvalidUserId = 'USER_005'
export const ErrEmailAlreadyUsed = 'USER_006'
export const ErrPhoneAlreadyUsed = 'USER_007'
export const ErrEmployeeCodeExists = 'USER_008'
export const ErrCannotDeleteSelf = 'USER_009'
export const ErrCannotModifySelf = 'USER_010'

// ==================== Department Errors (DEPT_xxx) ====================
export const ErrDeptNotFound = 'DEPT_001'
export const ErrDeptAlreadyExists = 'DEPT_002'
export const ErrDeptHasChildren = 'DEPT_003'
export const ErrDeptHasUsers = 'DEPT_004'
export const ErrDeptCircularRef = 'DEPT_005'
export const ErrCannotMoveRoot = 'DEPT_006'

// ==================== Role Errors (ROLE_xxx) ====================
export const ErrRoleInUse = 'ROLE_001'
export const ErrCannotModifyBuiltin = 'ROLE_002'
export const ErrInvalidRoleId = 'ROLE_003'

// ==================== Import/Export Errors (IMP_xxx) ====================
export const ErrImportFailed = 'IMP_001'
export const ErrExportFailed = 'IMP_002'
export const ErrInvalidFileFormat = 'IMP_003'
export const ErrFileTooLarge = 'IMP_004'
export const ErrImportInProgress = 'IMP_005'
export const ErrTemplateNotFound = 'IMP_006'

// ==================== Session Errors (SESS_xxx) ====================
export const ErrSessionNotFound = 'SESS_001'
export const ErrSessionRevoked = 'SESS_002'
export const ErrSessionMaxReached = 'SESS_003'

// ==================== Audit Errors (AUDIT_xxx) ====================
export const ErrAuditLogNotFound = 'AUDIT_001'
export const ErrAuditExportFailed = 'AUDIT_002'

/**
 * Error code to user-friendly message mapping
 */
const errorMessages: Record<string, string> = {
  // General
  [ErrBadRequest]: '请求格式或参数无效',
  [ErrNotFound]: '资源不存在',
  [ErrConflict]: '资源冲突',
  [ErrInternal]: '服务器内部错误',
  [ErrServiceUnavailable]: '服务暂时不可用',
  [ErrRateLimited]: '请求频率超限',
  [ErrValidationFailed]: '请求验证失败',

  // Auth
  [ErrAuthRequired]: '请先登录',
  [ErrInvalidCredentials]: '用户名或密码错误',
  [ErrTokenInvalid]: '令牌无效',
  [ErrTokenExpired]: '令牌已过期',
  [ErrTokenRevoked]: '令牌已被撤销',
  [ErrSessionExpired]: '会话已过期',
  [ErrAccountLocked]: '账户已被锁定',
  [ErrAccountDisabled]: '账户已禁用',
  [ErrAccountInactive]: '账户未激活',
  [ErrInvalidAuthFormat]: '认证格式无效',
  [ErrRefreshTokenInvalid]: '刷新令牌无效',
  [ErrMFARequired]: '需要多因素认证',

  // Tenant
  [ErrTenantRequired]: '需要租户ID',
  [ErrTenantInvalid]: '租户ID无效',
  [ErrTenantInactive]: '租户已停用',
  [ErrTenantNotFound]: '租户不存在',
  [ErrTenantExpired]: '租户订阅已过期',

  // Permission
  [ErrPermissionDenied]: '权限不足',
  [ErrRoleNotFound]: '角色不存在',
  [ErrRoleAlreadyExists]: '角色已存在',
  [ErrPermissionNotFound]: '权限不存在',
  [ErrDataScopeDenied]: '数据范围访问被拒绝',
  [ErrFieldPermissionDenied]: '字段权限被拒绝',
  [ErrPermissionExpired]: '权限已过期',

  // User
  [ErrUserNotFound]: '用户不存在',
  [ErrUserAlreadyExists]: '用户已存在',
  [ErrUserInactive]: '用户未激活',
  [ErrUserLocked]: '用户已锁定',
  [ErrInvalidUserId]: '用户ID格式无效',
  [ErrEmailAlreadyUsed]: '邮箱已被使用',
  [ErrPhoneAlreadyUsed]: '手机号已被使用',
  [ErrEmployeeCodeExists]: '工号已存在',
  [ErrCannotDeleteSelf]: '无法删除自己的账户',
  [ErrCannotModifySelf]: '无法修改自己的该字段',

  // Department
  [ErrDeptNotFound]: '部门不存在',
  [ErrDeptAlreadyExists]: '部门已存在',
  [ErrDeptHasChildren]: '部门有子部门，无法删除',
  [ErrDeptHasUsers]: '部门有用户，无法删除',
  [ErrDeptCircularRef]: '检测到循环引用',
  [ErrCannotMoveRoot]: '无法移动根部门',

  // Role
  [ErrRoleInUse]: '角色正在使用中，无法删除',
  [ErrCannotModifyBuiltin]: '无法修改内置角色',
  [ErrInvalidRoleId]: '角色ID格式无效',

  // Import/Export
  [ErrImportFailed]: '导入失败',
  [ErrExportFailed]: '导出失败',
  [ErrInvalidFileFormat]: '文件格式无效',
  [ErrFileTooLarge]: '文件大小超限',
  [ErrImportInProgress]: '导入正在进行中',
  [ErrTemplateNotFound]: '模板不存在',

  // Session
  [ErrSessionNotFound]: '会话不存在',
  [ErrSessionRevoked]: '会话已被撤销',
  [ErrSessionMaxReached]: '已达到最大会话数',

  // Audit
  [ErrAuditLogNotFound]: '审计日志不存在',
  [ErrAuditExportFailed]: '审计导出失败',
}

/**
 * Get the localized error message for an error code
 */
export function getErrorMessage(code: string): string {
  return errorMessages[code] || '未知错误'
}

/**
 * Check if an error code indicates authentication issues
 */
export function isAuthError(code: string): boolean {
  return code.startsWith('AUTH_') || code === ErrSessionExpired
}

/**
 * Check if an error code indicates permission issues
 */
export function isPermissionError(code: string): boolean {
  return code.startsWith('PERM_')
}

/**
 * Check if an error code indicates tenant issues
 */
export function isTenantError(code: string): boolean {
  return code.startsWith('TENANT_')
}
