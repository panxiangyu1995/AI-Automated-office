/**
 * SubAgentManagement.tsx
 * Story 7.8 - 子代理管理
 * 
 * 功能：
 * - 子代理创建与委派：检测何时需要子代理委派
 * - 子代理状态监控：监控子代理执行状态
 * - 结果聚合：聚合子代理结果并向用户展示
 */

import { useState, useMemo } from 'react'
import { 
  Users, UserPlus, Clock, CheckCircle2, 
  XCircle, RefreshCw, Play, 
  Pause, Square, Settings, Activity, Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义

/** 子代理状态 */
export type SubAgentStatus = 
  | 'pending'      // 等待创建
  | 'initializing' // 初始化中
  | 'running'      // 运行中
  | 'paused'       // 已暂停
  | 'completed'    // 已完成
  | 'failed'       // 失败
  | 'terminated'   // 已终止

/** 委派策略 */
export type DelegationStrategy = 
  | 'auto'         // 自动委派
  | 'manual'       // 手动委派
  | 'hybrid'       // 混合模式

/** 子代理类型 */
export type SubAgentType = 
  | 'task_executor'    // 任务执行器
  | 'researcher'       // 研究助手
  | 'analyst'          // 分析师
  | 'coder'            // 代码助手
  | 'reviewer'         // 审核员
  | 'specialist'       // 专家

/** 子代理能力 */
export interface SubAgentCapability {
  id: string
  name: string
  description: string
  enabled: boolean
}

/** 子代理配置 */
export interface SubAgentConfig {
  id: string
  type: SubAgentType
  name: string
  description?: string
  capabilities: SubAgentCapability[]
  maxExecutionTime: number // seconds
  maxIterations: number
  memoryLimit: number // MB
  priority: 'low' | 'medium' | 'high' | 'critical'
  parentAgentId: string
  createdAt: Date
}

/** 子代理执行记录 */
export interface SubAgentExecution {
  id: string
  agentId: string
  taskId: string
  status: SubAgentStatus
  startTime: Date
  endTime?: Date
  duration?: number
  steps: ExecutionStep[]
  result?: SubAgentResult
  error?: string
}

/** 执行步骤 */
export interface ExecutionStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startTime?: Date
  endTime?: Date
  output?: string
}

/** 子代理结果 */
export interface SubAgentResult {
  success: boolean
  output: string
  artifacts?: string[]
  metrics: {
    stepsCompleted: number
    totalSteps: number
    tokensUsed: number
    toolsCalled: number
  }
}

/** 委派请求 */
export interface DelegationRequest {
  id: string
  taskId: string
  taskDescription: string
  requiredCapabilities: string[]
  suggestedAgentType: SubAgentType
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedTime: number
  createdAt: Date
  status: 'pending' | 'approved' | 'rejected' | 'delegated'
}

/** 子代理统计 */
export interface SubAgentStats {
  totalAgents: number
  activeAgents: number
  completedTasks: number
  failedTasks: number
  avgExecutionTime: number
  totalTokensUsed: number
  delegationRequests: number
  autoDelegations: number
  manualDelegations: number
}

/** 子代理管理状态 */
export interface SubAgentManagementState {
  agents: SubAgentConfig[]
  executions: SubAgentExecution[]
  delegationRequests: DelegationRequest[]
  stats: SubAgentStats
  delegationStrategy: DelegationStrategy
}

// ============================================================================
// 默认数据

const defaultCapabilities: SubAgentCapability[] = [
  { id: 'tool_execution', name: '工具执行', description: '执行工具调用', enabled: true },
  { id: 'web_search', name: '网络搜索', description: '搜索网络信息', enabled: true },
  { id: 'file_operations', name: '文件操作', description: '读写文件', enabled: true },
  { id: 'code_analysis', name: '代码分析', description: '分析代码结构', enabled: false },
  { id: 'data_processing', name: '数据处理', description: '处理数据转换', enabled: true },
]

const createMockAgents = (): SubAgentConfig[] => [
  {
    id: 'sub-agent-1',
    type: 'task_executor',
    name: '任务执行器 Alpha',
    description: '通用任务执行子代理',
    capabilities: defaultCapabilities,
    maxExecutionTime: 300,
    maxIterations: 10,
    memoryLimit: 512,
    priority: 'high',
    parentAgentId: 'main-agent',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'sub-agent-2',
    type: 'researcher',
    name: '研究助手 Beta',
    description: '信息检索与分析子代理',
    capabilities: defaultCapabilities.filter(c => c.id !== 'file_operations'),
    maxExecutionTime: 600,
    maxIterations: 20,
    memoryLimit: 256,
    priority: 'medium',
    parentAgentId: 'main-agent',
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'sub-agent-3',
    type: 'analyst',
    name: '分析师 Gamma',
    description: '数据分析子代理',
    capabilities: defaultCapabilities.filter(c => c.id === 'data_processing' || c.id === 'tool_execution'),
    maxExecutionTime: 180,
    maxIterations: 15,
    memoryLimit: 1024,
    priority: 'high',
    parentAgentId: 'main-agent',
    createdAt: new Date(Date.now() - 1800000),
  },
]

