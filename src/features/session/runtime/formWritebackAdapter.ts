/**
 * Form Writeback Adapter (Story 49.1)
 * Task 84: Write normalized Agent results into approved dynamic form targets.
 *
 * Barrel re-export from sub-modules:
 *  - formWritebackAdapterTypes.ts      (type definitions)
 *  - formWritebackAdapterFactories.ts  (constants + ID gen + factories + permissions + validation + result mapping)
 *  - formWritebackAdapterExecution.ts  (writeback execution)
 *  - formWritebackAdapterStore.ts      (store + serialization + debug)
 */

export type {
  FieldDataType,
  WritebackPermission,
  FieldUpdateStatus,
  WritebackStatus,
  FieldReference,
  FieldPermissionResult,
  FieldUpdate,
  WritebackAction,
  WritebackContract,
  FieldValidationRule,
  NormalizedResult,
  ResultToFieldMapping,
  WritebackTraceEntry,
  WritebackAdapterStore,
  WritebackOptions,
  WritebackResult,
} from './formWritebackAdapterTypes'

export {
  UPDATE_ID_PREFIX,
  ACTION_ID_PREFIX,
  MAPPING_ID_PREFIX,
  TRACE_ENTRY_ID_PREFIX,
  CONTRACT_ID_PREFIX,
  FIELD_DATA_TYPES,
  WRITEBACK_PERMISSIONS,
  FIELD_UPDATE_STATUSES,
  WRITEBACK_STATUSES,
  generateUpdateId,
  generateActionId,
  generateMappingId,
  generateTraceEntryId,
  generateContractId,
  isValidUpdateId,
  isValidActionId,
  isValidMappingId,
  isValidTraceEntryId,
  createFieldReference,
  createFieldPermissionResult,
  createFieldUpdate,
  createWritebackAction,
  createWritebackContract,
  createValidationRule,
  createResultToFieldMapping,
  createWritebackTraceEntry,
  createWritebackAdapterStore,
  isFieldAllowed,
  getFieldPermission,
  canWriteField,
  checkFieldPermissions,
  validateValueAgainstRule,
  validateFieldUpdate,
  validateFieldUpdates,
  extractValueByPath,
  mapResultToUpdates,
} from './formWritebackAdapterFactories'

export {
  executeWriteback,
  updateFieldStatus,
  updateWritebackStatus,
} from './formWritebackAdapterExecution'

export {
  registerContract,
  addAction,
  addTraceEntries,
  getContract,
  getAction,
  getTraceEntries,
  getActionsByForm,
  getActionsBySession,
  getActionsByStatus,
  serializeContract,
  deserializeContract,
  serializeAction,
  deserializeAction,
  serializeWritebackStore,
  deserializeWritebackStore,
  formatFieldReference,
  formatFieldUpdate,
  formatWritebackAction,
  formatWritebackResult,
  formatTraceEntry,
} from './formWritebackAdapterStore'

export type {
  SerializableWritebackContract,
  SerializableWritebackAction,
  SerializableWritebackAdapterStore,
} from './formWritebackAdapterStore'
