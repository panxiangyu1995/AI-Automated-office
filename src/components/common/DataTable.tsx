/**
 * DataTable - 数据表格组件
 * 
 * 提供通用的数据表格功能：排序、分页、行选择、操作菜单
 */

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  width?: string
  render?: (item: T, index: number) => ReactNode
}

export interface DataTableProps<T> {
  /** 列定义 */
  columns: Column<T>[]
  /** 数据 */
  data: T[]
  /** 加载状态 */
  loading?: boolean
  /** 行选择 */
  selectable?: boolean
  /** 选中的行 */
  selectedKeys?: Set<string | number>
  /** 行选择变化回调 */
  onSelectionChange?: (keys: Set<string | number>) => void
  /** 行点击 */
  onRowClick?: (item: T, index: number) => void
  /** 操作菜单 */
  actions?: Array<{
    key: string
    label: string
    onClick: (item: T) => void
    disabled?: (item: T) => boolean
  }>
  /** 空状态文本 */
  emptyText?: string
  /** 加载中组件 */
  loadingComponent?: ReactNode
}

/**
 * 数据表格组件
 */
export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  loading = false,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  onRowClick,
  actions,
  emptyText = '暂无数据',
  loadingComponent,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // 排序处理
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  // 排序数据
  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = (a as Record<string, unknown>)[sortKey]
    const bVal = (b as Record<string, unknown>)[sortKey]
    if (aVal === bVal) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    const cmp = aVal < bVal ? -1 : 1
    return sortOrder === 'asc' ? cmp : -cmp
  })

  // 全选处理
  const allSelected = data.length > 0 && data.every((item) => selectedKeys?.has(item.id!))
  const someSelected = data.some((item) => selectedKeys?.has(item.id!))

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.(new Set())
    } else {
      onSelectionChange?.(new Set(data.map((item) => item.id!).filter(Boolean)))
    }
  }

  const handleSelectRow = (id: string | number) => {
    const newKeys = new Set(selectedKeys)
    if (newKeys.has(id)) {
      newKeys.delete(id)
    } else {
      newKeys.add(id)
    }
    onSelectionChange?.(newKeys)
  }

  // 加载状态
  if (loading && loadingComponent) {
    return <div className="w-full">{loadingComponent}</div>
  }

  // 空状态
  if (!loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="w-full overflow-auto border rounded-lg">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            {selectable && (
              <th className="w-10 px-3 py-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Checkbox
                  checked={allSelected}
                  ref={(el) => { if (el) (el as any).indeterminate = someSelected && !allSelected }}
                  onCheckedChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-3 text-left text-sm font-medium ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                style={{ width: col.width }}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-muted-foreground">
                      {sortKey === col.key ? (
                        sortOrder === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="w-12 px-3 py-3"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => {
            const isSelected = selectedKeys?.has(item.id!)

            return (
              <tr
                key={item.id ?? index}
                className={`border-t hover:bg-muted/30 ${isSelected ? 'bg-muted/30' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item, index)}
              >
                {selectable && (
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectRow(item.id!)}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2 text-sm">
                    {col.render ? col.render(item, index) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action) => (
                          <DropdownMenuItem
                            key={action.key}
                            onClick={() => action.onClick(item)}
                            disabled={action.disabled?.(item)}
                          >
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
