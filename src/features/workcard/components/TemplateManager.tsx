import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  FileText,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { workcardApi } from '../api/workcardApi'
import type { WorkCardTemplate, CardPriority } from '../types/workcard.types'

const PRIORITY_CONFIG: Record<CardPriority, { label: string; color: string }> = {
  low: { label: '低', color: 'text-gray-500' },
  normal: { label: '普通', color: 'text-blue-500' },
  high: { label: '高', color: 'text-orange-500' },
  urgent: { label: '紧急', color: 'text-red-500' },
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<WorkCardTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await workcardApi.listTemplates()
      setTemplates(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTemplates()
  }, [fetchTemplates])

  const filteredTemplates = templates.filter(t =>
    !searchQuery ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.card_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading && templates.length === 0) {
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
          <h2 className="text-lg font-semibold">卡片模板</h2>
          <p className="text-sm text-muted-foreground">管理工作卡片模板</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索模板..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={FileText}
          variant="data"
          title="暂无模板"
          description="当前没有卡片模板，可以通过后端配置创建"
        />
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => {
              const priorityCfg = PRIORITY_CONFIG[template.priority]
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {template.card_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {template.description_template && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {template.description_template}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">字段数</span>
                        <span className="font-medium">{template.fields.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">操作数</span>
                        <span className="font-medium">{template.actions.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">默认优先级</span>
                        <span className={cn('font-medium', priorityCfg.color)}>{priorityCfg.label}</span>
                      </div>
                    </div>
                    {template.fields.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">字段列表</p>
                        <div className="flex flex-wrap gap-1">
                          {template.fields.map((field, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {field.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
