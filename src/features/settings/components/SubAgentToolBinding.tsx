import { useCallback, useMemo, useState } from 'react'
import {
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  History,
  Loader2,
  Plus,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import {
  SETTINGS_MCP_TOOLS,
  SETTINGS_SKILLS,
  SETTINGS_SUB_AGENT_OPTIONS,
  SHARED_SKILL_SOURCE_META,
  SHARED_SKILL_SOURCE_ORDER,
  type SharedSkillSource,
} from './subAgentSettingsFixtures'

export type ToolBindingStatus = 'draft' | 'pending' | 'applied' | 'failed' | 'rollback'
export type SubAgentToolPolicy = 'auto_approve' | 'manual_approve' | 'deny'
export type SkillLevel = 'basic' | 'intermediate' | 'advanced' | 'expert'

export interface MCPToolBinding {
  id: string
  toolId: string
  toolName: string
  toolDescription: string
  enabled: boolean
}

export interface SkillBinding {
  id: string
  skillId: string
  skillName: string
  skillDescription: string
  level: SkillLevel
  source: SharedSkillSource
  enabled: boolean
  approvePolicy: SubAgentToolPolicy
}

export interface ToolBindingAuditEntry {
  id: string
  timestamp: string
  action: 'bind' | 'unbind' | 'apply' | 'rollback'
  actor: string
  targetType: 'mcp_tool' | 'skill'
  targetName: string
  status: 'success' | 'failed'
  errorMessage?: string
}

export interface SubAgentToolBindingProps {
  className?: string
}

const POLICY_OPTIONS: Array<{ value: SubAgentToolPolicy; label: string }> = [
  { value: 'auto_approve', label: '自动批准' },
  { value: 'manual_approve', label: '手动批准' },
  { value: 'deny', label: '拒绝' },
]

const LEVEL_META: Record<SkillLevel, string> = {
  basic: '基础',
  intermediate: '中级',
  advanced: '高级',
  expert: '专家',
}

const AUDIT_HISTORY: ToolBindingAuditEntry[] = [
  { id: 'audit-1', timestamp: '2026-03-24T10:30:00Z', action: 'apply', actor: 'admin', targetType: 'mcp_tool', targetName: '项目文档中心', status: 'success' },
  { id: 'audit-2', timestamp: '2026-03-24T09:15:00Z', action: 'bind', actor: 'user-001', targetType: 'skill', targetName: '文档起草', status: 'success' },
  { id: 'audit-3', timestamp: '2026-03-23T14:20:00Z', action: 'rollback', actor: 'admin', targetType: 'skill', targetName: '规则校验', status: 'failed', errorMessage: '当前租户策略不允许继续发布该绑定。' },
]

function createMcpBindings(agentId: string): MCPToolBinding[] {
  const selected = SETTINGS_SUB_AGENT_OPTIONS.find((item) => item.id === agentId)
  if (!selected) return []
  return selected.suggestedMcpTools
    .map((toolId, index) => {
      const tool = SETTINGS_MCP_TOOLS.find((item) => item.id === toolId)
      return tool
        ? { id: `mcp-${agentId}-${index}`, toolId: tool.id, toolName: tool.name, toolDescription: tool.description, enabled: true }
        : null
    })
    .filter((item): item is MCPToolBinding => Boolean(item))
}

function createSkillBindings(agentId: string): SkillBinding[] {
  const selected = SETTINGS_SUB_AGENT_OPTIONS.find((item) => item.id === agentId)
  if (!selected) return []
  return selected.suggestedSkills
    .map((skillName, index) => {
      const skill = SETTINGS_SKILLS.find(
        (item) => item.name === skillName || item.id.includes(skillName.replace(/-/g, '_')),
      )
      return skill
        ? {
            id: `skill-${agentId}-${index}`,
            skillId: skill.id,
            skillName: skill.name,
            skillDescription: skill.description,
            level: skill.level,
            source: skill.source,
            enabled: true,
            approvePolicy: index === 0 ? 'auto_approve' : 'manual_approve',
          }
        : null
    })
    .filter((item): item is SkillBinding => Boolean(item))
}

export function SubAgentToolBinding({ className = '' }: SubAgentToolBindingProps) {
  const [selectedSubAgentId, setSelectedSubAgentId] = useState<string | null>(null)
  const [mcpBindings, setMcpBindings] = useState<MCPToolBinding[]>([])
  const [skillBindings, setSkillBindings] = useState<SkillBinding[]>([])
  const [dialog, setDialog] = useState<'mcp' | 'skill' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const selectedSubAgent = useMemo(
    () => SETTINGS_SUB_AGENT_OPTIONS.find((item) => item.id === selectedSubAgentId) ?? null,
    [selectedSubAgentId],
  )

  const sourceSummary = useMemo(
    () =>
      SHARED_SKILL_SOURCE_ORDER.map((source) => ({
        source,
        meta: SHARED_SKILL_SOURCE_META[source],
        total: skillBindings.filter((item) => item.source === source).length,
      })),
    [skillBindings],
  )

  const availableMcpTools = useMemo(() => {
    const boundIds = new Set(mcpBindings.map((item) => item.toolId))
    return SETTINGS_MCP_TOOLS.filter((tool) => !boundIds.has(tool.id))
  }, [mcpBindings])

  const availableSkillsBySource = useMemo(() => {
    const boundIds = new Set(skillBindings.map((item) => item.skillId))
    return SHARED_SKILL_SOURCE_ORDER.map((source) => ({
      source,
      meta: SHARED_SKILL_SOURCE_META[source],
      skills: SETTINGS_SKILLS.filter((skill) => skill.source === source && !boundIds.has(skill.id)),
    })).filter((group) => group.skills.length > 0)
  }, [skillBindings])

  const handleSelectSubAgent = useCallback((agentId: string) => {
    setSelectedSubAgentId(agentId)
    setMcpBindings(createMcpBindings(agentId))
    setSkillBindings(createSkillBindings(agentId))
    setMessage(null)
  }, [])

  const handleApply = useCallback(async () => {
    setIsSubmitting(true)
    setMessage(null)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setIsSubmitting(false)
    setMessage('绑定配置已写入当前用户主 Agent 的能力清单。')
  }, [])

  return (
    <div className={cn('space-y-6', className)}>
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Wrench className="h-6 w-6" />
            Sub-Agent 工具绑定
          </h2>
          <p className="text-muted-foreground">
            当前用户主 Agent 下的 Sub-Agent 从平台内置、部门内置、用户安装三类来源绑定能力，避免所有能力混成同一种绿色标签。
          </p>
        </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="mb-4 flex items-center gap-2 font-medium">
                <Bot className="h-4 w-4" />
                选择 Sub-Agent
              </h3>
              <div className="space-y-2">
                {SETTINGS_SUB_AGENT_OPTIONS.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleSelectSubAgent(agent.id)}
                    className={cn(
                      'w-full rounded-lg border p-3 text-left transition-colors',
                      selectedSubAgentId === agent.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                      !agent.enabled && 'opacity-50',
                    )}
                    disabled={!agent.enabled}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      {agent.enabled ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{agent.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-8">
          {!selectedSubAgent ? (
            <Card>
              <CardContent className="py-0">
                <EmptyState title="请选择 Sub-Agent" description="先从左侧选择一个 Sub-Agent，再配置它的原子工具、MCP 和 Skills。" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <div className="mb-6 space-y-4 border-b pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{selectedSubAgent.name}</div>
                      <div className="text-xs text-muted-foreground">{selectedSubAgent.defaultRole}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{mcpBindings.length} MCP</Badge>
                      <Badge variant="secondary">{skillBindings.length} Skills</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sourceSummary.map((item) => (
                      <Badge key={item.source} variant="outline" className={cn('text-xs', item.meta.className)}>
                        {item.meta.shortLabel} {item.total}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Tabs defaultValue="skills">
                  <TabsList className="mb-4">
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="mcp">MCP 工具</TabsTrigger>
                    <TabsTrigger value="audit">审计历史</TabsTrigger>
                  </TabsList>

                  <TabsContent value="skills" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="flex items-center gap-2 font-medium">
                          <Zap className="h-4 w-4" />
                          Skill 来源
                        </h4>
                        <p className="text-xs text-muted-foreground">绑定页按来源分组，运行页按来源留痕。</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setDialog('skill')}>
                        <Plus className="mr-1 h-4 w-4" />
                        绑定 Skill
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {skillBindings.map((binding) => (
                        <div key={binding.id} className="flex items-start gap-3 rounded-lg border p-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="font-medium">{binding.skillName}</span>
                              <Badge variant="outline" className="text-xs">{binding.skillId}</Badge>
                              <Badge variant="secondary" className="text-xs">{LEVEL_META[binding.level]}</Badge>
                              <Badge variant="outline" className={cn('text-xs', SHARED_SKILL_SOURCE_META[binding.source].className)}>
                                {SHARED_SKILL_SOURCE_META[binding.source].shortLabel}
                              </Badge>
                            </div>
                            <p className="mb-2 text-sm text-muted-foreground">{binding.skillDescription}</p>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">审批策略</Label>
                              <select
                                className="rounded border px-2 py-1 text-xs"
                                value={binding.approvePolicy}
                                onChange={(event) =>
                                  setSkillBindings((prev) =>
                                    prev.map((item) =>
                                      item.id === binding.id ? { ...item, approvePolicy: event.target.value as SubAgentToolPolicy } : item,
                                    ),
                                  )
                                }
                              >
                                {POLICY_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSkillBindings((prev) => prev.map((item) => item.id === binding.id ? { ...item, enabled: !item.enabled } : item))}>
                              {binding.enabled ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setSkillBindings((prev) => prev.filter((item) => item.id !== binding.id))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="mcp" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="flex items-center gap-2 font-medium">
                          <Wrench className="h-4 w-4" />
                          MCP 工具
                        </h4>
                        <p className="text-xs text-muted-foreground">保留少量、原子化、职责明确的可调用工具。</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setDialog('mcp')}>
                        <Plus className="mr-1 h-4 w-4" />
                        绑定工具
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {mcpBindings.map((binding) => (
                        <div key={binding.id} className="flex items-start gap-3 rounded-lg border p-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="font-medium">{binding.toolName}</span>
                              <Badge variant="outline" className="text-xs">{binding.toolId}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{binding.toolDescription}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMcpBindings((prev) => prev.map((item) => item.id === binding.id ? { ...item, enabled: !item.enabled } : item))}>
                              {binding.enabled ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setMcpBindings((prev) => prev.filter((item) => item.id !== binding.id))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="audit">
                    <div>
                      <h4 className="mb-3 flex items-center gap-2 font-medium">
                        <History className="h-4 w-4" />
                        审计历史
                      </h4>
                      <div className="space-y-3">
                        {AUDIT_HISTORY.map((entry) => (
                          <div key={entry.id} className="rounded-lg border p-3 text-sm">
                            <div className="mb-1 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{entry.targetType === 'mcp_tool' ? 'MCP 工具' : 'Skill'}</Badge>
                              <span className="font-medium">{entry.targetName}</span>
                              <Badge variant={entry.status === 'success' ? 'secondary' : 'destructive'} className="text-xs">
                                {entry.status === 'success' ? '成功' : '失败'}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{entry.action} · {entry.actor} · {new Date(entry.timestamp).toLocaleString('zh-CN')}</div>
                            {entry.errorMessage ? <div className="mt-1 text-xs text-red-500">{entry.errorMessage}</div> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
                  {message ? <span className="text-sm text-emerald-600">{message}</span> : null}
                  <Button onClick={handleApply} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                    应用绑定
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={dialog === 'mcp'} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>绑定 MCP 工具</DialogTitle>
            <DialogDescription>选择要绑定到当前 Sub-Agent 的原子工具入口。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {availableMcpTools.map((tool) => (
              <button key={tool.id} type="button" className="w-full rounded-lg border p-3 text-left hover:bg-muted/50" onClick={() => { setMcpBindings((prev) => [...prev, { id: `mcp-${Date.now()}`, toolId: tool.id, toolName: tool.name, toolDescription: tool.description, enabled: true }]); setDialog(null) }}>
                <div className="font-medium">{tool.name}</div>
                <div className="text-xs text-muted-foreground">{tool.description}</div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'skill'} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>绑定 Skill</DialogTitle>
            <DialogDescription>按来源分组展示可绑定 Skills，避免平台内置、部门内置和用户安装能力混淆。</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[360px] pr-2">
            <div className="space-y-4">
              {availableSkillsBySource.map((group) => (
                <div key={group.source} className="rounded-lg border p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="outline" className={cn('text-xs', group.meta.className)}>{group.meta.label}</Badge>
                    <span className="text-xs text-muted-foreground">{group.meta.description}</span>
                  </div>
                  <div className="space-y-2">
                    {group.skills.map((skill) => (
                      <button key={skill.id} type="button" className="w-full rounded-lg border p-3 text-left hover:bg-muted/50" onClick={() => { setSkillBindings((prev) => [...prev, { id: `skill-${Date.now()}`, skillId: skill.id, skillName: skill.name, skillDescription: skill.description, level: skill.level, source: skill.source, enabled: true, approvePolicy: 'manual_approve' }]); setDialog(null) }}>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-medium">{skill.name}</span>
                          <Badge variant="secondary" className="text-xs">{LEVEL_META[skill.level]}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{skill.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SubAgentToolBinding
