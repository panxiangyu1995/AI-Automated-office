/**
 * Agent Feature Module
 * Story 4.1 - AI对话界面实现
 * Story 4.2 - 会话管理功能
 * Story 4.3 - 历史对话管理
 * Story 4.7 - 检查点自动创建
 * Story 4.8 - 检查点回滚功能
 * Story 4.9 - 检查点编辑重试功能
 * Story 4.10 - Git工具集成
 * Story 4.11 - 检查点管理功能
 * Story 4.12 - 上下文自动压缩
 *
 * 导出 Agent 相关的组件和 Hooks。
 *
 * 架构优化：按功能域拆分导出，通过子 index 重导出。
 * 兼容层：所有旧导入路径仍然可用。
 */

// Re-export all components by domain
export * from './components'

// Re-export hooks via domains (按域聚合导出)
export * from './hooks/domains'

// Re-export core hooks that are not domain-specific
export { useAgentRuntime, type AgentRuntimeState, type UseAgentRuntimeOptions } from './hooks/useAgentRuntime'
export { useAutoCheckpoint } from './hooks/useAutoCheckpoint'
