/**
 * Session Feature Module
 * Task 60: Story 43.1 - Session Lifecycle Management
 */

export * from './runtime'

// Tools - selective exports to avoid conflicts with runtime
export type {
  ToolCategory,
  ToolExecutionMode,
  ToolParameterType,
  ToolParameter,
  ToolReturnType,
  ToolCapabilities,
  ToolPermissionRequirement,
  ToolDependency,
  ToolMetadata,
  ToolContextRequirements,
  ToolDescriptor,
} from './tools'

export type {
  ToolLookupFilter,
  ToolLookupResult,
  RegistryStatistics,
  RegistryChangeEvent,
  RegistryChangeListener,
  ToolRegistryConfig,
} from './tools'

export {
  ToolRegistry,
  getToolRegistry,
  createToolRegistry,
  registerCoreTools,
} from './tools'

// Components
export { ToolRegistryPanel } from './components/ToolRegistryPanel'
export type { ToolRegistryPanelProps } from './components/ToolRegistryPanel'
export {
  ToolCallStatusDisplay,
  ToolCallStatusStream,
  ToolCallCard,
} from './components/ToolCallStatusDisplay'
export type {
  ToolCallStatusDisplayProps,
  ToolCallStatusStreamProps,
} from './components/ToolCallStatusDisplay'
