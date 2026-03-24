/**
 * Agent Group Participant - Story 11.5
 * Agent群聊参与 - 在策略管控下允许 Agent 参与群组聊天
 *
 * 功能：
 * - 在策略允许下显示 Agent 在群聊中的存在
 * - 显示 AI 身份标识和发言规则
 * - 支持提及驱动的和事件驱动的参与方式
 *
 * 铁律合规：
 * - FR619, FR620, FR621, FR639, FR640, FR641, FR642, FR643, FR644, FR645, FR646, FR649
 * - NFR16
 * - ADR-037
 */

import { useState, useMemo } from 'react'
import {
  Bot,
  AtSign,
  Bell,
  BellOff,
  Clock,
  Zap,
  Settings,
  Users,
  ChevronDown,
  AlertTriangle,
  VolumeX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
export type AgentRole = 'assistant' | 'moderator' | 'observer'

export type AgentStatus = 'active' | 'idle' | 'processing' | 'disabled'

export type ParticipationMode = 'mention' | 'event' | 'auto' | 'disabled'

export interface AgentIdentity {
  id: string
  name: string
  avatar?: string
  role: AgentRole
  description?: string
  capabilities: string[]
  status: AgentStatus
  participationMode: ParticipationMode
  isMuted: boolean
  lastActive?: string
  conversationId?: string
}

export interface AgentMention {
  id: string
  agentId: string
  agentName: string
  messageId: string
  mentionedBy: string
  mentionedAt: string
  context?: string
}

export interface AgentEvent {
  id: string
  agentId: string
  agentName: string
  eventType: 'join' | 'leave' | 'mention' | 'action' | 'alert'
  message: string
  timestamp: string
  groupId: string
  groupName: string
}

export interface ParticipationPolicy {
  id: string
  name: string
  allowMention: boolean
  allowAutoRespond: boolean
  maxResponsesPerHour: number
  restrictedTopics?: string[]
  requireApproval: boolean
}

export interface AgentGroupParticipantStats {
  totalAgents: number
  activeAgents: number
  mentionsToday: number
  autoResponsesToday: number
}

export interface AgentGroupParticipantProps {
  agents: AgentIdentity[]
  groupId: string
  groupName: string
  currentUserId: string
  mentions?: AgentMention[]
  events?: AgentEvent[]
  policies?: ParticipationPolicy[]
  onAgentToggle?: (agentId: string, enabled: boolean) => void
  onAgentMute?: (agentId: string, muted: boolean) => void
  onAgentModeChange?: (agentId: string, mode: ParticipationMode) => void
  onPolicyUpdate?: (policy: ParticipationPolicy) => void
  onMentionAgent?: (agentId: string, context?: string) => void
}

// Mock data
const MOCK_AGENTS: AgentIdentity[] = [
  {
    id: 'agent-1',
    name: '代码助手',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=code',
    role: 'assistant',
    description: '帮助编写和审查代码',
    capabilities: ['代码生成', '代码审查', '调试辅助'],
    status: 'active',
    participationMode: 'mention',
    isMuted: false,
    lastActive: '10:35',
    conversationId: 'group-1',
  },
  {
    id: 'agent-2',
    name: '会议助手',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=meeting',
    role: 'assistant',
    description: '协助安排和管理会议',
    capabilities: ['日程管理', '会议记录', '提醒通知'],
    status: 'idle',
    participationMode: 'event',
    isMuted: false,
    lastActive: '09:20',
    conversationId: 'group-1',
  },
  {
    id: 'agent-3',
    name: '文档助手',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=doc',
    role: 'moderator',
    description: '帮助整理和搜索文档',
    capabilities: ['文档检索', '内容总结', '翻译协助'],
    status: 'processing',
    participationMode: 'auto',
    isMuted: true,
    lastActive: '10:30',
    conversationId: 'group-1',
  },
]

const MOCK_MENTIONS: AgentMention[] = [
  {
    id: 'mention-1',
    agentId: 'agent-1',
    agentName: '代码助手',
    messageId: 'msg-1',
    mentionedBy: '张小明',
    mentionedAt: '10:35',
    context: '请帮我看看这段代码',
  },
]

const MOCK_EVENTS: AgentEvent[] = [
  {
    id: 'event-1',
    agentId: 'agent-1',
    agentName: '代码助手',
    eventType: 'join',
    message: '代码助手加入了群聊',
    timestamp: '10:30',
    groupId: 'group-1',
    groupName: '技术部交流群',
  },
  {
    id: 'event-2',
    agentId: 'agent-2',
    agentName: '会议助手',
    eventType: 'action',
    message: '会议助手已发送会议提醒',
    timestamp: '10:00',
    groupId: 'group-1',
    groupName: '技术部交流群',
  },
  {
    id: 'event-3',
    agentId: 'agent-1',
    agentName: '代码助手',
    eventType: 'alert',
    message: '检测到代码质量问题',
    timestamp: '10:35',
    groupId: 'group-1',
    groupName: '技术部交流群',
  },
]

const MOCK_POLICIES: ParticipationPolicy[] = [
  {
    id: 'policy-1',
    name: '默认策略',
    allowMention: true,
    allowAutoRespond: false,
    maxResponsesPerHour: 10,
    requireApproval: false,
  },
  {
    id: 'policy-2',
    name: '严格策略',
    allowMention: true,
    allowAutoRespond: false,
    maxResponsesPerHour: 5,
    restrictedTopics: ['人事', '财务'],
    requireApproval: true,
  },
]

// Calculate stats
function calculateStats(agents: AgentIdentity[], mentions: AgentMention[], events: AgentEvent[]): AgentGroupParticipantStats {
  const today = new Date().toDateString()
  const mentionsToday = mentions.filter(m => new Date(m.mentionedAt).toDateString() === today).length
  const autoResponsesToday = events.filter(e =>
    e.eventType === 'action' && new Date(e.timestamp).toDateString() === today
  ).length

  return {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active' || a.status === 'processing').length,
    mentionsToday,
    autoResponsesToday,
  }
}

// Get role badge color and text
function getAgentRoleBadge(role: AgentRole): { color: string; text: string } {
  switch (role) {
    case 'assistant':
      return { color: 'bg-blue-100 text-blue-700 border-blue-200', text: '助手' }
    case 'moderator':
      return { color: 'bg-purple-100 text-purple-700 border-purple-200', text: '协调员' }
    case 'observer':
      return { color: 'bg-gray-100 text-gray-700 border-gray-200', text: '观察员' }
    default:
      return { color: 'bg-gray-100 text-gray-700 border-gray-200', text: '未知' }
  }
}

// Get status color and text
function getAgentStatusBadge(status: AgentStatus): { color: string; text: string; icon: typeof Zap } {
  switch (status) {
    case 'active':
      return { color: 'bg-green-100 text-green-700 border-green-200', text: '活跃', icon: Zap }
    case 'idle':
      return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', text: '空闲', icon: Clock }
    case 'processing':
      return { color: 'bg-blue-100 text-blue-700 border-blue-200', text: '处理中', icon: Bot }
    case 'disabled':
      return { color: 'bg-gray-100 text-gray-700 border-gray-200', text: '已禁用', icon: BellOff }
    default:
      return { color: 'bg-gray-100 text-gray-700 border-gray-200', text: '未知', icon: Bot }
  }
}

// Get participation mode text
function getParticipationModeText(mode: ParticipationMode): string {
  switch (mode) {
    case 'mention':
      return '提及响应'
    case 'event':
      return '事件驱动'
    case 'auto':
      return '自动参与'
    case 'disabled':
      return '已禁用'
    default:
      return '未知'
  }
}

// Get event type color
function getEventTypeColor(type: AgentEvent['eventType']): string {
  switch (type) {
    case 'join':
      return 'text-green-600 bg-green-50'
    case 'leave':
      return 'text-red-600 bg-red-50'
    case 'mention':
      return 'text-blue-600 bg-blue-50'
    case 'action':
      return 'text-purple-600 bg-purple-50'
    case 'alert':
      return 'text-yellow-600 bg-yellow-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

// Agent item component
interface AgentItemProps {
  agent: AgentIdentity
  onToggle?: (enabled: boolean) => void
  onMute?: (muted: boolean) => void
  onModeChange?: (mode: ParticipationMode) => void
  onMention?: () => void
}

function AgentItem({ agent, onToggle, onMute, onModeChange, onMention }: AgentItemProps) {
  const roleBadge = getAgentRoleBadge(agent.role)
  const statusBadge = getAgentStatusBadge(agent.status)

  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
      {/* Avatar with bot indicator */}
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={agent.avatar} />
          <AvatarFallback className="bg-blue-100 text-blue-600">
            <Bot className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
          <Bot className="h-3 w-3 text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-slate-800">{agent.name}</span>
          <Badge variant="secondary" className={`text-xs ${roleBadge.color}`}>
            {roleBadge.text}
          </Badge>
          <Badge variant="secondary" className={`text-xs ${statusBadge.color}`}>
            <statusBadge.icon className="h-3 w-3 mr-1" />
            {statusBadge.text}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 mb-2">{agent.description}</p>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1 mb-2">
          {agent.capabilities.map((cap, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {cap}
            </Badge>
          ))}
        </div>

        {/* Mode and controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">参与模式：</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  {getParticipationModeText(agent.participationMode)}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => onModeChange?.('mention')}>
                  <AtSign className="h-4 w-4 mr-2" />
                  提及响应
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onModeChange?.('event')}>
                  <Bell className="h-4 w-4 mr-2" />
                  事件驱动
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onModeChange?.('auto')}>
                  <Zap className="h-4 w-4 mr-2" />
                  自动参与
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onModeChange?.('disabled')}>
                  <BellOff className="h-4 w-4 mr-2" />
                  已禁用
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onMention} disabled={agent.isMuted || agent.status === 'disabled'}>
              <AtSign className="h-4 w-4 mr-1" />
              提及
            </Button>
          </div>
        </div>
      </div>

      {/* Toggle and mute */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={`agent-${agent.id}`} className="text-xs text-slate-500">
            {agent.isMuted ? '已静音' : '启用'}
          </Label>
          <Switch
            id={`agent-${agent.id}`}
            checked={!agent.isMuted && agent.status !== 'disabled'}
            onCheckedChange={(checked) => {
              onToggle?.(checked)
              if (checked) onMute?.(false)
            }}
          />
        </div>
        {!agent.isMuted && agent.status !== 'disabled' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-slate-500"
            onClick={() => onMute?.(!agent.isMuted)}
          >
            <VolumeX className="h-3 w-3 mr-1" />
            静音
          </Button>
        )}
      </div>
    </div>
  )
}

// Event item component
interface EventItemProps {
  event: AgentEvent
}

function EventItem({ event }: EventItemProps) {
  const colorClass = getEventTypeColor(event.eventType)

  const getEventIcon = () => {
    switch (event.eventType) {
      case 'join':
        return <Users className="h-4 w-4" />
      case 'leave':
        return <Users className="h-4 w-4" />
      case 'mention':
        return <AtSign className="h-4 w-4" />
      case 'action':
        return <Zap className="h-4 w-4" />
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${colorClass}`}>
      <div className="mt-0.5">{getEventIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{event.agentName}</span>
          <span className="text-xs opacity-70">{event.timestamp}</span>
        </div>
        <p className="text-sm">{event.message}</p>
      </div>
    </div>
  )
}

// Mention item component
interface MentionItemProps {
  mention: AgentMention
  onClick?: () => void
}

function MentionItem({ mention, onClick }: MentionItemProps) {
  return (
    <div
      className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer"
      onClick={onClick}
    >
      <AtSign className="h-5 w-5 text-blue-500 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-800">{mention.agentName}</span>
          <span className="text-xs text-blue-500">被 @{mention.mentionedBy} 提及</span>
          <span className="text-xs text-blue-400">{mention.mentionedAt}</span>
        </div>
        {mention.context && (
          <p className="text-sm text-blue-700 mt-1">{mention.context}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Agent Group Participant Component
 */
export function AgentGroupParticipant({
  agents: initialAgents,
  groupId: _groupId,
  groupName: _groupName,
  currentUserId: _currentUserId,
  mentions: initialMentions,
  events: initialEvents,
  policies: initialPolicies,
  onAgentToggle,
  onAgentMute,
  onAgentModeChange,
  onPolicyUpdate,
  onMentionAgent,
}: AgentGroupParticipantProps) {
  const [agents, setAgents] = useState<AgentIdentity[]>(initialAgents || MOCK_AGENTS)
  const [mentions] = useState<AgentMention[]>(initialMentions || MOCK_MENTIONS)
  const [events] = useState<AgentEvent[]>(initialEvents || MOCK_EVENTS)
  const [policies] = useState<ParticipationPolicy[]>(initialPolicies || MOCK_POLICIES)
  const [showPolicyDialog, setShowPolicyDialog] = useState(false)
  const [selectedPolicy] = useState<ParticipationPolicy>(policies[0] || MOCK_POLICIES[0])
  const [activeTab, setActiveTab] = useState<string>('agents')

  // Stats
  const stats = useMemo(() => calculateStats(agents, mentions, events), [agents, mentions, events])

  // Handle agent toggle
  const handleToggle = (agentId: string, enabled: boolean) => {
    setAgents(prev =>
      prev.map(a =>
        a.id === agentId
          ? { ...a, status: enabled ? 'active' : 'disabled' }
          : a
      )
    )
    onAgentToggle?.(agentId, enabled)
  }

  // Handle mute
  const handleMute = (agentId: string, muted: boolean) => {
    setAgents(prev =>
      prev.map(a =>
        a.id === agentId ? { ...a, isMuted: muted } : a
      )
    )
    onAgentMute?.(agentId, muted)
  }

  // Handle mode change
  const handleModeChange = (agentId: string, mode: ParticipationMode) => {
    setAgents(prev =>
      prev.map(a =>
        a.id === agentId ? { ...a, participationMode: mode } : a
      )
    )
    onAgentModeChange?.(agentId, mode)
  }

  // Handle mention
  const handleMention = (agentId: string) => {
    onMentionAgent?.(agentId)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-800">Agent 参与</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPolicyDialog(true)}>
            <Settings className="h-4 w-4 mr-1" />
            策略设置
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-slate-800">{stats.totalAgents}</div>
            <div className="text-xs text-slate-500">Agent 总数</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-600">{stats.activeAgents}</div>
            <div className="text-xs text-slate-500">活跃</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{stats.mentionsToday}</div>
            <div className="text-xs text-slate-500">今日提及</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-600">{stats.autoResponsesToday}</div>
            <div className="text-xs text-slate-500">自动响应</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-white px-4">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="mentions">提及</TabsTrigger>
          <TabsTrigger value="events">事件</TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {agents.map(agent => (
                <AgentItem
                  key={agent.id}
                  agent={agent}
                  onToggle={(enabled) => handleToggle(agent.id, enabled)}
                  onMute={(muted) => handleMute(agent.id, muted)}
                  onModeChange={(mode) => handleModeChange(agent.id, mode)}
                  onMention={() => handleMention(agent.id)}
                />
              ))}

              {agents.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Bot className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>暂无 Agent 加入此群聊</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Mentions Tab */}
        <TabsContent value="mentions" className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {mentions.map(mention => (
                <MentionItem
                  key={mention.id}
                  mention={mention}
                  onClick={() => handleMention(mention.agentId)}
                />
              ))}

              {mentions.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <AtSign className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>暂无 Agent 被提及</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {events.map(event => (
                <EventItem key={event.id} event={event} />
              ))}

              {events.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>暂无 Agent 事件</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Policy Dialog */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>参与策略设置</DialogTitle>
            <DialogDescription>
              配置 Agent 在群聊中的参与规则
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="policy-1" className="mt-4">
            <TabsList className="w-full">
              {policies.map(policy => (
                <TabsTrigger key={policy.id} value={policy.id} className="flex-1">
                  {policy.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {policies.map(policy => (
              <TabsContent key={policy.id} value={policy.id} className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={`allow-mention-${policy.id}`}>允许提及</Label>
                    <p className="text-xs text-slate-500">成员可以通过 @ 提及 Agent</p>
                  </div>
                  <Switch id={`allow-mention-${policy.id}`} defaultChecked={policy.allowMention} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={`allow-auto-${policy.id}`}>允许自动响应</Label>
                    <p className="text-xs text-slate-500">Agent 可以自动响应特定事件</p>
                  </div>
                  <Switch id={`allow-auto-${policy.id}`} defaultChecked={policy.allowAutoRespond} />
                </div>

                <div className="space-y-2">
                  <Label>每小时最大响应次数</Label>
                  <div className="text-2xl font-bold">{policy.maxResponsesPerHour}</div>
                </div>

                {policy.restrictedTopics && policy.restrictedTopics.length > 0 && (
                  <div className="space-y-2">
                    <Label>限制话题</Label>
                    <div className="flex flex-wrap gap-1">
                      {policy.restrictedTopics.map(topic => (
                        <Badge key={topic} variant="secondary">{topic}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={`require-approval-${policy.id}`}>需要审批</Label>
                    <p className="text-xs text-slate-500">Agent 的响应需要人工审批</p>
                  </div>
                  <Switch id={`require-approval-${policy.id}`} defaultChecked={policy.requireApproval} />
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPolicyDialog(false)}>
              取消
            </Button>
            <Button onClick={() => {
              onPolicyUpdate?.(selectedPolicy)
              setShowPolicyDialog(false)
            }}>
              保存设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
