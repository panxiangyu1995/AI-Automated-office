import { useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  MessagesSquare,
  Pause,
  Play,
  RefreshCw,
  Settings,
  ShieldCheck,
  Square,
  Target,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  SETTINGS_SKILLS,
  SETTINGS_DEPARTMENTS,
  SETTINGS_KNOWLEDGE_BASES,
  SETTINGS_SUB_AGENT_OPTIONS,
  SHARED_SKILL_SOURCE_META,
} from '@/features/settings/components/subAgentSettingsFixtures'

export type SubAgentStatus = 'pending' | 'initializing' | 'running' | 'paused' | 'completed' | 'failed' | 'terminated'
export type DelegationStrategy = 'auto' | 'manual' | 'hybrid'
export type SubAgentType = 'document_drafter' | 'resource_curator' | 'policy_checker' | 'collaboration_coordinator'

export interface SubAgentCapability {
  id: string
  name: string
  description: string
  enabled: boolean
  source: 'tool' | 'platform_skill' | 'department_skill' | 'user_skill' | 'mcp' | 'policy'
}

export interface SubAgentConfig {
  id: string
  type: SubAgentType
  name: string
  description?: string
  capabilities: SubAgentCapability[]
  departmentBoundaries: string[]
  knowledgeScopes: string[]
  maxExecutionTime: number
  maxIterations: number
  memoryLimit: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  parentAgentId: string
  ownerUserId: string
  createdAt: Date
}

export interface ExecutionStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  output?: string
}

export interface SubAgentResult {
  success: boolean
  output: string
  artifacts?: string[]
  metrics: { stepsCompleted: number; totalSteps: number; tokensUsed: number; toolsCalled: number }
}

export interface SubAgentExecution {
  id: string
  agentId: string
  taskId: string
  taskLabel: string
  status: SubAgentStatus
  startTime: Date
  endTime?: Date
  duration?: number
  steps: ExecutionStep[]
  result?: SubAgentResult
  error?: string
}

export interface DelegationRequest {
  id: string
  taskId: string
  taskDescription: string
  requiredCapabilities: string[]
  departmentBoundaries: string[]
  knowledgeScopes: string[]
  suggestedAgentType: SubAgentType
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedTime: number
  createdAt: Date
  status: 'pending' | 'approved' | 'rejected' | 'delegated'
}

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

export interface SubAgentManagementState {
  agents: SubAgentConfig[]
  executions: SubAgentExecution[]
  delegationRequests: DelegationRequest[]
  stats: SubAgentStats
  delegationStrategy: DelegationStrategy
}

const TYPE_LABELS: Record<SubAgentType, string> = {
  document_drafter: '文档起草',
  resource_curator: '资料整理',
  policy_checker: '规则校验',
  collaboration_coordinator: '协作协调',
}

const TYPE_ICONS = {
  document_drafter: FileText,
  resource_curator: FolderKanban,
  policy_checker: ShieldCheck,
  collaboration_coordinator: MessagesSquare,
} satisfies Record<SubAgentType, typeof FileText>

const DEPARTMENT_NAMES = Object.fromEntries(SETTINGS_DEPARTMENTS.map((item) => [item.id, item.name]))
const KNOWLEDGE_NAMES = Object.fromEntries(SETTINGS_KNOWLEDGE_BASES.map((item) => [item.id, item.name]))
const TYPE_BY_AGENT_ID: Record<string, SubAgentType> = {
  'subagent-001': 'document_drafter',
  'subagent-002': 'resource_curator',
  'subagent-003': 'policy_checker',
  'subagent-004': 'collaboration_coordinator',
}

const SCOPES: Record<string, { departments: string[]; knowledge: string[] }> = {
  'subagent-001': { departments: ['dept-tender', 'dept-sales'], knowledge: ['kb-bid-archive', 'kb-template'] },
  'subagent-002': { departments: ['dept-tender', 'dept-management'], knowledge: ['kb-bid-archive', 'kb-collaboration'] },
  'subagent-003': { departments: ['dept-tender', 'dept-legal', 'dept-finance'], knowledge: ['kb-policy', 'kb-template'] },
  'subagent-004': { departments: ['dept-tender', 'dept-finance', 'dept-legal', 'dept-management'], knowledge: ['kb-collaboration', 'kb-policy'] },
}

