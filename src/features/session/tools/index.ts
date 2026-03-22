/**
 * Tools Module - Unified Tool Descriptor and Registry
 * Task 68: Story 45.1 - Tool Descriptor and Registry
 */

// Types
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
} from './toolDescriptor'

export type {
  ToolLookupFilter,
  ToolLookupResult,
  RegistryStatistics,
  RegistryChangeEvent,
  RegistryChangeListener,
  ToolRegistryConfig,
} from './toolRegistry'

// Builder and Factory Functions
export {
  ToolDescriptorBuilder,
  defineTool,
  createParameter,
  stringParam,
  numberParam,
  booleanParam,
  objectParam,
  arrayParam,
  validateToolDescriptor,
  validateParameters,
  getToolDisplayName,
  isToolAvailable,
  requiresConfirmation,
  hasSideEffects,
  getToolsByCapability,
  getToolsByCategory,
  descriptorToJsonSchema,
} from './toolDescriptor'

// Registry
export {
  ToolRegistry,
  getToolRegistry,
  createToolRegistry,
  registerCoreTools,
} from './toolRegistry'

// Executor
export type {
  ToolRuntimeContext,
  ToolExecutionInput,
  ToolExecutionResult,
  ToolExecutionStatus,
  ToolExecutionError,
  ToolErrorCode,
  ToolCallLifecycleEvent,
  ToolCallEventType,
  ToolExecutorFn,
  ToolExecutorConfig,
  ToolExecutorListener,
} from './toolExecutor'

export {
  ToolExecutor,
  createRuntimeContext,
  createExecutionInput,
  isSuccessfulResult,
  isFailedResult,
  isRetryableError,
  isRecoverableError,
} from './toolExecutor'
