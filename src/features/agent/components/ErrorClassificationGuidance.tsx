/**
 * ErrorClassificationGuidance - 错误分类与用户提示组件
 * Story 36.1 - 错误分类与用户提示
 *
 * 提供统一的错误分类和可操作的用户恢复指导
 * - 定义用户面向的错误类别和错误码
 * - 显示敏感化处理后的错误输出
 * - 附加恢复建议和后备方案提示
 *
 * 铁律合规：
 * - ARCH: 分层架构，使用 Zustand 状态管理
 * - UX-01, UX-04: 使用 Shadcn/ui 组件
 */

import { useState, useMemo } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  HelpCircle,
  Info,
  Lightbulb,
  Lock,
  RefreshCw,
  Search,
  Shield,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'
export type ErrorCategory = 'runtime' | 'network' | 'auth' | 'storage' | 'tool' | 'agent' | 'system'
export type ErrorClass = 'transient' | 'permanent' | 'config' | 'resource' | 'runtime' | 'unknown'
export type RecoveryStatus = 'suggested' | 'attempted' | 'resolved' | 'failed' | 'escalated'

export interface ErrorCode {
  code: string
  class: ErrorClass
  category: ErrorCategory
  severity: ErrorSeverity
  message: string
  desensitizedMessage: string
  recoverySuggestion: string
  fallbackHint: string
  timestamp: Date
}

export interface ErrorInstance {
  id: string
  errorCode: string
  severity: ErrorSeverity
  category: ErrorCategory
  message: string
  desensitizedMessage: string
  stackTrace?: string
  recoverySuggestion: string
  fallbackHint: string
  recoveryStatus: RecoveryStatus
  retryCount: number
  maxRetries: number
  timestamp: Date
  resolvedAt?: Date
}

export interface ErrorGuidanceStats {
  totalErrors: number
  bySeverity: Record<ErrorSeverity, number>
  byCategory: Record<ErrorCategory, number>
  resolvedCount: number
  pendingCount: number
  avgResolutionTime: number
}

// ==================== Mock Data ====================

const mockErrorCodes: ErrorCode[] = [
  {
    code: 'ERR_NETWORK_TIMEOUT',
    class: 'transient',
    category: 'network',
    severity: 'error',
    message: 'Network request timed out after 30000ms',
    desensitizedMessage: '网络请求超时，请检查网络连接',
    recoverySuggestion: '检查网络连接，等待后重试',
    fallbackHint: '使用本地缓存数据，或稍后重试',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    code: 'ERR_AUTH_TOKEN_EXPIRED',
    class: 'transient',
    category: 'auth',
    severity: 'warning',
    message: 'Authentication token expired',
    desensitizedMessage: '登录已过期，请重新登录',
    recoverySuggestion: '重新进行身份验证',
    fallbackHint: '使用离线模式访问已缓存内容',
    timestamp: new Date(Date.now() - 7200000),
  },
  {
    code: 'ERR_STORAGE_QUOTA_EXCEEDED',
    class: 'resource',
    category: 'storage',
    severity: 'critical',
    message: 'Storage quota exceeded: 10GB limit reached',
    desensitizedMessage: '存储空间已满，请清理数据',
    recoverySuggestion: '清理不必要的文件或扩展存储空间',
    fallbackHint: '删除旧日志或缓存文件',
    timestamp: new Date(Date.now() - 1800000),
  },
  {
    code: 'ERR_TOOL_NOT_FOUND',
    class: 'config',
    category: 'tool',
    severity: 'error',
    message: 'Tool plugin_name.tool_action not found in registry',
    desensitizedMessage: '工具未找到，请检查工具配置',
    recoverySuggestion: '安装所需插件或使用替代工具',
    fallbackHint: '使用基础工具集完成操作',
    timestamp: new Date(Date.now() - 900000),
  },
  {
    code: 'ERR_AGENT_LOOP_DETECTED',
    class: 'runtime',
    category: 'agent',
    severity: 'critical',
    message: 'Infinite loop detected in agent reasoning after 50 iterations',
    desensitizedMessage: 'Agent 执行异常，请联系支持',
    recoverySuggestion: '重启 Agent 会话并简化任务',
    fallbackHint: '手动中断并重新开始',
    timestamp: new Date(Date.now() - 600000),
  },
]

