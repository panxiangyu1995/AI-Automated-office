/**
 * GroupChat Types - 群聊类型定义
 *
 * FR613-FR619: 群组基础功能
 * FR622-FR630: 消息状态追踪
 * FR631-FR649: Agent协作
 */

import type {
  AgentBehavior,
  AgentJoinMode,
  AgentTaskNotification,
  AgentDataCard,
  AgentProgressReport,
} from './AgentCollaboration'

export type GroupRole = 'owner' | 'admin' | 'member'

export type GroupMemberStatus = 'active' | 'muted' | 'left'

export interface GroupMember {
  id: string
  userId: string
  name: string
  avatar?: string
  role: GroupRole
  status: GroupMemberStatus
  joinedAt: string
  isCurrentUser?: boolean
  isAgent?: boolean
  agentBehavior?: AgentBehavior
  agentJoinMode?: AgentJoinMode
  agentCapabilities?: string[]
  isAgentMuted?: boolean
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type MessageType = 'text' | 'image' | 'file' | 'system' | 'agent_task' | 'agent_data' | 'agent_progress'

export interface GroupMessage {
  id: string
  groupId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  senderRole: GroupRole
  content: string
  type: MessageType
  status: MessageStatus
  timestamp: string
  attachments?: GroupAttachment[]
  replyTo?: string
  isSystem?: boolean
  agentPayload?: AgentTaskNotification | AgentDataCard | AgentProgressReport
}

export interface GroupAttachment {
  id: string
  type: 'image' | 'file'
  name: string
  size: number
  url?: string
  thumbnail?: string
}

export interface Group {
  id: string
  name: string
  avatar?: string
  description?: string
  ownerId: string
  memberCount: number
  members: GroupMember[]
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  messages: GroupMessage[]
  createdAt: string
  isJoined: boolean
}

export interface GroupChatStats {
  totalGroups: number
  totalMessages: number
  unreadMessages: number
  joinedGroups: number
}

export interface GroupChatProps {
  currentUserId: string
  groups: Group[]
  onSendMessage: (groupId: string, content: string, type?: MessageType) => void
  onDeleteMessage?: (messageId: string) => void
  onCreateGroup?: (name: string, description?: string, memberIds?: string[]) => void
  onJoinGroup?: (groupId: string) => void
  onLeaveGroup?: (groupId: string) => void
  onAddMember?: (groupId: string, userId: string) => void
  onRemoveMember?: (groupId: string, userId: string) => void
  onChangeMemberRole?: (groupId: string, userId: string, role: GroupRole) => void
  onMuteMember?: (groupId: string, userId: string) => void
  onMarkAsRead?: (groupId: string) => void
  onSearchMessages?: (query: string) => GroupMessage[]
}

export interface MessageBubbleProps {
  message: GroupMessage
  isOwn: boolean
  onDelete?: (messageId: string) => void
  onReply?: (messageId: string) => void
  isAgentMessage?: boolean
}

export interface MemberItemProps {
  member: GroupMember
  currentUserRole: GroupRole
  onRemove?: (userId: string) => void
  onChangeRole?: (userId: string, role: GroupRole) => void
  onMute?: (userId: string) => void
}
