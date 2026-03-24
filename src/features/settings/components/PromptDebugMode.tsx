import { useState, useMemo, useCallback } from 'react'
import {
  Bug,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Zap,
  Clock,
  FileText,
  Layers,
  ChevronRight,
  ChevronDown,
  Copy,
  Info,
  Search,
  Filter,
  Terminal,
  MessageSquare,
  Brain,
  TrendingUp,
  Lock,
  Unlock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'

// Types
export type DebugStatus = 'idle' | 'running' | 'success' | 'failed' | 'blocked'
export type SafetyLevel = 'safe' | 'warning' | 'danger'
export type ConvergenceStrategy = 'completed' | 'max_iterations' | 'timeout' | 'user_interrupt'

export interface TriggeredRule {
  id: string
  name: string
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  matched: boolean
  impact: 'positive' | 'negative' | 'neutral'
  description: string
  content: string
  order: number
}

export interface SafetyBlock {
  id: string
  type: 'content_filter' | 'permission' | 'rate_limit' | 'schema_validation' | 'safety_policy'
  level: SafetyLevel
  message: string
  blocked: boolean
  details: string
}

export interface ConvergenceHit {
  strategy: ConvergenceStrategy
  message: string
  iterations: number
  maxIterations: number
  duration: number
}

export interface DebugResult {
  id: string
  timestamp: string
  input: string
  output: string
  status: DebugStatus
  triggeredRules: TriggeredRule[]
  safetyBlocks: SafetyBlock[]
  convergenceHit?: ConvergenceHit
  tokenUsage: {
    prompt: number
    completion: number
    total: number
  }
  latency: number
  metadata: Record<string, string>
}

export interface PromptDebugModeProps {
  className?: string
}

// Mock triggered rules
const createMockTriggeredRules = (): TriggeredRule[] => [
  {
    id: 'rule-001',
    name: '身份验证规则',
    category: 'identity',
    priority: 'critical',
    matched: true,
    impact: 'positive',
    description: '在执行敏感操作前必须验证用户身份',
    content: '在执行任何敏感操作之前，必须首先验证用户身份和权限。',
    order: 1,
  },
  {
    id: 'rule-003',
    name: '响应格式规范',
    category: 'output',
    priority: 'high',
    matched: true,
    impact: 'positive',
    description: '确保输出内容符合格式要求',
    content: '所有响应必须使用清晰的结构化格式。',
    order: 2,
  },
  {
    id: 'rule-004',
    name: '工具调用审批',
    category: 'tool',
    priority: 'high',
    matched: false,
    impact: 'neutral',
    description: '敏感工具调用需要用户确认',
    content: '调用文件系统、网络请求等敏感工具时，必须先获取用户明确确认。',
    order: 3,
  },
]

// Mock safety blocks
const createMockSafetyBlocks = (): SafetyBlock[] => [
  {
    id: 'block-001',
    type: 'content_filter',
    level: 'safe',
    message: '内容安全检查通过',
    blocked: false,
    details: '未检测到敏感内容或违规信息',
  },
  {
    id: 'block-002',
    type: 'permission',
    level: 'safe',
    message: '权限验证通过',
    blocked: false,
    details: '用户具有执行此操作的权限',
  },
  {
    id: 'block-003',
    type: 'schema_validation',
    level: 'warning',
    message: '部分参数未通过验证',
    blocked: false,
    details: '参数 "temperature" 超出建议范围 (0.8 > 0.7)，已自动调整',
  },
]

// Mock debug results
const createMockDebugResults = (): DebugResult[] => [
  {
    id: 'debug-001',
    timestamp: '2026-03-24T10:30:00Z',
    input: '帮我创建一个新的工作流程，名称为"销售审批"，描述为"用于销售部门的审批流程"',
    output: '已成功创建工作流程"销售审批"。工作流程 ID: wf-20240324-001，包含以下步骤：\n\n1. 提交申请\n2. 部门主管审批\n3. 财务复核\n4. 完成\n\n您可以在工作流程管理中查看和管理此流程。',
    status: 'success',
    triggeredRules: createMockTriggeredRules(),
    safetyBlocks: createMockSafetyBlocks(),
    convergenceHit: {
      strategy: 'completed',
      message: '任务成功完成',
      iterations: 3,
      maxIterations: 10,
      duration: 2500,
    },
    tokenUsage: {
      prompt: 1250,
      completion: 890,
      total: 2140,
    },
    latency: 2500,
    metadata: {
      model: 'gpt-4o',
      provider: 'openai',
      sessionId: 'sess-20240324-001',
    },
  },
  {
    id: 'debug-002',
    timestamp: '2026-03-24T10:25:00Z',
    input: '删除所有用户数据',
    output: '',
    status: 'blocked',
    triggeredRules: createMockTriggeredRules().filter(r => r.id === 'rule-001'),
    safetyBlocks: [
      {
        id: 'block-danger',
        type: 'safety_policy',
        level: 'danger',
        message: '危险操作被阻止',
        blocked: true,
        details: '检测到批量删除操作，违反安全策略。需要管理员确认才能执行。',
      },
    ],
    convergenceHit: {
      strategy: 'user_interrupt',
      message: '操作被安全策略阻止',
      iterations: 1,
      maxIterations: 10,
      duration: 150,
    },
    tokenUsage: {
      prompt: 45,
      completion: 120,
      total: 165,
    },
    latency: 150,
    metadata: {
      model: 'gpt-4o',
      provider: 'openai',
      sessionId: 'sess-20240324-001',
    },
  },
  {
    id: 'debug-003',
    timestamp: '2026-03-24T10:20:00Z',
    input: '解释量子计算的基本原理',
    output: '量子计算是一种基于量子力学原理的计算方式...',
    status: 'success',
    triggeredRules: [],
    safetyBlocks: createMockSafetyBlocks().slice(0, 2),
    convergenceHit: {
      strategy: 'completed',
      message: '响应生成完成',
      iterations: 2,
      maxIterations: 10,
      duration: 1800,
    },
    tokenUsage: {
      prompt: 320,
      completion: 1450,
      total: 1770,
    },
    latency: 1800,
    metadata: {
      model: 'gpt-4o',
      provider: 'openai',
      sessionId: 'sess-20240324-001',
    },
  },
]

// Priority configuration
const PRIORITY_CONFIG = {
  critical: { label: '关键', color: 'bg-red-500 text-white', icon: <Shield className="h-3 w-3" /> },
  high: { label: '高', color: 'bg-orange-500 text-white', icon: <AlertTriangle className="h-3 w-3" /> },
  medium: { label: '中', color: 'bg-yellow-500 text-white', icon: <Zap className="h-3 w-3" /> },
  low: { label: '低', color: 'bg-gray-500 text-white', icon: <Info className="h-3 w-3" /> },
}

// Safety level configuration
const SAFETY_CONFIG = {
  safe: { label: '安全', color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200' },
  warning: { label: '警告', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200' },
  danger: { label: '危险', color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200' },
}

// Convergence strategy configuration
const CONVERGENCE_CONFIG = {
  completed: { label: '完成', color: 'text-green-600', icon: <CheckCircle2 className="h-4 w-4" /> },
  max_iterations: { label: '迭代上限', color: 'text-orange-600', icon: <RefreshCw className="h-4 w-4" /> },
  timeout: { label: '超时', color: 'text-red-600', icon: <Clock className="h-4 w-4" /> },
  user_interrupt: { label: '用户中断', color: 'text-purple-600', icon: <Square className="h-4 w-4" /> },
}

export function PromptDebugMode({ className = '' }: PromptDebugModeProps) {
  const [testInput, setTestInput] = useState('')
  const [debugStatus, setDebugStatus] = useState<DebugStatus>('idle')
  const [debugResults, setDebugResults] = useState<DebugResult[]>(createMockDebugResults())
  const [selectedResult, setSelectedResult] = useState<DebugResult | null>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('test')
  const [filterStatus, setFilterStatus] = useState<DebugStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())

  // Filter results
  const filteredResults = useMemo(() => {
    return debugResults.filter(result => {
      const matchesSearch = searchQuery === '' ||
        result.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.output.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.triggeredRules.some(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = filterStatus === 'all' || result.status === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [debugResults, searchQuery, filterStatus])

  // Run debug test
  const handleRunTest = useCallback(async () => {
    if (!testInput.trim()) return

    setDebugStatus('running')

    // Simulate debug run
    setTimeout(() => {
      const newResult: DebugResult = {
        id: `debug-${Date.now()}`,
        timestamp: new Date().toISOString(),
        input: testInput,
        output: `这是对输入的调试响应："${testInput}"\n\n[调试信息]\n- 解析了 3 个意图\n- 触发了 2 条规则\n- 执行了 1 次工具调用\n- 响应生成成功`,
        status: 'success',
        triggeredRules: createMockTriggeredRules(),
        safetyBlocks: createMockSafetyBlocks(),
        convergenceHit: {
          strategy: 'completed',
          message: '调试执行成功',
          iterations: 4,
          maxIterations: 10,
          duration: Math.floor(Math.random() * 3000) + 500,
        },
        tokenUsage: {
          prompt: Math.floor(Math.random() * 500) + 200,
          completion: Math.floor(Math.random() * 800) + 300,
          total: Math.floor(Math.random() * 1300) + 500,
        },
        latency: Math.floor(Math.random() * 3000) + 500,
        metadata: {
          model: 'gpt-4o',
          provider: 'openai',
          sessionId: `sess-${Date.now()}`,
        },
      }

      setDebugResults(prev => [newResult, ...prev])
      setDebugStatus('success')
      setSelectedResult(newResult)
      setShowResultDialog(true)
      setTestInput('')

      setTimeout(() => setDebugStatus('idle'), 2000)
    }, 1500)
  }, [testInput])

  // Stop debug
  const handleStopTest = useCallback(() => {
    setDebugStatus('idle')
  }, [])

  // Toggle rule expansion
  const toggleRuleExpansion = useCallback((ruleId: string) => {
    setExpandedRules(prev => {
      const next = new Set(prev)
      if (next.has(ruleId)) {
        next.delete(ruleId)
      } else {
        next.add(ruleId)
      }
      return next
    })
  }, [])

  // Toggle block expansion
  const toggleBlockExpansion = useCallback((blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
      }
      return next
    })
  }, [])

  // Get status badge
  const getStatusBadge = (status: DebugStatus) => {
    switch (status) {
      case 'idle':
        return <Badge variant="outline">空闲</Badge>
      case 'running':
        return <Badge variant="default" className="bg-blue-500">运行中</Badge>
      case 'success':
        return <Badge variant="outline" className="text-green-600 border-green-300">成功</Badge>
      case 'failed':
        return <Badge variant="destructive">失败</Badge>
      case 'blocked':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">被阻止</Badge>
    }
  }

  // Stats
  const stats = useMemo(() => ({
    total: debugResults.length,
    success: debugResults.filter(r => r.status === 'success').length,
    blocked: debugResults.filter(r => r.status === 'blocked').length,
    failed: debugResults.filter(r => r.status === 'failed').length,
  }), [debugResults])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-6 w-6" />
            提示词调试模式
          </h2>
          <p className="text-muted-foreground">
            运行测试提示词，验证规则触发、安全阻止和收敛策略
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDebugResults(createMockDebugResults())
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重置示例
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">总调试次数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                <div className="text-xs text-muted-foreground">成功</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.blocked}</div>
                <div className="text-xs text-muted-foreground">被阻止</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-xs text-muted-foreground">失败</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">
            <Bug className="h-4 w-4 mr-2" />
            调试测试
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            调试历史
          </TabsTrigger>
        </TabsList>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                测试输入
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="输入要测试的提示词..."
                className="min-h-[150px] font-mono text-sm"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                disabled={debugStatus === 'running'}
              />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {testInput.length} 字符
                </div>
                <div className="flex items-center gap-2">
                  {debugStatus === 'running' ? (
                    <Button variant="destructive" onClick={handleStopTest}>
                      <Square className="h-4 w-4 mr-2" />
                      停止
                    </Button>
                  ) : (
                    <Button onClick={handleRunTest} disabled={!testInput.trim()}>
                      <Play className="h-4 w-4 mr-2" />
                      运行调试
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                调试说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Layers className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">规则触发</div>
                    <div className="text-xs text-muted-foreground">
                      显示输入触发的规则及其影响
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">安全阻止</div>
                    <div className="text-xs text-muted-foreground">
                      显示内容安全和权限检查结果
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">收敛策略</div>
                    <div className="text-xs text-muted-foreground">
                      显示迭代次数和完成状态
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索调试结果..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    className="text-sm border rounded px-2 py-1.5"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as DebugStatus | 'all')}
                  >
                    <option value="all">全部状态</option>
                    <option value="success">成功</option>
                    <option value="blocked">被阻止</option>
                    <option value="failed">失败</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results List */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredResults.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Terminal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">没有找到匹配的调试结果</p>
                  </CardContent>
                </Card>
              ) : (
                filteredResults.map(result => (
                  <Card
                    key={result.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedResult(result)
                      setShowResultDialog(true)
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(result.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {result.latency}ms
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {result.tokenUsage.total} tokens
                          </span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="text-sm font-medium mb-1">输入:</div>
                        <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded font-mono line-clamp-2">
                          {result.input}
                        </div>
                      </div>
                      {result.output && (
                        <div className="mb-2">
                          <div className="text-sm font-medium mb-1">输出:</div>
                          <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded font-mono line-clamp-2">
                            {result.output}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {result.triggeredRules.length} 条规则触发
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {result.safetyBlocks.filter(b => b.blocked).length} 项阻止
                        </span>
                        {result.convergenceHit && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {result.convergenceHit.strategy}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Result Detail Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              调试结果详情
            </DialogTitle>
            <DialogDescription>
              {selectedResult && new Date(selectedResult.timestamp).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedResult && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 p-1">
                {/* Status and Metadata */}
                <div className="flex items-center justify-between">
                  {getStatusBadge(selectedResult.status)}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Model: {selectedResult.metadata.model}</span>
                    <span>Provider: {selectedResult.metadata.provider}</span>
                    <span>Latency: {selectedResult.latency}ms</span>
                  </div>
                </div>

                {/* Input/Output */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      输入
                    </Label>
                    <div className="mt-1 p-3 bg-muted/50 rounded-md font-mono text-sm">
                      {selectedResult.input}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      输出
                    </Label>
                    <div className="mt-1 p-3 bg-muted/50 rounded-md font-mono text-sm whitespace-pre-wrap">
                      {selectedResult.output || '(无输出)'}
                    </div>
                  </div>
                </div>

                {/* Token Usage */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Token 使用量
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Prompt</div>
                        <Progress value={(selectedResult.tokenUsage.prompt / selectedResult.tokenUsage.total) * 100} className="h-2" />
                        <div className="text-xs mt-1">{selectedResult.tokenUsage.prompt}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Completion</div>
                        <Progress value={(selectedResult.tokenUsage.completion / selectedResult.tokenUsage.total) * 100} className="h-2" />
                        <div className="text-xs mt-1">{selectedResult.tokenUsage.completion}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">总计</div>
                        <Progress value={100} className="h-2" />
                        <div className="text-xs mt-1 font-bold">{selectedResult.tokenUsage.total}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Convergence Hit */}
                {selectedResult.convergenceHit && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        收敛策略
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 ${CONVERGENCE_CONFIG[selectedResult.convergenceHit.strategy].color}`}>
                          {CONVERGENCE_CONFIG[selectedResult.convergenceHit.strategy].icon}
                          <span className="font-medium">
                            {CONVERGENCE_CONFIG[selectedResult.convergenceHit.strategy].label}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedResult.convergenceHit.message}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>迭代次数: {selectedResult.convergenceHit.iterations} / {selectedResult.convergenceHit.maxIterations}</span>
                        <span>执行时间: {selectedResult.convergenceHit.duration}ms</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Triggered Rules */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      触发的规则 ({selectedResult.triggeredRules.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedResult.triggeredRules.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        没有触发任何规则
                      </div>
                    ) : (
                      selectedResult.triggeredRules.map(rule => (
                        <div
                          key={rule.id}
                          className="border rounded-lg p-3"
                        >
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleRuleExpansion(rule.id)}
                          >
                            <div className="flex items-center gap-2">
                              {expandedRules.has(rule.id) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium text-sm">{rule.name}</span>
                              <Badge className={PRIORITY_CONFIG[rule.priority].color}>
                                {PRIORITY_CONFIG[rule.priority].icon}
                                <span className="ml-1">{PRIORITY_CONFIG[rule.priority].label}</span>
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  rule.impact === 'positive'
                                    ? 'text-green-600 border-green-300'
                                    : rule.impact === 'negative'
                                    ? 'text-red-600 border-red-300'
                                    : 'text-gray-600 border-gray-300'
                                }
                              >
                                {rule.impact === 'positive' && <Unlock className="h-3 w-3 mr-1" />}
                                {rule.impact === 'negative' && <Lock className="h-3 w-3 mr-1" />}
                                {rule.impact === 'positive' ? '正面' : rule.impact === 'negative' ? '负面' : '中性'}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {rule.category}
                            </div>
                          </div>
                          {expandedRules.has(rule.id) && (
                            <div className="mt-3 pl-6 space-y-2">
                              <div className="text-sm text-muted-foreground">
                                {rule.description}
                              </div>
                              <div className="text-sm bg-muted/50 p-2 rounded font-mono">
                                {rule.content}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Safety Blocks */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      安全检查 ({selectedResult.safetyBlocks.filter(b => b.blocked).length} 项阻止)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedResult.safetyBlocks.map(block => (
                      <div
                        key={block.id}
                        className={`border rounded-lg p-3 ${
                          block.blocked ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''
                        }`}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleBlockExpansion(block.id)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedBlocks.has(block.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            {block.blocked ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            <span className="font-medium text-sm">{block.message}</span>
                            <Badge className={SAFETY_CONFIG[block.level].color}>
                              {SAFETY_CONFIG[block.level].label}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {block.type.replace('_', ' ')}
                          </div>
                        </div>
                        {expandedBlocks.has(block.id) && (
                          <div className="mt-3 pl-6 text-sm text-muted-foreground">
                            {block.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedResult) {
                  navigator.clipboard.writeText(JSON.stringify(selectedResult, null, 2))
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              复制结果
            </Button>
            <Button onClick={() => setShowResultDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
