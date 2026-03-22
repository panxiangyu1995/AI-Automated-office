import type { RouteObject } from 'react-router-dom'
import { RouteContainer, type WorkbenchRouteDefinition } from '@/components/common/RouteContainer'
import {
  UserListPage,
  UserCreatePage,
  UserEditPage,
  OrganizationPage,
  OrgChartPage,
  ImportExportPage,
} from '@/features/admin/pages'
import { PermissionCenter, FineGrainedPermissionPage } from '@/features/permission'
import { AuditPage } from '@/features/audit'

export const workbenchRoutes: WorkbenchRouteDefinition[] = [
  {
    id: 'admin-users-list',
    path: 'admin/users',
    title: 'User Management',
    resource: 'admin/users',
    mode: 'static',
    requiredPermission: 'admin_user_read',
    component: UserListPage,
  },
  {
    id: 'admin-users-create',
    path: 'admin/users/create',
    title: 'Create User',
    resource: 'admin/users/create',
    mode: 'static',
    requiredPermission: 'admin_user_write',
    component: UserCreatePage,
  },
  {
    id: 'admin-users-edit',
    path: 'admin/users/:id/edit',
    title: 'Edit User',
    resource: 'admin/users/edit',
    mode: 'static',
    requiredPermission: 'admin_user_write',
    component: UserEditPage,
  },
  {
    id: 'admin-organization',
    path: 'admin/organization',
    title: 'Organization',
    resource: 'admin/organization',
    mode: 'static',
    requiredPermission: 'admin_org_read',
    component: OrganizationPage,
  },
  {
    id: 'admin-org-chart',
    path: 'admin/org-chart',
    title: 'Organization Chart',
    resource: 'admin/org-chart',
    mode: 'static',
    requiredPermission: 'admin_org_read',
    component: OrgChartPage,
  },
  {
    id: 'admin-permissions',
    path: 'admin/permissions',
    title: 'Permission Center',
    resource: 'admin/permissions',
    mode: 'static',
    requiredPermission: 'admin_permission_read',
    component: PermissionCenter,
  },
  {
    id: 'admin-permissions-fine-grained',
    path: 'admin/permissions/fine-grained',
    title: 'Fine-grained Permissions',
    resource: 'admin/permissions/fine-grained',
    mode: 'static',
    requiredPermission: 'admin_permission_write',
    component: FineGrainedPermissionPage,
  },
  {
    id: 'admin-import-export',
    path: 'admin/import-export',
    title: 'Import and Export',
    resource: 'admin/import-export',
    mode: 'static',
    requiredPermission: 'admin_user_import',
    component: ImportExportPage,
  },
  {
    id: 'admin-audit',
    path: 'admin/audit',
    title: 'Audit Logs',
    resource: 'admin/audit',
    mode: 'static',
    requiredPermission: 'admin_audit_read',
    component: AuditPage,
  },
]

export function createWorkbenchRouteObjects(): RouteObject[] {
  return workbenchRoutes.map((route) => ({
    path: route.path,
    element: <RouteContainer route={route} />,
  }))
}