const createMockExecutions = (): SubAgentExecution[] => [
  {
    id: 'exec-1',
    agentId: 'sub-agent-1',
    taskId: 'task-001',
    status: 'completed',
    startTime: new Date(Date.now() - 1800000),
    endTime: new Date(Date.now() - 1200000),
    duration: 600,
    steps: [
      { id: 'step-1', name: '初始化', status: 'completed', startTime: new Date(Date.now() - 1800000), endTime: new Date(Date.now() - 1790000) },
      { id: 'step-2', name: '执行任务', status: 'completed', startTime: new Date(Date.now() - 1790000), endTime: new Date(Date.now() - 1300000) },
      { id: 'step-3', name: '结果汇总', status: 'completed', startTime: new Date(Date.now() - 1300000), endTime: new Date(Date.now() - 1200000) },
    ],
    result: {
      success: true,
      output: '任务成功完成',
      artifacts: ['result.json'],
      metrics: { stepsCompleted: 3, totalSteps: 3, tokensUsed: 1500, toolsCalled: 5 },
    },
  },
  {
    id: 'exec-2',
    agentId: 'sub-agent-2',
    taskId: 'task-002',
    status: 'running',
    startTime: new Date(Date.now() - 300000),
    steps: [
      { id: 'step-1', name: '初始化', status: 'completed', startTime: new Date(Date.now() - 300000), endTime: new Date(Date.now() - 295000) },
      { id: 'step-2', name: '搜索信息', status: 'running', startTime: new Date(Date.now() - 295000) },
      { id: 'step-3', name: '分析结果', status: 'pending' },
    ],
  },
  {
    id: 'exec-3',
    agentId: 'sub-agent-3',
    taskId: 'task-003',
    status: 'failed',
    startTime: new Date(Date.now() - 600000),
    endTime: new Date(Date.now() - 540000),
    duration: 60,
    steps: [
      { id: 'step-1', name: '初始化', status: 'completed' },
      { id: 'step-2', name: '数据处理', status: 'failed', output: '内存不足' },
    ],
    error: '内存限制超出',
  },
]

const createMockDelegationRequests = (): DelegationRequest[] => [
  {
    id: 'req-1',
    taskId: 'task-004',
    taskDescription: '分析用户行为数据',
    requiredCapabilities: ['data_processing', 'code_analysis'],
    suggestedAgentType: 'analyst',
    priority: 'high',
    estimatedTime: 120,
    createdAt: new Date(Date.now() - 60000),
    status: 'pending',
  },
  {
    id: 'req-2',
    taskId: 'task-005',
    taskDescription: '搜索最新技术文档',
    requiredCapabilities: ['web_search'],
    suggestedAgentType: 'researcher',
    priority: 'medium',
    estimatedTime: 180,
    createdAt: new Date(Date.now() - 120000),
    status: 'approved',
  },
]

// ============================================================================
// 子组件

/** 状态徽章 */
function StatusBadge({ status }: { status: SubAgentStatus }) {
  const config: Record<SubAgentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    pending: { label: '待处理', variant: 'secondary', className: 'bg-gray-100 text-gray-600' },
    initializing: { label: '初始化中', variant: 'default', className: 'bg-blue-100 text-blue-700' },
    running: { label: '运行中', variant: 'default', className: 'bg-green-100 text-green-700' },
    paused: { label: '已暂停', variant: 'secondary', className: 'bg-amber-100 text-amber-700' },
    completed: { label: '已完成', variant: 'default', className: 'bg-green-100 text-green-700' },
    failed: { label: '失败', variant: 'destructive', className: 'bg-red-100 text-red-700' },
    terminated: { label: '已终止', variant: 'outline', className: 'bg-gray-100 text-gray-500' },
  }
  
  const { label, className } = config[status]
  
  return (
    <Badge variant="outline" className={cn('text-xs', className)}>
      {label}
    </Badge>
  )
}

