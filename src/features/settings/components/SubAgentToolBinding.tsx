import { useState, useMemo, useCallback } from 'react'
import {
  Bot,
  Settings,
  Plus,
  RotateCcw,
  Clock,
  Zap,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  History,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
export type ToolBindingStatus = 'draft' | 'pending' | 'applied' | 'failed' | 'rollback'
export type SubAgentToolPolicy = 'auto_approve' | 'manual_approve' | 'deny'
export type SkillLevel = 'basic' | 'intermediate' | 'advanced' | 'expert'

export interface MCPToolBinding {
  id: string
  toolId: string
  toolName: string
  toolDescription: string
  enabled: boolean
  parameters?: Record<string, unknown>
}

export interface SkillBinding {
  id: string
  skillId: string
  skillName: string
  skillDescription: string
  level: SkillLevel
  enabled: boolean
  approvePolicy: SubAgentToolPolicy
  autoApproveThreshold?: number
}

export interface ToolBindingAuditEntry {
  id: string
  timestamp: string
  action: 'bind' | 'unbind' | 'update' | 'apply' | 'rollback'
  actor: string
  targetType: 'mcp_tool' | 'skill'
  targetId: string
  targetName: string
  before?: Partial<MCPToolBinding | SkillBinding>
  after?: Partial<MCPToolBinding | SkillBinding>
  status: 'success' | 'failed'
  errorMessage?: string
}

export interface SubAgentToolBindingProps {
  className?: string
}

// Mock Sub-Agent list
const MOCK_SUB_AGENTS = [
  { id: 'subagent-001', name: 'HR助手', template: 'specialist', enabled: true },
  { id: 'subagent-002', name: '财务分析师', template: 'analyst', enabled: true },
  { id: 'subagent-003', name: '销售协调员', template: 'coordinator', enabled: true },
  { id: 'subagent-004', name: 'IT支持助手', template: 'general', enabled: false },
]

// Mock available MCP tools
const MOCK_MCP_TOOLS = [
  { id: 'mcp_hr_employee', name: 'HR员工查询', description: '查询员工信息', category: 'hr' },
  { id: 'mcp_hr_calendar', name: 'HR日历', description: '管理日程安排', category: 'hr' },
  { id: 'mcp_finance_reports', name: '财务报表', description: '生成财务报表', category: 'finance' },
  { id: 'mcp_crm_customer', name: 'CRM客户管理', description: '客户信息管理', category: 'crm' },
  { id: 'mcp_it_tickets', name: 'IT工单', description: 'IT支持工单管理', category: 'it' },
]

// Mock available Skills
const MOCK_SKILLS = [
  { id: 'skill_hr_query', name: '员工查询', description: '查询员工基本信息', level: 'basic' as SkillLevel },
  { id: 'skill_hr_leave', name: '假期管理', description: '处理员工假期申请', level: 'intermediate' as SkillLevel },
  { id: 'skill_fin_report', name: '报表生成', description: '生成各类财务报表', level: 'advanced' as SkillLevel },
  { id: 'skill_data_analysis', name: '数据分析', description: '执行数据分析和挖掘', level: 'expert' as SkillLevel },
  { id: 'skill_customer_follow', name: '客户跟进', description: '跟进客户状态', level: 'basic' as SkillLevel },
]

// Approve policy options
const APPROVE_POLICY_OPTIONS: { value: SubAgentToolPolicy; label: string; description: string }[] = [
  { value: 'auto_approve', label: '自动批准', description: '低于阈值的操作自动批准' },
  { value: 'manual_approve', label: '手动批准', description: '所有操作需要手动确认' },
  { value: 'deny', label: '拒绝', description: '禁用此工具/技能' },
]

// Mock audit history
const createMockAuditHistory = (): ToolBindingAuditEntry[] => [
  {
    id: 'audit-001',
    timestamp: '2026-03-24T10:30:00Z',
    action: 'apply',
    actor: 'admin',
    targetType: 'mcp_tool',
    targetId: 'mcp_hr_employee',
    targetName: 'HR员工查询',
    status: 'success',
  },
  {
    id: 'audit-002',
    timestamp: '2026-03-24T09:15:00Z',
    action: 'bind',
    actor: 'admin',
    targetType: 'skill',
    targetId: 'skill_hr_query',
    targetName: '员工查询',
    status: 'success',
  },
  {
    id: 'audit-003',
    timestamp: '2026-03-23T16:45:00Z',
    action: 'unbind',
    actor: 'admin',
    targetType: 'mcp_tool',
    targetId: 'mcp_it_tickets',
    targetName: 'IT工单',
    status: 'success',
  },
  {
    id: 'audit-004',
    timestamp: '2026-03-23T14:20:00Z',
    action: 'apply',
    actor: 'admin',
    targetType: 'skill',
    targetId: 'skill_data_analysis',
    targetName: '数据分析',
    status: 'failed',
    errorMessage: '技能版本不兼容，请更新后再试',
  },
]

export function SubAgentToolBinding({ className = '' }: SubAgentToolBindingProps) {
  const [selectedSubAgentId, setSelectedSubAgentId] = useState<string | null>(null)
  const [mcpToolBindings, setMcpToolBindings] = useState<MCPToolBinding[]>([])
  const [skillBindings, setSkillBindings] = useState<SkillBinding[]>([])
  const [auditHistory] = useState<ToolBindingAuditEntry[]>(createMockAuditHistory)
  const [showBindDialog, setShowBindDialog] = useState<'mcp' | 'skill' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Get selected sub-agent info
  const selectedSubAgent = useMemo(() => {
    return MOCK_SUB_AGENTS.find(a => a.id === selectedSubAgentId)
  }, [selectedSubAgentId])

  // Load bindings for selected sub-agent
  const handleSelectSubAgent = useCallback((subAgentId: string) => {
    setSelectedSubAgentId(subAgentId)
    // In real implementation, this would fetch from API/store
    // Mock: load some default bindings
    setMcpToolBindings([
      { id: 'bind-001', toolId: 'mcp_hr_employee', toolName: 'HR员工查询', toolDescription: '查询员工信息', enabled: true },
      { id: 'bind-002', toolId: 'mcp_hr_calendar', toolName: 'HR日历', toolDescription: '管理日程安排', enabled: true },
    ])
    setSkillBindings([
      { id: 'bind-003', skillId: 'skill_hr_query', skillName: '员工查询', skillDescription: '查询员工基本信息', level: 'basic', enabled: true, approvePolicy: 'auto_approve' },
      { id: 'bind-004', skillId: 'skill_hr_leave', skillName: '假期管理', skillDescription: '处理员工假期申请', level: 'intermediate', enabled: true, approvePolicy: 'manual_approve' },
    ])
    setSubmitMessage(null)
  }, [])

  // Toggle MCP tool binding enabled
  const handleToggleMcpToolEnabled = useCallback((bindingId: string) => {
    setMcpToolBindings(prev => prev.map(b =>
      b.id === bindingId ? { ...b, enabled: !b.enabled } : b
    ))
  }, [])

  // Toggle skill binding enabled
  const handleToggleSkillEnabled = useCallback((bindingId: string) => {
    setSkillBindings(prev => prev.map(b =>
      b.id === bindingId ? { ...b, enabled: !b.enabled } : b
    ))
  }, [])

  // Update skill approve policy
  const handleUpdateApprovePolicy = useCallback((bindingId: string, policy: SubAgentToolPolicy) => {
    setSkillBindings(prev => prev.map(b =>
      b.id === bindingId ? { ...b, approvePolicy: policy } : b
    ))
  }, [])

  // Remove MCP tool binding
  const handleRemoveMcpToolBinding = useCallback((bindingId: string) => {
    setMcpToolBindings(prev => prev.filter(b => b.id !== bindingId))
  }, [])

  // Remove skill binding
  const handleRemoveSkillBinding = useCallback((bindingId: string) => {
    setSkillBindings(prev => prev.filter(b => b.id !== bindingId))
  }, [])

  // Add MCP tool binding
  const handleAddMcpToolBinding = useCallback((tool: typeof MOCK_MCP_TOOLS[0]) => {
    const newBinding: MCPToolBinding = {
      id: `bind-${Date.now()}`,
      toolId: tool.id,
      toolName: tool.name,
      toolDescription: tool.description,
      enabled: true,
    }
    setMcpToolBindings(prev => [...prev, newBinding])
    setShowBindDialog(null)
  }, [])

  // Add skill binding
  const handleAddSkillBinding = useCallback((skill: typeof MOCK_SKILLS[0]) => {
    const newBinding: SkillBinding = {
      id: `bind-${Date.now()}`,
      skillId: skill.id,
      skillName: skill.name,
      skillDescription: skill.description,
      level: skill.level,
      enabled: true,
      approvePolicy: 'manual_approve',
    }
    setSkillBindings(prev => [...prev, newBinding])
    setShowBindDialog(null)
  }, [])

  // Apply bindings
  const handleApply = useCallback(async () => {
    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitMessage({ type: 'success', text: '工具绑定配置已应用' })
    } catch {
      setSubmitMessage({ type: 'error', text: '应用失败，请重试' })
    } finally {
      setIsSubmitting(false)
    }
  }, [mcpToolBindings, skillBindings])

  // Get skill level badge variant
  const getSkillLevelBadge = (level: SkillLevel) => {
    const variants: Record<SkillLevel, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      basic: { variant: 'secondary', label: '基础' },
      intermediate: { variant: 'outline', label: '中级' },
      advanced: { variant: 'default', label: '高级' },
      expert: { variant: 'destructive', label: '专家' },
    }
    return variants[level]
  }

  // Get available MCP tools (not yet bound)
  const availableMcpTools = useMemo(() => {
    const boundToolIds = new Set(mcpToolBindings.map(b => b.toolId))
    return MOCK_MCP_TOOLS.filter(t => !boundToolIds.has(t.id))
  }, [mcpToolBindings])

  // Get available skills (not yet bound)
  const availableSkills = useMemo(() => {
    const boundSkillIds = new Set(skillBindings.map(b => b.skillId))
    return MOCK_SKILLS.filter(s => !boundSkillIds.has(s.id))
  }, [skillBindings])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Sub-Agent 工具绑定
          </h2>
          <p className="text-muted-foreground">
            绑定 MCP 工具和 Skills 到 Sub-Agent，配置权限策略
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sub-Agent List */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Bot className="h-4 w-4" />
                选择 Sub-Agent
              </h3>
              <div className="space-y-2">
                {MOCK_SUB_AGENTS.map(agent => (
                  <button
                    key={agent.id}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedSubAgentId === agent.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    } ${!agent.enabled ? 'opacity-50' : ''}`}
                    onClick={() => handleSelectSubAgent(agent.id)}
                    disabled={!agent.enabled}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      {agent.enabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-6 capitalize">
                      {agent.template}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tool Binding Panel */}
        <div className="col-span-12 lg:col-span-8">
          {!selectedSubAgentId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">请从左侧选择一个 Sub-Agent 进行工具绑定</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4">
                {/* Sub-Agent Info Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{selectedSubAgent?.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {selectedSubAgent?.template}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {mcpToolBindings.length} MCP 工具
                    </Badge>
                    <Badge variant="secondary">
                      {skillBindings.length} Skills
                    </Badge>
                  </div>
                </div>

                <Tabs defaultValue="mcp">
                  <TabsList className="mb-4">
                    <TabsTrigger value="mcp">MCP 工具</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="audit">审计历史</TabsTrigger>
                  </TabsList>

                  {/* MCP Tools Tab */}
                  <TabsContent value="mcp" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          MCP 工具绑定
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          管理此 Sub-Agent 可使用的 MCP 工具
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBindDialog('mcp')}
                        disabled={availableMcpTools.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        绑定工具
                      </Button>
                    </div>

                    {mcpToolBindings.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg">
                        <Wrench className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-4">
                          暂无绑定的 MCP 工具
                        </p>
                        <Button variant="outline" onClick={() => setShowBindDialog('mcp')}>
                          <Plus className="h-4 w-4 mr-1" />
                          绑定工具
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mcpToolBindings.map(binding => (
                          <div key={binding.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{binding.toolName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {binding.toolId}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {binding.toolDescription}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggleMcpToolEnabled(binding.id)}
                              >
                                {binding.enabled ? (
                                  <Eye className="h-4 w-4 text-green-500" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={() => handleRemoveMcpToolBinding(binding.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Skills Tab */}
                  <TabsContent value="skills" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Skills 绑定
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          管理此 Sub-Agent 可使用的 Skills 及审批策略
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBindDialog('skill')}
                        disabled={availableSkills.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        绑定 Skill
                      </Button>
                    </div>

                    {skillBindings.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg">
                        <Zap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-4">
                          暂无绑定的 Skills
                        </p>
                        <Button variant="outline" onClick={() => setShowBindDialog('skill')}>
                          <Plus className="h-4 w-4 mr-1" />
                          绑定 Skill
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {skillBindings.map(binding => (
                          <div key={binding.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{binding.skillName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {binding.skillId}
                                </Badge>
                                <Badge variant={getSkillLevelBadge(binding.level).variant} className="text-xs">
                                  {getSkillLevelBadge(binding.level).label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {binding.skillDescription}
                              </p>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs">审批策略:</Label>
                                <select
                                  className="text-xs border rounded px-2 py-1"
                                  value={binding.approvePolicy}
                                  onChange={(e) => handleUpdateApprovePolicy(
                                    binding.id,
                                    e.target.value as SubAgentToolPolicy
                                  )}
                                >
                                  {APPROVE_POLICY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggleSkillEnabled(binding.id)}
                              >
                                {binding.enabled ? (
                                  <Eye className="h-4 w-4 text-green-500" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={() => handleRemoveSkillBinding(binding.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Audit History Tab */}
                  <TabsContent value="audit">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        审计历史
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        查看工具绑定的变更历史和操作记录
                      </p>
                    </div>

                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {auditHistory.map(entry => (
                          <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="mt-1">
                              {entry.action === 'bind' && <Plus className="h-4 w-4 text-green-500" />}
                              {entry.action === 'unbind' && <XCircle className="h-4 w-4 text-red-500" />}
                              {entry.action === 'update' && <Settings className="h-4 w-4 text-blue-500" />}
                              {entry.action === 'apply' && entry.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              {entry.action === 'apply' && entry.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              {entry.action === 'rollback' && <RotateCcw className="h-4 w-4 text-yellow-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {entry.action === 'bind' ? '绑定' :
                                   entry.action === 'unbind' ? '解绑' :
                                   entry.action === 'update' ? '更新' :
                                   entry.action === 'apply' ? '应用' :
                                   entry.action === 'rollback' ? '回滚' : entry.action}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {entry.targetType === 'mcp_tool' ? 'MCP工具' : 'Skill'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {entry.targetName}
                                </span>
                                <Badge
                                  variant={entry.status === 'success' ? 'secondary' : 'destructive'}
                                  className="text-xs"
                                >
                                  {entry.status === 'success' ? '成功' : '失败'}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(entry.timestamp).toLocaleString()}
                                <span className="ml-2">by {entry.actor}</span>
                              </div>
                              {entry.errorMessage && (
                                <div className="text-xs text-red-500 mt-1">
                                  {entry.errorMessage}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex items-center justify-end mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {submitMessage && (
                      <span className={`text-sm ${
                        submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {submitMessage.text}
                      </span>
                    )}
                    <Button onClick={handleApply} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      应用绑定
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bind MCP Tool Dialog */}
      <Dialog open={showBindDialog === 'mcp'} onOpenChange={() => setShowBindDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>绑定 MCP 工具</DialogTitle>
            <DialogDescription>
              选择要绑定到此 Sub-Agent 的 MCP 工具
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 p-1">
              {availableMcpTools.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">所有工具已绑定</p>
                </div>
              ) : (
                availableMcpTools.map(tool => (
                  <button
                    key={tool.id}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    onClick={() => handleAddMcpToolBinding(tool)}
                  >
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-xs text-muted-foreground">{tool.description}</div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {tool.category}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBindDialog(null)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bind Skill Dialog */}
      <Dialog open={showBindDialog === 'skill'} onOpenChange={() => setShowBindDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>绑定 Skill</DialogTitle>
            <DialogDescription>
              选择要绑定到此 Sub-Agent 的 Skill
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 p-1">
              {availableSkills.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">所有 Skills 已绑定</p>
                </div>
              ) : (
                availableSkills.map(skill => (
                  <button
                    key={skill.id}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    onClick={() => handleAddSkillBinding(skill)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {getSkillLevelBadge(skill.level).label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{skill.description}</div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBindDialog(null)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}