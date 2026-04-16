/**
 * Message Status Indicator
 *
 * I5: 消息状态追踪 UI (FR622-FR630)
 * 铁律来源: PRD FR622-FR630 消息状态追踪
 *
 * 功能：
 * - FR622: 已发送状态指示
 * - FR623: 已送达状态指示
 * - FR624: 已读回执
 * - FR625: 多端同步状态
 * - FR627: 消息撤回
 * - FR628: 消息编辑
 */

import { useState } from 'react'
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  RotateCcw,
  Pencil,
  Smartphone,
  Monitor,
  Users,
} from 'lucide-react'

/** 消息状态 */
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

/** 多端同步状态 */
export type SyncStatus = 'local_only' | 'syncing' | 'synced' | 'conflict'

/** 消息回执信息 */
export interface MessageReceipt {
  messageId: string
  status: MessageDeliveryStatus
  readBy: ReadReceipt[]
  syncStatus: SyncStatus
  editedAt?: string
  recalledAt?: string
}

/** 已读回执 */
export interface ReadReceipt {
  userId: string
  userName: string
  readAt: string
  device?: string
}

// ==================== Status Icon ====================

interface StatusIconProps {
  status: MessageDeliveryStatus
  className?: string
}

const STATUS_CONFIG: Record<MessageDeliveryStatus, { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; colorVar: string; label: string }> = {
  sending: { icon: Clock, colorVar: 'var(--ao-workbench.secondaryForeground)', label: '发送中' },
  sent: { icon: Check, colorVar: 'var(--ao-workbench.secondaryForeground)', label: '已发送' },
  delivered: { icon: CheckCheck, colorVar: 'var(--ao-workbench.secondaryForeground)', label: '已送达' },
  read: { icon: CheckCheck, colorVar: 'var(--ao-infoForeground)', label: '已读' },
  failed: { icon: AlertCircle, colorVar: 'var(--ao-errorForeground)', label: '发送失败' },
}

export function MessageStatusIcon({ status, className = 'h-3.5 w-3.5' }: StatusIconProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return <Icon className={className} style={{ color: config.colorVar }} />
}

// ==================== Full Status Indicator ====================

interface MessageStatusIndicatorProps {
  receipt: MessageReceipt
  showReadList?: boolean
  onRecall?: () => void
  onEdit?: () => void
}

export function MessageStatusIndicator({
  receipt,
  showReadList = false,
  onRecall,
  onEdit,
}: MessageStatusIndicatorProps) {
  const [expanded, setExpanded] = useState(false)
  const config = STATUS_CONFIG[receipt.status]
  const Icon = config.icon

  return (
    <div className="inline-flex items-center gap-1">
      {/* Status icon + label */}
      <button
        className="flex items-center gap-1 text-xs transition-colors"
        style={{ color: config.colorVar }}
        onClick={() => setExpanded(!expanded)}
        title={config.label}
      >
        <Icon className="h-3.5 w-3.5" />
        {receipt.status === 'read' && receipt.readBy.length > 0 && (
          <span>{receipt.readBy.length}</span>
        )}
      </button>

      {/* Sync indicator */}
      {receipt.syncStatus === 'syncing' && (
        <span className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
          <RotateCcw className="h-3 w-3 inline animate-spin" />
        </span>
      )}

      {/* Edit indicator */}
      {receipt.editedAt && (
        <Pencil className="h-3 w-3" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
      )}

      {/* Recall indicator */}
      {receipt.recalledAt && (
        <span className="text-xs italic" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
          已撤回
        </span>
      )}

      {/* Expanded read list */}
      {expanded && showReadList && receipt.readBy.length > 0 && (
        <div
          className="absolute bottom-full right-0 mb-1 w-48 rounded border p-2 shadow-lg"
          style={{ backgroundColor: 'var(--ao-commandPalette.background)', borderColor: 'var(--ao-commandPalette.border)' }}
        >
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--ao-commandPalette.secondaryForeground)' }}>
            已读 ({receipt.readBy.length})
          </div>
          {receipt.readBy.map((r) => (
            <div key={r.userId} className="flex items-center gap-1.5 py-0.5">
              <span className="text-xs" style={{ color: 'var(--ao-commandPalette.foreground)' }}>
                {r.userName}
              </span>
              {r.device === 'mobile' ? (
                <Smartphone className="h-3 w-3" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
              ) : r.device === 'desktop' ? (
                <Monitor className="h-3 w-3" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
              ) : null}
              <span className="text-xs ml-auto" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
                {new Date(r.readAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {expanded && !receipt.recalledAt && (
        <div className="flex items-center gap-0.5 ml-1">
          {onEdit && receipt.status !== 'failed' && (
            <button
              onClick={onEdit}
              className="rounded p-0.5"
              style={{ color: 'var(--ao-workbench.secondaryForeground)' }}
              title="编辑"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {onRecall && (
            <button
              onClick={onRecall}
              className="rounded p-0.5"
              style={{ color: 'var(--ao-workbench.secondaryForeground)' }}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ==================== Bulk Read Receipt ====================

interface BulkReadReceiptProps {
  totalMembers: number
  readCount: number
  receipts: ReadReceipt[]
}

export function BulkReadReceiptDisplay({ totalMembers, readCount, receipts }: BulkReadReceiptProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs"
        style={{ color: readCount === totalMembers ? 'var(--ao-infoForeground)' : 'var(--ao-workbench.secondaryForeground)' }}
      >
        <Users className="h-3 w-3" />
        <span>{readCount}/{totalMembers} 已读</span>
      </button>
      {expanded && (
        <div
          className="absolute bottom-full right-0 mb-1 w-56 max-h-40 overflow-y-auto rounded border p-2 shadow-lg"
          style={{ backgroundColor: 'var(--ao-commandPalette.background)', borderColor: 'var(--ao-commandPalette.border)' }}
        >
          {receipts.map((r) => (
            <div key={r.userId} className="flex items-center justify-between py-0.5">
              <span className="text-xs" style={{ color: 'var(--ao-commandPalette.foreground)' }}>{r.userName}</span>
              <span className="text-xs" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>
                {new Date(r.readAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
