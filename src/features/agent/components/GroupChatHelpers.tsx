/**
 * GroupChat Helpers - 群聊辅助函数
 */

import { Crown, ShieldCheck, Shield } from 'lucide-react'
import { MessageStatusIcon } from './MessageStatusIndicator'
import type { GroupRole, MessageStatus, Group, GroupChatStats } from './GroupChatTypes'

export function calculateStats(groups: Group[]): GroupChatStats {
  const totalMessages = groups.reduce((sum, g) => sum + g.messages.length, 0)
  const unreadMessages = groups.reduce((sum, g) => sum + g.unreadCount, 0)
  const joinedGroups = groups.filter((g) => g.isJoined).length

  return {
    totalGroups: groups.length,
    totalMessages,
    unreadMessages,
    joinedGroups,
  }
}

export function getRoleBadgeColor(role: GroupRole): string {
  switch (role) {
    case 'owner':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'admin':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'member':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function getRoleText(role: GroupRole): string {
  switch (role) {
    case 'owner':
      return '群主'
    case 'admin':
      return '管理员'
    case 'member':
      return '成员'
    default:
      return '成员'
  }
}

export function getRoleIcon(role: GroupRole) {
  switch (role) {
    case 'owner':
      return <Crown className="h-3 w-3" />
    case 'admin':
      return <ShieldCheck className="h-3 w-3" />
    default:
      return <Shield className="h-3 w-3" />
  }
}

export function getStatusIcon(status: MessageStatus) {
  return <MessageStatusIcon status={status} />
}
