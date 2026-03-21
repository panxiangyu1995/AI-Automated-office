/**
 * 审计日志筛选器组件
 *
 * @module AuditFilterBar
 * @description 提供审计日志列表筛选功能
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import type { AuditLogQueryParams } from '../types/audit.types'
import {
  EVENT_TYPE_OPTIONS,
  RESOURCE_OPTIONS,
  ACTION_OPTIONS,
  RESULT_OPTIONS,
} from '../types/audit.types'

interface AuditFilterBarProps {
  filters: AuditLogQueryParams
  onFilter: (filters: AuditLogQueryParams) => void
  onReset: () => void
}

export function AuditFilterBar({ filters, onFilter, onReset }: AuditFilterBarProps) {
  const handleEventTypeChange = (value: string) => {
    onFilter({ ...filters, event_type: value === 'all' ? undefined : value, page: 1 })
  }

  const handleResourceChange = (value: string) => {
    onFilter({ ...filters, resource: value === 'all' ? undefined : value, page: 1 })
  }

  const handleActionChange = (value: string) => {
    onFilter({ ...filters, action: value === 'all' ? undefined : value, page: 1 })
  }

  const handleResultChange = (value: string) => {
    onFilter({ ...filters, result: value === 'all' ? undefined : (value as 'success' | 'failure'), page: 1 })
  }

  const handleStartTimeChange = (value: string) => {
    onFilter({ ...filters, start_time: value || undefined, page: 1 })
  }

  const handleEndTimeChange = (value: string) => {
    onFilter({ ...filters, end_time: value || undefined, page: 1 })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* 事件类型选择 */}
        <div className="w-[180px] space-y-2">
          <label className="text-sm font-medium text-gray-700">事件类型</label>
          <Select
            value={filters.event_type || 'all'}
            onValueChange={handleEventTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="全部事件" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部事件</SelectItem>
              {EVENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 资源类型选择 */}
        <div className="w-[150px] space-y-2">
          <label className="text-sm font-medium text-gray-700">资源类型</label>
          <Select
            value={filters.resource || 'all'}
            onValueChange={handleResourceChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="全部资源" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部资源</SelectItem>
              {RESOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 操作类型选择 */}
        <div className="w-[150px] space-y-2">
          <label className="text-sm font-medium text-gray-700">操作类型</label>
          <Select
            value={filters.action || 'all'}
            onValueChange={handleActionChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="全部操作" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部操作</SelectItem>
              {ACTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 结果选择 */}
        <div className="w-[120px] space-y-2">
          <label className="text-sm font-medium text-gray-700">结果</label>
          <Select
            value={filters.result || 'all'}
            onValueChange={handleResultChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="全部结果" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {RESULT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 重置按钮 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-transparent">操作</label>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            重置
          </Button>
        </div>
      </div>

      {/* 时间范围 */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-[200px] space-y-2">
          <label className="text-sm font-medium text-gray-700">开始时间</label>
          <Input
            type="datetime-local"
            value={filters.start_time || ''}
            onChange={(e) => handleStartTimeChange(e.target.value)}
          />
        </div>

        <div className="w-[200px] space-y-2">
          <label className="text-sm font-medium text-gray-700">结束时间</label>
          <Input
            type="datetime-local"
            value={filters.end_time || ''}
            onChange={(e) => handleEndTimeChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
