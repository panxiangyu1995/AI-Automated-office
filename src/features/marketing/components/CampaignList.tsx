import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Search,
  Megaphone,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import * as marketingApi from '../api/marketing'
import type { CampaignListItem, CampaignStatus } from '../types/marketing'

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, unknown> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (searchQuery) params.search = searchQuery
      const result = await marketingApi.listCampaigns(params)
      setCampaigns(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    void fetchCampaigns()
  }, [fetchCampaigns])

  if (isLoading && campaigns.length === 0) {
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
        <h2 className="text-lg font-semibold">营销活动</h2>
        <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={isLoading}>
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
            placeholder="搜索活动..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>全部</Button>
          {(['draft', 'published', 'in_progress', 'paused', 'completed', 'cancelled'] as CampaignStatus[]).map(status => {
            const meta: Record<CampaignStatus, string> = { draft: '草稿', published: '已发布', in_progress: '进行中', paused: '已暂停', completed: '已完成', cancelled: '已取消' }
            return (
              <Button key={status} variant={statusFilter === status ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(status)}>
                {meta[status]}
              </Button>
            )
          })}
        </div>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} variant="data" title="暂无营销活动" description="创建营销活动来推广产品和服务" />
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-sm truncate">{campaign.name}</h3>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {campaign.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {campaign.startDate}
                      </span>
                    )}
                    {campaign.budget != null && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ¥{campaign.budget.toLocaleString()}
                      </span>
                    )}
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
