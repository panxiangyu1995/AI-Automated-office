/**
 * Test fixtures for E2E tests
 *
 * These fixtures represent test data that can be used across all E2E tests.
 */

export const testUsers = {
  admin: {
    id: 'test-admin-001',
    username: 'admin',
    password: 'Admin@123456',
    real_name: '系统管理员',
    email: 'admin@test.local',
    employee_code: 'ADMIN001',
    status: 'active',
  },
  manager: {
    id: 'test-manager-001',
    username: 'manager',
    password: 'Manager@123456',
    real_name: '部门经理',
    email: 'manager@test.local',
    employee_code: 'MGR001',
    status: 'active',
  },
  employee: {
    id: 'test-employee-001',
    username: 'employee',
    password: 'Employee@123456',
    real_name: '普通员工',
    email: 'employee@test.local',
    employee_code: 'EMP001',
    status: 'active',
  },
  inactiveUser: {
    id: 'test-inactive-001',
    username: 'inactive',
    password: 'Inactive@123456',
    real_name: '停用员工',
    email: 'inactive@test.local',
    employee_code: 'INACT001',
    status: 'inactive',
  },
}

export const testDepartments = {
  root: {
    id: 'test-dept-root',
    name: '测试公司',
    code: 'ROOT',
    parent_id: null,
    level: 1,
  },
  tech: {
    id: 'test-dept-tech',
    name: '技术部',
    code: 'TECH',
    parent_id: 'test-dept-root',
    level: 2,
  },
  hr: {
    id: 'test-dept-hr',
    name: '人力资源部',
    code: 'HR',
    parent_id: 'test-dept-root',
    level: 2,
  },
  finance: {
    id: 'test-dept-finance',
    name: '财务部',
    code: 'FINANCE',
    parent_id: 'test-dept-root',
    level: 2,
  },
}

export const testRoles = {
  admin: {
    id: 'test-role-admin',
    name: '系统管理员',
    code: 'ADMIN',
    layer: 'base',
    is_builtin: true,
  },
  deptManager: {
    id: 'test-role-dept-manager',
    name: '部门经理',
    code: 'DEPT_MANAGER',
    layer: 'department',
    is_builtin: false,
  },
  employee: {
    id: 'test-role-employee',
    name: '普通员工',
    code: 'EMPLOYEE',
    layer: 'base',
    is_builtin: true,
  },
  hrAdmin: {
    id: 'test-role-hr-admin',
    name: 'HR管理员',
    code: 'HR_ADMIN',
    layer: 'department',
    is_builtin: false,
  },
}

export const testTenant = {
  id: 'test-tenant-001',
  name: '测试租户',
  code: 'TEST_TENANT',
  status: 'active',
}

export const testPermissions = {
  userRead: 'auth_profile_read',
  userWrite: 'admin_user_write',
  userDelete: 'admin_user_delete',
  roleRead: 'admin_role_read',
  roleWrite: 'admin_role_write',
  deptRead: 'admin_department_read',
  deptWrite: 'admin_department_write',
  auditRead: 'audit_log_read',
  auditExport: 'audit_log_export',
  importExecute: 'admin_user_import',
  exportExecute: 'admin_user_export',
}

/**
 * Generate a unique test ID for E2E tests
 */
export function generateTestId(prefix: string = 'test'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 7)
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Test API endpoints
 */
export const apiEndpoints = {
  // Auth
  login: '/api/v1/auth/login',
  logout: '/api/v1/auth/logout',
  refresh: '/api/v1/auth/refresh',
  sessions: '/api/v1/auth/sessions',
  sessionsRevokeOthers: '/api/v1/auth/sessions/revoke-others',

  // Admin - Users
  users: '/api/v1/admin/users',
  userById: (id: string) => `/api/v1/admin/users/${id}`,
  userStatus: (id: string) => `/api/v1/admin/users/${id}/status`,
  userManager: (id: string) => `/api/v1/admin/users/${id}/manager`,
  userManagers: (id: string) => `/api/v1/admin/users/${id}/managers`,
  userSubordinates: (id: string) => `/api/v1/admin/users/${id}/subordinates`,
  userRoles: (id: string) => `/api/v1/admin/users/${id}/roles`,

  // Admin - Departments
  departments: '/api/v1/admin/departments',
  departmentById: (id: string) => `/api/v1/admin/departments/${id}`,
  departmentTree: '/api/v1/admin/departments/tree',

  // Admin - Roles & Permissions
  roles: '/api/v1/admin/roles',
  roleById: (id: string) => `/api/v1/admin/roles/${id}`,
  rolePermissions: (id: string) => `/api/v1/admin/roles/${id}/permissions`,
  permissions: '/api/v1/admin/permissions',

  // Fine-grained Permissions
  userPermissionOverrides: (id: string) => `/api/v1/admin/users/${id}/permission-overrides`,
  userDataScope: (id: string) => `/api/v1/admin/users/${id}/data-scope`,
  userFieldRestrictions: (id: string) => `/api/v1/admin/users/${id}/field-restrictions`,

  // Import/Export
  importTemplate: '/api/v1/admin/users/import/template',
  importPreview: '/api/v1/admin/users/import/preview',
  importConfirm: '/api/v1/admin/users/import/confirm',
  importBatch: (id: string) => `/api/v1/admin/users/import/batches/${id}`,
  importReceipt: (id: string) => `/api/v1/admin/users/import/${id}/receipt`,

  // Audit
  auditLogs: '/api/v1/audit/logs',
  auditLogById: (id: string) => `/api/v1/audit/logs/${id}`,
  auditExport: '/api/v1/audit/export',

  // Health
  health: '/api/v1/health',
}
