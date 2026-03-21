/**
 * 审计日志导出按钮组件
 *
 * @module AuditExportButton
 * @description 提供审计日志导出功能的按钮组件
 */

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { auditApi, resolveErrorMessage } from '../api/auditApi'
import type { AuditLogQueryParams, ExportFormat } from '../types/audit.types'

interface AuditExportButtonProps {
  filters: AuditLogQueryParams
  disabled?: boolean
}

export function AuditExportButton({ filters, disabled }: AuditExportButtonProps) {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    try {
      setExporting(true)
      await auditApi.exportAuditLogs(filters, format)
    } catch (err) {
      const message = resolveErrorMessage(err, '导出审计日志')
      alert(message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={format}
        onValueChange={(value) => setFormat(value as ExportFormat)}
        disabled={exporting || disabled}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="excel">Excel</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={exporting || disabled}
        className="gap-2"
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        导出
      </Button>
    </div>
  )
}