function mapSkillCapabilitySource(source: typeof SETTINGS_SKILLS[number]['source']): SubAgentCapability['source'] {
  if (source === 'platform_builtin') return 'platform_skill'
  if (source === 'department_builtin') return 'department_skill'
  return 'user_skill'
}

function getCapabilityBadgeClass(source: SubAgentCapability['source']) {
  if (source === 'tool') return 'bg-slate-100 text-slate-700'
  if (source === 'platform_skill') return SHARED_SKILL_SOURCE_META.platform_builtin.className
  if (source === 'department_skill') return SHARED_SKILL_SOURCE_META.department_builtin.className
  if (source === 'user_skill') return SHARED_SKILL_SOURCE_META.user_installed.className
  if (source === 'mcp') return 'bg-blue-100 text-blue-700'
  return 'bg-amber-100 text-amber-700'
}

const createCapabilities = (agentId: string): SubAgentCapability[] => {
  const option = SETTINGS_SUB_AGENT_OPTIONS.find((item) => item.id === agentId)
  if (!option) return []
  return [
    ...option.suggestedTools.map((name) => ({ id: `${agentId}-${name}`, name, description: 'Atomic tool', enabled: true, source: 'tool' as const })),
    ...option.suggestedSkills
      .map((name) => SETTINGS_SKILLS.find((item) => item.name === name || item.id.includes(name.replace(/-/g, '_'))))
      .filter((item): item is typeof SETTINGS_SKILLS[number] => Boolean(item))
      .map((skill) => ({
        id: `${agentId}-${skill.id}`,
        name: skill.name,
        description: SHARED_SKILL_SOURCE_META[skill.source].label,
        enabled: true,
        source: mapSkillCapabilitySource(skill.source),
      })),
    ...option.suggestedMcpTools.map((name) => ({ id: `${agentId}-${name}`, name, description: 'MCP binding', enabled: true, source: 'mcp' as const })),
    ...option.suggestedPermissions.map((name) => ({ id: `${agentId}-${name}`, name, description: 'Policy boundary', enabled: true, source: 'policy' as const })),
  ]
}

const createAgents = (): SubAgentConfig[] =>
  SETTINGS_SUB_AGENT_OPTIONS.map((option) => {
    const scope = SCOPES[option.id]
    const type = TYPE_BY_AGENT_ID[option.id] ?? 'document_drafter'
    return {
      id: option.id,
      type,
      name: option.name,
      description: option.description,
      capabilities: createCapabilities(option.id),
      departmentBoundaries: scope.departments.map((id) => DEPARTMENT_NAMES[id] ?? id),
      knowledgeScopes: scope.knowledge.map((id) => KNOWLEDGE_NAMES[id] ?? id),
      maxExecutionTime: type === 'document_drafter' ? 480 : type === 'resource_curator' ? 360 : type === 'policy_checker' ? 300 : 240,
      maxIterations: type === 'document_drafter' ? 12 : type === 'resource_curator' ? 10 : type === 'policy_checker' ? 9 : 8,
      memoryLimit: type === 'document_drafter' ? 768 : type === 'resource_curator' ? 640 : type === 'policy_checker' ? 512 : 384,
      priority: type === 'resource_curator' || type === 'collaboration_coordinator' ? 'medium' : 'high',
      parentAgentId: 'main-agent:user-001',
      ownerUserId: 'user-001',
      createdAt: new Date(option.createdAt),
    }
  })

