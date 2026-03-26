import { useState, useMemo, useCallback } from 'react'
import {
  Bot,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Zap,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  Info,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SETTINGS_SUB_AGENT_OPTIONS } from './subAgentSettingsFixtures'

// Types
export type SubAgentStatus = 'active' | 'inactive' | 'creating' | 'error'
export type SubAgentTemplate = 'general' | 'specialist' | 'analyst' | 'coordinator'

export interface SubAgent {
  id: string
  name: string
  description: string
  template: SubAgentTemplate
  status: SubAgentStatus
  role: string
  skills: string[]
  tools: string[]
  mcpTools: string[]
  permissions: string[]
  createdAt: string
  updatedAt: string
  lastUsed?: string
  usageCount: number
  enabled: boolean
}

export interface SubAgentTemplateInfo {
  type: SubAgentTemplate
  name: string
  description: string
  icon: React.ReactNode
  color: string
  defaultRole: string
  suggestedSkills: string[]
  suggestedTools: string[]
}

export interface SubAgentRegistryProps {
  className?: string
}

// Template configuration
const TEMPLATE_CONFIG: Record<SubAgentTemplate, SubAgentTemplateInfo> = {
  general: {
    type: 'general',
    name: '通用助手',
    description: '适用于日常任务和通用问题解答',
    icon: <Bot className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    defaultRole: '通用 AI 助手，负责日常对话和信息查询',
    suggestedSkills: ['对话', '搜索', '总结'],
    suggestedTools: ['web_search', 'calculator'],
  },
  specialist: {
    type: 'specialist',
    name: '领域专家',
    description: '专注于特定领域的高级分析和建议',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    defaultRole: '领域专家，提供专业知识和深度分析',
    suggestedSkills: ['专业知识', '数据分析', '报告生成'],
    suggestedTools: ['data_analysis', 'report_generator'],
  },
  analyst: {
    type: 'analyst',
    name: '数据分析师',
    description: '专注于数据处理和可视化',
    icon: <Settings className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    defaultRole: '数据分析师，执行数据处理和生成可视化报告',
    suggestedSkills: ['数据处理', '统计分析', '图表生成'],
    suggestedTools: ['data_processor', 'chart_maker', 'excel_export'],
  },
  coordinator: {
    type: 'coordinator',
    name: '任务协调员',
    description: '擅长分解复杂任务并协调执行',
    icon: <User className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    defaultRole: '任务协调员，将复杂任务分解为可执行的子任务',
    suggestedSkills: ['任务分解', '进度跟踪', '结果汇总'],
    suggestedTools: ['task_tracker', 'notifier', 'summarizer'],
  },
}

TEMPLATE_CONFIG.general.suggestedSkills = ['资料接入', '检索整理', '协作摘要']
TEMPLATE_CONFIG.general.suggestedTools = ['file_read', 'http_request']
TEMPLATE_CONFIG.specialist.suggestedSkills = ['文档起草', '结构抽取', '模板抽象']
TEMPLATE_CONFIG.specialist.suggestedTools = ['document_parse', 'workspace_stage_change']
TEMPLATE_CONFIG.analyst.suggestedSkills = ['规则校验', '结构抽取', '知识沉淀']
TEMPLATE_CONFIG.analyst.suggestedTools = ['knowledge_query', 'document_convert']
TEMPLATE_CONFIG.coordinator.suggestedSkills = ['跨部门摘要', '后续跟进', '知识沉淀']
TEMPLATE_CONFIG.coordinator.suggestedTools = ['agent_delegate', 'message_send', 'workspace_stage_change']

