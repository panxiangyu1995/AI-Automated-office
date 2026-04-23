/**
 * Agent间通信 API 客户端
 *
 * 提供与后端 Agent通信服务交互的 API
 */

import { safeInvoke } from '@/lib/tauri'

// Types from backend (mirrored from Rust types)
export interface AgentMessageDTO {
  id: string;
  senderType: string;
  senderId: string;
  receiverType: string;
  receiverId: string;
  content: {
    type: 'text' | 'command' | 'file' | 'image' | 'system';
    text?: string;
    command?: string;
    args?: string[];
    file_id?: string;
    alt_text?: string;
    message?: string;
  };
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  requiresConfirmation: boolean;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface AgentPermissionDTO {
  agentId: string;
  canSendToAgents: boolean;
  allowedReceivers: string[];
  blockedReceivers: string[];
  contentRestrictions: string[];
  requiresConfirmation: boolean;
  allowExternal: boolean;
  maxMessageRate: number;
}

// API Functions

/**
 * 发送Agent间消息
 */
export async function sendAgentMessage(
  senderId: string,
  receiverId: string,
  content: string
): Promise<AgentMessageDTO> {
  const result = await safeInvoke<AgentMessageDTO>('send_agent_message', {
    sender_id: senderId,
    receiver_id: receiverId,
    content,
  });
  return result ?? { id: '', senderType: '', senderId: '', receiverType: '', receiverId: '', content: { type: 'text' }, status: 'failed', requiresConfirmation: false, createdAt: '' }
}

/**
 * 获取Agent消息列表
 */
export async function getAgentMessages(
  agentId: string,
  limit?: number
): Promise<AgentMessageDTO[]> {
  const result = await safeInvoke<AgentMessageDTO[]>('get_agent_messages', {
    agent_id: agentId,
    limit,
  });
  return result ?? []
}

/**
 * 更新消息状态
 */
export async function updateAgentMessageStatus(
  messageId: string,
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
): Promise<void> {
  await safeInvoke('update_agent_message_status', {
    message_id: messageId,
    status,
  });
}

/**
 * 确认消息发送 (FR60)
 */
export async function confirmAgentMessage(
  messageId: string,
  approved: boolean
): Promise<AgentMessageDTO> {
  const result = await safeInvoke<AgentMessageDTO>('confirm_agent_message', {
    message_id: messageId,
    approved,
  });
  return result ?? { id: '', senderType: '', senderId: '', receiverType: '', receiverId: '', content: { type: 'text' }, status: 'failed', requiresConfirmation: false, createdAt: '' }
}

/**
 * 设置Agent权限 (FR62)
 */
export async function setAgentPermission(
  agentId: string,
  permission: AgentPermissionDTO
): Promise<void> {
  await safeInvoke('set_agent_permission', {
    agentId,
    permission,
  });
}

/**
 * 获取Agent权限
 */
export async function getAgentPermission(
  agentId: string
): Promise<AgentPermissionDTO> {
  const result = await safeInvoke<AgentPermissionDTO>('get_agent_permission', {
    agent_id: agentId,
  });
  return result ?? { agentId: '', canSendToAgents: false, allowedReceivers: [], blockedReceivers: [], contentRestrictions: [], requiresConfirmation: false, allowExternal: false, maxMessageRate: 0 }
}

/**
 * 撤回消息 (FR63)
 */
export async function recallAgentMessage(
  messageId: string,
  senderId: string
): Promise<void> {
  await safeInvoke('recall_agent_message', {
    message_id: messageId,
    sender_id: senderId,
  });
}

/**
 * 获取Agent联系人列表
 */
export async function getAgentContacts(
  agentId: string
): Promise<AgentContactDTO[]> {
  const result = await safeInvoke<AgentContactDTO[]>('get_agent_contacts', {
    agent_id: agentId,
  });
  return result ?? []
}

export interface AgentContactDTO {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  securityLevel: 'trusted' | 'verified' | 'restricted' | 'blocked';
  permissionLevel: 'none' | 'read' | 'write' | 'admin';
  lastSeen?: string;
  unreadCount: number;
}

// Type conversion helpers

/**
 * 将后端 AgentMessageDTO 转换为前端 AgentMessage
 */
export function toAgentMessage(dto: AgentMessageDTO): {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system' | 'command';
  direction: 'sent' | 'received';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  permissionGranted: boolean;
  auditStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
} {
  let text = '';
  let type: 'text' | 'file' | 'image' | 'system' | 'command' = 'text';

  if (dto.content.type === 'text' && dto.content.text) {
    text = dto.content.text;
    type = 'text';
  } else if (dto.content.type === 'command') {
    text = `${dto.content.command} ${dto.content.args?.join(' ') || ''}`;
    type = 'command';
  } else if (dto.content.type === 'file') {
    text = `[文件] ${dto.content.file_id}`;
    type = 'file';
  } else if (dto.content.type === 'image') {
    text = `[图片] ${dto.content.alt_text || ''}`;
    type = 'image';
  } else if (dto.content.type === 'system') {
    text = dto.content.message ?? '';
    type = 'system';
  }

  return {
    id: dto.id,
    senderId: dto.senderId,
    senderName: dto.senderId,
    senderRole: 'Agent',
    recipientId: dto.receiverId,
    recipientName: dto.receiverId,
    content: text,
    type,
    direction: 'sent', // Will be adjusted by caller
    timestamp: new Date(dto.createdAt),
    status: dto.status,
    permissionGranted: !dto.requiresConfirmation,
    auditStatus: dto.status === 'failed' ? 'rejected' : 'approved',
  };
}
