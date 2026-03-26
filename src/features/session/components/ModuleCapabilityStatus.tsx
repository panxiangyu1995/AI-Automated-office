/**
 * ModuleCapabilityStatus - 能力供给状态组件
 * Story 5.6 - 能力供给与模块状态监控
 *
 * 显示能力包级别的原子工具、Skills、MCP 和运行时绑定状态
 *
 * 铁律合规：
 * - UX: 使用 Shadcn/ui 组件
 * - ARCH: 分层架构，复用 tool registry 和 plugin system
 * - Brand Color: #1E3A5F
 */

import { useState, useCallback, useMemo } from 'react'
import {
  Box,
  Terminal,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
  Settings,
  Wifi,
  WifiOff,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ==================== Constants ====================

const BRAND_COLOR = '#1E3A5F'

/**
 * 模块健康状态
 */
export type ModuleHealthStatus = 'healthy' | 'degraded' | 'offline' | 'error'

/**
 * 握手状态
 */
export type HandshakeStatus = 'connected' | 'connecting' | 'disconnected' | 'error'

/**
 * 能力类型
 */
export type CapabilityType = 'tool' | 'skill' | 'mcp' | 'builtin'

const CAPABILITY_CONFIG: Record<CapabilityType, {
  icon: React.ElementType
  label: string
  color: string
}> = {
  tool: {
    icon: Box,
    label: '原子工具',
    color: 'text-blue-500',
  },
  skill: {
    icon: Zap,
    label: 'Skills',
    color: 'text-purple-500',
  },
  mcp: {
    icon: Terminal,
    label: 'MCP',
    color: 'text-orange-500',
  },
  builtin: {
    icon: Settings,
    label: '能力包',
    color: 'text-gray-500',
  },
}

const HEALTH_STATUS_CONFIG: Record<ModuleHealthStatus, {
  icon: React.ElementType
  label: string
  color: string
  bgColor: string
}> = {
  healthy: {
    icon: CheckCircle,
    label: '健康',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  degraded: {
    icon: AlertCircle,
    label: '降级',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  offline: {
    icon: XCircle,
    label: '离线',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
  error: {
    icon: XCircle,
    label: '错误',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
}

const HANDSHAKE_STATUS_CONFIG: Record<HandshakeStatus, {
  icon: React.ElementType
  label: string
  color: string
}> = {
  connected: {
    icon: Wifi,
    label: '已连接',
    color: 'text-green-500',
  },
  connecting: {
    icon: RefreshCw,
    label: '连接中',
    color: 'text-blue-500',
  },
  disconnected: {
    icon: WifiOff,
    label: '已断开',
    color: 'text-gray-500',
  },
  error: {
    icon: WifiOff,
    label: '连接错误',
    color: 'text-red-500',
  },
}

// ==================== Types ====================

/**
 * 能力统计
 */
export interface CapabilityStats {
  type: CapabilityType
  total: number
  enabled: number
  healthy: number
  error: number
}

/**
 * 模块能力状态
 */
export interface ModuleCapabilityState {
  moduleId: string
  moduleName: string
  moduleType: 'hr' | 'finance' | 'warehouse' | 'sales' | 'service' | 'tender' | 'dashboard' | 'knowledge'
  healthStatus: ModuleHealthStatus
  handshakeStatus: HandshakeStatus
  lastHeartbeat?: number
  capabilities: CapabilityStats[]
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export interface ModuleCapabilityStatusProps {
  /** 模块状态列表 */
  modules: ModuleCapabilityState[]
  /** 是否显示详细信息 */
  detailed?: boolean
  /** 刷新回调 */
  onRefresh?: () => void
  /** 点击模块回调 */
  onModuleClick?: (module: ModuleCapabilityState) => void
  /** 重连回调 */
  onReconnect?: (moduleId: string) => void
}

export interface ModuleStatusCardProps {
  module: ModuleCapabilityState
  expanded?: boolean
  onToggleExpand?: () => void
  onModuleClick?: (module: ModuleCapabilityState) => void
  onReconnect?: (moduleId: string) => void
}

export interface HandshakeIndicatorProps {
  status: HandshakeStatus
  lastHeartbeat?: number
}

// ==================== Helper Functions ====================

function formatHeartbeat(timestamp?: number): string {
  if (!timestamp) return '未知'
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getModuleTypeLabel(type: ModuleCapabilityState['moduleType']): string {
  const labels: Record<string, string> = {
    hr: '人事部',
    finance: '财务部',
    warehouse: '仓储部',
    sales: '销售部',
    service: '售后服务',
    tender: '招投标',
    dashboard: '数据看板',
    knowledge: '知识库',
  }
  return labels[type] || type
}

// ==================== Sub Components ====================

interface HealthIndicatorProps {
  status: ModuleHealthStatus
}

function HealthIndicator({ status }: HealthIndicatorProps): React.ReactNode {
  const config = HEALTH_STATUS_CONFIG[status]
  const Icon = config.icon
  
  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full', config.bgColor)}>
      <Icon className={cn('h-3.5 w-3.5', config.color)} />
      <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
    </div>
  )
}

function HandshakeIndicator({ status, lastHeartbeat }: HandshakeIndicatorProps): React.ReactNode {
  const config = HANDSHAKE_STATUS_CONFIG[status]
  const Icon = config.icon
  const isAnimated = status === 'connecting'
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Icon className={cn('h-4 w-4', config.color, isAnimated ? 'animate-spin' : '')} />
            <span className={cn('text-xs', config.color)}>{config.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div>状态: {config.label}</div>
            {lastHeartbeat ? (
              <div>最后心跳: {formatHeartbeat(lastHeartbeat)}</div>
            ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface CapabilityBarProps {
  stats: CapabilityStats
}

function CapabilityBar({ stats }: CapabilityBarProps): React.ReactNode {
  const config = CAPABILITY_CONFIG[stats.type]
  const Icon = config.icon
  const healthPercent = stats.total > 0 ? (stats.healthy / stats.total) * 100 : 0
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 min-w-[60px]">
        <Icon className={cn('h-4 w-4', config.color)} />
        <span className="text-sm font-medium text-slate-700">{config.label}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">
            {stats.enabled}/{stats.total} 启用
          </span>
          <span className="text-xs text-slate-500">
            {stats.healthy} 健康 / {stats.error} 错误
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ==================== Main Components ====================

/**
 * 模块状态卡片
 */
export function ModuleStatusCard({
  module,
  expanded = false,
  onToggleExpand,
  onModuleClick,
  onReconnect,
}: ModuleStatusCardProps): React.ReactNode {
  return (
    <div
      className="rounded-lg border bg-white overflow-hidden transition-all hover:shadow-md cursor-pointer"
      style={{ borderLeftWidth: '3px', borderLeftColor: module.healthStatus === 'healthy' ? '#22c55e' : module.healthStatus === 'error' ? '#ef4444' : BRAND_COLOR }}
      onClick={() => onModuleClick?.(module)}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4" style={{ color: BRAND_COLOR }} />
          <div>
            <div className="font-medium text-slate-700">{module.moduleName}</div>
            <div className="text-xs text-slate-500">{getModuleTypeLabel(module.moduleType)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HealthIndicator status={module.healthStatus} />
          {onToggleExpand ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand()
              }}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {/* 内容 */}
      <Collapsible open={expanded} onOpenChange={onToggleExpand}>
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* 握手状态 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">运行时绑定</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        当前能力包与通用 Agent Runtime 的绑定状态
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <HandshakeIndicator
                  status={module.handshakeStatus}
                  lastHeartbeat={module.lastHeartbeat}
                />
                {module.handshakeStatus === 'disconnected' || module.handshakeStatus === 'error' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onReconnect?.(module.moduleId)
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    重连
                  </Button>
                ) : null}
              </div>
            </div>

            {/* 能力统计 */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-700">能力状态</div>
              {module.capabilities.map((cap) => (
                <CapabilityBar key={cap.type} stats={cap} />
              ))}
            </div>

            {/* 错误信息 */}
            {module.errorMessage ? (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-1.5 text-red-600 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">错误信息</span>
                </div>
                <p className="text-sm text-red-600">{module.errorMessage}</p>
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 简略信息（折叠时显示） */}
      {!expanded ? (
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {module.capabilities.map((cap) => {
              const config = CAPABILITY_CONFIG[cap.type]
              const Icon = config.icon
              return (
                <TooltipProvider key={cap.type}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="text-xs">
                        <Icon className={cn('h-3 w-3 mr-1', config.color)} />
                        {cap.enabled}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        {config.label}: {cap.enabled}/{cap.total} 启用
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
          <HandshakeIndicator
            status={module.handshakeStatus}
            lastHeartbeat={module.lastHeartbeat}
          />
        </div>
      ) : null}
    </div>
  )
}

/**
 * 模块能力状态面板
 */
export function ModuleCapabilityStatus({
  modules,
  detailed = false,
  onRefresh,
  onModuleClick,
  onReconnect,
}: ModuleCapabilityStatusProps): React.ReactNode {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }, [])

  // 统计总览
  const summary = useMemo(() => {
    const healthy = modules.filter((m) => m.healthStatus === 'healthy').length
    const degraded = modules.filter((m) => m.healthStatus === 'degraded').length
    const offline = modules.filter((m) => m.healthStatus === 'offline').length
    const error = modules.filter((m) => m.healthStatus === 'error').length
    const connected = modules.filter((m) => m.handshakeStatus === 'connected').length
    
    return { healthy, degraded, offline, error, connected, total: modules.length }
  }, [modules])

  return (
    <div className="rounded-lg border bg-white overflow-hidden" style={{ borderLeftWidth: '3px', borderLeftColor: BRAND_COLOR }}>
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: BRAND_COLOR }} />
          <span className="font-medium text-slate-700">能力供给状态</span>
          <Badge variant="secondary" className="text-xs">
            {summary.connected}/{summary.total} 已绑定
          </Badge>
        </div>
        {onRefresh ? (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            刷新
          </Button>
        ) : null}
      </div>

      {/* 总览 */}
      {detailed ? (
        <div className="px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-slate-600">健康: {summary.healthy}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-slate-600">降级: {summary.degraded}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-slate-600">离线: {summary.offline}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-slate-600">错误: {summary.error}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* 模块列表 */}
      <ScrollArea className="max-h-[400px]">
        <div className="p-4 space-y-3">
          {modules.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">
              暂无模块数据
            </div>
          ) : (
            modules.map((module) => (
              <ModuleStatusCard
                key={module.moduleId}
                module={module}
                expanded={expandedModules.has(module.moduleId)}
                onToggleExpand={() => toggleExpand(module.moduleId)}
                onModuleClick={onModuleClick}
                onReconnect={onReconnect}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default ModuleCapabilityStatus
