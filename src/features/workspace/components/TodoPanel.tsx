import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import {
  listTodos,
  deleteTodo,
  updateTodo,
  getTaskAggregations,
} from '../api/workspace'
import type { QueryTodosParams } from '../types/workspace'
import type {
  TodoListItem,
  TodoStatus,
  TodoPriority,
  TodoSourceModule,
  TaskAggregation,
} from '../types/workspace'

const STATUS_CONFIG: Record<TodoStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-800', icon: Clock },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600', icon: XCircle },
}

const PRIORITY_CONFIG: Record<TodoPriority, { label: string; color: string }> = {
  low: { label: '低', color: 'text-gray-500' },
  medium: { label: '中', color: 'text-blue-500' },
  high: { label: '高', color: 'text-orange-500' },
  urgent: { label: '紧急', color: 'text-red-500' },
}

const MODULE_LABELS: Record<TodoSourceModule, string> = {
  hr: '人事',
  finance: '财务',
  approval: '审批',
  service: '售后',
  sales: '销售',
  warehouse: '仓储',
  marketing: '市场',
  tender: '招投标',
  system: '系统',
}

export function TodoPanel() {
  const [todos, setTodos] = useState<TodoListItem[]>([])
  const [aggregations, setAggregations] = useState<TaskAggregation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'all'>('all')
  const pageSize = 20

  const fetchTodos = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, unknown> = { page, pageSize }
      if (statusFilter !== 'all') params.status = statusFilter
      if (searchQuery) params.search = searchQuery
      const result = await listTodos(params as QueryTodosParams)
      setTodos(result.items)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  const fetchAggregations = useCallback(async () => {
    try {
      const result = await getTaskAggregations()
      setAggregations(result)
    } catch {
      // silently fail for aggregations
    }
  }, [])

  useEffect(() => {
    void fetchTodos()
  }, [fetchTodos])

  useEffect(() => {
    void fetchAggregations()
  }, [fetchAggregations])

  const handleStatusChange = async (id: string, status: TodoStatus) => {
    try {
      await updateTodo(id, { status })
      void fetchTodos()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id)
      void fetchTodos()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (isLoading && todos.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">日清任务</h2>
          <p className="text-sm text-muted-foreground">管理和跟踪每日工作任务</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchTodos(); fetchAggregations(); }} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          {error}
        </div>
      )}

      {aggregations.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {aggregations.map(agg => (
            <Card key={agg.module}>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">{agg.moduleName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold">{agg.taskCount}</span>
                  <span className="text-xs text-muted-foreground">任务</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="text-yellow-600">{agg.pendingCount}待处理</span>
                  <span className="text-blue-600">{agg.inProgressCount}进行中</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索任务..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter('all'); setPage(1); }}
          >
            全部
          </Button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter(status as TodoStatus); setPage(1); }}
            >
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      {todos.length === 0 ? (
        <EmptyState
          variant="data"
          title="暂无任务"
          description="当前没有符合条件的任务"
        />
      ) : (
        <>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {todos.map(todo => {
                const statusCfg = STATUS_CONFIG[todo.status]
                const priorityCfg = PRIORITY_CONFIG[todo.priority]
                return (
                  <Card key={todo.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm truncate">{todo.title}</h3>
                            <Badge variant="outline" className={cn('text-xs', statusCfg.color)}>
                              {statusCfg.label}
                            </Badge>
                            <span className={cn('text-xs font-medium', priorityCfg.color)}>
                              {priorityCfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>来源: {MODULE_LABELS[todo.sourceModule]}</span>
                            {todo.dueDate && <span>截止: {todo.dueDate}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {todo.status === 'pending' && (
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(todo.id, 'in_progress')}>
                              开始
                            </Button>
                          )}
                          {todo.status === 'in_progress' && (
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(todo.id, 'completed')}>
                              完成
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(todo.id)}>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                共 {total} 条，第 {page}/{totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
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