const createExecutions = (): SubAgentExecution[] => [
  {
    id: 'exec-001',
    agentId: 'subagent-001',
    taskId: 'task-bid-outline',
    taskLabel: '起草新标书章节草稿',
    status: 'completed',
    startTime: new Date(Date.now() - 22 * 60 * 1000),
    endTime: new Date(Date.now() - 16 * 60 * 1000),
    duration: 360,
    steps: [
      { id: 'step-001', name: '读取招标要求与历史模板', status: 'completed' },
      { id: 'step-002', name: '生成章节结构与候选正文', status: 'completed' },
      { id: 'step-003', name: '写入工作区暂存变更', status: 'completed', output: '已生成 6 条候选变更。' },
    ],
    result: { success: true, output: '已产出标书大纲与正文候选内容。', artifacts: ['tender-outline.md'], metrics: { stepsCompleted: 3, totalSteps: 3, tokensUsed: 2840, toolsCalled: 6 } },
  },
  {
    id: 'exec-002',
    agentId: 'subagent-002',
    taskId: 'task-resource-brief',
    taskLabel: '整理历史标书与资质材料',
    status: 'running',
    startTime: new Date(Date.now() - 8 * 60 * 1000),
    steps: [
      { id: 'step-004', name: '读取云端资料目录', status: 'completed' },
      { id: 'step-005', name: '清洗投标要求与附件引用', status: 'running' },
      { id: 'step-006', name: '生成结构化资料清单', status: 'pending' },
    ],
  },
  {
    id: 'exec-003',
    agentId: 'subagent-003',
    taskId: 'task-policy-check',
    taskLabel: '校验敏感字段与规则约束',
    status: 'failed',
    startTime: new Date(Date.now() - 13 * 60 * 1000),
    endTime: new Date(Date.now() - 11 * 60 * 1000),
    duration: 120,
    steps: [
      { id: 'step-007', name: '载入制度与模板规则', status: 'completed' },
      { id: 'step-008', name: '检查权限受限字段', status: 'failed', output: '当前用户无受限财务字段读取权限。' },
    ],
    error: 'Permission boundary blocked access to sensitive pricing details.',
  },
]

const createDelegations = (): DelegationRequest[] => [
  {
    id: 'req-001',
    taskId: 'delegation-outline',
    taskDescription: '从新的招标要求中生成可审阅的标书大纲',
    requiredCapabilities: ['document-draft', 'workspace_stage_change'],
    departmentBoundaries: ['招投标部', '销售部'],
    knowledgeScopes: ['历史标书知识库', '模板资产库'],
    suggestedAgentType: 'document_drafter',
    priority: 'high',
    estimatedTime: 180,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    status: 'pending',
  },
  {
    id: 'req-002',
    taskId: 'delegation-resource-intake',
    taskDescription: '把本地旧标书和云端资料整理成统一引用包',
    requiredCapabilities: ['resource-intake', 'file_read', 'document_convert'],
    departmentBoundaries: ['招投标部', '管理层'],
    knowledgeScopes: ['历史标书知识库', '协作摘要知识库'],
    suggestedAgentType: 'resource_curator',
    priority: 'medium',
    estimatedTime: 240,
    createdAt: new Date(Date.now() - 11 * 60 * 1000),
    status: 'approved',
  },
]

function StatusBadge({ status }: { status: SubAgentStatus }) {
  const classes: Record<SubAgentStatus, string> = {
    pending: 'bg-slate-100 text-slate-700',
    initializing: 'bg-blue-100 text-blue-700',
    running: 'bg-emerald-100 text-emerald-700',
    paused: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
    terminated: 'bg-slate-100 text-slate-600',
  }
  return <Badge variant="outline" className={cn('text-xs', classes[status])}>{status}</Badge>
}

