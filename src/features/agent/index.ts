/**
 * Agent Feature Module
 * Story 4.1 - AI对话界面实现
 * 
 * 导出 Agent 相关的组件和 Hooks
 */

// Components
export { AgentChatPanel } from './components/AgentChatPanel'
export { ChatMessage } from './components/ChatMessage'
export { MessageInput } from './components/MessageInput'
export { MessageList } from './components/MessageList'

// Hooks
export { 
  useChatStore, 
  useActiveChatSession, 
  useActiveMessages, 
  useStreamingStatus,
  type ChatSession,
  type ChatStoreState
} from './hooks/useChatStore'