// Mock data
const createMockSubAgents = (): SubAgent[] => [
  {
    id: 'subagent-001',
    name: 'HR助手',
    description: '人力资源部门的专属助手，处理员工咨询和行政管理',
    template: 'specialist',
    status: 'active',
    role: 'HR 专家助手，提供员工信息查询、假期管理、考勤统计等功能',
    skills: ['员工查询', '假期计算', '考勤统计', '政策解读'],
    tools: ['hr_employee_query', 'hr_leave_calc', 'hr_attendance_stats'],
    mcpTools: ['mcp_hr_employee', 'mcp_hr_calendar'],
    permissions: ['hr_employee_read', 'hr_leave_read', 'hr_leave_write'],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-20T14:30:00Z',
    lastUsed: '2026-03-24T09:45:00Z',
    usageCount: 1256,
    enabled: true,
  },
  {
    id: 'subagent-002',
    name: '财务分析师',
    description: '财务部门的专属助手，处理财务分析和报表生成',
    template: 'analyst',
    status: 'active',
    role: '财务分析师，执行财务报表生成、预算分析和财务指标计算',
    skills: ['报表生成', '预算分析', '指标计算', '趋势分析'],
    tools: ['fin_report_generate', 'fin_budget_analysis', 'fin_metric_calc'],
    mcpTools: ['mcp_finance_reports'],
    permissions: ['fin_report_read', 'fin_report_write'],
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-03-18T11:20:00Z',
    lastUsed: '2026-03-24T08:30:00Z',
    usageCount: 892,
    enabled: true,
  },
  {
    id: 'subagent-003',
    name: '销售协调员',
    description: '销售部门的专属助手，协助客户跟进和销售流程管理',
    template: 'coordinator',
    status: 'active',
    role: '销售协调员，管理销售流程、跟进客户状态、协调内部审批',
    skills: ['客户跟进', '流程管理', '状态更新', '审批协调'],
    tools: ['sales_customer_follow', 'sales_pipeline_update', 'sales_approval_coord'],
    mcpTools: ['mcp_crm_customer'],
    permissions: ['sales_customer_read', 'sales_customer_write', 'sales_pipeline_read'],
    createdAt: '2026-02-20T14:00:00Z',
    updatedAt: '2026-03-22T16:45:00Z',
    lastUsed: '2026-03-24T10:15:00Z',
    usageCount: 678,
    enabled: true,
  },
  {
    id: 'subagent-004',
    name: 'IT支持助手',
    description: 'IT部门的专属助手，处理技术支持和工单管理',
    template: 'general',
    status: 'inactive',
    role: 'IT 支持助手，提供技术支持、工单管理和系统监控',
    skills: ['故障排查', '工单处理', '系统监控', '知识库查询'],
    tools: ['it_ticket_create', 'it_status_check', 'it_kb_search'],
    mcpTools: ['mcp_it_tickets'],
    permissions: ['it_ticket_read', 'it_ticket_write'],
    createdAt: '2026-03-01T11:00:00Z',
    updatedAt: '2026-03-10T09:30:00Z',
    usageCount: 234,
    enabled: false,
  },
]

const createCorrectiveSubAgents = (): SubAgent[] =>
  SETTINGS_SUB_AGENT_OPTIONS.length > 0
    ? SETTINGS_SUB_AGENT_OPTIONS.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        template: agent.template,
        status: agent.enabled ? 'active' : 'inactive',
        role: agent.defaultRole,
        skills: [...agent.suggestedSkills],
        tools: [...agent.suggestedTools],
        mcpTools: [...agent.suggestedMcpTools],
        permissions: [...agent.suggestedPermissions],
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        lastUsed: agent.lastUsed,
        usageCount: agent.usageCount,
        enabled: agent.enabled,
      }))
    : createMockSubAgents()

