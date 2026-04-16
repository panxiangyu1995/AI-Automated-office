import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { workcardApi } from '../api/workcardApi'
import type { WorkCard, CardStatus, CardPriority } from '../types/workcard.types'

const STATUS_CONFIG: Record<CardStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '待处理', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  in_progress: { label: '进行中', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: RefreshCw },
  completed: { label: '已完成', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
  failed: { label: '失败', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
  cancelled: { label: '已取消', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: AlertCircle },
}

const PRIORITY_CONFIG: Record<CardPriority, { label: string; color: string }> = {
  low: { label: '低', color: 'text-gray-500' },
  normal: { label: '普通', color: 'text-blue-500' },
  high: { label: '高', color: 'text-orange-500' },
  urgent: { label: '紧急', color: 'text-red-500' },
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function WorkCardList() {
  const [cards, setCards] = useState<WorkCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CardStatus | 'all'>('all')

  const fetchCards = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await workcardApi.listCards()
      setCards(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCards()
  }, [fetchCards])

  const handleDelete = async (cardId: string) => {
    try {
      await workcardApi.deleteCard(cardId)
      setCards(prev => prev.filter(c => c.id !== cardId))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const filteredCards = cards.filter(card => {
    const matchesSearch = !searchQuery ||
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.sender_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = cards.reduce<Record<string, number>>((acc, card) => {
    acc[card.status] = (acc[card.status] || 0) + 1
    return acc
  }, {})

  if (isLoading && cards.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">工作卡片</h2>
          <p className="text-sm text-muted-foreground">管理和跟踪工作卡片消息</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCards} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <Card key={status}>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <config.icon className={`h-4 w-4 ${config.color.split(' ')[1]}`} />
                <span className="text-sm text-muted-foreground">{config.label}</span>
              </div>
              <p className="text-xl font-bold mt-1">{statusCounts[status] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索卡片..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            全部
          </Button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status as CardStatus)}
            >
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <EmptyState variant="data" title="暂无工作卡片" description="当前没有工作卡片记录" />
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredCards.map(card => {
              const statusCfg = STATUS_CONFIG[card.status]
              const priorityCfg = PRIORITY_CONFIG[card.priority]
              return (
                <Card key={card.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate">{card.title}</h3>
                          <Badge variant="outline" className={cn('text-xs', statusCfg.color)}>
                            {statusCfg.label}
                          </Badge>
                          <span className={cn('text-xs font-medium', priorityCfg.color)}>
                            {priorityCfg.label}
                          </span>
                        </div>
                        {card.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{card.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>发送人: {card.sender_name}</span>
                          <span>类型: {card.type}</span>
                          <span>创建: {formatDate(card.created_at)}</span>
                          {card.attachment_count > 0 && <span>附件: {card.attachment_count}</span>}
                        </div>
                        {card.fields.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {card.fields.slice(0, 4).map((field, idx) => (
                              <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">
                                {field.label}: {field.value}
                              </span>
                            ))}
                            {card.fields.length > 4 && (
                              <span className="text-xs text-muted-foreground">+{card.fields.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {card.actions.slice(0, 2).map(action => (
                          <Button key={action.id} variant="outline" size="sm" disabled={action.disabled}>
                            {action.label}
                          </Button>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(card.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
