/**
 * OrgChartToolbar - 组织架构图工具栏组件
 *
 * @module OrgChartToolbar
 * @description 提供布局切换、缩放控制、搜索等功能
 */

import { Grid, LayoutGrid, Minus, Plus, RotateCcw, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { OrgChartToolbarProps } from './types'

export function OrgChartToolbar({
  layout,
  scale,
  searchValue,
  onLayoutChange,
  onScaleChange,
  onSearchChange,
  onResetView,
}: OrgChartToolbarProps) {
  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.1, 2)
    onScaleChange(newScale)
  }

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.1, 0.3)
    onScaleChange(newScale)
  }

  const scalePercent = Math.round(scale * 100)

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
      {/* 布局切换 */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                  layout === 'tree'
                    ? 'bg-[var(--ao-button.background)] text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
                onClick={() => onLayoutChange('tree')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>树形布局</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                  layout === 'matrix'
                    ? 'bg-[var(--ao-button.background)] text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
                onClick={() => onLayoutChange('matrix')}
              >
                <Grid className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>矩阵布局</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 分隔线 */}
      <div className="h-6 w-px bg-gray-200" />

      {/* 缩放控制 */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                onClick={handleZoomOut}
                disabled={scale <= 0.3}
              >
                <Minus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>缩小</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className="min-w-[48px] text-center text-sm font-medium text-gray-600">
          {scalePercent}%
        </span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                onClick={handleZoomIn}
                disabled={scale >= 2}
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>放大</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 分隔线 */}
      <div className="h-6 w-px bg-gray-200" />

      {/* 重置视图 */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
              onClick={onResetView}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>重置视图</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 分隔线 */}
      <div className="h-6 w-px bg-gray-200" />

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="搜索部门..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-[200px] pl-9 text-sm"
        />
      </div>
    </div>
  )
}