/** 子代理卡片 */
function SubAgentCard({ 
  agent, 
  onAction 
}: { 
  agent: SubAgentConfig
  onAction: (agentId: string, action: 'start' | 'pause' | 'stop') => void
}) {
  const executions = createMockExecutions().filter(e => e.agentId === agent.id)
  const runningExecutions = executions.filter(e => e.status === 'running')
  
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm">{agent.name}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {agent.type}
          </Badge>
        </div>
        <CardDescription className="text-xs">{agent.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div>
            <span className="text-muted-foreground">优先级: </span>
            <Badge variant="outline" className={cn(
              'text-xs',
              agent.priority === 'critical' ? 'bg-red-100 text-red-700' :
              agent.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              agent.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700'
            )}>
              {agent.priority}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">最大时间: </span>
            <span>{agent.maxExecutionTime}s</span>
          </div>
          <div>
            <span className="text-muted-foreground">最大迭代: </span>
            <span>{agent.maxIterations}</span>
          </div>
          <div>
            <span className="text-muted-foreground">活跃任务: </span>
            <span>{runningExecutions.length}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onAction(agent.id, 'start')}
            disabled={runningExecutions.length > 0}
          >
            <Play className="h-3 w-3 mr-1" />
            启动
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAction(agent.id, 'pause')}
            disabled={runningExecutions.length === 0}
          >
            <Pause className="h-3 w-3 mr-1" />
            暂停
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAction(agent.id, 'stop')}
            disabled={runningExecutions.length === 0}
          >
            <Square className="h-3 w-3 mr-1" />
            停止
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** 执行记录卡片 */
function ExecutionCard({ execution }: { execution: SubAgentExecution }) {
  const agent = createMockAgents().find(a => a.id === execution.agentId)
  
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-sm">{agent?.name || 'Unknown Agent'}</CardTitle>
          </div>
          <StatusBadge status={execution.status} />
        </div>
        <CardDescription className="text-xs">
          任务: {execution.taskId}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div>
            <span className="text-muted-foreground">开始: </span>
            <span>{new Date(execution.startTime).toLocaleTimeString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">时长: </span>
            <span>{execution.duration ? `${execution.duration}s` : '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">步骤: </span>
            <span>{execution.steps.filter(s => s.status === 'completed').length}/{execution.steps.length}</span>
          </div>
        </div>
        
        {execution.result && (
          <div className="text-xs bg-green-50 p-2 rounded mb-2">
            <span className="text-green-700 font-medium">结果: </span>
            <span className="text-green-600">{execution.result.output}</span>
          </div>
        )}
        
        {execution.error && (
          <div className="text-xs bg-red-50 p-2 rounded mb-2">
            <span className="text-red-700 font-medium">错误: </span>
            <span className="text-red-600">{execution.error}</span>
          </div>
        )}
        
        <div className="space-y-1">
          {execution.steps.map((step) => (
            <div key={step.id} className="flex items-center gap-2 text-xs">
              {step.status === 'completed' ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : step.status === 'running' ? (
                <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
              ) : step.status === 'failed' ? (
                <XCircle className="h-3 w-3 text-red-500" />
              ) : (
                <Clock className="h-3 w-3 text-gray-400" />
              )}
              <span className={cn(
                step.status === 'pending' && 'text-muted-foreground',
                step.status === 'running' && 'text-blue-700 font-medium',
                step.status === 'completed' && 'text-green-700',
                step.status === 'failed' && 'text-red-700'
              )}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/** 委派请求卡片 */
function DelegationRequestCard({ 
  request, 
  onApprove, 
  onReject 
}: { 
  request: DelegationRequest
  onApprove: (requestId: string) => void
  onReject: (requestId: string) => void
}) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">{request.taskDescription}</span>
          </div>
          <Badge variant="outline" className={cn(
            'text-xs',
            request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
            request.status === 'approved' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          )}>
            {request.status === 'pending' ? '待处理' : 
             request.status === 'approved' ? '已批准' : '已拒绝'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
          <div>
            <span>建议类型: </span>
            <Badge variant="outline" className="text-xs">{request.suggestedAgentType}</Badge>
          </div>
          <div>
            <span>预计时间: </span>
            <span>{request.estimatedTime}s</span>
          </div>
          <div>
            <span>优先级: </span>
            <Badge variant="outline" className={cn(
              'text-xs',
              request.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-700'
            )}>
              {request.priority}
            </Badge>
          </div>
          <div>
            <span>创建时间: </span>
            <span>{new Date(request.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>
        
        {request.status === 'pending' && (
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={() => onApprove(request.id)}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              批准
            </Button>
            <Button size="sm" variant="outline" onClick={() => onReject(request.id)}>
              <XCircle className="h-3 w-3 mr-1" />
              拒绝
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// 主组件

export function SubAgentManagement() {
  const [state, setState] = useState<SubAgentManagementState>({
    agents: createMockAgents(),
    executions: createMockExecutions(),
    delegationRequests: createMockDelegationRequests(),
    stats: {
      totalAgents: 3,
      activeAgents: 1,
      completedTasks: 1,
      failedTasks: 1,
      avgExecutionTime: 330,
      totalTokensUsed: 2500,
      delegationRequests: 2,
      autoDelegations: 5,
      manualDelegations: 3,
    },
    delegationStrategy: 'hybrid',
  })
  
  const [activeTab, setActiveTab] = useState<'agents' | 'executions' | 'delegation'>('agents')
  
  // 统计数据
  const stats = useMemo(() => {
    const activeAgents = state.agents.filter(a => 
      state.executions.some(e => e.agentId === a.id && e.status === 'running')
    )
    
    return {
      ...state.stats,
      totalAgents: state.agents.length,
      activeAgents: activeAgents.length,
      completedTasks: state.executions.filter(e => e.status === 'completed').length,
      failedTasks: state.executions.filter(e => e.status === 'failed').length,
    }
  }, [state])
  
  // 处理子代理操作
  const handleAgentAction = (agentId: string, action: 'start' | 'pause' | 'stop') => {
    console.log(`Agent ${agentId} action: ${action}`)
    // 实际实现中这里会调用后端 API
  }
  
  // 处理委派批准
  const handleApproveDelegation = (requestId: string) => {
    setState(prev => ({
      ...prev,
      delegationRequests: prev.delegationRequests.map(r => 
        r.id === requestId ? { ...r, status: 'approved' as const } : r
      ),
    }))
  }
  
  // 处理委派拒绝
  const handleRejectDelegation = (requestId: string) => {
    setState(prev => ({
      ...prev,
      delegationRequests: prev.delegationRequests.map(r => 
        r.id === requestId ? { ...r, status: 'rejected' as const } : r
      ),
    }))
  }
  
  // 创建新子代理
  const handleCreateAgent = () => {
    const newAgent: SubAgentConfig = {
      id: `sub-agent-${Date.now()}`,
      type: 'task_executor',
      name: `新子代理 ${state.agents.length + 1}`,
      description: '新创建的子代理',
      capabilities: defaultCapabilities,
      maxExecutionTime: 300,
      maxIterations: 10,
      memoryLimit: 512,
      priority: 'medium',
      parentAgentId: 'main-agent',
      createdAt: new Date(),
    }
    
    setState(prev => ({
      ...prev,
      agents: [...prev.agents, newAgent],
    }))
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">子代理管理</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={state.delegationStrategy}
              onValueChange={(value: DelegationStrategy) => 
                setState(prev => ({ ...prev, delegationStrategy: value }))
              }
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自动委派</SelectItem>
                <SelectItem value="manual">手动委派</SelectItem>
                <SelectItem value="hybrid">混合模式</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleCreateAgent}>
              <UserPlus className="h-3 w-3 mr-1" />
              新建
            </Button>
          </div>
        </div>
        <CardDescription>
          管理子代理的创建、委派和监控
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">活跃子代理</div>
            <div className="text-2xl font-bold text-blue-600">{stats.activeAgents}</div>
            <div className="text-xs text-muted-foreground">/ {stats.totalAgents} 总计</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">已完成任务</div>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <div className="text-xs text-muted-foreground">成功完成</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">失败任务</div>
            <div className="text-2xl font-bold text-red-600">{stats.failedTasks}</div>
            <div className="text-xs text-muted-foreground">需要关注</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">待处理委派</div>
            <div className="text-2xl font-bold text-amber-600">
              {state.delegationRequests.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-xs text-muted-foreground">等待决策</div>
          </Card>
        </div>
        
        {/* 标签页 */}
        <div className="flex border-b mb-4">
          <button
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'agents' 
                ? 'border-blue-500 text-blue-700' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('agents')}
          >
            子代理列表
          </button>
          <button
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'executions' 
                ? 'border-blue-500 text-blue-700' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('executions')}
          >
            执行记录
          </button>
          <button
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'delegation' 
                ? 'border-blue-500 text-blue-700' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('delegation')}
          >
            委派请求
          </button>
        </div>
        
        {/* 内容区域 */}
        <ScrollArea className="h-[400px] pr-4">
          {activeTab === 'agents' && (
            <div className="space-y-2">
              {state.agents.map(agent => (
                <SubAgentCard 
                  key={agent.id} 
                  agent={agent} 
                  onAction={handleAgentAction}
                />
              ))}
            </div>
          )}
          
          {activeTab === 'executions' && (
            <div className="space-y-2">
              {state.executions.map(execution => (
                <ExecutionCard key={execution.id} execution={execution} />
              ))}
            </div>
          )}
          
          {activeTab === 'delegation' && (
            <div className="space-y-2">
              {state.delegationRequests.map(request => (
                <DelegationRequestCard
                  key={request.id}
                  request={request}
                  onApprove={handleApproveDelegation}
                  onReject={handleRejectDelegation}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        <Separator className="my-4" />
        
        {/* 底部操作 */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            委派策略: <Badge variant="outline" className="text-xs">
              {state.delegationStrategy === 'auto' ? '自动' : 
               state.delegationStrategy === 'manual' ? '手动' : '混合'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-3 w-3 mr-1" />
              高级设置
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              刷新状态
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SubAgentManagement
