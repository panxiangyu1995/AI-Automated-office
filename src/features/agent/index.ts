/**
 * Agent Feature Module
 * Story 4.1 - AI对话界面实现
 * Story 4.2 - 会话管理功能
 * Story 4.3 - 历史对话管理
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
export { HistoryPanel } from './components/HistoryPanel'

// Hooks
export { 
  useChatStore, 
  useActiveChatSession, 
  useActiveMessages, 
  useStreamingStatus,
  type ChatSession,
  type ChatStoreState
} from './hooks/useChatStore'

export {
  useHistoryStore,
  useFilteredSessions,
  useHistoryFilter,
  useArchivedSessions,
  type TimeFilter,
  type HistoryFilter,
  type ArchivedSession
} from './hooks/useHistoryStore'
