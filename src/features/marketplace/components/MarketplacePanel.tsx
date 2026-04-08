/**
 * 部门市场面板组件
 */

import { useEffect } from 'react'
import { Download, Trash2, Loader2, RefreshCw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useMarketplaceStore } from '../stores/marketplaceStore'

export function MarketplacePanel() {
  const { plugins, stats, isLoading, fetchPlugins, install, uninstall, enable } = useMarketplaceStore()

  useEffect(() => { fetchPlugins() }, [fetchPlugins])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">部门市场</h2>
        <Button variant="outline" size="sm" onClick={fetchPlugins}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalPlugins}</div>
            <p className="text-xs text-muted-foreground">可用插件</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.installed}</div>
            <p className="text-xs text-muted-foreground">已安装</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.categories.length}</div>
            <p className="text-xs text-muted-foreground">分类</p>
          </CardContent></Card>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {plugins.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{p.name}</span>
                  {p.enabled && <Badge className="bg-green-500">已启用</Badge>}
                  {!p.enabled && p.installed && <Badge variant="outline">已安装</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">{p.category}</Badge>
                  <span className="text-xs text-muted-foreground">v{p.version}</span>
                  <span className="text-xs text-muted-foreground">by {p.author}</span>
                  {p.price > 0 && <span className="text-xs font-medium text-orange-500">¥{p.price}</span>}
                  {p.price === 0 && <span className="text-xs text-green-500">免费</span>}
                </div>
                {!p.installed ? (
                  <Button size="sm" onClick={() => install(p.id)}>
                    <Download className="h-4 w-4 mr-1"/>安装
                  </Button>
                ) : !p.enabled ? (
                  <Button size="sm" onClick={() => enable(p.id)}>
                    <Zap className="h-4 w-4 mr-1"/>启用
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => uninstall(p.id)}>
                    <Trash2 className="h-4 w-4 mr-1"/>卸载
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
