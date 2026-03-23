/**
 * ToolRegistryPanel - 工具注册与管理面板
 * Story 5.1 - 工具注册与管理
 *
 * 显示和管理所有注册的工具（核心工具、插件工具、MCP工具）
 *
 * 铁律合规：
 * - UX: 使用 Shadcn/ui 组件
 * - ARCH: 分层架构，复用 ToolRegistry
 * - Brand Color: #1E3A5F
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Filter,
  Info,
  Package,
  Plug,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  getToolRegistry,
  type RegistryStatistics,
  type ToolLookupFilter,
} from '../../session/tools/toolRegistry'
import type {
  ToolDescriptor,
  ToolCategory,
} from '../../session/tools/toolDescriptor'

// ==================== Constants ====================

const BRAND_COLOR = '#1E3A5F'

const CATEGORY_CONFIG: Record<ToolCategory, { icon: React.ElementType; label: string; color: string }> = {
  core: { icon: Box, label: '核心工具', color: 'text-blue-500' },
  plugin: { icon: Plug, label: '插件工具', color: 'text-purple-500' },
  mcp: { icon: Terminal, label: 'MCP工具', color: 'text-orange-500' },
  builtin: { icon: Settings, label: '内置工具', color: 'text-gray-500' },
  external: { icon: ExternalLink, label: '外部工具', color: 'text-green-500' },
}

// ==================== Types ====================

export interface ToolRegistryPanelProps {
  onToolSelect?: (tool: ToolDescriptor) => void
  onToolConfigure?: (tool: ToolDescriptor) => void
  refreshKey?: number
}

export interface ToolCardProps {
  tool: ToolDescriptor
  expanded?: boolean
  onSelect?: () => void
  onConfigure?: () => void
  onToggleEnable?: (enabled: boolean) => void
}

export interface ToolFilterBarProps {
  filter: ToolLookupFilter
  onFilterChange: (filter: ToolLookupFilter) => void
  statistics: RegistryStatistics
}

// ==================== Helper Functions ====================

function getCategoryConfig(category: ToolCategory) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.external
}

function getExecutionModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    sync: '同步',
    async: '异步',
    streaming: '流式',
    batch: '批量',
  }
  return labels[mode] || mode
}

// ==================== Sub Components ====================

/**
 * 工具筛选栏
 */
