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

// Adapters
export type {
  ToolSource,
  CoreToolDefinition,
  PluginToolDefinition,
  MCPToolDefinition,
  MCPInputSchema,
  MCPPropertySchema,
  NormalizedToolResult,
  ToolAdapter,
  MCPToolExecutor,
} from './toolAdapters'

export {
  CoreToolAdapter,
  PluginToolAdapter,
  MCPToolAdapter,
  UnifiedToolManager,
  createUnifiedToolManager,
  getToolSource,
  parsePluginToolId,
  parseMCPToolId,
  createPluginToolId,
  createMCPToolId,
} from './toolAdapters'

// Result Normalization
export type {
  NormalizedStatus,
  ResultSeverity,
  NormalizedSuccessEnvelope,
  NormalizedFailureEnvelope,
  NormalizedPartialEnvelope,
  NormalizedResultEnvelope,
  NormalizedError,
  ErrorCategory,
  ResultMetadata,
  RawOutputReference,
  PartialResultItem,
  PlannerPayload,
  AuditPayload,
  UIWritebackPayload,
  SideEffect,
  SuggestedAction,
  UIAction,
  RefreshInstruction,
  ResultNormalizerConfig,
  NormalizationOptions,
  PlannerContext,
  AuditContext,
  UIContext,
} from './toolResultNormalization'

export {
  ResultNormalizer,
  createResultNormalizer,
  normalizeResult,
  isSuccessEnvelope,
  isFailureEnvelope,
  isPartialEnvelope,
} from './toolResultNormalization'

// Permission Precheck
export type {
  PermissionType,
  PermissionResource,
  PermissionScope,
  Permission,
  PermissionCheckResult,
  PermissionDecisionEvent,
  PermissionResolverConfig,
  PermissionStreamListener,
} from './toolPermissionPrecheck'

export {
  PermissionPrecheck,
  createPermissionPrecheck,
  checkToolPermission,
  formatPermissionResult,
  isPermissionDenied,
  extractPermissionRequirements,
} from './toolPermissionPrecheck'
