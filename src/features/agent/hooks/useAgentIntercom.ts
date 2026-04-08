/**
 * Agent间通信 Hook
 * 
 * 提供 Agent-to-Agent 通信功能的后端集成
 */

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

// Types
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type SecurityLevel = 'trusted' | 'verified' | 'restricted' | 'blocked';
export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';
export type AuditStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface AgentContact {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  department: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  securityLevel: SecurityLevel;
  permissionLevel: PermissionLevel;
  lastSeen?: Date;
  unreadCount: number;
}

export interface AgentMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system' | 'command';
  direction: 'sent' | 'received';
  timestamp: Date;
  status: MessageStatus;
  permissionGranted: boolean;
  permissionDeniedReason?: string;
  auditStatus: AuditStatus;
  auditFlags?: string[];
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

export interface IntercomConfig {
  enabled: boolean;
  auditEnabled: boolean;
  contentModerationEnabled: boolean;
  maxHopCount: number;
}

// Default config
const defaultConfig: IntercomConfig = {
  enabled: true,
  auditEnabled: true,
  contentModerationEnabled: true,
  maxHopCount: 3,
};

// Hook
export function useAgentIntercom(currentAgentId: string = 'current-agent') {
  const [contacts, setContacts] = useState<AgentContact[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config] = useState<IntercomConfig>(defaultConfig);

  // 初始化：加载联系人和消息
  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 从后端获取联系人列表
      const contactsResult = await invoke<AgentContact[]>('get_agent_contacts', {
        agentId: currentAgentId,
      });
      setContacts(contactsResult);

      // 从后端获取消息列表
      const messagesResult = await invoke<AgentMessage[]>('get_agent_messages', {
        agentId: currentAgentId,
        limit: 100,
      });
      setMessages(messagesResult.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })));
    } catch (err) {
      setError(err as string);
      // 如果后端未初始化，使用空数据
      console.warn('Agent通信服务未初始化，使用空数据:', err);
    } finally {
      setLoading(false);
    }
  }, [currentAgentId]);

  // 发送消息
  const sendMessage = useCallback(async (
    receiverId: string,
    content: string
  ): Promise<AgentMessage | null> => {
    setError(null);
    try {
      const result = await invoke<AgentMessage>('send_agent_message', {
        senderId: currentAgentId,
        receiverId,
        content,
      });

      const newMessage: AgentMessage = {
        id: result.id,
        senderId: currentAgentId,
        senderName: 'Current Agent',
        senderRole: 'AI Assistant',
        recipientId: receiverId,
        recipientName: contacts.find(c => c.id === receiverId)?.name || receiverId,
        content,
        type: 'text',
        direction: 'sent',
        timestamp: new Date(),
        status: 'sending',
        permissionGranted: true,
        auditStatus: 'pending',
      };

      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      setError(err as string);
      
      // 创建失败消息
      const failedMessage: AgentMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentAgentId,
        senderName: 'Current Agent',
        senderRole: 'AI Assistant',
        recipientId: receiverId,
        recipientName: contacts.find(c => c.id === receiverId)?.name || receiverId,
        content,
        type: 'text',
        direction: 'sent',
        timestamp: new Date(),
        status: 'failed',
        permissionGranted: false,
        permissionDeniedReason: err as string,
        auditStatus: 'rejected',
      };
      
      setMessages(prev => [...prev, failedMessage]);
      return null;
    }
  }, [currentAgentId, contacts]);

  // 更新消息状态
  const updateMessageStatus = useCallback(async (
    messageId: string,
    status: MessageStatus
  ) => {
    try {
      await invoke('update_agent_message_status', {
        messageId,
        status,
      });

      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, status } : m
      ));
    } catch (err) {
      console.error('更新消息状态失败:', err);
    }
  }, []);

  // 确认消息发送 (FR60)
  const confirmMessage = useCallback(async (
    messageId: string,
    approved: boolean
  ): Promise<boolean> => {
    setError(null);
    try {
      await invoke<AgentMessage>('confirm_agent_message', {
        messageId,
        approved,
      });

      setMessages(prev => prev.map(m =>
        m.id === messageId ? {
          ...m,
          status: approved ? 'sent' : 'failed',
          auditStatus: approved ? 'approved' : 'rejected',
        } : m
      ));

      return approved;
    } catch (err) {
      setError(err as string);
      return false;
    }
  }, []);

  // 设置Agent权限 (FR62)
  const setPermission = useCallback(async (
    agentId: string,
    permission: Partial<AgentPermission>
  ) => {
    setError(null);
    try {
      const fullPermission: AgentPermission = {
        agentId,
        canSendToAgents: permission.canSendToAgents ?? true,
        allowedReceivers: permission.allowedReceivers ?? [],
        blockedReceivers: permission.blockedReceivers ?? [],
        contentRestrictions: permission.contentRestrictions ?? [],
        requiresConfirmation: permission.requiresConfirmation ?? false,
        allowExternal: permission.allowExternal ?? false,
        maxMessageRate: permission.maxMessageRate ?? 60,
      };

      await invoke('set_agent_permission', {
        agentId,
        permission: fullPermission,
      });

      // 更新本地联系人状态
      setContacts(prev => prev.map(c =>
        c.id === agentId ? {
          ...c,
          securityLevel: fullPermission.blockedReceivers.length > 0 ? 'blocked' : 'verified',
          permissionLevel: fullPermission.canSendToAgents ? 'write' : 'none',
        } : c
      ));
    } catch (err) {
      setError(err as string);
    }
  }, []);

  // 撤回消息 (FR63)
  const recallMessage = useCallback(async (messageId: string): Promise<boolean> => {
    setError(null);
    try {
      await invoke('recall_agent_message', {
        messageId,
        senderId: currentAgentId,
      });

      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, status: 'failed' } : m
      ));

      return true;
    } catch (err) {
      setError(err as string);
      return false;
    }
  }, [currentAgentId]);

  // 获取Agent权限
  const getPermission = useCallback(async (agentId: string): Promise<AgentPermission | null> => {
    try {
      const result = await invoke<AgentPermission>('get_agent_permission', {
        agentId,
      });
      return result;
    } catch (err) {
      console.error('获取Agent权限失败:', err);
      return null;
    }
  }, []);

  // 阻止/解除阻止Agent
  const toggleBlockAgent = useCallback(async (agentId: string, block: boolean) => {
    await setPermission(agentId, {
      canSendToAgents: !block,
      blockedReceivers: block ? [agentId] : [],
    });
  }, [setPermission]);

  // 阻止Agent
  const blockAgent = useCallback((agentId: string) => toggleBlockAgent(agentId, true), [toggleBlockAgent]);

  // 解除阻止Agent
  const unblockAgent = useCallback((agentId: string) => toggleBlockAgent(agentId, false), [toggleBlockAgent]);

  // 监听新消息事件
  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    const setupListener = async () => {
      unlisten = await listen<AgentMessage>('agent-message-received', (event) => {
        const message = event.payload;
        setMessages(prev => [...prev, {
          ...message,
          timestamp: new Date(message.timestamp),
          direction: message.senderId === currentAgentId ? 'sent' : 'received',
        }]);
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [currentAgentId]);

  // 初始化
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // State
    contacts,
    messages,
    loading,
    error,
    config,
    
    // Actions
    sendMessage,
    updateMessageStatus,
    confirmMessage,
    setPermission,
    getPermission,
    recallMessage,
    blockAgent,
    unblockAgent,
    initialize,
  };
}

