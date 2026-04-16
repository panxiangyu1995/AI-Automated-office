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
import { BuiltinJsonEditorPage, BuiltinMarkdownEditorPage, BuiltinTextEditorPage } from '@/features/editor/pages'
import { EditorRegistry, type EditorDescriptor } from '@/features/editor/registry/editorRegistry'
import type { WorkbenchPageContext } from '@/components/common'
import { ServicePage } from '@/features/service/pages/ServicePage'
import { TenderPage } from '@/features/tender/pages/TenderPage'
import { MarketingPage } from '@/features/marketing/pages/MarketingPage'
/** 核心部门页面（不可卸载） */
import { HrPage } from '@/features/hr/pages/HrPage'
import { FinancePage } from '@/features/finance/pages/FinancePage'
import { SalesPage } from '@/features/sales/pages/SalesPage'
import { ApprovalPage } from '@/features/approval/pages/ApprovalPage'
import { WarehousePage } from '@/features/warehouse/pages/WarehousePage'
/** 知识库页面 */
import { KnowledgePage } from '@/features/knowledge/pages/KnowledgePage'
/** Agent 协作页面 */
import { GroupChat } from '@/features/agent/components/GroupChat'

const fallbackEditorDescriptor: EditorDescriptor = {
  id: 'builtin-text-editor',
  label: 'Text Editor',
  priority: 0,
  matches: () => true,
  render: (context) => <BuiltinTextEditorPage context={context} />,
}

const coreEditorRegistry = new EditorRegistry(fallbackEditorDescriptor)

let hasRegisteredCoreEditors = false

function registerCoreEditors() {
  if (hasRegisteredCoreEditors) {
    return
  }

  coreEditorRegistry.register({
    id: 'builtin-json-editor',
    label: 'JSON Editor',
    priority: 300,
    matches: (resourceId) => /\.json$/i.test(resourceId),
    render: (context) => <BuiltinJsonEditorPage context={context} />,
  })

  coreEditorRegistry.register({
    id: 'builtin-markdown-editor',
    label: 'Markdown Editor',
    priority: 200,
    matches: (resourceId) => /\.md$/i.test(resourceId),
    render: (context) => <BuiltinMarkdownEditorPage context={context} />,
  })

  coreEditorRegistry.register({
    id: 'builtin-text-editor',
    label: 'Text Editor',
    priority: 100,
    matches: () => true,
    render: (context) => <BuiltinTextEditorPage context={context} />,
  })

  hasRegisteredCoreEditors = true
}

registerCoreEditors()

function resolveEditorDescriptor(context: WorkbenchPageContext): EditorDescriptor {
  const docId = decodeURIComponent(context.params.docId ?? '')
  return coreEditorRegistry.resolve(docId)
}

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
  {
    id: 'service',
    path: 'service',
    title: '售后服务',
    resource: 'service',
    mode: 'static',
    component: ServicePage,
  },
  {
    id: 'tender',
    path: 'tender',
    title: '招投标',
    resource: 'tender',
    mode: 'static',
    component: TenderPage,
  },
  {
    id: 'marketing',
    path: 'marketing',
    title: '市场宣传',
    resource: 'marketing',
    mode: 'static',
    component: MarketingPage,
  },
  // ===== 核心部门路由（不可卸载） =====
  {
    id: 'hr',
    path: 'hr',
    title: '人事管理',
    resource: 'hr',
    mode: 'static',
    component: HrPage,
  },
  {
    id: 'finance',
    path: 'finance',
    title: '财务管理',
    resource: 'finance',
    mode: 'static',
    component: FinancePage,
  },
  {
    id: 'sales',
    path: 'sales',
    title: '销售管理',
    resource: 'sales',
    mode: 'static',
    component: SalesPage,
  },
  {
    id: 'approval',
    path: 'approval',
    title: '审批中心',
    resource: 'approval',
    mode: 'static',
    component: ApprovalPage,
  },
  {
    id: 'warehouse',
    path: 'warehouse',
    title: '仓库管理',
    resource: 'warehouse',
    mode: 'static',
    component: WarehousePage,
  },
  {
    id: 'knowledge',
    path: 'knowledge',
    title: '知识库',
    resource: 'knowledge',
    mode: 'static',
    component: KnowledgePage,
  },
  // ===== Agent 协作路由 =====
  {
    id: 'group-chat',
    path: 'chat/group',
    title: '群组聊天',
    resource: 'chat/group',
    mode: 'static',
    component: () => <GroupChat currentUserId="current-user" groups={[]} onSendMessage={() => {}} />,
  },
  {
    id: 'builtin-text-editor',
    path: 'editor/:docId',
    title: 'Text Editor',
    resource: 'editor/text',
    mode: 'editor',
    resolveDescriptor: (context) => {
      const resolvedEditor = resolveEditorDescriptor(context)
      return {
        id: `${resolvedEditor.id}:${context.params.docId ?? 'untitled'}`,
        title: `${resolvedEditor.label} · ${context.params.docId ?? 'untitled.txt'}`,
        mode: 'editor',
        render: () => resolvedEditor.render(context),
      }
    },
  },
]

export function createWorkbenchRouteObjects(): RouteObject[] {
  return workbenchRoutes.map((route) => ({
    path: route.path,
    element: <RouteContainer route={route} />,
  }))
}
