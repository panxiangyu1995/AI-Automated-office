//! TicketList 组件 - 工单列表

import { useServiceStore } from '../stores/serviceStore'
import { TicketCard } from './TicketCard'
import { StatusBadge } from './StatusBadge'
import { PriorityTag } from './PriorityTag'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Columns,
  ClipboardList,
} from 'lucide-react'
import type { TicketListItem } from '../types/service'
import { useState } from 'react'

interface TicketListProps {
  onTicketClick?: (ticket: TicketListItem) => void
  onCreateClick?: () => void
}

type ViewMode = 'card' | 'table' | 'kanban'

export function TicketList({ onTicketClick, onCreateClick }: TicketListProps) {
  const {
    tickets,
    ticketsTotal,
    ticketsPage,
    ticketsPageSize,
    ticketsLoading,
    filters,
    setFilters,
  } = useServiceStore()

  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [searchValue, setSearchValue] = useState(filters.search || '')

  const totalPages = Math.ceil(ticketsTotal / ticketsPageSize)

  const handleSearch = () => {
    setFilters({ search: searchValue || undefined })
  }

  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage })
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索工单..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none border-x"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('kanban')}
            >
              <Columns className="h-4 w-4" />
            </Button>
          </div>

          <Button size="sm" onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-1" />
            新建工单
          </Button>
        </div>
      </div>

      {/* 筛选标签 */}
      {(filters.status || filters.ticketType || filters.priority) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">筛选:</span>
          {filters.status?.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1">
              状态: {s}
            </Badge>
          ))}
          {filters.ticketType?.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              类型: {t}
            </Badge>
          ))}
          {filters.priority?.map((p) => (
            <Badge key={p} variant="secondary" className="gap-1">
              优先级: {p}
            </Badge>
          ))}
        </div>
      )}

      {/* 列表内容 */}
      {ticketsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title="暂无工单"
          description="点击下方按钮创建第一个工单"
          icon={ClipboardList}
          actionLabel="新建工单"
          onAction={onCreateClick}
        />
      ) : (
        <>
          {/* 卡片视图 */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => onTicketClick?.(ticket)}
                />
              ))}
            </div>
          )}

          {/* 表格视图 */}
          {viewMode === 'table' && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">标题</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">类型</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">优先级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">客户</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">处理人</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">创建时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => onTicketClick?.(ticket)}
                    >
                      <td className="px-4 py-3 text-sm">{ticket.title}</td>
                      <td className="px-4 py-3 text-sm">
                        {ticket.ticketType === 'repair'
                          ? '维修'
                          : ticket.ticketType === 'consultation'
                            ? '咨询'
                            : '投诉'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityTag priority={ticket.priority} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-sm">{ticket.customerName}</td>
                      <td className="px-4 py-3 text-sm">{ticket.assignedName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                共 {ticketsTotal} 条记录，第 {ticketsPage}/{totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={ticketsPage <= 1}
                  onClick={() => handlePageChange(ticketsPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {ticketsPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={ticketsPage >= totalPages}
                  onClick={() => handlePageChange(ticketsPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
