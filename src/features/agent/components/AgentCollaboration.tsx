/**
 * Agent Collaboration Components for Group Chat
 *
 * I2: 群聊 Agent 协作 UI (FR631-FR649)
 * - FR634: Agent 自动入群
 * - FR639: AI 标识显示
 * - FR641: @提及 Agent
 * - FR640: Agent 默认静默
 * - FR642: Agent 任务通知
 * - FR643: Agent 数据卡片
 * - FR644: Agent 进度汇报
 */

import { useState } from 'react'
import {
  Bot,
  Bell,
  BellOff,
  CheckCircle2,
  Loader2,
  AtSign,
  BarChart3,
  FileText,
  AlertCircle,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react'

// ==================== Types ====================

/** Agent 在群组中的行为模式 */
export type AgentBehavior = 'proactive' | 'reactive' | 'silent'

/** Agent 入群方式 */
export type AgentJoinMode = 'auto' | 'invited' | 'manual'

/** Agent 群成员扩展 */
export interface AgentGroupMember {
  id: string
  agentId: string
  name: string
  avatar?: string
  behavior: AgentBehavior
  joinMode: AgentJoinMode
  capabilities: string[]
  isMuted: boolean
  joinedAt: string
}

/** @提及目标 */
export interface MentionTarget {
  id: string
  name: string
  type: 'agent' | 'user'
  avatar?: string
  capabilities?: string[]
}

/** Agent 任务通知 */
export interface AgentTaskNotification {
  id: string
  agentId: string
  agentName: string
  taskId: string
  taskName: string
  status: 'started' | 'in_progress' | 'completed' | 'failed'
  progress?: number
  message: string
  timestamp: string
}

/** Agent 数据卡片 */
export interface AgentDataCard {
  id: string
  agentId: string
  title: string
  type: 'chart' | 'table' | 'metric' | 'text'
  data: Record<string, unknown>
  timestamp: string
}

/** Agent 进度汇报 */
export interface AgentProgressReport {
  id: string
  agentId: string
  agentName: string
  taskName: string
  step: string
  stepIndex: number
  totalSteps: number
  status: 'running' | 'paused' | 'done' | 'error'
  detail?: string
  timestamp: string
}

// ==================== Agent Identity Badge ====================

interface AgentBadgeProps {
  agent: { name: string; behavior: AgentBehavior; isMuted: boolean }
  size?: 'sm' | 'md'
}

export function AgentBadge({ agent, size = 'sm' }: AgentBadgeProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  return (
    <span className="inline-flex items-center gap-1">
      <Bot className={iconSize} style={{ color: 'var(--ao-infoForeground)' }} />
      {agent.isMuted && <BellOff className="h-2.5 w-2.5" style={{ color: 'var(--ao-workbench-secondaryForeground)' }} />}
    </span>
  )
}

// ==================== Agent Mention Input ====================

interface AgentMentionInputProps {
  agents: MentionTarget[]
  onSelect: (target: MentionTarget) => void
  query: string
}

export function AgentMentionInput({ agents, onSelect, query }: AgentMentionInputProps) {
  const [open, setOpen] = useState(false)

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase())
  )

  if (!open || filtered.length === 0) return null

  return (
    <div
      className="absolute bottom-full left-0 mb-1 w-64 rounded border p-1 shadow-lg"
      style={{ backgroundColor: 'var(--ao-commandPalette.background)', borderColor: 'var(--ao-commandPalette.border)' }}
    >
      <div className="text-xs font-medium px-2 py-1" style={{ color: 'var(--ao-commandPalette.secondaryForeground)' }}>
        <AtSign className="h-3 w-3 inline mr-1" />
        提及 Agent 或成员
      </div>
      {filtered.map((target) => (
        <button
          key={target.id}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors"
          style={{ color: 'var(--ao-commandPalette.foreground)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ao-commandPalette.selectedBackground)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          onClick={() => { onSelect(target); setOpen(false) }}
        >
          {target.type === 'agent' ? (
            <Bot className="h-4 w-4" style={{ color: 'var(--ao-infoForeground)' }} />
          ) : (
            <AtSign className="h-4 w-4" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
          )}
          <span className="flex-1 text-left">{target.name}</span>
          {target.capabilities && target.capabilities.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
              {target.capabilities.length} 项能力
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ==================== Task Notification Card ====================

interface TaskNotificationCardProps {
  notification: AgentTaskNotification
  onDismiss?: (id: string) => void
}

const TASK_STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; colorVar: string }> = {
  started: { icon: Zap, colorVar: 'var(--ao-infoForeground)' },
  in_progress: { icon: Loader2, colorVar: 'var(--ao-infoForeground)' },
  completed: { icon: CheckCircle2, colorVar: 'var(--ao-successForeground)' },
  failed: { icon: AlertCircle, colorVar: 'var(--ao-errorForeground)' },
}

export function TaskNotificationCard({ notification, onDismiss }: TaskNotificationCardProps) {
  const config = TASK_STATUS_CONFIG[notification.status]
  const Icon = config.icon

  return (
    <div
      className="rounded border p-3"
      style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-bottomPanel.border)' }}
    >
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: config.colorVar }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Bot className="h-3 w-3" style={{ color: 'var(--ao-infoForeground)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--ao-infoForeground)' }}>
              {notification.agentName}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ao-bottomPanel.activeForeground)' }}>
            {notification.taskName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
            {notification.message}
          </p>
          {notification.progress !== undefined && (
            <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ao-bottomPanel.activeBackground)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${notification.progress}%`, backgroundColor: config.colorVar }}
              />
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(notification.id)}
            className="shrink-0 rounded p-0.5"
            style={{ color: 'var(--ao-workbench.secondaryForeground)' }}
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}

// ==================== Agent Data Card ====================

interface AgentDataCardProps {
  card: AgentDataCard
}

const DATA_TYPE_ICON: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  chart: BarChart3,
  table: FileText,
  metric: BarChart3,
  text: FileText,
}

export function AgentDataCardComponent({ card }: AgentDataCardProps) {
  const Icon = DATA_TYPE_ICON[card.type] || FileText

  return (
    <div
      className="rounded border p-3"
      style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-bottomPanel.border)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color: 'var(--ao-infoForeground)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--ao-bottomPanel.activeForeground)' }}>
          {card.title}
        </span>
      </div>
      <div className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
        {card.type === 'metric' && card.data.value !== undefined && (
          <span className="text-lg font-bold" style={{ color: 'var(--ao-bottomPanel.activeForeground)' }}>
            {String(card.data.value)}
          </span>
        )}
        {card.type === 'text' && String(card.data.content ?? '') && (
          <p>{String(card.data.content)}</p>
        )}
        {(card.type === 'chart' || card.type === 'table') && (
          <p className="italic">数据卡片渲染待实现</p>
        )}
      </div>
    </div>
  )
}

// ==================== Agent Progress Report ====================

interface ProgressReportProps {
  report: AgentProgressReport
}

export function AgentProgressReportCard({ report }: ProgressReportProps) {
  const progressPct = report.totalSteps > 0
    ? Math.round((report.stepIndex / report.totalSteps) * 100)
    : 0

  return (
    <div
      className="rounded border p-3"
      style={{ backgroundColor: 'var(--ao-bottomPanel.background)', borderColor: 'var(--ao-bottomPanel.border)' }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Bot className="h-4 w-4" style={{ color: 'var(--ao-infoForeground)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--ao-infoForeground)' }}>
          {report.agentName}
        </span>
        <span className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
          {report.stepIndex}/{report.totalSteps}
        </span>
      </div>
      <p className="text-sm" style={{ color: 'var(--ao-bottomPanel.activeForeground)' }}>
        {report.taskName} — {report.step}
      </p>
      {report.detail && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
          {report.detail}
        </p>
      )}
      <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ao-bottomPanel.activeBackground)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progressPct}%`,
            backgroundColor: report.status === 'error' ? 'var(--ao-errorForeground)' : 'var(--ao-infoForeground)',
          }}
        />
      </div>
    </div>
  )
}

// ==================== Agent Behavior Toggle ====================

interface AgentBehaviorToggleProps {
  behavior: AgentBehavior
  isMuted: boolean
  onBehaviorChange: (behavior: AgentBehavior) => void
  onMuteToggle: () => void
}

export function AgentBehaviorToggle({ behavior, isMuted, onBehaviorChange, onMuteToggle }: AgentBehaviorToggleProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={onMuteToggle}
        className="rounded p-1 transition-colors"
        style={{ color: isMuted ? 'var(--ao-workbench.secondaryForeground)' : 'var(--ao-infoForeground)' }}
        title={isMuted ? '取消静默' : '静默 Agent'}
      >
        {isMuted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={() => setExpanded(!expanded)}
        className="rounded p-1 transition-colors"
        style={{ color: 'var(--ao-workbench.secondaryForeground)' }}
      >
        <Shield className="h-3.5 w-3.5" />
      </button>
      {expanded && (
        <div className="flex gap-0.5">
          {(['proactive', 'reactive', 'silent'] as const).map((b) => (
            <button
              key={b}
              onClick={() => onBehaviorChange(b)}
              className="rounded px-1.5 py-0.5 text-xs transition-colors"
              style={{
                backgroundColor: behavior === b ? 'var(--ao-bottomPanel.activeBackground)' : 'transparent',
                color: behavior === b ? 'var(--ao-bottomPanel.activeForeground)' : 'var(--ao-workbench.secondaryForeground)',
              }}
            >
              {b === 'proactive' ? '主动' : b === 'reactive' ? '被动' : '静默'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