export function SubAgentRegistry({ className = '' }: SubAgentRegistryProps) {
  const [subAgents, setSubAgents] = useState<SubAgent[]>(createCorrectiveSubAgents)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [filterTemplate, setFilterTemplate] = useState<SubAgentTemplate | 'all'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgent | null>(null)
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<SubAgent>>({
    name: '',
    description: '',
    template: 'general',
    role: '',
    skills: [],
    tools: [],
    mcpTools: [],
    permissions: [],
  })

  // Filtered sub agents
  const filteredSubAgents = useMemo(() => {
    return subAgents.filter(agent => {
      const matchesSearch = searchQuery === '' ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'enabled' && agent.enabled) ||
        (filterStatus === 'disabled' && !agent.enabled)

      const matchesTemplate = filterTemplate === 'all' || agent.template === filterTemplate

      return matchesSearch && matchesStatus && matchesTemplate
    })
  }, [subAgents, searchQuery, filterStatus, filterTemplate])

  // Stats
  const stats = useMemo(() => ({
    total: subAgents.length,
    active: subAgents.filter(a => a.enabled).length,
    inactive: subAgents.filter(a => !a.enabled).length,
    byTemplate: Object.fromEntries(
      Object.keys(TEMPLATE_CONFIG).map(t => [
        t,
        subAgents.filter(a => a.template === t).length
      ])
    ),
  }), [subAgents])

  // Toggle agent expansion
  const toggleAgentExpansion = useCallback((agentId: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev)
      if (next.has(agentId)) {
        next.delete(agentId)
      } else {
        next.add(agentId)
      }
      return next
    })
  }, [])

  // Toggle agent enabled
  const toggleAgentEnabled = useCallback((agentId: string) => {
    setSubAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, enabled: !a.enabled, updatedAt: new Date().toISOString() } : a
    ))
  }, [])

  // Delete agent
  const deleteAgent = useCallback((agentId: string) => {
    setSubAgents(prev => prev.filter(a => a.id !== agentId))
  }, [])

  // Duplicate agent
  const duplicateAgent = useCallback((agent: SubAgent) => {
    const newAgent: SubAgent = {
      ...agent,
      id: `subagent-${Date.now()}`,
      name: `${agent.name} (副本)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    }
    setSubAgents(prev => [...prev, newAgent])
  }, [])

  // Open create dialog
  const handleOpenCreateDialog = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      template: 'general',
      role: TEMPLATE_CONFIG.general.defaultRole,
      skills: [...TEMPLATE_CONFIG.general.suggestedSkills],
      tools: [...TEMPLATE_CONFIG.general.suggestedTools],
      mcpTools: [],
      permissions: [],
    })
    setShowCreateDialog(true)
  }, [])

  // Open edit dialog
  const handleOpenEditDialog = useCallback((agent: SubAgent) => {
    setSelectedSubAgent(agent)
    setFormData({
      name: agent.name,
      description: agent.description,
      template: agent.template,
      role: agent.role,
      skills: [...agent.skills],
      tools: [...agent.tools],
      mcpTools: [...agent.mcpTools],
      permissions: [...agent.permissions],
    })
    setShowEditDialog(true)
  }, [])

  // Handle create
  const handleCreate = useCallback(async () => {
    if (!formData.name?.trim()) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    const newAgent: SubAgent = {
      id: `subagent-${Date.now()}`,
      name: formData.name || '',
      description: formData.description || '',
      template: formData.template || 'general',
      role: formData.role || '',
      skills: formData.skills || [],
      tools: formData.tools || [],
      mcpTools: formData.mcpTools || [],
      permissions: formData.permissions || [],
      status: 'active',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    }

    setSubAgents(prev => [...prev, newAgent])
    setShowCreateDialog(false)
    setIsSubmitting(false)
  }, [formData])

  // Handle edit
  const handleEdit = useCallback(async () => {
    if (!selectedSubAgent || !formData.name?.trim()) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    setSubAgents(prev => prev.map(a =>
      a.id === selectedSubAgent.id
        ? {
            ...a,
            name: formData.name || a.name,
            description: formData.description || a.description,
            template: formData.template || a.template,
            role: formData.role || a.role,
            skills: formData.skills || a.skills,
            tools: formData.tools || a.tools,
            mcpTools: formData.mcpTools || a.mcpTools,
            permissions: formData.permissions || a.permissions,
            updatedAt: new Date().toISOString(),
          }
        : a
    ))

    setShowEditDialog(false)
    setSelectedSubAgent(null)
    setIsSubmitting(false)
  }, [selectedSubAgent, formData])

  // Handle template change
  const handleTemplateChange = useCallback((template: SubAgentTemplate) => {
    const templateInfo = TEMPLATE_CONFIG[template]
    setFormData(prev => ({
      ...prev,
      template,
      role: templateInfo.defaultRole,
      skills: [...templateInfo.suggestedSkills],
      tools: [...templateInfo.suggestedTools],
    }))
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Sub-Agent 注册表
          </h2>
          <p className="text-muted-foreground">
            创建和管理 Sub-Agent，支持模板化创建和生命周期控制
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          创建 Sub-Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">总 Sub-Agent 数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-xs text-muted-foreground">已启用</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
                <div className="text-xs text-muted-foreground">已禁用</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{Object.values(stats.byTemplate).reduce((a, b) => a + b, 0)}</div>
                <div className="text-xs text-muted-foreground">模板类型</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索 Sub-Agent..."
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
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              >
                <option value="all">全部状态</option>
                <option value="enabled">已启用</option>
                <option value="disabled">已禁用</option>
              </select>
              <select
                className="text-sm border rounded px-2 py-1.5"
                value={filterTemplate}
                onChange={(e) => setFilterTemplate(e.target.value as SubAgentTemplate | 'all')}
              >
                <option value="all">全部模板</option>
                {Object.entries(TEMPLATE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              setSearchQuery('')
              setFilterStatus('all')
              setFilterTemplate('all')
            }}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sub-Agent List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {filteredSubAgents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">没有找到匹配的 Sub-Agent</p>
              </CardContent>
            </Card>
          ) : (
            filteredSubAgents.map(agent => {
              const templateInfo = TEMPLATE_CONFIG[agent.template]
              const isExpanded = expandedAgents.has(agent.id)

              return (
                <Card key={agent.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => toggleAgentExpansion(agent.id)}
                          className="mt-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{agent.name}</span>
                            <Badge className={templateInfo.color}>
                              {templateInfo.icon}
                              <span className="ml-1">{templateInfo.name}</span>
                            </Badge>
                            {agent.enabled ? (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                启用
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 border-gray-300">
                                <XCircle className="h-3 w-3 mr-1" />
                                禁用
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {agent.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              创建于 {new Date(agent.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              使用 {agent.usageCount} 次
                            </span>
                            {agent.lastUsed && (
                              <span className="flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                上次使用 {new Date(agent.lastUsed).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleAgentEnabled(agent.id)}
                              >
                                {agent.enabled ? (
                                  <ToggleRight className="h-4 w-4 text-green-500" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {agent.enabled ? '禁用' : '启用'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(agent)}>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateAgent(agent)}>
                              <Copy className="h-4 w-4 mr-2" />
                              复制
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => deleteAgent(agent.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pl-7 space-y-4 border-t pt-4">
                        {/* Role */}
                        <div>
                          <div className="text-sm font-medium mb-1 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            角色定义
                          </div>
                          <div className="text-sm bg-muted/50 p-3 rounded-md">
                            {agent.role}
                          </div>
                        </div>

                        {/* Skills */}
                        <div>
                          <div className="text-sm font-medium mb-1">技能</div>
                          <div className="flex flex-wrap gap-1">
                            {agent.skills.map(skill => (
                              <Badge key={skill} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Tools */}
                        <div>
                          <div className="text-sm font-medium mb-1">工具</div>
                          <div className="flex flex-wrap gap-1">
                            {agent.tools.map(tool => (
                              <Badge key={tool} variant="outline">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* MCP Tools */}
                        {agent.mcpTools.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-1">MCP 工具</div>
                            <div className="flex flex-wrap gap-1">
                              {agent.mcpTools.map(tool => (
                                <Badge key={tool} variant="outline" className="border-blue-300 text-blue-600">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Permissions */}
                        <div>
                          <div className="text-sm font-medium mb-1">权限</div>
                          <div className="flex flex-wrap gap-1">
                            {agent.permissions.map(perm => (
                              <Badge key={perm} variant="outline" className="border-orange-300 text-orange-600">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>创建 Sub-Agent</DialogTitle>
            <DialogDescription>
              选择模板并配置 Sub-Agent 的基本属性
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 p-1">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>选择模板</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(TEMPLATE_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        formData.template === key
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleTemplateChange(key as SubAgentTemplate)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`p-1 rounded ${config.color}`}>
                          {config.icon}
                        </span>
                        <span className="font-medium">{config.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">名称</Label>
                <Input
                  id="name"
                  placeholder="输入 Sub-Agent 名称"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  placeholder="输入 Sub-Agent 描述"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">角色定义</Label>
                <Textarea
                  id="role"
                  placeholder="定义 Sub-Agent 的角色和行为"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label>技能 (逗号分隔)</Label>
                <Input
                  placeholder="输入技能，用逗号分隔"
                  value={formData.skills?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                />
              </div>

              {/* Tools */}
              <div className="space-y-2">
                <Label>工具 (逗号分隔)</Label>
                <Input
                  placeholder="输入工具 ID，用逗号分隔"
                  value={formData.tools?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tools: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name?.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>编辑 Sub-Agent</DialogTitle>
            <DialogDescription>
              修改 Sub-Agent 的配置和属性
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 p-1">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">名称</Label>
                <Input
                  id="edit-name"
                  placeholder="输入 Sub-Agent 名称"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">描述</Label>
                <Textarea
                  id="edit-description"
                  placeholder="输入 Sub-Agent 描述"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="edit-role">角色定义</Label>
                <Textarea
                  id="edit-role"
                  placeholder="定义 Sub-Agent 的角色和行为"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label>技能 (逗号分隔)</Label>
                <Input
                  placeholder="输入技能，用逗号分隔"
                  value={formData.skills?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                />
              </div>

              {/* Tools */}
              <div className="space-y-2">
                <Label>工具 (逗号分隔)</Label>
                <Input
                  placeholder="输入工具 ID，用逗号分隔"
                  value={formData.tools?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tools: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                />
              </div>

              {/* MCP Tools */}
              <div className="space-y-2">
                <Label>MCP 工具 (逗号分隔)</Label>
                <Input
                  placeholder="输入 MCP 工具 ID，用逗号分隔"
                  value={formData.mcpTools?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    mcpTools: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                />
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <Label>权限 (逗号分隔)</Label>
                <Input
                  placeholder="输入权限 ID，用逗号分隔"
                  value={formData.permissions?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    permissions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name?.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
