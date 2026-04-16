import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Search,
  FileText,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { listTenderProjects } from '../api/tender'
import type { TenderProjectListItem, TenderStatus } from '../types/tender'

const STATUS_LABELS: Record<TenderStatus, string> = {
  preparing: '筹备中',
  bidding: '投标中',
  waiting_result: '待开标',
  won: '已中标',
  lost: '已失标',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<TenderStatus, string> = {
  preparing: 'bg-gray-100 text-gray-800 border-gray-200',
  bidding: 'bg-blue-100 text-blue-800 border-blue-200',
  waiting_result: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  won: 'bg-green-100 text-green-800 border-green-200',
  lost: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function TenderProjectList() {
  const [projects, setProjects] = useState<TenderProjectListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TenderStatus | 'all'>('all')

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, unknown> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (searchQuery) params.search = searchQuery
      const result = await listTenderProjects(params as import('../types/tender').QueryTenderProjectsParams)
      setProjects(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    void fetchProjects()
  }, [fetchProjects])

  if (isLoading && projects.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">投标项目</h2>
        <Button variant="outline" size="sm" onClick={fetchProjects} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索投标项目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>全部</Button>
          {(['preparing', 'bidding', 'waiting_result', 'won', 'lost'] as TenderStatus[]).map(status => (
            <Button key={status} variant={statusFilter === status ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(status)}>
              {STATUS_LABELS[status]}
            </Button>
          ))}
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={FileText} variant="data" title="暂无投标项目" description="创建投标项目来管理招投标流程" />
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {projects.map(project => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{project.projectName}</h3>
                        <Badge variant="outline" className={cn('text-xs shrink-0', STATUS_COLORS[project.status])}>
                          {STATUS_LABELS[project.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span>客户: {project.customerName}</span>
                        {project.biddingAmount != null && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ¥{project.biddingAmount.toLocaleString()}
                          </span>
                        )}
                        {project.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {project.deadline}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">{project.progress}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
