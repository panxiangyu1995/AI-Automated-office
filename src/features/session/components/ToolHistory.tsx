/**
 * ToolHistory.tsx
 * Tool Calling 2.0 历史追溯组件
 * Story 5.12 - 提供可搜索的分层工具执行历史记录和统计
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  History,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
  Timer,
  Database,
  Eye,
} from 'lucide-react'

// 工具执行状态
export type ToolExecutionStatus =
  | 'success'
  | 'failed'
  | 'timeout'
  | 'cancelled'
  | 'pending'
  | 'running'
  | 'retrying'

// 工具类别
export type ToolHistoryCategory =
  | 'general'
  | 'platform'
  | 'department'
  | 'restricted'

// 历史记录条目
export interface ToolHistoryEntry {
  id: string
  toolName: string
  category: ToolHistoryCategory
  status: ToolExecutionStatus
  timestamp: number
  duration: number // ms
  latency: number // ms
  correlationId: string
  sessionId: string
  userId: string
  input: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  retryCount: number
  isRetained: boolean
  retentionDays: number
  expiresAt?: number
  policyTrace?: string[]
  permissionCheck?: 'passed' | 'denied' | 'partial'
}

// 历史统计
export interface ToolHistoryStats {
  totalCalls: number
  successRate: number
  avgDuration: number
  avgLatency: number
  errorCount: number
  timeoutCount: number
  retryCount: number
  topTools: Array<{ name: string; count: number }>
  dailyTrend: Array<{ date: string; calls: number; success: number }>
}

// 过滤器选项
interface HistoryFilters {
  search: string
  status: ToolExecutionStatus | 'all'
  category: ToolHistoryCategory | 'all'
  dateRange: 'today' | 'week' | 'month' | 'all'
  showRetained: boolean
}

// 状态颜色映射
const statusColors: Record<ToolExecutionStatus, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  timeout: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  running: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  retrying: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
}

// 状态图标
const statusIcons: Record<ToolExecutionStatus, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4" />,
  failed: <XCircle className="h-4 w-4" />,
  timeout: <AlertTriangle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
  pending: <Clock className="h-4 w-4" />,
  running: <Loader2 className="h-4 w-4 animate-spin" />,
  retrying: <RefreshCw className="h-4 w-4" />,
}

// 类别颜色
const categoryColors: Record<ToolHistoryCategory, string> = {
  general: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  platform: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  department: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  restricted: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
}

const categoryLabels: Record<ToolHistoryCategory, string> = {
  general: '通用',
  platform: '平台',
  department: '部门',
  restricted: '受限',
}

// 模拟历史数据
const mockHistory: ToolHistoryEntry[] = [
  {
    id: 'h1',
    toolName: 'file_read',
    category: 'general',
    status: 'success',
    timestamp: Date.now() - 1000 * 60 * 5,
    duration: 45,
    latency: 12,
    correlationId: 'corr-001',
    sessionId: 'sess-001',
    userId: 'user-001',
    input: { path: '/workspace/tenders/requirement.md' },
    output: { content: '# 项目要求摘要...' },
    retryCount: 0,
    isRetained: true,
    retentionDays: 30,
    permissionCheck: 'passed',
  },
  {
    id: 'h2',
    toolName: 'http_request',
    category: 'general',
    status: 'timeout',
    timestamp: Date.now() - 1000 * 60 * 15,
    duration: 30000,
    latency: 30000,
    correlationId: 'corr-002',
    sessionId: 'sess-001',
    userId: 'user-001',
    input: { url: 'https://knowledge.company.local/api/search', method: 'POST' },
    error: 'Request timeout after 30s',
    retryCount: 3,
    isRetained: true,
    retentionDays: 30,
    permissionCheck: 'passed',
  },
  {
    id: 'h3',
    toolName: 'knowledge_query',
    category: 'platform',
    status: 'success',
    timestamp: Date.now() - 1000 * 60 * 30,
    duration: 156,
    latency: 45,
    correlationId: 'corr-003',
    sessionId: 'sess-002',
    userId: 'user-002',
    input: { query: '历史标书模板', scope: 'tenant', topK: 5 },
    output: { entries: 3, topSource: '历史标书知识库' },
    retryCount: 0,
    isRetained: true,
    retentionDays: 30,
    policyTrace: ['validate', 'permission_check', 'retrieve', 'normalize', 'complete'],
    permissionCheck: 'passed',
  },
  {
    id: 'h4',
    toolName: 'workspace_stage_change',
    category: 'platform',
    status: 'success',
    timestamp: Date.now() - 1000 * 60 * 60,
    duration: 2345,
    latency: 120,
    correlationId: 'corr-004',
    sessionId: 'sess-001',
    userId: 'user-001',
    input: { target: 'editor:tender-outline', changes: 4 },
    output: { staged: true, changeCount: 4 },
    retryCount: 0,
    isRetained: true,
    retentionDays: 90,
    policyTrace: ['validate', 'permission_check', 'stage', 'record'],
    permissionCheck: 'passed',
  },
  {
    id: 'h5',
    toolName: 'sandbox_execute',
    category: 'general',
    status: 'cancelled',
    timestamp: Date.now() - 1000 * 60 * 90,
    duration: 500,
    latency: 50,
    correlationId: 'corr-005',
    sessionId: 'sess-003',
    userId: 'user-003',
    input: { command: 'document-convert --input requirement.pdf --output requirement.md' },
    error: 'User cancelled operation before execution',
    retryCount: 0,
    isRetained: false,
    retentionDays: 7,
    permissionCheck: 'denied',
  },
  {
    id: 'h6',
    toolName: 'sales_query',
    category: 'department',
    status: 'retrying',
    timestamp: Date.now() - 1000 * 30,
    duration: 0,
    latency: 0,
    correlationId: 'corr-006',
    sessionId: 'sess-001',
    userId: 'user-001',
    input: { department: 'sales', query: '待确认报价单' },
    retryCount: 1,
    isRetained: true,
    retentionDays: 30,
    permissionCheck: 'passed',
  },
]

// 模拟统计数据
const mockStats: ToolHistoryStats = {
  totalCalls: 1247,
  successRate: 94.2,
  avgDuration: 234,
  avgLatency: 67,
  errorCount: 45,
  timeoutCount: 12,
  retryCount: 89,
  topTools: [
    { name: 'file_read', count: 342 },
    { name: 'http_request', count: 256 },
    { name: 'knowledge_query', count: 198 },
    { name: 'workspace_stage_change', count: 145 },
    { name: 'sales_query', count: 98 },
  ],
  dailyTrend: [
    { date: '2024-01-20', calls: 156, success: 148 },
    { date: '2024-01-21', calls: 189, success: 175 },
    { date: '2024-01-22', calls: 134, success: 130 },
    { date: '2024-01-23', calls: 201, success: 189 },
    { date: '2024-01-24', calls: 178, success: 170 },
  ],
}

export function ToolHistory() {
  const [filters, setFilters] = useState<HistoryFilters>({
    search: '',
    status: 'all',
    category: 'all',
    dateRange: 'all',
    showRetained: true,
  })
  const [selectedEntry, setSelectedEntry] = useState<ToolHistoryEntry | null>(null)

  // 过滤历史记录
  const filteredHistory = useMemo(() => {
    return mockHistory.filter((entry) => {
      // 搜索过滤
      if (
        filters.search &&
        !entry.toolName.toLowerCase().includes(filters.search.toLowerCase()) &&
        !entry.correlationId.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }

      // 状态过滤
      if (filters.status !== 'all' && entry.status !== filters.status) {
        return false
      }

      // 类别过滤
      if (filters.category !== 'all' && entry.category !== filters.category) {
        return false
      }

      // 日期范围过滤
      if (filters.dateRange !== 'all') {
        const now = Date.now()
        const ranges = {
          today: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000,
        }
        if (now - entry.timestamp > ranges[filters.dateRange]) {
          return false
        }
      }

      // 保留状态过滤
      if (!filters.showRetained && entry.isRetained) {
        return false
      }

      return true
    })
  }, [filters])

  // 格式化持续时间
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  // 格式化时间戳
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 格式化保留信息
  const formatRetention = (entry: ToolHistoryEntry): string => {
    if (!entry.isRetained) return '不保留'
    if (entry.expiresAt) {
      const daysLeft = Math.ceil((entry.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
      return `剩余 ${daysLeft} 天`
    }
    return `保留 ${entry.retentionDays} 天`
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#1E3A5F]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">工具调用历史</h2>
            <p className="text-sm text-muted-foreground">按通用工具、平台工具、部门能力工具的分层追溯执行记录。</p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总调用次数</p>
                  <p className="text-2xl font-bold text-[#1E3A5F]">{mockStats.totalCalls}</p>
                </div>
                <Activity className="h-8 w-8 text-[#1E3A5F]/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">成功率</p>
                  <p className="text-2xl font-bold text-green-600">{mockStats.successRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">平均延迟</p>
                  <p className="text-2xl font-bold text-[#1E3A5F]">{mockStats.avgLatency}ms</p>
                </div>
                <Timer className="h-8 w-8 text-[#1E3A5F]/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">错误/超时</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {mockStats.errorCount}/{mockStats.timeoutCount}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 过滤器 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* 搜索 */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索工具名或关联ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>

              {/* 状态过滤 */}
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value as ToolExecutionStatus | 'all' })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                  <SelectItem value="timeout">超时</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                  <SelectItem value="running">运行中</SelectItem>
                  <SelectItem value="retrying">重试中</SelectItem>
                </SelectContent>
              </Select>

              {/* 类别过滤 */}
              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters({ ...filters, category: value as ToolHistoryCategory | 'all' })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  <SelectItem value="general">通用工具</SelectItem>
                  <SelectItem value="platform">平台工具</SelectItem>
                  <SelectItem value="department">部门能力工具</SelectItem>
                  <SelectItem value="restricted">受限工具</SelectItem>
                </SelectContent>
              </Select>

              {/* 日期范围 */}
              <Select
                value={filters.dateRange}
                onValueChange={(value) =>
                  setFilters({ ...filters, dateRange: value as HistoryFilters['dateRange'] })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="时间范围" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部时间</SelectItem>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">最近一周</SelectItem>
                  <SelectItem value="month">最近一月</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 历史列表 */}
        <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
          {/* 表格 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">执行记录</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>工具名</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>时间</TableHead>
                      <TableHead>耗时</TableHead>
                      <TableHead>延迟</TableHead>
                      <TableHead>保留</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className={selectedEntry?.id === entry.id ? 'bg-[#1E3A5F]/5' : ''}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={categoryColors[entry.category]}>
                              {categoryLabels[entry.category]}
                            </Badge>
                            <span className="font-medium">{entry.toolName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[entry.status]}>
                            <span className="flex items-center gap-1">
                              {statusIcons[entry.status]}
                              {entry.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTimestamp(entry.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{formatDuration(entry.duration)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>总执行时间</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{formatDuration(entry.latency)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>网络延迟</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            <span className="text-xs">{formatRetention(entry)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEntry(entry)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 详情面板 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>调用详情</span>
                {selectedEntry && (
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEntry ? (
                <div className="space-y-4">
                  {/* 基本信息 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">工具名</span>
                      <span className="font-medium">{selectedEntry.toolName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">关联ID</span>
                      <code className="text-xs bg-muted px-1 rounded">
                        {selectedEntry.correlationId}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">会话ID</span>
                      <code className="text-xs bg-muted px-1 rounded">
                        {selectedEntry.sessionId}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">重试次数</span>
                      <span>{selectedEntry.retryCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">权限检查</span>
                      <Badge
                        variant="outline"
                        className={
                          selectedEntry.permissionCheck === 'passed'
                            ? 'text-green-600'
                            : selectedEntry.permissionCheck === 'denied'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                        }
                      >
                        {selectedEntry.permissionCheck}
                      </Badge>
                    </div>
                  </div>

                  {/* 策略追踪 */}
                  {selectedEntry.policyTrace && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">策略追踪</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {selectedEntry.policyTrace.map((step, idx) => (
                          <div key={idx} className="flex items-center">
                            <Badge variant="secondary" className="text-xs">
                              {step}
                            </Badge>
                            {idx < selectedEntry.policyTrace!.length - 1 && (
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 错误信息 */}
                  {selectedEntry.error && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-red-600">错误信息</span>
                      <div className="rounded bg-red-50 p-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                        {selectedEntry.error}
                      </div>
                    </div>
                  )}

                  {/* 输入/输出 */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium">输入参数</span>
                    <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                      {JSON.stringify(selectedEntry.input, null, 2)}
                    </pre>
                  </div>

                  {selectedEntry.output && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">输出结果</span>
                      <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(selectedEntry.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  选择一条记录查看详情
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 热门工具 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">热门工具</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {mockStats.topTools.map((tool, index) => (
                <div
                  key={tool.name}
                  className="flex items-center gap-2 rounded-lg border p-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E3A5F] text-xs text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">{tool.count} 次调用</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
