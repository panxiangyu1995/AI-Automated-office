/**
 * 审计日志表格组件
 *
 * @module AuditLogTable
 * @description 展示审计日志列表数据的表格组件
 */

import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuditLogItem } from '../types/audit.types'

interface AuditLogTableProps {
  logs: AuditLogItem[]
  loading?: boolean
  onViewDetail: (logId: string) => void
}

// 结果徽章组件
function ResultBadge({ result }: { result: 'success' | 'failure' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        result === 'success'
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      )}
    >
      {result === 'success' ? '成功' : '失败'}
    </span>
  )
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

export function AuditLogTable({ logs, loading, onViewDetail }: AuditLogTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">暂无审计日志</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-medium text-gray-600">时间</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">操作人</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">事件类型</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">资源</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">结果</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">IP地址</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {new Date(log.created_at).toLocaleString('zh-CN')}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">
                {log.operator_name || '-'}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {formatEventType(log.event_type)}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {formatResource(log.resource)}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {formatAction(log.action)}
              </td>
              <td className="px-4 py-3">
                <ResultBadge result={log.result} />
              </td>
              <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                {log.ip_address || '-'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => onViewDetail(log.id)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="查看详情"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
