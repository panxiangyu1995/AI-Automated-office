/**
 * Message Runtime Module
 * Task 61: Story 43.2 - Message and Part Model
 */

// Message and Part Types
export {
  // Part Types
  type PartType,
  type BasePart,
  type TextPart,
  type ReasoningPart,
  type ToolCallPart,
  type ToolParameter,
  type ToolResultPart,
  type ConfirmationPart,
  type ConfirmationOption,
  type ErrorPart,
  type ErrorSeverity,
  type ErrorCode,
  type UIPatchPart,
  type UIPatchOperation,
  type UIPatchAction,
  type Part,
  
  // Message Types
  type MessageRole,
  type MessageStatus,
  type Message,
  
  // Creation Types
  type CreateMessageRequest,
  type CreateMessageResponse,
  type CreatePartRequest,
  type CreatePartResponse,
  
  // Streaming Types
  type StreamChunkType,
  type StreamChunk,
  
  // Serialization Types
  type SerializedMessage,
  type SerializedPart,
  
  // Helper Functions
  generateId,
  createTextPart,
  createReasoningPart,
  createToolCallPart,
  createToolResultPart,
  createConfirmationPart,
  createErrorPart,
  createUIPatchPart,
  createMessage,
  serializeMessage,
  serializePart,
  deserializeMessage,
  deserializePart,
  validatePart,
  validateMessage,
  getMessageText,
  getToolCalls,
  getErrors,
} from './messageModel'

// Message Store
export {
  type MessageStateListener,
  type MessageStateChangeEvent,
  type StreamListener,
  messageStore,
  useSessionMessages,
  useMessage,
  useLastMessage,
} from './messageStore'

// Message API
export {
  MessageApi,
  getMessageApi,
  resetMessageApi,
  createMessage as createMessageApi,
  getMessage as getMessageApiFn,
  getSessionMessages as getSessionMessagesApi,
  addTextPart as addTextPartApi,
} from './messageApi'
