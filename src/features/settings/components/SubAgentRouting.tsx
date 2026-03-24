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
  MessageSquare,
  TrendingUp,
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

// Types
export type RoutingMode = 'manual' | 'auto' | 'hybrid'
export type MatchStrategy = 'keyword' | 'semantic' | 'combined' | 'llm_guided'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface RoutingRule {
  id: string
  name: string
  description: string
  subAgentId: string
  subAgentName: string
  matchStrategy: MatchStrategy
  keywords: string[]
  semanticThreshold: number
  priority: number
  enabled: boolean
  fallbackEnabled: boolean
}

export interface RoutingDecision {
  id: string
  timestamp: string
  inputPreview: string
  matchedRuleId?: string
  matchedRuleName?: string
  selectedSubAgentId?: string
  selectedSubAgentName?: string
  routingMode: RoutingMode
  confidence?: ConfidenceLevel
  confidenceScore?: number
  reasoning?: string
  accepted: boolean | null // null = pending decision
}

export interface RoutingStats {
  totalDecisions: number
  autoRouted: number
  manualOverridden: number
  pendingDecisions: number
  averageConfidence: number
}

export interface SubAgentRoutingProps {
  className?: string
}

// Mock Sub-Agent list
const MOCK_SUB_AGENTS = [
  { id: 'subagent-001', name: 'HR助手', template: 'specialist', enabled: true },
  { id: 'subagent-002', name: '财务分析师', template: 'analyst', enabled: true },
  { id: 'subagent-003', name: '销售协调员', template: 'coordinator', enabled: true },
  { id: 'subagent-004', name: 'IT支持助手', template: 'general', enabled: false },
]

// Mock routing rules
const createMockRoutingRules = (): RoutingRule[] => [
  {
    id: 'rule-001',
    name: 'HR查询规则',
    description: '处理员工信息查询、假期计算等HR相关请求',
    subAgentId: 'subagent-001',
    subAgentName: 'HR助手',
    matchStrategy: 'combined',
    keywords: ['员工', '请假', '假期', '考勤', '工资'],
    semanticThreshold: 0.7,
    priority: 10,
    enabled: true,
    fallbackEnabled: true,
  },
  {
    id: 'rule-002',
    name: '财务分析规则',
    description: '处理财务报表、预算分析等财务相关请求',
    subAgentId: 'subagent-002',
    subAgentName: '财务分析师',
    matchStrategy: 'keyword',
    keywords: ['财务', '报表', '预算', '支出', '收入'],
    semanticThreshold: 0.6,
    priority: 9,
    enabled: true,
    fallbackEnabled: false,
  },
  {
    id: 'rule-003',
    name: '销售协调规则',
    description: '处理客户跟进、销售流程等销售相关请求',
    subAgentId: 'subagent-003',
    subAgentName: '销售协调员',
    matchStrategy: 'semantic',
    keywords: ['客户', '销售', '订单', '商机'],
    semanticThreshold: 0.75,
    priority: 8,
    enabled: true,
    fallbackEnabled: true,
  },
]

// Mock routing decisions
const createMockRoutingDecisions = (): RoutingDecision[] => [
  {
    id: 'dec-001',
    timestamp: '2026-03-24T10:30:00Z',
    inputPreview: '我想查询员工张三的考勤记录',
    matchedRuleId: 'rule-001',
    matchedRuleName: 'HR查询规则',
    selectedSubAgentId: 'subagent-001',
    selectedSubAgentName: 'HR助手',
    routingMode: 'auto',
    confidence: 'high',
    confidenceScore: 0.92,
    reasoning: '检测到关键词"员工"和"考勤"，匹配HR查询规则',
    accepted: true,
  },
  {
    id: 'dec-002',
    timestamp: '2026-03-24T10:15:00Z',
    inputPreview: '帮我分析一下本月的财务支出',
    matchedRuleId: 'rule-002',
    matchedRuleName: '财务分析规则',
    selectedSubAgentId: 'subagent-002',
    selectedSubAgentName: '财务分析师',
    routingMode: 'auto',
    confidence: 'high',
    confidenceScore: 0.88,
    reasoning: '检测到关键词"财务"和"支出"，匹配财务分析规则',
    accepted: true,
  },
  {
    id: 'dec-003',
    timestamp: '2026-03-24T09:45:00Z',
    inputPreview: '有一个新客户需要跟进',
    matchedRuleId: 'rule-003',
    matchedRuleName: '销售协调规则',
    selectedSubAgentId: 'subagent-003',
    selectedSubAgentName: '销售协调员',
    routingMode: 'manual',
    confidence: 'medium',
    confidenceScore: 0.65,
    reasoning: '语义相似度中等，建议人工确认',
    accepted: null,
  },
  {
    id: 'dec-004',
    timestamp: '2026-03-24T09:30:00Z',
    inputPreview: '如何设置新员工的系统权限',
    matchedRuleId: 'rule-001',
    matchedRuleName: 'HR查询规则',
    selectedSubAgentId: 'subagent-001',
    selectedSubAgentName: 'HR助手',
    routingMode: 'auto',
    confidence: 'low',
    confidenceScore: 0.45,
    reasoning: '未检测到明确关键词，使用语义匹配',
    accepted: false,
  },
]

