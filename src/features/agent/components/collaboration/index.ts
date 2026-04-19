/**
 * Collaboration Domain - Agent 协作相关组件
 * 组件文件位于 ../ 根目录
 */

export { AgentIntercom, type AgentContact, type AgentMessage as IntercomAgentMessage, type AgentMessageType, type MessageDirection, type PermissionLevel, type SecurityLevel, type AuditStatus, type ConversationThread, type IntercomStats, type AgentIntercomProps } from '../AgentIntercom'
export { AgentGroupParticipant, type AgentRole, type AgentStatus, type ParticipationMode, type AgentIdentity, type AgentMention, type AgentEvent, type ParticipationPolicy, type AgentGroupParticipantStats, type AgentGroupParticipantProps } from '../AgentGroupParticipant'
export { GroupChat, type GroupRole, type GroupMemberStatus, type GroupMember, type GroupMessage, type GroupAttachment, type Group, type GroupChatStats, type GroupChatProps } from '../GroupChat'
export { PrivateChat, type MessageStatus, type MessageType, type PrivateMessage, type MessageAttachment, type Conversation, type ChatStats, type PrivateChatProps } from '../PrivateChat'
export { EmployeeDirectory, type EmployeeStatus, type Employee, type Department, type DirectoryStats, type EmployeeDirectoryProps } from '../EmployeeDirectory'
export { EmployeeCard, type EmployeeProfile, type ParticipantType, type ContactAction, type VisibilitySettings, type EmployeeCardProps } from '../EmployeeCard'
export { SystemAnnouncements, type Notice, type NoticeType, type NoticeStatus, type NoticePriority, type AnnouncementStats, type SystemAnnouncementsProps } from '../SystemAnnouncements'