export function SubAgentManagement() {
  const [state, setState] = useState<SubAgentManagementState>({
    agents: createAgents(),
    executions: createExecutions(),
    delegationRequests: createDelegations(),
    stats: { totalAgents: 0, activeAgents: 0, completedTasks: 0, failedTasks: 0, avgExecutionTime: 0, totalTokensUsed: 0, delegationRequests: 0, autoDelegations: 6, manualDelegations: 4 },
    delegationStrategy: 'hybrid',
  })
  const [activeTab, setActiveTab] = useState<'agents' | 'executions' | 'delegation'>('agents')

  const stats = useMemo(() => {
    const completed = state.executions.filter((item) => item.status === 'completed')
    const totalTokens = completed.reduce((sum, item) => sum + (item.result?.metrics.tokensUsed ?? 0), 0)
    const totalDuration = completed.reduce((sum, item) => sum + (item.duration ?? 0), 0)
    const activeAgents = new Set(state.executions.filter((item) => item.status === 'running').map((item) => item.agentId)).size
    return {
      ...state.stats,
      totalAgents: state.agents.length,
      activeAgents,
      completedTasks: completed.length,
      failedTasks: state.executions.filter((item) => item.status === 'failed').length,
      avgExecutionTime: completed.length ? Math.round(totalDuration / completed.length) : 0,
      totalTokensUsed: totalTokens,
      delegationRequests: state.delegationRequests.length,
    }
  }, [state])

  const handleAgentAction = (agentId: string, action: 'start' | 'pause' | 'stop') => {
    setState((prev) => {
      if (action === 'start' && !prev.executions.some((item) => item.agentId === agentId && item.status === 'running')) {
        const execution: SubAgentExecution = {
          id: `exec-${Date.now()}`,
          agentId,
          taskId: `task-${Date.now()}`,
          taskLabel: '新的企业业务委派任务',
          status: 'running',
          startTime: new Date(),
          steps: [
            { id: `step-${Date.now()}-1`, name: '读取部门上下文', status: 'completed' },
            { id: `step-${Date.now()}-2`, name: '执行候选内容生成', status: 'running' },
            { id: `step-${Date.now()}-3`, name: '写入工作区暂存变更', status: 'pending' },
          ],
        }
        return { ...prev, executions: [execution, ...prev.executions] }
      }
      return {
        ...prev,
        executions: prev.executions.map((item) => {
          if (item.agentId !== agentId || item.status !== 'running') return item
          if (action === 'pause') return { ...item, status: 'paused' as const }
          if (action === 'stop') return { ...item, status: 'terminated' as const, endTime: new Date() }
          return item
        }),
      }
    })
  }

  const handleRequest = (requestId: string, status: 'approved' | 'rejected') => {
    setState((prev) => ({
      ...prev,
      delegationRequests: prev.delegationRequests.map((item) => item.id === requestId ? { ...item, status } : item),
    }))
  }

  const handleCreateAgent = () => {
    setState((prev) => ({
      ...prev,
      agents: [{
        id: `subagent-${Date.now()}`,
        type: 'document_drafter',
        name: `自定义子 Agent ${prev.agents.length + 1}`,
        description: '当前用户主 Agent 下的新能力子 Agent，负责可审阅内容产出。',
        capabilities: [
          { id: `cap-${Date.now()}-1`, name: 'file_read', description: 'Atomic tool', enabled: true, source: 'tool' },
          { id: `cap-${Date.now()}-2`, name: 'document-draft', description: '平台内置 Skills', enabled: true, source: 'platform_skill' },
        ],
        departmentBoundaries: ['招投标部'],
        knowledgeScopes: ['模板资产库'],
        maxExecutionTime: 300,
        maxIterations: 8,
        memoryLimit: 512,
        priority: 'medium',
        parentAgentId: 'main-agent:user-001',
        ownerUserId: 'user-001',
        createdAt: new Date(),
      }, ...prev.agents],
    }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--ao-button.background)]" />
              <CardTitle className="text-lg">Sub-Agent 管理</CardTitle>
            </div>
            <CardDescription>用户主 Agent 在自己的权限、部门边界和知识范围内配置子 Agent。</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={state.delegationStrategy} onValueChange={(value: DelegationStrategy) => setState((prev) => ({ ...prev, delegationStrategy: value }))}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自动委派</SelectItem>
                <SelectItem value="manual">手动委派</SelectItem>
                <SelectItem value="hybrid">混合委派</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleCreateAgent}><UserPlus className="mr-1 h-3 w-3" />新建</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="p-3"><div className="text-xs text-muted-foreground">活跃子 Agent</div><div className="text-2xl font-bold text-[var(--ao-button.background)]">{stats.activeAgents}</div><div className="text-xs text-muted-foreground">/ {stats.totalAgents} 总数</div></Card>
          <Card className="p-3"><div className="text-xs text-muted-foreground">已完成任务</div><div className="text-2xl font-bold text-emerald-600">{stats.completedTasks}</div><div className="text-xs text-muted-foreground">平均 {stats.avgExecutionTime}s</div></Card>
          <Card className="p-3"><div className="text-xs text-muted-foreground">失败任务</div><div className="text-2xl font-bold text-red-600">{stats.failedTasks}</div><div className="text-xs text-muted-foreground">由权限或执行异常触发</div></Card>
          <Card className="p-3"><div className="text-xs text-muted-foreground">累计 Tokens</div><div className="text-2xl font-bold text-amber-600">{stats.totalTokensUsed}</div><div className="text-xs text-muted-foreground">仅统计已完成执行</div></Card>
        </div>

        <div className="mb-4 flex border-b">
          {(['agents', 'executions', 'delegation'] as const).map((tab) => (
            <button key={tab} type="button" className={cn('border-b-2 px-4 py-2 text-sm font-medium transition-colors', activeTab === tab ? 'border-[var(--ao-button.background)] text-[var(--ao-button.background)]' : 'border-transparent text-muted-foreground hover:text-foreground')} onClick={() => setActiveTab(tab)}>
              {tab === 'agents' ? '子 Agent 列表' : tab === 'executions' ? '执行记录' : '委派请求'}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[420px] pr-4">
          {activeTab === 'agents' && state.agents.map((agent) => {
            const Icon = TYPE_ICONS[agent.type]
            const activeExecution = state.executions.find((item) => item.agentId === agent.id && item.status === 'running')
            return (
              <Card key={agent.id} className="mb-3">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-[var(--ao-button.background)]" />
                        <CardTitle className="text-sm">{agent.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">{TYPE_LABELS[agent.type]}</Badge>
                      </div>
                      <CardDescription className="text-xs">{agent.description}</CardDescription>
                    </div>
                    <StatusBadge status={activeExecution ? 'running' : 'pending'} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                    <div><span className="font-medium text-foreground">优先级:</span> {agent.priority}</div>
                    <div><span className="font-medium text-foreground">最长执行:</span> {agent.maxExecutionTime}s</div>
                    <div><span className="font-medium text-foreground">最大迭代:</span> {agent.maxIterations}</div>
                    <div><span className="font-medium text-foreground">内存上限:</span> {agent.memoryLimit}MB</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-medium text-foreground">部门边界</span>{agent.departmentBoundaries.map((item) => <Badge key={`${agent.id}-${item}`} variant="outline">{item}</Badge>)}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-medium text-foreground">知识范围</span>{agent.knowledgeScopes.map((item) => <Badge key={`${agent.id}-${item}`} variant="outline" className="border-blue-200 text-blue-700">{item}</Badge>)}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-medium text-foreground">能力来源</span>{agent.capabilities.slice(0, 6).map((item) => <Badge key={item.id} variant="secondary" className={cn(getCapabilityBadgeClass(item.source))}>{item.name}</Badge>)}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleAgentAction(agent.id, 'start')} disabled={Boolean(activeExecution)}><Play className="mr-1 h-3 w-3" />启动</Button>
                    <Button size="sm" variant="outline" onClick={() => handleAgentAction(agent.id, 'pause')} disabled={!activeExecution}><Pause className="mr-1 h-3 w-3" />暂停</Button>
                    <Button size="sm" variant="outline" onClick={() => handleAgentAction(agent.id, 'stop')} disabled={!activeExecution}><Square className="mr-1 h-3 w-3" />停止</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {activeTab === 'executions' && state.executions.map((item) => (
            <Card key={item.id} className="mb-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--ao-button.background)]" /><CardTitle className="text-sm">{state.agents.find((agent) => agent.id === item.agentId)?.name ?? item.agentId}</CardTitle></div>
                  <StatusBadge status={item.status} />
                </div>
                <CardDescription className="text-xs">{item.taskLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div><span className="font-medium text-foreground">开始:</span> {item.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div><span className="font-medium text-foreground">时长:</span> {item.duration ? `${item.duration}s` : '进行中'}</div>
                  <div><span className="font-medium text-foreground">步骤:</span> {item.steps.filter((step) => step.status === 'completed').length}/{item.steps.length}</div>
                </div>
                {item.result && <div className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-700">{item.result.output}</div>}
                {item.error && <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">{item.error}</div>}
                <div className="space-y-1.5">{item.steps.map((step) => <div key={step.id} className="flex items-start gap-2 text-xs">{step.status === 'completed' ? <CheckCircle2 className="mt-0.5 h-3 w-3 text-emerald-500" /> : step.status === 'running' ? <RefreshCw className="mt-0.5 h-3 w-3 animate-spin text-blue-500" /> : step.status === 'failed' ? <XCircle className="mt-0.5 h-3 w-3 text-red-500" /> : <Clock3 className="mt-0.5 h-3 w-3 text-slate-400" />}<div><div className={cn(step.status === 'pending' && 'text-muted-foreground', step.status === 'running' && 'font-medium text-blue-700', step.status === 'completed' && 'text-emerald-700', step.status === 'failed' && 'text-red-700')}>{step.name}</div>{step.output && <div className="text-muted-foreground">{step.output}</div>}</div></div>)}</div>
              </CardContent>
            </Card>
          ))}

          {activeTab === 'delegation' && state.delegationRequests.map((item) => (
            <Card key={item.id} className="mb-3">
              <CardContent className="space-y-3 pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2"><Target className="h-4 w-4 text-amber-500" /><span className="text-sm font-medium">{item.taskDescription}</span></div>
                    <div className="text-xs text-muted-foreground">预计执行 {item.estimatedTime}s，建议委派给 {TYPE_LABELS[item.suggestedAgentType]}</div>
                  </div>
                  <Badge variant="outline" className={cn('text-xs', item.status === 'pending' && 'bg-amber-100 text-amber-700', item.status === 'approved' && 'bg-emerald-100 text-emerald-700', item.status === 'rejected' && 'bg-red-100 text-red-700')}>{item.status}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-medium text-foreground">需要能力</span>{item.requiredCapabilities.map((value) => <Badge key={`${item.id}-${value}`} variant="secondary">{value}</Badge>)}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-medium text-foreground">部门边界</span>{item.departmentBoundaries.map((value) => <Badge key={`${item.id}-${value}`} variant="outline">{value}</Badge>)}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-medium text-foreground">知识范围</span>{item.knowledgeScopes.map((value) => <Badge key={`${item.id}-${value}`} variant="outline" className="border-blue-200 text-blue-700">{value}</Badge>)}</div>
                {item.status === 'pending' && <div className="flex gap-2"><Button size="sm" onClick={() => handleRequest(item.id, 'approved')}><CheckCircle2 className="mr-1 h-3 w-3" />批准</Button><Button size="sm" variant="outline" onClick={() => handleRequest(item.id, 'rejected')}><XCircle className="mr-1 h-3 w-3" />拒绝</Button></div>}
              </CardContent>
            </Card>
          ))}
        </ScrollArea>

        <Separator className="my-4" />
        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><span>委派策略</span><Badge variant="outline">{state.delegationStrategy === 'auto' ? '自动' : state.delegationStrategy === 'manual' ? '手动' : '混合'}</Badge></div>
          <div className="flex gap-2"><Button variant="outline" size="sm"><Settings className="mr-1 h-3 w-3" />高级设置</Button><Button variant="outline" size="sm"><RefreshCw className="mr-1 h-3 w-3" />刷新状态</Button></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SubAgentManagement
