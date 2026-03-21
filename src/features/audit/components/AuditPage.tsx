/**
 * 审计日志页面组件
 *
 * @module AuditPage
 * @description 审计日志查询和导出页面
 */

import { useState, useEffect, useCallback } from 'react'
import { AuditLogTable } from '../components/AuditLogTable'
import { AuditFilterBar } from '../components/AuditFilterBar'
import { AuditLogDetailDialog } from '../components/AuditLogDetail'
import { AuditExportButton } from '../components/AuditExportButton'
import { auditApi, resolveErrorMessage } from '../api/auditApi'
import type {
  AuditLogItem,
  AuditLogDetail,
  AuditLogQueryParams,
  AuditLogListResponse,
} from '../types/audit.types'

const DEFAULT_PAGE_SIZE = 20

export function AuditPage() {
  // 列表数据状态
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 筛选条件状态
  const [filters, setFilters] = useState<AuditLogQueryParams>({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
  })

  // 详情弹窗状态
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // 加载审计日志列表
  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response: AuditLogListResponse = await auditApi.listAuditLogs(filters)
      setLogs(response.list || [])
      setTotal(response.total || 0)
    } catch (err) {
      const message = resolveErrorMessage(err, '加载审计日志')
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // 初始化加载
  useEffect(() => {
    loadAuditLogs()
  }, [loadAuditLogs])

  // 处理筛选变更
  const handleFilter = (newFilters: AuditLogQueryParams) => {
    setFilters(newFilters)
  }

  // 处理筛选重置
  const handleReset = () => {
    setFilters({
      page: 1,
      page_size: DEFAULT_PAGE_SIZE,
    })
  }

  // 处理分页变更
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  // 处理查看详情
  const handleViewDetail = async (logId: string) => {
    try {
      setDetailOpen(true)
      setDetailLoading(true)
      const detail = await auditApi.getAuditLog(logId)
      setSelectedLog(detail)
    } catch (err) {
      const message = resolveErrorMessage(err, '加载审计日志详情')
      alert(message)
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  // 计算总页数
  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE)
  const currentPage = filters.page || 1

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">审计日志</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看和导出系统操作审计记录
          </p>
        </div>
        <AuditExportButton filters={filters} disabled={loading || logs.length === 0} />
      </div>

      {/* 筛选器 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <AuditFilterBar
          filters={filters}
          onFilter={handleFilter}
          onReset={handleReset}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 数据表格 */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <AuditLogTable
          logs={logs}
          loading={loading}
          onViewDetail={handleViewDetail}
        />
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            共 {total} 条记录，第 {currentPage} / {totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      <AuditLogDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        log={selectedLog}
        loading={detailLoading}
      />
    </div>
  )
}
