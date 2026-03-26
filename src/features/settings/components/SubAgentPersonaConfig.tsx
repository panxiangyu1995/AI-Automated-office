import { useState, useMemo, useCallback } from 'react'
import {
  Bot,
  Settings,
  Plus,
  RotateCcw,
  Clock,
  User,
  Zap,
  Shield,
  FileText,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  History,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { SETTINGS_SUB_AGENT_OPTIONS } from './subAgentSettingsFixtures'

// Types
export type PersonaStatus = 'draft' | 'pending' | 'applied' | 'failed' | 'rollback'
export type TriggerType = 'keyword' | 'pattern' | 'context' | 'combined'
export type SoulTemplate = 'minimal' | 'standard' | 'extended' | 'custom'

export interface TriggerCondition {
  id: string
  type: TriggerType
  value: string
  enabled: boolean
  priority: number
}

export interface PersonaConfig {
  subAgentId: string
  rolePrompt: string
  invocationDescription: string
  triggerConditions: TriggerCondition[]
  soulTemplate: SoulTemplate
  soulTemplateCustom?: string
  status: PersonaStatus
  lastModified: string
  lastModifiedBy: string
  version: number
}

export interface PersonaAuditEntry {
  id: string
  timestamp: string
  action: 'create' | 'update' | 'apply' | 'rollback'
  actor: string
  before?: Partial<PersonaConfig>
  after?: Partial<PersonaConfig>
  status: 'success' | 'failed'
  errorMessage?: string
}

export interface SubAgentPersonaConfigProps {
  className?: string
}

// SOUL Template descriptions
const SOUL_TEMPLATES: Record<SoulTemplate, { name: string; description: string }> = {
  minimal: {
    name: '最小化模板',
    description: '仅包含核心角色定义，最轻量级执行',
  },
  standard: {
    name: '标准模板',
    description: '包含角色定义和标准行为指南',
  },
  extended: {
    name: '扩展模板',
    description: '包含完整角色定义、行为指南和约束条件',
  },
  custom: {
    name: '自定义模板',
    description: '使用自定义 SOUL 模板内容',
  },
}

// Mock Sub-Agent list (should be replaced with actual data from store)
const MOCK_SUB_AGENTS = [
  { id: 'subagent-001', name: 'HR助手', template: 'specialist', enabled: true },
  { id: 'subagent-002', name: '财务分析师', template: 'analyst', enabled: true },
  { id: 'subagent-003', name: '销售协调员', template: 'coordinator', enabled: true },
  { id: 'subagent-004', name: 'IT支持助手', template: 'general', enabled: false },
]

const CORRECTIVE_SUB_AGENTS =
  SETTINGS_SUB_AGENT_OPTIONS.length > 0 ? SETTINGS_SUB_AGENT_OPTIONS : MOCK_SUB_AGENTS

// Mock audit history
const createMockAuditHistory = (): PersonaAuditEntry[] => [
  {
    id: 'audit-001',
    timestamp: '2026-03-24T10:30:00Z',
    action: 'apply',
    actor: 'admin',
    after: { rolePrompt: 'HR专家助手...', version: 3 },
    status: 'success',
  },
  {
    id: 'audit-002',
    timestamp: '2026-03-24T09:15:00Z',
    action: 'update',
    actor: 'admin',
    before: { rolePrompt: '原角色提示词...' },
    after: { rolePrompt: 'HR专家助手...' },
    status: 'success',
  },
  {
    id: 'audit-003',
    timestamp: '2026-03-23T16:45:00Z',
    action: 'rollback',
    actor: 'admin',
    before: { rolePrompt: '新版提示词...' },
    after: { rolePrompt: '原角色提示词...' },
    status: 'success',
  },
  {
    id: 'audit-004',
    timestamp: '2026-03-23T14:20:00Z',
    action: 'apply',
    actor: 'admin',
    status: 'failed',
    errorMessage: '配置验证失败：角色提示词长度超过限制',
  },
]

// Default persona config
const createDefaultPersonaConfig = (subAgentId: string): PersonaConfig => ({
  subAgentId,
  rolePrompt: '',
  invocationDescription: '',
  triggerConditions: [],
  soulTemplate: 'standard',
  status: 'draft',
  lastModified: new Date().toISOString(),
  lastModifiedBy: 'current-user',
  version: 1,
})

export function SubAgentPersonaConfig({ className = '' }: SubAgentPersonaConfigProps) {
  const [selectedSubAgentId, setSelectedSubAgentId] = useState<string | null>(null)
  const [personaConfig, setPersonaConfig] = useState<PersonaConfig | null>(null)
  const [auditHistory] = useState<PersonaAuditEntry[]>(createMockAuditHistory)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Get selected sub-agent info
  const selectedSubAgent = useMemo(() => {
    return CORRECTIVE_SUB_AGENTS.find(a => a.id === selectedSubAgentId)
  }, [selectedSubAgentId])

  // Trigger condition type options
  const triggerTypeOptions: { value: TriggerType; label: string }[] = [
    { value: 'keyword', label: '关键词' },
    { value: 'pattern', label: '正则模式' },
    { value: 'context', label: '上下文' },
    { value: 'combined', label: '组合条件' },
  ]

  // Load persona config for selected sub-agent
  const handleSelectSubAgent = useCallback((subAgentId: string) => {
    setSelectedSubAgentId(subAgentId)
    // In real implementation, this would fetch from API/store
    setPersonaConfig(createDefaultPersonaConfig(subAgentId))
    setSubmitMessage(null)
  }, [])

  // Update role prompt
  const handleRolePromptChange = useCallback((value: string) => {
    if (!personaConfig) return
    setPersonaConfig(prev => prev ? {
      ...prev,
      rolePrompt: value,
      status: 'draft',
      lastModified: new Date().toISOString(),
    } : null)
  }, [personaConfig])

  // Update invocation description
  const handleInvocationDescriptionChange = useCallback((value: string) => {
    if (!personaConfig) return
    setPersonaConfig(prev => prev ? {
      ...prev,
      invocationDescription: value,
      status: 'draft',
      lastModified: new Date().toISOString(),
    } : null)
  }, [personaConfig])

  // Update SOUL template
  const handleSoulTemplateChange = useCallback((template: SoulTemplate) => {
    if (!personaConfig) return
    setPersonaConfig(prev => prev ? {
      ...prev,
      soulTemplate: template,
      status: 'draft',
      lastModified: new Date().toISOString(),
    } : null)
  }, [personaConfig])

  // Add trigger condition
  const handleAddTriggerCondition = useCallback(() => {
    if (!personaConfig) return
    const newCondition: TriggerCondition = {
      id: `trigger-${Date.now()}`,
      type: 'keyword',
      value: '',
      enabled: true,
      priority: personaConfig.triggerConditions.length + 1,
    }
    setPersonaConfig(prev => prev ? {
      ...prev,
      triggerConditions: [...prev.triggerConditions, newCondition],
      status: 'draft',
      lastModified: new Date().toISOString(),
    } : null)
  }, [personaConfig])

  // Update trigger condition
  const handleUpdateTriggerCondition = useCallback((conditionId: string, updates: Partial<TriggerCondition>) => {
    if (!personaConfig) return
    setPersonaConfig(prev => prev ? {
      ...prev,
      triggerConditions: prev.triggerConditions.map(c =>
        c.id === conditionId ? { ...c, ...updates } : c
      ),
      status: 'draft',
      lastModified: new Date().toISOString(),
    } : null)
  }, [personaConfig])

  // Remove trigger condition
  const handleRemoveTriggerCondition = useCallback((conditionId: string) => {
    if (!personaConfig) return
    setPersonaConfig(prev => prev ? {
      ...prev,
      triggerConditions: prev.triggerConditions.filter(c => c.id !== conditionId),
      status: 'draft',
      lastModified: new Date().toISOString(),
    } : null)
  }, [personaConfig])

  // Toggle trigger condition enabled
  const handleToggleTriggerEnabled = useCallback((conditionId: string) => {
    if (!personaConfig) return
    const condition = personaConfig.triggerConditions.find(c => c.id === conditionId)
    if (condition) {
      handleUpdateTriggerCondition(conditionId, { enabled: !condition.enabled })
    }
  }, [personaConfig, handleUpdateTriggerCondition])

  // Preview persona config
  const handlePreview = useCallback(() => {
    if (!personaConfig) return
    // Generate preview content
    const preview = `
# ${selectedSubAgent?.name} - Persona 配置预览

## 角色提示词
${personaConfig.rolePrompt || '(未设置)'}

## 调用描述
${personaConfig.invocationDescription || '(未设置)'}

## 触发条件
${personaConfig.triggerConditions.length > 0
  ? personaConfig.triggerConditions.map(c => `- [${c.enabled ? '✓' : '✗'}] ${c.type}: ${c.value || '(空)'}`).join('\n')
  : '(无触发条件)'}

## SOUL 模板
${SOUL_TEMPLATES[personaConfig.soulTemplate].name}
${personaConfig.soulTemplate === 'custom' ? `\n自定义内容:\n${personaConfig.soulTemplateCustom || '(未设置)'}` : ''}
    `.trim()
    setPreviewContent(preview)
    setShowPreviewDialog(true)
  }, [personaConfig, selectedSubAgent])

  // Apply persona config
  const handleApply = useCallback(async () => {
    if (!personaConfig || !personaConfig.rolePrompt.trim()) {
      setSubmitMessage({ type: 'error', text: '角色提示词不能为空' })
      return
    }

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simulate validation
      if (personaConfig.rolePrompt.length > 5000) {
        setSubmitMessage({ type: 'error', text: '角色提示词长度不能超过5000字符' })
        setIsSubmitting(false)
        return
      }

      setPersonaConfig(prev => prev ? {
        ...prev,
        status: 'applied',
        version: prev.version + 1,
        lastModified: new Date().toISOString(),
      } : null)
      setSubmitMessage({ type: 'success', text: '配置已应用并生效' })
    } catch {
      setSubmitMessage({ type: 'error', text: '应用配置失败，请重试' })
    } finally {
      setIsSubmitting(false)
    }
  }, [personaConfig])

  // Reset to last applied state
  const handleReset = useCallback(() => {
    if (!personaConfig) return
    setPersonaConfig(prev => prev ? {
      ...prev,
      status: 'draft',
      lastModified: new Date().toISOString(),
    } : null)
    setSubmitMessage({ type: 'success', text: '已重置为草稿状态' })
  }, [personaConfig])

  // Rollback to previous version
  const handleRollback = useCallback(async () => {
    if (!personaConfig || personaConfig.version <= 1) return

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))

      setPersonaConfig(prev => prev ? {
        ...prev,
        status: 'rollback',
        version: prev.version - 1,
        lastModified: new Date().toISOString(),
      } : null)
      setSubmitMessage({ type: 'success', text: '已回滚到上一版本' })
    } catch {
      setSubmitMessage({ type: 'error', text: '回滚失败，请重试' })
    } finally {
      setIsSubmitting(false)
    }
  }, [personaConfig])

  // Get status badge variant
  const getStatusBadge = (status: PersonaStatus) => {
    const variants: Record<PersonaStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      draft: { variant: 'secondary', label: '草稿' },
      pending: { variant: 'outline', label: '待应用' },
      applied: { variant: 'default', label: '已应用' },
      failed: { variant: 'destructive', label: '失败' },
      rollback: { variant: 'outline', label: '已回滚' },
    }
    return variants[status]
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-6 w-6" />
            Sub-Agent 角色配置
          </h2>
          <p className="text-muted-foreground">
            配置 Sub-Agent 的角色提示词、触发条件和 SOUL 模板策略
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
                {CORRECTIVE_SUB_AGENTS.map(agent => (
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

        {/* Persona Config Panel */}
        <div className="col-span-12 lg:col-span-8">
          {!selectedSubAgentId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">请从左侧选择一个 Sub-Agent 进行配置</p>
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
                  {personaConfig && (
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadge(personaConfig.status).variant}>
                        {getStatusBadge(personaConfig.status).label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        v{personaConfig.version}
                      </span>
                    </div>
                  )}
                </div>

                {personaConfig && (
                  <Tabs defaultValue="role">
                    <TabsList className="mb-4">
                      <TabsTrigger value="role">角色配置</TabsTrigger>
                      <TabsTrigger value="triggers">触发条件</TabsTrigger>
                      <TabsTrigger value="soul">SOUL 模板</TabsTrigger>
                      <TabsTrigger value="audit">审计历史</TabsTrigger>
                    </TabsList>

                    {/* Role Configuration Tab */}
                    <TabsContent value="role" className="space-y-4">
                      {/* Role Prompt */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="role-prompt" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            角色提示词
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {personaConfig.rolePrompt.length}/5000
                          </span>
                        </div>
                        <Textarea
                          id="role-prompt"
                          placeholder="定义 Sub-Agent 的角色和行为..."
                          className="min-h-[200px]"
                          value={personaConfig.rolePrompt}
                          onChange={(e) => handleRolePromptChange(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          描述 Sub-Agent 的身份、专业领域和行为准则
                        </p>
                      </div>

                      {/* Invocation Description */}
                      <div className="space-y-2">
                        <Label htmlFor="invocation-desc" className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          调用描述
                        </Label>
                        <Textarea
                          id="invocation-desc"
                          placeholder="描述何时以及如何调用此 Sub-Agent..."
                          className="min-h-[100px]"
                          value={personaConfig.invocationDescription}
                          onChange={(e) => handleInvocationDescriptionChange(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          用于 AI 路由决策的调用条件说明
                        </p>
                      </div>
                    </TabsContent>

                    {/* Trigger Conditions Tab */}
                    <TabsContent value="triggers" className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            触发条件
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            配置激活此 Sub-Agent 的条件
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleAddTriggerCondition}>
                          <Plus className="h-4 w-4 mr-1" />
                          添加条件
                        </Button>
                      </div>

                      {personaConfig.triggerConditions.length === 0 ? (
                        <div className="text-center py-8 border rounded-lg">
                          <Tag className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            暂无触发条件，点击"添加条件"创建
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {personaConfig.triggerConditions.map((condition, index) => (
                            <div key={condition.id} className="flex items-start gap-3 p-3 border rounded-lg">
                              <div className="text-sm font-medium text-muted-foreground w-6">
                                #{index + 1}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <select
                                    className="text-sm border rounded px-2 py-1"
                                    value={condition.type}
                                    onChange={(e) => handleUpdateTriggerCondition(
                                      condition.id,
                                      { type: e.target.value as TriggerType }
                                    )}
                                  >
                                    {triggerTypeOptions.map(opt => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                  <Input
                                    placeholder={
                                      condition.type === 'keyword' ? '例如: HR, 人事, 员工' :
                                      condition.type === 'pattern' ? '例如: ^HR.*' :
                                      condition.type === 'context' ? '例如: 员工查询' :
                                      '例如: HR AND 请假'
                                    }
                                    className="flex-1"
                                    value={condition.value}
                                    onChange={(e) => handleUpdateTriggerCondition(
                                      condition.id,
                                      { value: e.target.value }
                                    )}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleToggleTriggerEnabled(condition.id)}
                                >
                                  {condition.enabled ? (
                                    <Eye className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => handleRemoveTriggerCondition(condition.id)}
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* SOUL Template Tab */}
                    <TabsContent value="soul" className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          SOUL 模板策略
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          选择应用于此 Sub-Agent 的 SOUL 模板类型
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {(Object.entries(SOUL_TEMPLATES) as [SoulTemplate, { name: string; description: string }][]).map(([key, template]) => (
                          <button
                            key={key}
                            className={`p-4 rounded-lg border text-left transition-colors ${
                              personaConfig.soulTemplate === key
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleSoulTemplateChange(key)}
                          >
                            <div className="font-medium mb-1">{template.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {template.description}
                            </div>
                          </button>
                        ))}
                      </div>

                      {personaConfig.soulTemplate === 'custom' && (
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="custom-soul">自定义 SOUL 模板内容</Label>
                          <Textarea
                            id="custom-soul"
                            placeholder="输入自定义 SOUL 模板内容..."
                            className="min-h-[150px]"
                            value={personaConfig.soulTemplateCustom || ''}
                            onChange={(e) => setPersonaConfig(prev => prev ? {
                              ...prev,
                              soulTemplateCustom: e.target.value,
                              status: 'draft',
                            } : null)}
                          />
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
                          查看角色配置的变更历史和操作记录
                        </p>
                      </div>

                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {auditHistory.map(entry => (
                            <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                              <div className="mt-1">
                                {entry.action === 'create' && <Plus className="h-4 w-4 text-green-500" />}
                                {entry.action === 'update' && <Settings className="h-4 w-4 text-blue-500" />}
                                {entry.action === 'apply' && entry.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                {entry.action === 'apply' && entry.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                {entry.action === 'rollback' && <RotateCcw className="h-4 w-4 text-yellow-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm capitalize">
                                    {entry.action === 'create' ? '创建' :
                                     entry.action === 'update' ? '更新' :
                                     entry.action === 'apply' ? '应用' :
                                     entry.action === 'rollback' ? '回滚' : entry.action}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {entry.actor}
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
                )}

                {/* Action Buttons */}
                {personaConfig && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handlePreview}>
                        <Eye className="h-4 w-4 mr-1" />
                        预览
                      </Button>
                      {personaConfig.version > 1 && (
                        <Button variant="outline" onClick={handleRollback} disabled={isSubmitting}>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          回滚
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {submitMessage && (
                        <span className={`text-sm ${
                          submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {submitMessage.text}
                        </span>
                      )}
                      <Button variant="outline" onClick={handleReset} disabled={isSubmitting}>
                        重置
                      </Button>
                      <Button onClick={handleApply} disabled={isSubmitting || !personaConfig.rolePrompt.trim()}>
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        应用配置
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>配置预览</DialogTitle>
            <DialogDescription>
              预览此 Sub-Agent 的角色配置效果
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <pre className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">
              {previewContent}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
