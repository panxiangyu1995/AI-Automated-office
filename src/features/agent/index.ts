/**
 * Agent Feature Module
 * Story 4.1 - AI对话界面实现
 * Story 4.2 - 会话管理功能
 * 
 * 导出 Agent 相关的组件和 Hooks
 */

// Components
export { AgentChatPanel } from './components/AgentChatPanel'
export { ChatMessage } from './components/ChatMessage'
export { MessageInput } from './components/MessageInput'
export { MessageList } from './components/MessageList'
export { SessionList } from './components/SessionList'
export { SessionPanel } from './components/SessionPanel'

// Hooks
export { 
  useChatStore, 
  useActiveChatSession, 
  useActiveMessages, 
  useStreamingStatus,
  type ChatSession,
  type ChatStoreState
} from './hooks/useChatStore'
