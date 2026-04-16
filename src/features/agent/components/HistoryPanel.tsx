/**
 * HistoryPanel - 历史对话管理面板
 * Story 4.3 - 历史对话管理
 *
 * 支持关键词搜索、时间过滤、安全删除
 *
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 var(--ao-button.background)
 * - ARCH: 分层架构，连接 history store
 * - FR11: 提供可搜索的历史对话管理
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Search,
  Clock,
  Trash2,
  Archive,
  RotateCcw,
  MessageSquare,
  X,
  ChevronDown,
  FileText,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import {
  useHistoryStore,
  useHistoryFilter,
  useArchivedSessions,
  type TimeFilter,
  type ArchivedSession,
} from '../hooks/useHistoryStore'
import { useChatStore, type ChatSession } from '../hooks/useChatStore'

// ==================== Types ====================

interface HistoryPanelProps {
  className?: string
  onSelectSession?: (sessionId: string) => void
  onShowArchived?: () => void
}

// ==================== Time Filter Options ====================

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
  { value: 'week', label: '最近一周' },
  { value: 'month', label: '最近一月' },
  { value: 'older', label: '更早' },
]

// ==================== History Item ====================

interface HistoryItemProps {
  session: ChatSession
  isSelected: boolean
  onSelect: () => void
  onArchive: () => void
}

function HistoryItem({ session, isSelected, onSelect, onArchive }: HistoryItemProps) {
  const [showActions, setShowActions] = useState(false)

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }

  // Get preview text from first message
  const previewText = useMemo(() => {
    const firstUserMsg = session.messages.find((m) => m.role === 'user')
    if (!firstUserMsg) return '暂无消息'

    const textPart = firstUserMsg.parts.find((p) => p.type === 'text')
    if (!textPart || textPart.type !== 'text') return '暂无消息'

    const text = textPart.content
    return text.length > 50 ? text.slice(0, 50) + '...' : text
  }, [session.messages])

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-1 px-3 py-2 rounded-lg cursor-pointer transition-colors',
        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 text-slate-700'
      )}
      style={isSelected ? { backgroundColor: 'rgba(30, 58, 95, 0.1)' } : undefined}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate flex-1">{session.title}</span>
        <span className="text-xs text-slate-400 ml-2">{formatTime(session.updatedAt)}</span>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-slate-500 truncate flex-1">{previewText}</p>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onArchive()
              }}
              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
              title="归档"
            >
              <Archive size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Message Count Badge */}
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <MessageSquare size={12} />
        <span>{session.messages.length} 条消息</span>
      </div>
    </div>
  )
}

// ==================== Archived Item ====================

interface ArchivedItemProps {
  archived: ArchivedSession
  onRestore: () => void
  onDelete: () => void
}

