import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Search,
  Server,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

export interface MCPService {
  id: string
  name: string
  url: string
  status: 'online' | 'offline' | 'error'
  toolCount: number
  lastChecked?: string
  latency?: number
  description?: string
}

interface MCPServiceBrowserProps {
  services?: MCPService[]
  onConnect?: (service: MCPService) => void
  onDisconnect?: (serviceId: string) => void
  onRefresh?: () => void
}

const STATUS_CONFIG = {
  online: { label: '在线', icon: Wifi, color: 'text-green-500', bgColor: 'bg-green-500/10 border-green-500/20' },
  offline: { label: '离线', icon: WifiOff, color: 'text-gray-500', bgColor: 'bg-gray-500/10 border-gray-500/20' },
  error: { label: '错误', icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10 border-red-500/20' },
}

export function MCPServiceBrowser({ services: externalServices, onConnect, onDisconnect, onRefresh }: MCPServiceBrowserProps) {
  const [services, setServices] = useState<MCPService[]>(externalServices || [])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchServices = useCallback(async () => {
    if (externalServices) return
    setIsLoading(true)
    try {
      // TODO: Replace with actual MCP API call
      setServices([])
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [externalServices])

  useEffect(() => {
    if (!externalServices) void fetchServices()
  }, [externalServices, fetchServices])

  const filteredServices = services.filter(s =>
    !searchQuery ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onlineCount = services.filter(s => s.status === 'online').length
  const offlineCount = services.filter(s => s.status === 'offline').length
  const errorCount = services.filter(s => s.status === 'error').length

  if (isLoading && services.length === 0) {
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
          <h2 className="text-lg font-semibold">MCP 服务浏览器</h2>
          <p className="text-sm text-muted-foreground">管理和监控 MCP 服务连接</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { onRefresh?.(); void fetchServices(); }}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">在线</span>
            </div>
            <p className="text-xl font-bold mt-1">{onlineCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-muted-foreground">离线</span>
            </div>
            <p className="text-xl font-bold mt-1">{offlineCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">错误</span>
            </div>
            <p className="text-xl font-bold mt-1">{errorCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索服务..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredServices.length === 0 ? (
        <EmptyState icon={Server} variant="data" title="暂无 MCP 服务" description="添加 MCP 服务来扩展系统能力" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map(service => {
            const statusCfg = STATUS_CONFIG[service.status]
            const StatusIcon = statusCfg.icon
            return (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      {service.name}
                    </CardTitle>
                    <Badge variant="outline" className={cn('text-xs', statusCfg.bgColor, statusCfg.color)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusCfg.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground font-mono mb-2">{service.url}</p>
                  {service.description && (
                    <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>工具数: {service.toolCount}</span>
                    {service.latency != null && <span>延迟: {service.latency}ms</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {service.status === 'online' ? (
                      <Button variant="outline" size="sm" onClick={() => onDisconnect?.(service.id)}>
                        断开
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => onConnect?.(service)}>
                        连接
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
