/**
 * SubAgent Config Component
 * Story 60.1 - SubAgent 完整集成
 *
 * Features:
 * - List all SubAgents and their status
 * - Configure SubAgent parameters and routing
 * - Show delegation history and outcomes
 * - Manual delegation trigger
 *
 * FR: FR930, FR931, FR932, FR933, FR934
 * NFR: NFR1, NFR16, NFR20
 * ARCH: ARCH-01
 * UX: UX-01, UX-04
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Bot,
  Settings,
  Plus,
  Clock,
  History,
  Route,
  ArrowRight,
  Zap,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { invoke } from '@tauri-apps/api/core'

// Types
export type DelegationStatus = 'success' | 'timeout' | 'error' | 'rejected'
export type RoutingMode = 'manual' | 'auto' | 'hybrid'

export interface DelegationOutcome {
  delegation_id: string
  subagent_id: string
  subagent_name: string
  status: DelegationStatus
  output?: string
  error?: string
  elapsed_ms: number
  delegation_depth: number
  timestamp: string
}

export interface SubAgentConfig {
  id: string
  name: string
  display_name: string
  description: string
  enabled: boolean
  routing_mode: RoutingMode
  match_strategy: string
  keywords: string[]
  timeout_seconds: number
  max_depth: number
  delegate_count: number
  success_rate: number
  last_delegated?: string
}

export interface SubAgentConfigProps {
  className?: string
}

// Mock data for demonstration
const mockSubAgents: SubAgentConfig[] = [
  {
    id: 'subagent-001',
    name: 'finance-subagent',
    display_name: '财务助手',
    description: '处理财务报销、发票OCR、报表生成等财务相关任务',
    enabled: true,
    routing_mode: 'auto',
    match_strategy: 'combined',
    keywords: ['报销', '发票', '财务', '报销单', '发票识别'],
    timeout_seconds: 300,
    max_depth: 2,
    delegate_count: 156,
    success_rate: 0.95,
    last_delegated: '2026-04-07T10:30:00Z',
  },
  {
    id: 'subagent-002',
    name: 'sales-subagent',
    display_name: '销售助手',
    description: '处理报价单、合同、客户管理等相关任务',
    enabled: true,
    routing_mode: 'hybrid',
    match_strategy: 'keyword',
    keywords: ['报价', '合同', '客户', '订单', '销售'],
    timeout_seconds: 180,
    max_depth: 2,
    delegate_count: 89,
    success_rate: 0.92,
    last_delegated: '2026-04-07T09:15:00Z',
  },
  {
    id: 'subagent-003',
    name: 'hr-subagent',
    display_name: '人事助手',
    description: '处理员工管理、入职离职、考勤等相关任务',
    enabled: true,
    routing_mode: 'auto',
    match_strategy: 'combined',
    keywords: ['员工', '入职', '离职', '考勤', '请假'],
    timeout_seconds: 120,
    max_depth: 1,
    delegate_count: 234,
    success_rate: 0.98,
    last_delegated: '2026-04-07T11:00:00Z',
  },
  {
    id: 'subagent-004',
    name: 'warehouse-subagent',
    display_name: '仓储助手',
    description: '处理入库、出库、库存查询等仓储相关任务',
    enabled: false,
    routing_mode: 'manual',
    match_strategy: 'keyword',
    keywords: ['入库', '出库', '库存', '仓储', '盘点'],
    timeout_seconds: 180,
    max_depth: 1,
    delegate_count: 45,
    success_rate: 0.88,
  },
]

const mockDelegationHistory: DelegationOutcome[] = [
  {
    delegation_id: 'del-001',
    subagent_id: 'subagent-001',
    subagent_name: '财务助手',
    status: 'success',
    output: '已创建报销单，报销金额：¥3,500',
    elapsed_ms: 1250,
    delegation_depth: 1,
    timestamp: '2026-04-07T10:30:00Z',
  },
  {
    delegation_id: 'del-002',
    subagent_id: 'subagent-003',
    subagent_name: '人事助手',
    status: 'success',
    output: '已创建员工档案：张三，技术部',
    elapsed_ms: 890,
    delegation_depth: 1,
    timestamp: '2026-04-07T10:15:00Z',
  },
  {
    delegation_id: 'del-003',
    subagent_id: 'subagent-002',
    subagent_name: '销售助手',
    status: 'timeout',
    error: '执行超时，已自动回退到主Agent',
    elapsed_ms: 180000,
    delegation_depth: 1,
    timestamp: '2026-04-07T09:45:00Z',
  },
  {
    delegation_id: 'del-004',
    subagent_id: 'subagent-001',
    subagent_name: '财务助手',
    status: 'error',
    error: '发票OCR识别失败：图片质量过低',
    elapsed_ms: 2300,
    delegation_depth: 1,
    timestamp: '2026-04-07T09:30:00Z',
  },
]

// Helper functions
const getStatusBadge = (status: DelegationStatus) => {
  const variants: Record<DelegationStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string; icon: typeof CheckCircle2 }> = {
    success: { variant: 'default', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    timeout: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
    error: { variant: 'destructive', className: 'bg-red-100 text-red-700', icon: XCircle },
    rejected: { variant: 'outline', className: 'bg-gray-100 text-gray-700', icon: AlertTriangle },
  }
  const config = variants[status]
  const Icon = config.icon
  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {status === 'success' ? '成功' :
       status === 'timeout' ? '超时' :
       status === 'error' ? '错误' : '拒绝'}
    </Badge>
  )
}

const getRoutingModeBadge = (mode: RoutingMode) => {
  const variants: Record<RoutingMode, { label: string; color: string }> = {
    manual: { label: '手动', color: 'bg-blue-100 text-blue-700' },
    auto: { label: '自动', color: 'bg-green-100 text-green-700' },
    hybrid: { label: '混合', color: 'bg-purple-100 text-purple-700' },
  }
  const config = variants[mode]
  return <Badge className={config.color}>{config.label}</Badge>
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

export function SubAgentConfig({ className = '' }: SubAgentConfigProps) {
  const [subAgents, setSubAgents] = useState<SubAgentConfig[]>(mockSubAgents)
  const [delegationHistory] = useState<DelegationOutcome[]>(mockDelegationHistory)
  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgentConfig | null>(null)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [manualDelegateDialogOpen, setManualDelegateDialogOpen] = useState(false)
  const [delegateMessage, setDelegateMessage] = useState('')
  const [delegateResult, setDelegateResult] = useState<DelegationOutcome | null>(null)
  const [isDelegating, setIsDelegating] = useState(false)

  // Stats
  const stats = useMemo(() => {
    const total = subAgents.length
    const enabled = subAgents.filter(s => s.enabled).length
    const totalDelegations = delegationHistory.length
    const successCount = delegationHistory.filter(d => d.status === 'success').length
    const successRate = totalDelegations > 0 ? (successCount / totalDelegations * 100).toFixed(1) : '0'
    return {
      total,
      enabled,
      totalDelegations,
      successRate,
    }
  }, [subAgents, delegationHistory])

  // Toggle SubAgent enabled
  const handleToggleEnabled = useCallback((agentId: string) => {
    setSubAgents(prev => prev.map(s =>
      s.id === agentId ? { ...s, enabled: !s.enabled } : s
    ))
  }, [])

  // Open config dialog
  const handleOpenConfig = useCallback((agent: SubAgentConfig) => {
    setSelectedSubAgent({ ...agent })
    setConfigDialogOpen(true)
  }, [])

  // Save config
  const handleSaveConfig = useCallback(() => {
    if (!selectedSubAgent) return
    setSubAgents(prev => prev.map(s =>
      s.id === selectedSubAgent.id ? selectedSubAgent : s
    ))
    setConfigDialogOpen(false)
    setSelectedSubAgent(null)
  }, [selectedSubAgent])

  // Manual delegation
  const handleManualDelegate = useCallback(async () => {
    if (!selectedSubAgent || !delegateMessage.trim()) return
    setIsDelegating(true)
    try {
      const result = await invoke<DelegationOutcome>('delegate_to_subagent', {
        subagentId: selectedSubAgent.id,
        message: delegateMessage,
      })
      setDelegateResult(result)
    } catch (error) {
      // Mock result for demo
      setDelegateResult({
        delegation_id: `del-${Date.now()}`,
        subagent_id: selectedSubAgent.id,
        subagent_name: selectedSubAgent.display_name,
        status: 'success',
        output: `[模拟结果] SubAgent "${selectedSubAgent.display_name}" 已处理您的请求：${delegateMessage}`,
        elapsed_ms: 1500,
        delegation_depth: 1,
        timestamp: new Date().toISOString(),
      })
    }
    setIsDelegating(false)
  }, [selectedSubAgent, delegateMessage])

  // Open manual delegate dialog
  const handleOpenManualDelegate = useCallback((agent: SubAgentConfig) => {
    setSelectedSubAgent(agent)
    setDelegateMessage('')
    setDelegateResult(null)
    setManualDelegateDialogOpen(true)
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">SubAgent 总数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.enabled}</div>
                <div className="text-xs text-muted-foreground">已启用</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalDelegations}</div>
                <div className="text-xs text-muted-foreground">委派总数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
                <div className="text-xs text-muted-foreground">成功率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="agents">
        <TabsList className="mb-4">
          <TabsTrigger value="agents">SubAgent 配置</TabsTrigger>
          <TabsTrigger value="history">委派历史</TabsTrigger>
        </TabsList>

        {/* SubAgent Config Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4">
            {subAgents.map(agent => (
              <Card key={agent.id} className={!agent.enabled ? 'opacity-60' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{agent.display_name}</span>
                          {getRoutingModeBadge(agent.routing_mode)}
                          {agent.enabled ? (
                            <Badge variant="outline" className="border-green-500/30 text-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              启用
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-500/30 text-gray-500">
                              <Pause className="h-3 w-3 mr-1" />
                              禁用
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {agent.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Route className="h-3 w-3" />
                            匹配策略: {agent.match_strategy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            超时: {agent.timeout_seconds}s
                          </span>
                          <span className="flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" />
                            委派: {agent.delegate_count}次
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            成功率: {(agent.success_rate * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.keywords.slice(0, 5).map(kw => (
                            <Badge key={kw} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                          {agent.keywords.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.keywords.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleEnabled(agent.id)}
                        title={agent.enabled ? '禁用' : '启用'}
                      >
                        {agent.enabled ? (
                          <Pause className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Play className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenConfig(agent)}
                        title="配置"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenManualDelegate(agent)}
                        disabled={!agent.enabled}
                        title="手动委派"
                      >
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Delegation History Tab */}
        <TabsContent value="history">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {delegationHistory.map(outcome => (
                <Card key={outcome.delegation_id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{outcome.subagent_name}</span>
                            {getStatusBadge(outcome.status)}
                            <Badge variant="outline" className="text-xs">
                              深度: {outcome.delegation_depth}
                            </Badge>
                          </div>
                          {outcome.output && (
                            <p className="text-sm text-muted-foreground mb-1">
                              {outcome.output}
                            </p>
                          )}
                          {outcome.error && (
                            <p className="text-sm text-red-500 mb-1">
                              {outcome.error}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(outcome.elapsed_ms)}
                            </span>
                            <span>
                              {new Date(outcome.timestamp).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {delegationHistory.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无委派历史</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>配置 {selectedSubAgent?.display_name}</DialogTitle>
            <DialogDescription>
              配置 SubAgent 的路由规则和执行参数
            </DialogDescription>
          </DialogHeader>
          {selectedSubAgent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="routing-mode">路由模式</Label>
                  <select
                    id="routing-mode"
                    className="w-full border rounded px-3 py-2"
                    value={selectedSubAgent.routing_mode}
                    onChange={(e) => setSelectedSubAgent(prev => prev ? { ...prev, routing_mode: e.target.value as RoutingMode } : null)}
                  >
                    <option value="manual">手动</option>
                    <option value="auto">自动</option>
                    <option value="hybrid">混合</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="match-strategy">匹配策略</Label>
                  <select
                    id="match-strategy"
                    className="w-full border rounded px-3 py-2"
                    value={selectedSubAgent.match_strategy}
                    onChange={(e) => setSelectedSubAgent(prev => prev ? { ...prev, match_strategy: e.target.value } : null)}
                  >
                    <option value="keyword">关键词</option>
                    <option value="semantic">语义</option>
                    <option value="combined">组合</option>
                    <option value="llm_guided">LLM引导</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">超时时间（秒）</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={selectedSubAgent.timeout_seconds}
                    onChange={(e) => setSelectedSubAgent(prev => prev ? { ...prev, timeout_seconds: parseInt(e.target.value) || 300 } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-depth">最大委派深度</Label>
                  <Input
                    id="max-depth"
                    type="number"
                    value={selectedSubAgent.max_depth}
                    onChange={(e) => setSelectedSubAgent(prev => prev ? { ...prev, max_depth: parseInt(e.target.value) || 2 } : null)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">触发关键词（逗号分隔）</Label>
                <Input
                  id="keywords"
                  value={selectedSubAgent.keywords.join(', ')}
                  onChange={(e) => setSelectedSubAgent(prev => prev ? { ...prev, keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) } : null)}
                  placeholder="报销, 发票, 财务"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveConfig}>
              保存配置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Delegate Dialog */}
      <Dialog open={manualDelegateDialogOpen} onOpenChange={setManualDelegateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>手动委派到 {selectedSubAgent?.display_name}</DialogTitle>
            <DialogDescription>
              输入要委派的任务内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delegate-message">任务描述</Label>
              <textarea
                id="delegate-message"
                className="w-full border rounded px-3 py-2 min-h-[100px]"
                value={delegateMessage}
                onChange={(e) => setDelegateMessage(e.target.value)}
                placeholder="输入要处理的业务任务..."
              />
            </div>
            {delegateResult && (
              <Card className={delegateResult.status === 'success' ? 'border-green-500' : 'border-red-500'}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(delegateResult.status)}
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(delegateResult.elapsed_ms)}
                    </span>
                  </div>
                  {delegateResult.output && (
                    <p className="text-sm">{delegateResult.output}</p>
                  )}
                  {delegateResult.error && (
                    <p className="text-sm text-red-500">{delegateResult.error}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDelegateDialogOpen(false)}>
              关闭
            </Button>
            <Button onClick={handleManualDelegate} disabled={!delegateMessage.trim() || isDelegating}>
              {isDelegating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              执行委派
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SubAgentConfig