function ArchivedItem({ archived, onRestore, onDelete }: ArchivedItemProps) {
  const [showActions, setShowActions] = useState(false)

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className="group relative flex flex-col gap-1 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate flex-1 text-slate-600">{archived.title}</span>
        {showActions && (
          <div className="flex items-center gap-1">
            <button
              onClick={onRestore}
              className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="恢复"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="永久删除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Info Row */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <FileText size={12} />
        <span>{archived.messageCount} 条消息</span>
        <span>·</span>
        <span>归档于 {formatDate(archived.archivedAt)}</span>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export function HistoryPanel({ className, onSelectSession }: HistoryPanelProps) {
  const [showArchived, setShowArchived] = useState(false)
  const [showTimeFilter, setShowTimeFilter] = useState(false)

  const filter = useHistoryFilter()
  const archivedSessions = useArchivedSessions()
  const {
    setKeyword,
    setTimeRange,
    clearFilters,
    archiveSession,
    restoreSession,
    deleteArchivedSession,
  } = useHistoryStore(
    useShallow((state) => ({
      setKeyword: state.setKeyword,
      setTimeRange: state.setTimeRange,
      clearFilters: state.clearFilters,
      archiveSession: state.archiveSession,
      restoreSession: state.restoreSession,
      deleteArchivedSession: state.deleteArchivedSession,
    }))
  )
  const sessions = useChatStore((state) => state.sessions)
  const activeSessionId = useChatStore((state) => state.activeSessionId)
  const setActiveSession = useChatStore((state) => state.setActiveSession)

  // Filter sessions based on keyword and time range
  const filteredSessions = useMemo(() => {
    let result = Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt)

    // Apply keyword filter
    if (filter.keyword.trim()) {
      const keyword = filter.keyword.toLowerCase().trim()
      result = result.filter((session) => {
        if (session.title.toLowerCase().includes(keyword)) return true
        return session.messages.some((msg) =>
          msg.parts.some((part) => {
            if (part.type === 'text') {
              return part.content.toLowerCase().includes(keyword)
            }
            return false
          })
        )
      })
    }

    // Apply time filter
    if (filter.timeRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      result = result.filter((session) => {
        switch (filter.timeRange) {
          case 'today':
            return session.updatedAt >= today.getTime()
          case 'yesterday':
            return (
              session.updatedAt >= today.getTime() - 24 * 60 * 60 * 1000 &&
              session.updatedAt < today.getTime()
            )
          case 'week':
            return session.updatedAt >= today.getTime() - 7 * 24 * 60 * 60 * 1000
          case 'month':
            return session.updatedAt >= today.getTime() - 30 * 24 * 60 * 60 * 1000
          case 'older':
            return session.updatedAt < today.getTime() - 30 * 24 * 60 * 60 * 1000
          default:
            return true
        }
      })
    }

    return result
  }, [sessions, filter])

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      setActiveSession(sessionId)
      onSelectSession?.(sessionId)
    },
    [setActiveSession, onSelectSession]
  )

  const handleArchive = useCallback(
    (sessionId: string) => {
      if (window.confirm('确定要归档这个会话吗？归档后可以从"已归档"中恢复。')) {
        archiveSession(sessionId)
      }
    },
    [archiveSession]
  )

  const handleRestore = useCallback(
    (archiveId: string) => {
      const newSessionId = restoreSession(archiveId)
      if (newSessionId) {
        setActiveSession(newSessionId)
        onSelectSession?.(newSessionId)
      }
    },
    [restoreSession, setActiveSession, onSelectSession]
  )

  const handleDeleteArchived = useCallback(
    (archiveId: string) => {
      if (window.confirm('确定要永久删除这个已归档的会话吗？此操作不可撤销。')) {
        deleteArchivedSession(archiveId)
      }
    },
    [deleteArchivedSession]
  )

  const hasFilters = filter.keyword.trim() !== '' || filter.timeRange !== 'all'

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">历史对话</h3>

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索对话内容..."
            value={filter.keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            style={{ '--tw-ring-color': 'var(--ao-button.background)' } as React.CSSProperties}
          />
          {filter.keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Time Filter */}
        <div className="relative mt-2">
          <button
            onClick={() => setShowTimeFilter(!showTimeFilter)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors',
              filter.timeRange !== 'all' && 'border-primary text-primary'
            )}
            style={
              filter.timeRange !== 'all' ? { borderColor: 'var(--ao-button.background)', color: 'var(--ao-button.background)' } : undefined
            }
          >
            <span className="flex items-center gap-2">
              <Clock size={14} />
              {TIME_FILTER_OPTIONS.find((o) => o.value === filter.timeRange)?.label}
            </span>
            <ChevronDown
              size={14}
              className={cn('transition-transform', showTimeFilter && 'rotate-180')}
            />
          </button>

          {showTimeFilter && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowTimeFilter(false)} />
              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                {TIME_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTimeRange(option.value)
                      setShowTimeFilter(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                      filter.timeRange === option.value && 'text-primary bg-primary/5'
                    )}
                    style={filter.timeRange === option.value ? { color: 'var(--ao-button.background)' } : undefined}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-2 w-full text-sm text-slate-500 hover:text-slate-700 py-1 hover:bg-slate-50 rounded transition-colors"
          >
            清除筛选条件
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setShowArchived(false)}
          className={cn(
            'flex-1 py-2 text-sm font-medium transition-colors',
            !showArchived
              ? 'text-primary border-b-2 border-primary'
              : 'text-slate-500 hover:text-slate-700'
          )}
          style={!showArchived ? { color: 'var(--ao-button.background)', borderColor: 'var(--ao-button.background)' } : undefined}
        >
          会话 ({filteredSessions.length})
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={cn(
            'flex-1 py-2 text-sm font-medium transition-colors',
            showArchived
              ? 'text-primary border-b-2 border-primary'
              : 'text-slate-500 hover:text-slate-700'
          )}
          style={showArchived ? { color: 'var(--ao-button.background)', borderColor: 'var(--ao-button.background)' } : undefined}
        >
          已归档 ({archivedSessions.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {!showArchived ? (
          // Active Sessions
          filteredSessions.length === 0 ? (
            <EmptyState
              title={hasFilters ? '未找到匹配的会话' : '暂无历史对话'}
              description={hasFilters ? '尝试调整筛选条件' : '开始新的对话后将会显示在这里'}
              icon={Search}
              action={hasFilters ? { label: '清除筛选', onClick: clearFilters } : undefined}
            />
          ) : (
            <div className="space-y-1">
              {filteredSessions.map((session) => (
                <HistoryItem
                  key={session.id}
                  session={session}
                  isSelected={session.id === activeSessionId}
                  onSelect={() => handleSelectSession(session.id)}
                  onArchive={() => handleArchive(session.id)}
                />
              ))}
            </div>
          )
        ) : // Archived Sessions
        archivedSessions.length === 0 ? (
          <EmptyState
            title="暂无已归档的会话"
            description="归档的会话将保存在这里"
            icon={Archive}
          />
        ) : (
          <div className="space-y-1">
            {archivedSessions.map((archived) => (
              <ArchivedItem
                key={archived.id}
                archived={archived}
                onRestore={() => handleRestore(archived.id)}
                onDelete={() => handleDeleteArchived(archived.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-slate-200 text-xs text-slate-400">
        {!showArchived
          ? `共 ${filteredSessions.length} 个会话${hasFilters ? ' (已筛选)' : ''}`
          : `共 ${archivedSessions.length} 个已归档会话`}
      </div>
    </div>
  )
}

export default HistoryPanel
