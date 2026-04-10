// src/types/agent/intercom.ts
// Agent间通信共享类型 - 对应后端 Rust intercom/types.rs
// 与 openspec/changes/agent-integration-align/tasks.md Step 3 对齐

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'command' | 'file' | 'image' | 'system';

export interface MessageContent {
  type: MessageType;
  text?: string;
  command?: string;
  args?: string[];
  file_id?: string;
  file_name?: string;
  mime_type?: string;
  image_id?: string;
  alt_text?: string;
  code?: string;
  message?: string;
}

export interface AgentMessage {
  id: string;
  senderType: 'human' | 'agent' | 'system' | 'group';
  senderId: string;
  receiverType: 'human' | 'agent' | 'system' | 'group';
  receiverId: string;
  content: MessageContent;
  status: MessageStatus;
  requiresConfirmation: boolean;
  hopCount?: number;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface SendMessageParams {
  senderId: string;
  receiverId: string;
  content: string;
  messageType?: MessageType;
  sessionId?: string;
}

export interface SendMessageResult {
  success: boolean;
  message?: AgentMessage;
  error?: string;
}

export interface AgentPermission {
  agentId: string;
  canSendToAgents: boolean;
  allowedReceivers: string[];
  blockedReceivers: string[];
  contentRestrictions: string[];
  requiresConfirmation: boolean;
  allowExternal: boolean;
  maxMessageRate: number;
}

export interface AgentContact {
  id: string;
  name: string;
  type: 'human' | 'agent' | 'system' | 'group';
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}