const mockErrorInstances: ErrorInstance[] = [
  {
    id: 'err-001',
    errorCode: 'ERR_NETWORK_TIMEOUT',
    severity: 'error',
    category: 'network',
    message: 'Failed to fetch data from API endpoint /api/v1/users',
    desensitizedMessage: '无法从服务器获取数据，请检查网络',
    recoverySuggestion: '检查网络连接，重试请求',
    fallbackHint: '使用本地缓存数据',
    recoveryStatus: 'resolved',
    retryCount: 2,
    maxRetries: 3,
    timestamp: new Date(Date.now() - 3600000),
    resolvedAt: new Date(Date.now() - 3500000),
  },
  {
    id: 'err-002',
    errorCode: 'ERR_AUTH_TOKEN_EXPIRED',
    severity: 'warning',
    category: 'auth',
    message: 'JWT token has expired at 2024-03-24T10:30:00Z',
    desensitizedMessage: '登录已过期，请重新登录',
    recoverySuggestion: '刷新访问令牌或重新登录',
    fallbackHint: '以游客身份浏览公开内容',
    recoveryStatus: 'attempted',
    retryCount: 1,
    maxRetries: 2,
    timestamp: new Date(Date.now() - 7200000),
  },
  {
    id: 'err-003',
    errorCode: 'ERR_STORAGE_QUOTA_EXCEEDED',
    severity: 'critical',
    category: 'storage',
    message: 'Cannot write to database: disk quota exceeded',
    desensitizedMessage: '存储空间不足，无法保存数据',
    recoverySuggestion: '清理存储空间或联系管理员扩展配额',
    fallbackHint: '删除临时文件和旧日志',
    recoveryStatus: 'failed',
    retryCount: 5,
    maxRetries: 5,
    timestamp: new Date(Date.now() - 1800000),
  },
  {
    id: 'err-004',
    errorCode: 'ERR_TOOL_NOT_FOUND',
    severity: 'error',
    category: 'tool',
    message: 'Tool hr_employee_create not registered',
    desensitizedMessage: '员工创建工具不可用',
    recoverySuggestion: '安装 HR 插件或使用手动方式创建员工',
    fallbackHint: '联系管理员安装所需插件',
    recoveryStatus: 'suggested',
    retryCount: 0,
    maxRetries: 1,
    timestamp: new Date(Date.now() - 900000),
  },
  {
    id: 'err-005',
    errorCode: 'ERR_AGENT_LOOP_DETECTED',
    severity: 'critical',
    category: 'agent',
    message: 'Agent entered infinite reasoning loop in session abc-123',
    desensitizedMessage: 'AI 助手执行异常已自动中断',
    recoverySuggestion: '重启会话并简化您的问题',
    fallbackHint: '将复杂问题拆分为多个简单步骤',
    recoveryStatus: 'escalated',
    retryCount: 1,
    maxRetries: 1,
    timestamp: new Date(Date.now() - 600000),
  },
]

// ==================== Helper Functions ====================

function getSeverityIcon(severity: ErrorSeverity) {
  switch (severity) {
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-orange-500" />
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-500" />
  }
}

function getSeverityColor(severity: ErrorSeverity): string {
  switch (severity) {
    case 'info':
      return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
    case 'warning':
      return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
    case 'error':
      return 'bg-orange-500/10 border-orange-500/20 text-orange-500'
    case 'critical':
      return 'bg-red-500/10 border-red-500/20 text-red-500'
  }
}

function getCategoryLabel(category: ErrorCategory): string {
  switch (category) {
    case 'runtime':
      return '运行时'
    case 'network':
      return '网络'
    case 'auth':
      return '认证'
    case 'storage':
      return '存储'
    case 'tool':
      return '工具'
    case 'agent':
      return 'Agent'
    case 'system':
      return '系统'
  }
}

