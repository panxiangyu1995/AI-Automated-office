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
import { cn } from '@/lib/utils'
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
    color: 'text-[var(--ao-button.linkForeground)] bg-[var(--ao-button.linkForeground)]/10 border border-[var(--ao-button.linkForeground)]/30',
    defaultRole: '通用 AI 助手，负责日常对话和信息查询',
    suggestedSkills: ['对话', '搜索', '总结'],
    suggestedTools: ['web_search', 'calculator'],
  },
  specialist: {
    type: 'specialist',
    name: '领域专家',
    description: '专注于特定领域的高级分析和建议',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-[var(--ao-infoForeground)] bg-[var(--ao-infoForeground)]/10 border border-[var(--ao-infoForeground)]/30',
    defaultRole: '领域专家，提供专业知识和深度分析',
    suggestedSkills: ['专业知识', '数据分析', '报告生成'],
    suggestedTools: ['data_analysis', 'report_generator'],
  },
  analyst: {
    type: 'analyst',
    name: '数据分析师',
    description: '专注于数据处理和可视化',
    icon: <Settings className="h-4 w-4" />,
    color: 'text-[var(--ao-successForeground)] bg-[var(--ao-successForeground)]/10 border border-[var(--ao-successForeground)]/30',
    defaultRole: '数据分析师，执行数据处理和生成可视化报告',
    suggestedSkills: ['数据处理', '统计分析', '图表生成'],
    suggestedTools: ['data_processor', 'chart_maker', 'excel_export'],
  },
  coordinator: {
    type: 'coordinator',
    name: '任务协调员',
    description: '擅长分解复杂任务并协调执行',
    icon: <User className="h-4 w-4" />,
    color: 'text-[var(--ao-warningForeground)] bg-[var(--ao-warningForeground)]/10 border border-[var(--ao-warningForeground)]/30',
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

const createCorrectiveSubAgents = (): SubAgent[] =>
  SETTINGS_SUB_AGENT_OPTIONS.map((agent) => ({
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
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--ao-foreground)' }}>
            <Bot className="h-6 w-6" style={{ color: 'var(--ao-successForeground)' }} />
            Sub-Agent 注册表
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
            管理当前用户主 Agent 挂载的 Sub-Agent 配置，部门只作为上下文、权限和能力边界出现。
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          创建 Sub-Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--ao-foreground)' }}>{stats.total}</div>
                <div className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>当前主 Agent 的 Sub-Agent</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--ao-successForeground)' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--ao-successForeground)' }}>{stats.active}</div>
                <div className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>已启用</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>{stats.inactive}</div>
                <div className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>已禁用</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" style={{ color: 'var(--ao-infoForeground)' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--ao-foreground)' }}>{Object.values(stats.byTemplate).reduce((a, b) => a + b, 0)}</div>
                <div className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>模板类型</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
                <Input
                  placeholder="搜索 Sub-Agent..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    backgroundColor: 'var(--ao-commandPalette.footerBackground)', 
                    borderColor: 'var(--ao-border)', 
                    color: 'var(--ao-foreground)' 
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
              <select
                className="text-sm rounded px-2 py-1.5"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                style={{ 
                  backgroundColor: 'var(--ao-commandPalette.footerBackground)', 
                  borderColor: 'var(--ao-border)', 
                  color: 'var(--ao-foreground)' 
                }}
              >
                <option value="all">全部状态</option>
                <option value="enabled">已启用</option>
                <option value="disabled">已禁用</option>
              </select>
              <select
                className="text-sm rounded px-2 py-1.5"
                value={filterTemplate}
                onChange={(e) => setFilterTemplate(e.target.value as SubAgentTemplate | 'all')}
                style={{ 
                  backgroundColor: 'var(--ao-commandPalette.footerBackground)', 
                  borderColor: 'var(--ao-border)', 
                  color: 'var(--ao-foreground)' 
                }}
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
            <Card style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
              <CardContent className="py-12 text-center">
                <Bot className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
                <p style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>没有找到匹配的 Sub-Agent</p>
              </CardContent>
            </Card>
          ) : (
            filteredSubAgents.map(agent => {
              const templateInfo = TEMPLATE_CONFIG[agent.template]
              const isExpanded = expandedAgents.has(agent.id)

              return (
                <Card key={agent.id} style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => toggleAgentExpansion(agent.id)}
                          className="mt-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
                          ) : (
                            <ChevronRight className="h-4 w-4" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium" style={{ color: 'var(--ao-foreground)' }}>{agent.name}</span>
                            <Badge className={cn(templateInfo.color, 'text-xs')}>
                              {templateInfo.icon}
                              <span className="ml-1">{templateInfo.name}</span>
                            </Badge>
                            {agent.enabled ? (
                              <Badge variant="outline" className="border-[var(--ao-successForeground)]/30" style={{ color: 'var(--ao-successForeground)' }}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                启用
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-[var(--ao-workbench.secondaryForeground)]/30" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
                                <XCircle className="h-3 w-3 mr-1" />
                                禁用
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mb-2" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
                            {agent.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
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
                                  <ToggleRight className="h-4 w-4" style={{ color: 'var(--ao-successForeground)' }} />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
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
                              <MoreVertical className="h-4 w-4" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(agent)}>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateAgent(agent)}>
                              <Copy className="h-4 w-4 mr-2" />
                              复制
                            </DropdownMenuItem>
                            <DropdownMenuSeparator style={{ backgroundColor: 'var(--ao-border)' }} />
                            <DropdownMenuItem
                              className="focus:bg-[var(--ao-errorForeground)]/10 focus:text-[var(--ao-errorForeground)]"
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
                      <div className="mt-4 pl-7 space-y-4" style={{ borderTop: '1px solid var(--ao-border)' }}>
                        {/* Role */}
                        <div>
                          <div className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: 'var(--ao-foreground)' }}>
                            <Shield className="h-4 w-4" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
                            角色定义
                          </div>
                          <div className="text-sm p-3 rounded-md" style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', color: 'var(--ao-foreground)' }}>
                            {agent.role}
                          </div>
                        </div>

                        {/* Skills */}
                        <div>
                          <div className="text-sm font-medium mb-1" style={{ color: 'var(--ao-foreground)' }}>技能</div>
                          <div className="flex flex-wrap gap-1">
                            {agent.skills.map(skill => (
                              <Badge key={skill} variant="outline" className="border-[var(--ao-border)]" style={{ color: 'var(--ao-foreground)' }}>
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Tools */}
                        <div>
                          <div className="text-sm font-medium mb-1" style={{ color: 'var(--ao-foreground)' }}>工具</div>
                          <div className="flex flex-wrap gap-1">
                            {agent.tools.map(tool => (
                              <Badge key={tool} variant="outline" className="border-[var(--ao-border)]" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* MCP Tools */}
                        {agent.mcpTools.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-1" style={{ color: 'var(--ao-foreground)' }}>MCP 工具</div>
                            <div className="flex flex-wrap gap-1">
                              {agent.mcpTools.map(tool => (
                                <Badge key={tool} variant="outline" className="border-[var(--ao-button.linkForeground)]/30" style={{ color: 'var(--ao-button.linkForeground)' }}>
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Permissions */}
                        <div>
                          <div className="text-sm font-medium mb-1" style={{ color: 'var(--ao-foreground)' }}>权限</div>
                          <div className="flex flex-wrap gap-1">
                            {agent.permissions.map(perm => (
                              <Badge key={perm} variant="outline" className="border-[var(--ao-warningForeground)]/30" style={{ color: 'var(--ao-warningForeground)' }}>
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
        <DialogContent className="max-w-2xl max-h-[85vh]" style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ao-foreground)' }}>创建 Sub-Agent</DialogTitle>
            <DialogDescription style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
              选择模板并配置将挂载到当前用户主 Agent 下的 Sub-Agent。
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 p-1">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--ao-foreground)' }}>选择模板</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(TEMPLATE_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all duration-200',
                        formData.template === key
                          ? 'border-[var(--ao-sidebarActiveIndicator)] shadow-sm'
                          : 'border-[var(--ao-border)] hover:border-[var(--ao-workbench.secondaryForeground)]'
                      )}
                      style={formData.template === key
                        ? { backgroundColor: 'rgba(35, 134, 54, 0.1)' }
                        : { backgroundColor: 'var(--ao-commandPalette.footerBackground)' }
                      }
                      onClick={() => handleTemplateChange(key as SubAgentTemplate)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('p-1 rounded text-xs', config.color)}>
                          {config.icon}
                        </span>
                        <span className="font-medium" style={{ color: 'var(--ao-foreground)' }}>{config.name}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>{config.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" style={{ color: 'var(--ao-foreground)' }}>名称</Label>
                <Input
                  id="name"
                  placeholder="输入 Sub-Agent 名称"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" style={{ color: 'var(--ao-foreground)' }}>描述</Label>
                <Textarea
                  id="description"
                  placeholder="输入 Sub-Agent 描述"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" style={{ color: 'var(--ao-foreground)' }}>角色定义</Label>
                <Textarea
                  id="role"
                  placeholder="定义 Sub-Agent 的角色和行为"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--ao-foreground)' }}>技能 (逗号分隔)</Label>
                <Input
                  placeholder="输入技能，用逗号分隔"
                  value={formData.skills?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
                />
              </div>

              {/* Tools */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--ao-foreground)' }}>工具 (逗号分隔)</Label>
                <Input
                  placeholder="输入工具 ID，用逗号分隔"
                  value={formData.tools?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tools: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
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
        <DialogContent className="max-w-2xl max-h-[85vh]" style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ao-foreground)' }}>编辑 Sub-Agent</DialogTitle>
            <DialogDescription style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
              修改当前用户主 Agent 下 Sub-Agent 的配置和属性。
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 p-1">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-name" style={{ color: 'var(--ao-foreground)' }}>名称</Label>
                <Input
                  id="edit-name"
                  placeholder="输入 Sub-Agent 名称"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description" style={{ color: 'var(--ao-foreground)' }}>描述</Label>
                <Textarea
                  id="edit-description"
                  placeholder="输入 Sub-Agent 描述"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="edit-role" style={{ color: 'var(--ao-foreground)' }}>角色定义</Label>
                <Textarea
                  id="edit-role"
                  placeholder="定义 Sub-Agent 的角色和行为"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--ao-foreground)' }}>技能 (逗号分隔)</Label>
                <Input
                  placeholder="输入技能，用逗号分隔"
                  value={formData.skills?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
                />
              </div>

              {/* Tools */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--ao-foreground)' }}>工具 (逗号分隔)</Label>
                <Input
                  placeholder="输入工具 ID，用逗号分隔"
                  value={formData.tools?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tools: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
                />
              </div>

              {/* MCP Tools */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--ao-foreground)' }}>MCP 工具 (逗号分隔)</Label>
                <Input
                  placeholder="输入 MCP 工具 ID，用逗号分隔"
                  value={formData.mcpTools?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    mcpTools: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
                />
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--ao-foreground)' }}>权限 (逗号分隔)</Label>
                <Input
                  placeholder="输入权限 ID，用逗号分隔"
                  value={formData.permissions?.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    permissions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', borderColor: 'var(--ao-border)', color: 'var(--ao-foreground)' }}
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
