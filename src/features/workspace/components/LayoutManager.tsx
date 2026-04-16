import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Layout,
  Star,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  listLayouts,
  deleteLayout,
  updateLayout,
} from '../api/workspace'
import type { LayoutListItem } from '../types/workspace'

export function LayoutManager() {
  const [layouts, setLayouts] = useState<LayoutListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLayouts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await listLayouts()
      setLayouts(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchLayouts()
  }, [fetchLayouts])

  const handleSetDefault = async (id: string) => {
    try {
      await updateLayout(id, { isDefault: true })
      void fetchLayouts()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteLayout(id)
      setLayouts(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  if (isLoading && layouts.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">工作区布局</h2>
          <p className="text-sm text-muted-foreground">管理工作区布局配置</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLayouts} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          {error}
        </div>
      )}

      {layouts.length === 0 ? (
        <EmptyState
          icon={Layout}
          variant="data"
          title="暂无布局"
          description="当前没有自定义工作区布局"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {layouts.map(layout => (
            <Card key={layout.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">{layout.name}</CardTitle>
                  </div>
                  {layout.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      默认
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {layout.description && (
                  <p className="text-xs text-muted-foreground mb-3">{layout.description}</p>
                )}
                <div className="flex items-center gap-2">
                  {!layout.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(layout.id)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      设为默认
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(layout.id)}
                    disabled={layout.isDefault}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
