/**
 * AgentObservabilityPanel.tsx
 * Agent可观测性面板组件
 * Story 5.13 - 提供会话级和租户级的使用统计和指标
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  BarChart3,
  TrendingUp,
  Activity,
  Cpu,
  Zap,
  Clock,
  Database,
  Users,
  Download,
  Calendar,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart,
  LineChart,
  FileText,
} from 'lucide-react'

// 时间范围类型
export type TimeRange = 'hour' | 'day' | 'week' | 'month'

// 会话级指标
export interface SessionMetrics {
  sessionId: string
  sessionName: string
  startTime: number
  endTime?: number
  status: 'active' | 'completed' | 'failed' | 'timeout'
  tokenUsage: {
    input: number
    output: number
    total: number
  }
  toolMetrics: {
    totalCalls: number
    successCount: number
    failedCount: number
    avgLatency: number
  }
  costMetrics: {
    inputCost: number
    outputCost: number
    totalCost: number
  }
}

// 租户级统计
export interface TenantStatistics {
  period: string
  totalSessions: number
  activeUsers: number
  totalTokens: {
    input: number
    output: number
  }
  totalToolCalls: number
  successRate: number
  avgResponseTime: number
  totalCost: number
  topModels: Array<{
    name: string
    calls: number
    tokens: number
  }>
  topTools: Array<{
    name: string
    calls: number
    successRate: number
  }>
  usageByDepartment: Array<{
    department: string
    sessions: number
    tokens: number
    cost: number
  }>
  trend: Array<{
    date: string
    sessions: number
    tokens: number
    cost: number
  }>
}

// 报告类型
export type ReportType = 'usage' | 'performance' | 'cost' | 'security'

// 模拟会话数据
const mockSessionMetrics: SessionMetrics[] = [
  {
    sessionId: 'sess-001',
    sessionName: '数据分析会话',
    startTime: Date.now() - 1000 * 60 * 30,
    status: 'active',
    tokenUsage: { input: 2340, output: 5670, total: 8010 },
    toolMetrics: { totalCalls: 12, successCount: 11, failedCount: 1, avgLatency: 234 },
    costMetrics: { inputCost: 0.23, outputCost: 0.57, totalCost: 0.80 },
  },
  {
    sessionId: 'sess-002',
    sessionName: '文档处理会话',
    startTime: Date.now() - 1000 * 60 * 60 * 2,
    endTime: Date.now() - 1000 * 60 * 60,
    status: 'completed',
    tokenUsage: { input: 4560, output: 8900, total: 13460 },
    toolMetrics: { totalCalls: 28, successCount: 27, failedCount: 1, avgLatency: 189 },
    costMetrics: { inputCost: 0.46, outputCost: 0.89, totalCost: 1.35 },
  },
  {
    sessionId: 'sess-003',
    sessionName: '代码审查会话',
    startTime: Date.now() - 1000 * 60 * 60 * 24,
    endTime: Date.now() - 1000 * 60 * 60 * 23,
    status: 'failed',
    tokenUsage: { input: 1230, output: 450, total: 1680 },
    toolMetrics: { totalCalls: 5, successCount: 3, failedCount: 2, avgLatency: 456 },
    costMetrics: { inputCost: 0.12, outputCost: 0.05, totalCost: 0.17 },
  },
  {
    sessionId: 'sess-004',
    sessionName: '报告生成会话',
    startTime: Date.now() - 1000 * 60 * 60 * 48,
    endTime: Date.now() - 1000 * 60 * 60 * 47,
    status: 'completed',
    tokenUsage: { input: 6780, output: 12340, total: 19120 },
    toolMetrics: { totalCalls: 34, successCount: 34, failedCount: 0, avgLatency: 178 },
    costMetrics: { inputCost: 0.68, outputCost: 1.23, totalCost: 1.91 },
  },
]

// 模拟租户统计
const mockTenantStats: TenantStatistics = {
  period: '2024-01',
  totalSessions: 1247,
  activeUsers: 89,
  totalTokens: { input: 1234567, output: 2345678 },
  totalToolCalls: 45678,
  successRate: 94.2,
  avgResponseTime: 234,
  totalCost: 1234.56,
  topModels: [
    { name: 'gpt-4-turbo', calls: 567, tokens: 1234567 },
    { name: 'claude-3-opus', calls: 234, tokens: 567890 },
    { name: 'gpt-3.5-turbo', calls: 189, tokens: 234567 },
  ],
  topTools: [
    { name: 'fs_read_file', calls: 1234, successRate: 98.5 },
    { name: 'http_request', calls: 987, successRate: 95.2 },
    { name: 'db_query', calls: 654, successRate: 92.1 },
    { name: 'agent_execute', calls: 432, successRate: 96.7 },
  ],
  usageByDepartment: [
    { department: '研发部', sessions: 456, tokens: 1234567, cost: 567.89 },
    { department: '产品部', sessions: 234, tokens: 567890, cost: 234.56 },
    { department: '运营部', sessions: 189, tokens: 345678, cost: 178.90 },
    { department: '市场部', sessions: 156, tokens: 234567, cost: 123.45 },
    { department: '其他', sessions: 212, tokens: 156789, cost: 89.76 },
  ],
  trend: [
    { date: '2024-01-20', sessions: 45, tokens: 89012, cost: 45.67 },
    { date: '2024-01-21', sessions: 52, tokens: 98765, cost: 52.34 },
    { date: '2024-01-22', sessions: 38, tokens: 76543, cost: 38.90 },
    { date: '2024-01-23', sessions: 61, tokens: 112345, cost: 61.23 },
    { date: '2024-01-24', sessions: 48, tokens: 90123, cost: 48.56 },
  ],
}

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// 格式化成本
const formatCost = (cost: number): string => {
  return `$${cost.toFixed(2)}`
}

// 格式化时间
const formatTime = (ms: number): string => {
  return `${ms}ms`
}

// 格式化日期
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

export function AgentObservabilityPanel() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [activeTab, setActiveTab] = useState('session')

  // 获取趋势图标
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  // 导出报告
  const handleExport = (type: ReportType) => {
    console.log(`Exporting ${type} report...`)
  }

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#1E3A5F]" />
          <h2 className="text-lg font-semibold text-[#1E3A5F]">可观测性面板</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger className="w-[120px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">最近1小时</SelectItem>
              <SelectItem value="day">今天</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 汇总统计 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">总会话数</p>
                <p className="text-xl font-bold text-[#1E3A5F]">
                  {formatNumber(mockTenantStats.totalSessions)}
                </p>
              </div>
              <Activity className="h-6 w-6 text-[#1E3A5F]/20" />
            </div>
            <div className="mt-1 flex items-center gap-1">
              {getTrendIcon('up')}
              <span className="text-xs text-green-600">+12.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">活跃用户</p>
                <p className="text-xl font-bold text-[#1E3A5F]">
                  {formatNumber(mockTenantStats.activeUsers)}
                </p>
              </div>
              <Users className="h-6 w-6 text-[#1E3A5F]/20" />
            </div>
            <div className="mt-1 flex items-center gap-1">
              {getTrendIcon('up')}
              <span className="text-xs text-green-600">+8.3%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Token 总量</p>
                <p className="text-xl font-bold text-[#1E3A5F]">
                  {formatNumber(mockTenantStats.totalTokens.input + mockTenantStats.totalTokens.output)}
                </p>
              </div>
              <Cpu className="h-6 w-6 text-[#1E3A5F]/20" />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              输入: {formatNumber(mockTenantStats.totalTokens.input)} / 输出: {formatNumber(mockTenantStats.totalTokens.output)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">工具调用</p>
                <p className="text-xl font-bold text-[#1E3A5F]">
                  {formatNumber(mockTenantStats.totalToolCalls)}
                </p>
              </div>
              <Zap className="h-6 w-6 text-[#1E3A5F]/20" />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              成功率: {mockTenantStats.successRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">平均响应</p>
                <p className="text-xl font-bold text-[#1E3A5F]">
                  {formatTime(mockTenantStats.avgResponseTime)}
                </p>
              </div>
              <Clock className="h-6 w-6 text-[#1E3A5F]/20" />
            </div>
            <div className="mt-1 flex items-center gap-1">
              {getTrendIcon('down')}
              <span className="text-xs text-green-600">-5.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">总成本</p>
                <p className="text-xl font-bold text-[#1E3A5F]">
                  {formatCost(mockTenantStats.totalCost)}
                </p>
              </div>
              <Database className="h-6 w-6 text-[#1E3A5F]/20" />
            </div>
            <div className="mt-1 flex items-center gap-1">
              {getTrendIcon('up')}
              <span className="text-xs text-orange-600">+15.8%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="session">
            <Activity className="mr-2 h-4 w-4" />
            会话级指标
          </TabsTrigger>
          <TabsTrigger value="tenant">
            <Users className="mr-2 h-4 w-4" />
            租户级统计
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="mr-2 h-4 w-4" />
            报告导出
          </TabsTrigger>
        </TabsList>

        {/* 会话级指标 */}
        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>活跃会话</span>
                <Badge variant="secondary">{mockSessionMetrics.length} 个会话</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>会话名称</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>工具调用</TableHead>
                      <TableHead>延迟</TableHead>
                      <TableHead>成本</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSessionMetrics.map((session) => (
                      <TableRow key={session.sessionId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{session.sessionName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(session.startTime)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              session.status === 'active'
                                ? 'border-green-500 text-green-600'
                                : session.status === 'completed'
                                  ? 'border-blue-500 text-blue-600'
                                  : 'border-red-500 text-red-600'
                            }
                          >
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>总计: {formatNumber(session.tokenUsage.total)}</p>
                            <p className="text-xs text-muted-foreground">
                              入: {session.tokenUsage.input} / 出: {session.tokenUsage.output}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>
                              {session.toolMetrics.successCount}/{session.toolMetrics.totalCalls}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              失败: {session.toolMetrics.failedCount}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatTime(session.toolMetrics.avgLatency)}</TableCell>
                        <TableCell>{formatCost(session.costMetrics.totalCost)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
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
        </TabsContent>

        {/* 租户级统计 */}
        <TabsContent value="tenant" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* 热门模型 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChart className="h-4 w-4" />
                  热门模型
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockTenantStats.topModels.map((model, index) => (
                    <div key={model.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E3A5F] text-xs text-white">
                          {index + 1}
                        </div>
                        <span className="font-medium">{model.name}</span>
                      </div>
                      <div className="text-right text-sm">
                        <p>{formatNumber(model.calls)} 次调用</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(model.tokens)} tokens
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 热门工具 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4" />
                  热门工具
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockTenantStats.topTools.map((tool, index) => (
                    <div key={tool.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E3A5F] text-xs text-white">
                          {index + 1}
                        </div>
                        <span className="font-medium">{tool.name}</span>
                      </div>
                      <div className="text-right text-sm">
                        <p>{formatNumber(tool.calls)} 次调用</p>
                        <p className="text-xs text-muted-foreground">
                          成功率: {tool.successRate}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 部门使用情况 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                部门使用情况
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>部门</TableHead>
                    <TableHead>会话数</TableHead>
                    <TableHead>Token 消耗</TableHead>
                    <TableHead>成本</TableHead>
                    <TableHead>占比</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTenantStats.usageByDepartment.map((dept) => {
                    const percentage = (dept.cost / mockTenantStats.totalCost) * 100
                    return (
                      <TableRow key={dept.department}>
                        <TableCell className="font-medium">{dept.department}</TableCell>
                        <TableCell>{formatNumber(dept.sessions)}</TableCell>
                        <TableCell>{formatNumber(dept.tokens)}</TableCell>
                        <TableCell>{formatCost(dept.cost)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-[#1E3A5F]"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm">{percentage.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 趋势图表 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <LineChart className="h-4 w-4" />
                使用趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                {mockTenantStats.trend.map((day) => {
                  const maxTokens = Math.max(...mockTenantStats.trend.map((d) => d.tokens))
                  const height = (day.tokens / maxTokens) * 100
                  return (
                    <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                      <div className="relative w-full">
                        <div
                          className="w-full rounded-t bg-[#1E3A5F]"
                          style={{ height: `${height}px` }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{day.date.slice(5)}</p>
                        <p className="text-xs font-medium">{formatNumber(day.tokens)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 报告导出 */}
        <TabsContent value="export" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 使用报告 */}
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-[#1E3A5F]/10 p-3">
                    <FileText className="h-6 w-6 text-[#1E3A5F]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">使用报告</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      会话数、Token消耗、工具调用统计
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={() => handleExport('usage')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      导出 CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 性能报告 */}
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-[#1E3A5F]/10 p-3">
                    <TrendingUp className="h-6 w-6 text-[#1E3A5F]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">性能报告</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      响应时间、成功率、错误分析
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={() => handleExport('performance')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      导出 CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 成本报告 */}
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-[#1E3A5F]/10 p-3">
                    <Database className="h-6 w-6 text-[#1E3A5F]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">成本报告</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      模型成本、部门成本、成本趋势
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={() => handleExport('cost')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      导出 CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 安全报告 */}
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-[#1E3A5F]/10 p-3">
                    <Activity className="h-6 w-6 text-[#1E3A5F]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">安全报告</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      权限检查、敏感操作、黑名单触发
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={() => handleExport('security')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      导出 CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
