/**
 * 审计日志详情弹窗组件
 *
 * @module AuditLogDetail
 * @description 展示审计日志完整详情的弹窗组件
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AuditLogDetail } from '../types/audit.types'
import { cn } from '@/lib/utils'

interface AuditLogDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: AuditLogDetail | null
  loading?: boolean
}

// 格式化事件类型
function formatEventType(eventType: string): string {
  const typeMap: Record<string, string> = {
    'auth.login': '登录',
    'auth.logout': '登出',
    'user.created': '用户创建',
    'user.updated': '用户更新',
    'user.deleted': '用户删除',
    'user.status_changed': '用户状态变更',
    'role.created': '角色创建',
    'role.updated': '角色更新',
    'role.deleted': '角色删除',
    'permission.granted': '权限授予',
    'permission.revoked': '权限撤销',
    'session.revoked': '会话撤销',
    'import.completed': '导入完成',
    'export.completed': '导出完成',
  }
  return typeMap[eventType] || eventType
}

// 格式化资源类型
function formatResource(resource: string): string {
  const resourceMap: Record<string, string> = {
    user: '用户',
    role: '角色',
    department: '部门',
    permission: '权限',
    session: '会话',
    import: '导入',
    export: '导出',
  }
  return resourceMap[resource] || resource
}

// 格式化操作类型
function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    enable: '启用',
    disable: '禁用',
    grant: '授予',
    revoke: '撤销',
    login: '登录',
    logout: '登出',
  }
  return actionMap[action] || action
}

// 详情行组件
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2">
      <dt className="w-24 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="flex-1 text-sm text-gray-900">{value || '-'}</dd>
    </div>
  )
}

// JSON 展示组件
function JsonDisplay({ data }: { data: Record<string, unknown> | undefined }) {
  if (!data || Object.keys(data).length === 0) {
    return <span className="text-gray-400">无</span>
  }

  return (
    <pre className="rounded bg-gray-50 p-3 text-xs overflow-x-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

export function AuditLogDetailDialog({ open, onOpenChange, log, loading }: AuditLogDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>审计日志详情</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : log ? (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">基本信息</h3>
              <dl className="divide-y divide-gray-100">
                <DetailRow
                  label="时间"
                  value={new Date(log.created_at).toLocaleString('zh-CN')}
                />
                <DetailRow
                  label="事件类型"
                  value={formatEventType(log.event_type)}
                />
                <DetailRow
                  label="资源"
                  value={formatResource(log.resource)}
                />
                <DetailRow
                  label="操作"
                  value={formatAction(log.action)}
                />
                <DetailRow
                  label="结果"
                  value={
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        log.result === 'success'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {log.result === 'success' ? '成功' : '失败'}
                    </span>
                  }
                />
              </dl>
            </div>

            {/* 操作人信息 */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">操作人</h3>
              <dl className="divide-y divide-gray-100">
                <DetailRow label="姓名" value={log.operator_name} />
                <DetailRow label="ID" value={log.operator_id} />
              </dl>
            </div>

            {/* 目标信息 */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">操作目标</h3>
              <dl className="divide-y divide-gray-100">
                <DetailRow label="目标类型" value={log.target_type} />
                <DetailRow label="目标ID" value={log.target_id} />
              </dl>
            </div>

            {/* 变更信息 */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">变更详情</h3>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">变更前</p>
                  <JsonDisplay data={log.old_values} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">变更后</p>
                  <JsonDisplay data={log.new_values} />
                </div>
              </div>
            </div>

            {/* 来源信息 */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">来源信息</h3>
              <dl className="divide-y divide-gray-100">
                <DetailRow label="IP地址" value={log.ip_address} />
                <DetailRow label="User-Agent" value={log.user_agent} />
                <DetailRow label="追踪ID" value={log.trace_id} />
              </dl>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-400">未找到审计日志</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