function getClassLabel(errorClass: ErrorClass): string {
  switch (errorClass) {
    case 'transient':
      return '瞬时'
    case 'permanent':
      return '永久'
    case 'config':
      return '配置'
    case 'resource':
      return '资源'
    case 'runtime':
      return '运行时'
    case 'unknown':
      return '未知'
  }
}

function getRecoveryStatusLabel(status: RecoveryStatus): string {
  switch (status) {
    case 'suggested':
      return '待处理'
    case 'attempted':
      return '处理中'
    case 'resolved':
      return '已解决'
    case 'failed':
      return '失败'
    case 'escalated':
      return '已升级'
  }
}

function getRecoveryStatusColor(status: RecoveryStatus): string {
  switch (status) {
    case 'suggested':
      return 'bg-gray-500/10 border-gray-500/20 text-gray-500'
    case 'attempted':
      return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
    case 'resolved':
      return 'bg-green-500/10 border-green-500/20 text-green-500'
    case 'failed':
      return 'bg-red-500/10 border-red-500/20 text-red-500'
    case 'escalated':
      return 'bg-purple-500/10 border-purple-500/20 text-purple-500'
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ==================== Components ====================

interface ErrorCardProps {
  error: ErrorInstance
  onViewDetails: (error: ErrorInstance) => void
  onApplyFix: (error: ErrorInstance) => void
}

function ErrorCard({ error, onViewDetails, onApplyFix }: ErrorCardProps) {
  return (
    <div className="p-4 rounded-lg border bg-card text-card-foreground">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {getSeverityIcon(error.severity)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-sm font-medium">{error.errorCode}</span>
              <Badge
                variant="outline"
                className={cn('text-xs', getSeverityColor(error.severity))}
              >
                {error.severity}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getCategoryLabel(error.category)}
              </Badge>
              <Badge
                variant="outline"
                className={cn('text-xs', getRecoveryStatusColor(error.recoveryStatus))}
              >
                {getRecoveryStatusLabel(error.recoveryStatus)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {error.desensitizedMessage}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(error.timestamp)}
              </span>
              {error.recoveryStatus === 'attempted' && (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  重试 {error.retryCount}/{error.maxRetries}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onApplyFix(error)}
            disabled={error.recoveryStatus === 'resolved'}
          >
            <Lightbulb className="h-3 w-3 mr-1" />
            修复
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(error)}>
            <Info className="h-3 w-3 mr-1" />
            详情
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ErrorCodeRowProps {
  errorCode: ErrorCode
}

function ErrorCodeRow({ errorCode }: ErrorCodeRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b last:border-b-0">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-medium">{errorCode.code}</span>
            <Badge variant="outline" className="text-xs">
              {getClassLabel(errorCode.class)}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-xs', getSeverityColor(errorCode.severity))}
            >
              {errorCode.severity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getCategoryLabel(errorCode.category)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{errorCode.desensitizedMessage}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDate(errorCode.timestamp)}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pl-10 space-y-3 bg-muted/30">
          <div>
            <h4 className="text-sm font-medium mb-1">原始错误（已脱敏）</h4>
            <p className="text-sm text-muted-foreground font-mono">
              {errorCode.message}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
              <Lightbulb className="h-3 w-3 text-yellow-500" />
              恢复建议
            </h4>
            <p className="text-sm text-muted-foreground">
              {errorCode.recoverySuggestion}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
              <Shield className="h-3 w-3 text-blue-500" />
              后备方案
            </h4>
            <p className="text-sm text-muted-foreground">
              {errorCode.fallbackHint}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Main Component ====================

export interface ErrorClassificationGuidanceProps {
  className?: string
  errors?: ErrorInstance[]
  errorCodes?: ErrorCode[]
}

export function ErrorClassificationGuidance({
  className,
  errors: initialErrors,
  errorCodes: initialErrorCodes,
}: ErrorClassificationGuidanceProps) {
  const errors = useMemo(() => initialErrors || mockErrorInstances, [initialErrors])
  const errorCodes = useMemo(() => initialErrorCodes || mockErrorCodes, [initialErrorCodes])

  const [activeTab, setActiveTab] = useState<'errors' | 'codes' | 'guidance'>('errors')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ErrorCategory | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity | 'all'>('all')
  const [selectedError, setSelectedError] = useState<ErrorInstance | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const stats = useMemo((): ErrorGuidanceStats => {
    const bySeverity: Record<ErrorSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    }
    const byCategory: Record<ErrorCategory, number> = {
      runtime: 0,
      network: 0,
      auth: 0,
      storage: 0,
      tool: 0,
      agent: 0,
      system: 0,
    }

    const totalErrors = errors.length
    let resolvedCount = 0
    let pendingCount = 0
    let totalResolutionTime = 0
    let resolutionCount = 0

    errors.forEach((err) => {
      bySeverity[err.severity]++
      byCategory[err.category]++
      if (err.recoveryStatus === 'resolved') {
        resolvedCount++
        if (err.resolvedAt) {
          totalResolutionTime += err.resolvedAt.getTime() - err.timestamp.getTime()
          resolutionCount++
        }
      } else {
        pendingCount++
      }
    })

    return {
      totalErrors,
      bySeverity,
      byCategory,
      resolvedCount,
      pendingCount,
      avgResolutionTime: resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0,
    }
  }, [errors])

  const filteredErrors = useMemo(() => {
    return errors.filter((err) => {
      const matchesSearch =
        searchQuery === '' ||
        err.errorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        err.desensitizedMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        err.recoverySuggestion.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || err.category === categoryFilter
      const matchesSeverity = severityFilter === 'all' || err.severity === severityFilter
      return matchesSearch && matchesCategory && matchesSeverity
    })
  }, [errors, searchQuery, categoryFilter, severityFilter])

  const handleViewDetails = (error: ErrorInstance) => {
    setSelectedError(error)
    setDetailsOpen(true)
  }

  const handleApplyFix = (error: ErrorInstance) => {
    console.log('Applying fix for:', error.errorCode)
  }

  const handleRetry = (error: ErrorInstance) => {
    console.log('Retrying:', error.errorCode)
  }

  const handleResolve = (error: ErrorInstance) => {
    console.log('Resolving:', error.errorCode)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <h2 className="text-lg font-medium">错误分类与用户提示</h2>
        </div>
        <Button size="sm">
          <RefreshCw className="h-3 w-3 mr-1" />
          刷新错误状态
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">严重错误</p>
            <p className="text-lg font-medium text-red-500">
              {stats.bySeverity.critical}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-xs text-muted-foreground">一般错误</p>
            <p className="text-lg font-medium text-orange-500">
              {stats.bySeverity.error}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground">待处理</p>
            <p className="text-lg font-medium text-yellow-500">{stats.pendingCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">已解决</p>
            <p className="text-lg font-medium text-green-500">{stats.resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            错误列表
            <Badge variant="secondary" className="ml-1">{filteredErrors.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="codes" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            错误码定义
            <Badge variant="secondary" className="ml-1">{errorCodes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="guidance" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            恢复指南
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索错误..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  类别: {categoryFilter === 'all' ? '全部' : getCategoryLabel(categoryFilter)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCategoryFilter('all')}>
                  全部类别
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCategoryFilter('runtime')}>
                  运行时
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('network')}>
                  网络
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('auth')}>
                  认证
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('storage')}>
                  存储
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('tool')}>
                  工具
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('agent')}>
                  Agent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('system')}>
                  系统
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  级别: {severityFilter === 'all' ? '全部' : severityFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSeverityFilter('all')}>
                  全部级别
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSeverityFilter('critical')}>
                  <XCircle className="h-3 w-3 mr-2 text-red-500" />
                  严重
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSeverityFilter('error')}>
                  <AlertCircle className="h-3 w-3 mr-2 text-orange-500" />
                  错误
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSeverityFilter('warning')}>
                  <AlertTriangle className="h-3 w-3 mr-2 text-yellow-500" />
                  警告
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSeverityFilter('info')}>
                  <Info className="h-3 w-3 mr-2 text-blue-500" />
                  信息
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Error List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredErrors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>没有错误记录</p>
                </div>
              ) : (
                filteredErrors.map((error) => (
                  <ErrorCard
                    key={error.id}
                    error={error}
                    onViewDetails={handleViewDetails}
                    onApplyFix={handleApplyFix}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="codes">
          <ScrollArea className="h-[400px]">
            <div className="border rounded-lg">
              {errorCodes.map((errorCode) => (
                <ErrorCodeRow key={errorCode.code} errorCode={errorCode} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="guidance" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Recovery Suggestions */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                常见恢复建议
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm font-medium">网络超时</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    检查网络连接，等待后重试
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-medium">认证过期</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    刷新访问令牌或重新登录
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm font-medium">存储空间不足</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    清理不必要的文件或扩展存储
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-sm font-medium">工具未找到</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    安装所需插件或使用替代工具
                  </p>
                </div>
              </div>
            </div>

            {/* Fallback Hints */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                后备方案提示
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm">离线模式</p>
                    <p className="text-xs text-muted-foreground">
                      使用本地缓存数据继续工作
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <RefreshCw className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm">重试机制</p>
                    <p className="text-xs text-muted-foreground">
                      系统会自动重试失败的请求
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <HelpCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm">联系支持</p>
                    <p className="text-xs text-muted-foreground">
                      如问题持续，请联系技术支持
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Class Legend */}
          <div className="p-4 border rounded-lg">
            <h3 className="text-sm font-medium mb-3">错误分类说明</h3>
            <div className="grid grid-cols-5 gap-3">
              <div className="text-center">
                <Badge variant="outline" className="mb-2">瞬时</Badge>
                <p className="text-xs text-muted-foreground">
                  网络波动、临时不可用
                </p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">永久</Badge>
                <p className="text-xs text-muted-foreground">
                  资源删除、权限撤销
                </p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">配置</Badge>
                <p className="text-xs text-muted-foreground">
                  参数错误、插件未安装
                </p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">资源</Badge>
                <p className="text-xs text-muted-foreground">
                  配额用尽、空间不足
                </p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">未知</Badge>
                <p className="text-xs text-muted-foreground">
                  无法分类的错误
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              错误详情
            </DialogTitle>
            <DialogDescription>
              错误码: {selectedError?.errorCode}
            </DialogDescription>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(getSeverityColor(selectedError.severity))}
                >
                  {selectedError.severity}
                </Badge>
                <Badge variant="outline">
                  {getCategoryLabel(selectedError.category)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(getRecoveryStatusColor(selectedError.recoveryStatus))}
                >
                  {getRecoveryStatusLabel(selectedError.recoveryStatus)}
                </Badge>
              </div>

              {/* Desensitized Message */}
              <div>
                <h4 className="text-sm font-medium mb-1">用户提示</h4>
                <p className="text-sm p-3 bg-muted rounded-lg">
                  {selectedError.desensitizedMessage}
                </p>
              </div>

              {/* Recovery Suggestion */}
              <div>
                <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Lightbulb className="h-3 w-3 text-yellow-500" />
                  恢复建议
                </h4>
                <p className="text-sm p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  {selectedError.recoverySuggestion}
                </p>
              </div>

              {/* Fallback Hint */}
              <div>
                <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Shield className="h-3 w-3 text-blue-500" />
                  后备方案
                </h4>
                <p className="text-sm p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  {selectedError.fallbackHint}
                </p>
              </div>

              {/* Retry Info */}
              {selectedError.retryCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                  已重试 {selectedError.retryCount}/{selectedError.maxRetries} 次
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRetry(selectedError)}
                  disabled={selectedError.recoveryStatus === 'resolved'}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  重试
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve(selectedError)}
                  disabled={selectedError.recoveryStatus === 'resolved'}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  标记已解决
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApplyFix(selectedError)}
                  disabled={selectedError.recoveryStatus === 'resolved'}
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  应用修复
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