// Match strategy options
const MATCH_STRATEGIES: { value: MatchStrategy; label: string; description: string }[] = [
  { value: 'keyword', label: '关键词匹配', description: '仅基于关键词进行匹配' },
  { value: 'semantic', label: '语义匹配', description: '基于向量相似度进行匹配' },
  { value: 'combined', label: '组合匹配', description: '结合关键词和语义匹配' },
  { value: 'llm_guided', label: 'LLM引导', description: '由LLM智能判断最合适的Sub-Agent' },
]

// Confidence level badge
const getConfidenceBadge = (level?: ConfidenceLevel) => {
  if (!level) return { variant: 'outline' as const, label: '未知' }
  const variants: Record<ConfidenceLevel, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
    high: { variant: 'default', label: '高置信' },
    medium: { variant: 'secondary', label: '中置信' },
    low: { variant: 'destructive', label: '低置信' },
  }
  return variants[level]
}

export function SubAgentRouting({ className = '' }: SubAgentRoutingProps) {
  const [routingMode, setRoutingMode] = useState<RoutingMode>('hybrid')
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>(createMockRoutingRules())
  const [routingDecisions] = useState<RoutingDecision[]>(createMockRoutingDecisions)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null)

  // Stats
  const stats = useMemo((): RoutingStats => {
    const total = routingDecisions.length
    const auto = routingDecisions.filter(d => d.routingMode === 'auto').length
    const manual = routingDecisions.filter(d => d.routingMode === 'manual').length
    const pending = routingDecisions.filter(d => d.accepted === null).length
    const avgConfidence = routingDecisions.reduce((sum, d) => sum + (d.confidenceScore || 0), 0) / total
    return {
      totalDecisions: total,
      autoRouted: auto,
      manualOverridden: manual,
      pendingDecisions: pending,
      averageConfidence: avgConfidence,
    }
  }, [routingDecisions])

  // Toggle rule enabled
  const handleToggleRuleEnabled = useCallback((ruleId: string) => {
    setRoutingRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ))
  }, [])

  // Delete rule
  const handleDeleteRule = useCallback((ruleId: string) => {
    setRoutingRules(prev => prev.filter(r => r.id !== ruleId))
  }, [])

  // Edit rule
  const handleEditRule = useCallback((rule: RoutingRule) => {
    setEditingRule({ ...rule })
  }, [])

  // Save rule
  const handleSaveRule = useCallback(() => {
    if (!editingRule) return
    setRoutingRules(prev => prev.map(r =>
      r.id === editingRule.id ? editingRule : r
    ))
    setEditingRule(null)
  }, [editingRule])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Route className="h-6 w-6" />
            Sub-Agent 调用路由
          </h2>
          <p className="text-muted-foreground">
            配置路由规则，实现主 Agent 到 Sub-Agent 的自动或手动路由
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalDecisions}</div>
                <div className="text-xs text-muted-foreground">总路由次数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.autoRouted}</div>
                <div className="text-xs text-muted-foreground">自动路由</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.manualOverridden}</div>
                <div className="text-xs text-muted-foreground">手动确认</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingDecisions}</div>
                <div className="text-xs text-muted-foreground">待确认</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{(stats.averageConfidence * 100).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">平均置信度</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routing Mode */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                路由模式
              </h3>
              <p className="text-xs text-muted-foreground">
                选择路由决策的方式
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              className={`p-4 rounded-lg border text-center transition-colors ${
                routingMode === 'manual'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setRoutingMode('manual')}
            >
              <UserCheck className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="font-medium">手动模式</div>
              <div className="text-xs text-muted-foreground">所有路由需人工确认</div>
            </button>
            <button
              className={`p-4 rounded-lg border text-center transition-colors ${
                routingMode === 'auto'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setRoutingMode('auto')}
            >
              <Zap className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="font-medium">自动模式</div>
              <div className="text-xs text-muted-foreground">高置信度自动路由</div>
            </button>
            <button
              className={`p-4 rounded-lg border text-center transition-colors ${
                routingMode === 'hybrid'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setRoutingMode('hybrid')}
            >
              <Route className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="font-medium">混合模式</div>
              <div className="text-xs text-muted-foreground">自动+人工确认</div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="rules">
        <TabsList className="mb-4">
          <TabsTrigger value="rules">路由规则</TabsTrigger>
          <TabsTrigger value="history">路由历史</TabsTrigger>
        </TabsList>

        {/* Routing Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                路由规则配置
              </h3>
              <p className="text-xs text-muted-foreground">
                定义消息匹配规则和对应的 Sub-Agent
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              添加规则
            </Button>
          </div>

          {routingRules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Route className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无路由规则，点击添加规则</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {routingRules.map(rule => (
                <Card key={rule.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{rule.name}</span>
                          <Badge variant={rule.enabled ? 'default' : 'outline'}>
                            {rule.enabled ? '启用' : '禁用'}
                          </Badge>
                          <Badge variant="secondary">
                            {MATCH_STRATEGIES.find(s => s.value === rule.matchStrategy)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rule.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {rule.keywords.map(kw => (
                            <Badge key={kw} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>目标: {rule.subAgentName}</span>
                          <span>优先级: {rule.priority}</span>
                          <span>语义阈值: {rule.semanticThreshold}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleRuleEnabled(rule.id)}
                        >
                          {rule.enabled ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Routing History Tab */}
        <TabsContent value="history">
          <div>
            <h3 className="font-medium flex items-center gap-2 mb-4">
              <History className="h-4 w-4" />
              路由历史
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              查看最近的路由决策记录
            </p>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {routingDecisions.map(decision => (
                <Card key={decision.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              decision.routingMode === 'auto' ? 'default' :
                              decision.routingMode === 'manual' ? 'secondary' : 'outline'
                            }
                          >
                            {decision.routingMode === 'auto' ? '自动' :
                             decision.routingMode === 'manual' ? '手动' : '混合'}
                          </Badge>
                          {decision.confidence && (
                            <Badge variant={getConfidenceBadge(decision.confidence).variant}>
                              {getConfidenceBadge(decision.confidence).label} ({decision.confidenceScore})
                            </Badge>
                          )}
                          {decision.accepted === true && (
                            <Badge variant="default" className="bg-green-500">已接受</Badge>
                          )}
                          {decision.accepted === false && (
                            <Badge variant="destructive">已拒绝</Badge>
                          )}
                          {decision.accepted === null && (
                            <Badge variant="outline">待确认</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{decision.inputPreview}</span>
                        </div>
                        {decision.matchedRuleName && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <ArrowRight className="h-3 w-3" />
                            <span>匹配规则: {decision.matchedRuleName}</span>
                          </div>
                        )}
                        {decision.selectedSubAgentName && (
                          <div className="flex items-center gap-2 text-xs">
                            <Bot className="h-3 w-3" />
                            <span>目标: {decision.selectedSubAgentName}</span>
                          </div>
                        )}
                        {decision.reasoning && (
                          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                            {decision.reasoning}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(decision.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Rule Dialog */}
      {(showCreateDialog || editingRule) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] max-h-[80vh] overflow-auto">
            <CardContent className="pt-4">
              <h3 className="font-medium mb-4">
                {editingRule ? '编辑路由规则' : '创建路由规则'}
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>规则名称</Label>
                  <Input
                    placeholder="输入规则名称"
                    defaultValue={editingRule?.name || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label>规则描述</Label>
                  <Input
                    placeholder="输入规则描述"
                    defaultValue={editingRule?.description || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label>目标 Sub-Agent</Label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    defaultValue={editingRule?.subAgentId || ''}
                  >
                    <option value="">选择 Sub-Agent</option>
                    {MOCK_SUB_AGENTS.filter(a => a.enabled).map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>匹配策略</Label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    defaultValue={editingRule?.matchStrategy || 'keyword'}
                  >
                    {MATCH_STRATEGIES.map(strategy => (
                      <option key={strategy.value} value={strategy.value}>
                        {strategy.label} - {strategy.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>关键词 (逗号分隔)</Label>
                  <Input
                    placeholder="员工,请假,考勤"
                    defaultValue={editingRule?.keywords.join(', ') || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label>语义阈值 (0-1)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    defaultValue={editingRule?.semanticThreshold || 0.7}
                  />
                </div>
                <div className="space-y-2">
                  <Label>优先级 (数字越大优先级越高)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    defaultValue={editingRule?.priority || 10}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => {
                  setShowCreateDialog(false)
                  setEditingRule(null)
                }}>
                  取消
                </Button>
                <Button onClick={() => {
                  if (editingRule) {
                    handleSaveRule()
                  }
                  setShowCreateDialog(false)
                }}>
                  {editingRule ? '保存' : '创建'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}