function ToolFilterBar({
  filter,
  onFilterChange,
  statistics,
}: ToolFilterBarProps) {
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      // Search is handled client-side in the parent component
    },
    []
  )

  return (
    <div className="space-y-3">
      {/* 搜索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索工具名称、描述..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-2">
        {/* 类别筛选 */}
        <Select
          value={filter.category || 'all'}
          onValueChange={(value) =>
            onFilterChange({
              ...filter,
              category: value === 'all' ? undefined : (value as ToolCategory),
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="类别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类别</SelectItem>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <config.icon className={cn('h-4 w-4', config.color)} />
                  <span>{config.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 状态筛选 */}
        <Select
          value={
            filter.enabled === undefined
              ? 'all'
              : filter.enabled
              ? 'enabled'
              : 'disabled'
          }
          onValueChange={(value) =>
            onFilterChange({
              ...filter,
              enabled:
                value === 'all' ? undefined : value === 'enabled',
            })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="enabled">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>已启用 ({statistics.enabledTools})</span>
              </div>
            </SelectItem>
            <SelectItem value="disabled">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>已禁用 ({statistics.disabledTools})</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 权限筛选 */}
        <Select
          value={
            filter.requiresPermission === undefined
              ? 'all'
              : filter.requiresPermission
              ? 'required'
              : 'not-required'
          }
          onValueChange={(value) =>
            onFilterChange({
              ...filter,
              requiresPermission:
                value === 'all' ? undefined : value === 'required',
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="权限要求" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部权限</SelectItem>
            <SelectItem value="required">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-500" />
                <span>需要权限</span>
              </div>
            </SelectItem>
            <SelectItem value="not-required">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span>无需权限</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 清除筛选 */}
        {(filter.category || filter.enabled !== undefined || filter.requiresPermission !== undefined) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange({})}
          >
            <XCircle className="h-4 w-4 mr-1" />
            清除筛选
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * 工具卡片
 */
function ToolCard({
  tool,
  expanded = false,
  onSelect,
  onConfigure,
}: ToolCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)
  const categoryConfig = getCategoryConfig(tool.category)
  const CategoryIcon = categoryConfig.icon

  return (
    <Card className={cn('transition-colors', !tool.enabled && 'opacity-60')}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg',
                  'bg-primary/10'
                )}
              >
                <CategoryIcon className={cn('h-5 w-5', categoryConfig.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{tool.name}</CardTitle>
                  <Badge
                    variant={tool.enabled ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {tool.enabled ? '启用' : '禁用'}
                  </Badge>
                  {tool.deprecated && (
                    <Badge variant="destructive" className="text-[10px]">
                      已弃用
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground font-mono">
                    {tool.id}
                  </span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                    {categoryConfig.label}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onConfigure && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onConfigure()
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>配置</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* 描述 */}
            <p className="text-sm text-muted-foreground mb-3">
              {tool.description}
            </p>

            {/* 元数据 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {/* 版本 */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">版本</span>
                <span className="text-sm font-medium">{tool.metadata.version}</span>
              </div>

              {/* 执行模式 */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">执行模式</span>
                <span className="text-sm font-medium">
                  {getExecutionModeLabel(tool.executionMode)}
                </span>
              </div>

              {/* 估计时长 */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">估计时长</span>
                <span className="text-sm font-medium">
                  {tool.capabilities.estimatedDuration
                    ? `${tool.capabilities.estimatedDuration}ms`
                    : '未知'}
                </span>
              </div>

              {/* 作者 */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">作者</span>
                <span className="text-sm font-medium">
                  {tool.metadata.author || '未知'}
                </span>
              </div>
            </div>

            {/* 能力标签 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tool.capabilities.supportsStreaming && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Zap className="h-3 w-3" />
                  流式
                </Badge>
              )}
              {tool.capabilities.supportsCancellation && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <XCircle className="h-3 w-3" />
                  可取消
                </Badge>
              )}
              {tool.capabilities.requiresPermission && (
                <Badge variant="secondary" className="text-[10px] gap-1 text-orange-500">
                  <Shield className="h-3 w-3" />
                  需权限
                </Badge>
              )}
              {tool.capabilities.requiresConfirmation && (
                <Badge variant="secondary" className="text-[10px] gap-1 text-yellow-500">
                  <ShieldAlert className="h-3 w-3" />
                  需确认
                </Badge>
              )}
              {tool.capabilities.isReadOnly && (
                <Badge variant="secondary" className="text-[10px] gap-1 text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  只读
                </Badge>
              )}
              {tool.capabilities.hasSideEffects && (
                <Badge variant="secondary" className="text-[10px] gap-1 text-red-500">
                  <Zap className="h-3 w-3" />
                  有副作用
                </Badge>
              )}
            </div>

            {/* 标签 */}
            {tool.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {tool.metadata.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="my-3" />

            {/* 参数 */}
            {tool.parameters.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Settings className="h-4 w-4" />
                  参数 ({tool.parameters.length})
                </div>
                <ScrollArea className="max-h-[120px]">
                  <div className="space-y-1.5">
                    {tool.parameters.map((param) => (
                      <div
                        key={param.name}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono">{param.name}</code>
                          {param.required && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1">
                              必填
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {Array.isArray(param.type) ? param.type.join(' | ') : param.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* 操作 */}
            <div className="flex justify-end gap-2">
              {onSelect && (
                <Button variant="outline" size="sm" onClick={onSelect}>
                  <Info className="h-4 w-4 mr-1" />
                  详情
                </Button>
              )}
              {onConfigure && (
                <Button variant="default" size="sm" onClick={onConfigure}>
                  <Settings className="h-4 w-4 mr-1" />
                  配置
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

/**
 * 统计卡片
 */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  color?: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <Icon className={cn('h-5 w-5', color || 'text-muted-foreground')} />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold" style={{ color: BRAND_COLOR }}>
          {value}
        </div>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

/**
 * 工具注册管理面板
 */
export function ToolRegistryPanel({
  onToolSelect,
  onToolConfigure,
  refreshKey,
}: ToolRegistryPanelProps) {
  const [filter, setFilter] = useState<ToolLookupFilter>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshCounter, setRefreshCounter] = useState(0)
  const registry = getToolRegistry()

  // 刷新工具列表
  useEffect(() => {
    if (refreshKey !== undefined) {
      setRefreshCounter((c) => c + 1)
    }
  }, [refreshKey])

  // 获取统计信息
  const statistics = useMemo(
    () => registry.getStatistics(),
    [registry, refreshCounter]
  )

  // 获取工具列表
  const tools = useMemo(() => {
    let result = registry.lookup(filter).tools

    // 客户端搜索
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.id.toLowerCase().includes(query) ||
          tool.metadata.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    return result
  }, [registry, filter, searchQuery, refreshCounter])

  // 按类别分组
  const toolsByCategory = useMemo(() => {
    const groups: Record<ToolCategory, ToolDescriptor[]> = {
      core: [],
      plugin: [],
      mcp: [],
      builtin: [],
      external: [],
    }

    for (const tool of tools) {
      groups[tool.category].push(tool)
    }

    return groups
  }, [tools])

  const handleRefresh = useCallback(() => {
    setRefreshCounter((c) => c + 1)
  }, [])

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: BRAND_COLOR }}>
            工具注册管理
          </h2>
          <p className="text-sm text-muted-foreground">
            管理和查看所有注册的工具
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon={Package}
          label="总工具数"
          value={statistics.totalTools}
        />
        <StatCard
          icon={CheckCircle2}
          label="已启用"
          value={statistics.enabledTools}
          color="text-green-500"
        />
        <StatCard
          icon={XCircle}
          label="已禁用"
          value={statistics.disabledTools}
          color="text-red-500"
        />
        <StatCard
          icon={Clock}
          label="已弃用"
          value={statistics.deprecatedTools}
          color="text-yellow-500"
        />
        <StatCard
          icon={Filter}
          label="标签数"
          value={Object.keys(statistics.byTag).length}
        />
      </div>

      {/* 类别统计 */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = statistics.byCategory[key as ToolCategory] || 0
          return (
            <div
              key={key}
              className={cn(
                'flex items-center justify-center gap-2 p-2 rounded-lg',
                'bg-muted/30 border'
              )}
            >
              <config.icon className={cn('h-4 w-4', config.color)} />
              <div className="text-center">
                <div className="text-sm font-bold">{count}</div>
                <div className="text-[10px] text-muted-foreground">
                  {config.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 搜索和筛选 */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索工具名称、ID、描述、标签..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ToolFilterBar
          filter={filter}
          onFilterChange={setFilter}
          statistics={statistics}
        />
      </div>

      {/* 工具列表 */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {/* 按类别分组显示 */}
          {Object.entries(toolsByCategory).map(([category, categoryTools]) => {
            if (categoryTools.length === 0) return null

            const config = CATEGORY_CONFIG[category as ToolCategory]
            const CategoryIcon = config.icon

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 px-2">
                  <CategoryIcon className={cn('h-4 w-4', config.color)} />
                  <span className="font-medium">{config.label}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {categoryTools.length}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {categoryTools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      onSelect={
                        onToolSelect
                          ? () => onToolSelect(tool)
                          : undefined
                      }
                      onConfigure={
                        onToolConfigure
                          ? () => onToolConfigure(tool)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* 空状态 */}
          {tools.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="mt-4 text-muted-foreground">没有找到匹配的工具</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ==================== Export ====================

export default ToolRegistryPanel
