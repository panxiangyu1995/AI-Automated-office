/**
 * Editor and Template Writeback - Store Operations & Serialization & Debug
 * Task 87: Story 49.4 - Editor and Template Writeback
 *
 * Store CRUD operations, serialization/deserialization, and debug formatting.
 */

import type {
  EditorWritebackStore,
  EditorWritebackContract,
  EditorState,
  EditorWritebackAction,
  EditorWritebackOutcome,
  EditorWritebackTrace,
  TemplateWritebackStore,
  TemplateWritebackContract,
  TemplateState,
  TemplateWritebackAction,
  TemplateWritebackOutcome,
  TemplateWritebackTrace,
  WritebackAuditEntry,
  EditorReference,
  TemplateReference,
  ContentRange,
  EditorWritebackResult,
  TemplateWritebackResult,
} from './editorWritebackTypes'

// ============================================================================
// Store Operations
// ============================================================================

export function createEditorWritebackStore(): EditorWritebackStore {
  return {
    editors: new Map(),
    actions: new Map(),
    contracts: new Map(),
    outcomes: new Map(),
    traces: new Map(),
    auditEntries: [],
  }
}

export function createTemplateWritebackStore(): TemplateWritebackStore {
  return {
    templates: new Map(),
    actions: new Map(),
    contracts: new Map(),
    outcomes: new Map(),
    traces: new Map(),
    auditEntries: [],
  }
}

// Editor store operations
export function registerEditorContract(
  store: EditorWritebackStore,
  contract: EditorWritebackContract
): void {
  store.contracts.set(contract.contractId, contract)
}

export function getEditorContract(
  store: EditorWritebackStore,
  contractId: string
): EditorWritebackContract | undefined {
  return store.contracts.get(contractId)
}

export function addEditorToStore(
  store: EditorWritebackStore,
  editorId: string,
  state: EditorState
): void {
  store.editors.set(editorId, state)
}

export function getEditorFromStore(
  store: EditorWritebackStore,
  editorId: string
): EditorState | undefined {
  return store.editors.get(editorId)
}

export function addEditorAction(
  store: EditorWritebackStore,
  action: EditorWritebackAction
): void {
  store.actions.set(action.actionId, action)
}

export function getEditorAction(
  store: EditorWritebackStore,
  actionId: string
): EditorWritebackAction | undefined {
  return store.actions.get(actionId)
}

export function getEditorActionsBySession(
  store: EditorWritebackStore,
  sessionId: string
): EditorWritebackAction[] {
  return Array.from(store.actions.values()).filter((a) => a.sessionId === sessionId)
}

export function addEditorOutcome(
  store: EditorWritebackStore,
  actionId: string,
  outcome: EditorWritebackOutcome
): void {
  store.outcomes.set(actionId, outcome)
}

export function getEditorOutcome(
  store: EditorWritebackStore,
  actionId: string
): EditorWritebackOutcome | undefined {
  return store.outcomes.get(actionId)
}

export function addEditorTraces(
  store: EditorWritebackStore,
  actionId: string,
  traces: EditorWritebackTrace[]
): void {
  store.traces.set(actionId, traces)
}

export function getEditorTraces(
  store: EditorWritebackStore,
  actionId: string
): EditorWritebackTrace[] | undefined {
  return store.traces.get(actionId)
}

export function addEditorAuditEntry(
  store: EditorWritebackStore,
  entry: WritebackAuditEntry
): void {
  store.auditEntries.push(entry)
}

// Template store operations
export function registerTemplateContract(
  store: TemplateWritebackStore,
  contract: TemplateWritebackContract
): void {
  store.contracts.set(contract.contractId, contract)
}

export function getTemplateContract(
  store: TemplateWritebackStore,
  contractId: string
): TemplateWritebackContract | undefined {
  return store.contracts.get(contractId)
}

export function addTemplateToStore(
  store: TemplateWritebackStore,
  templateId: string,
  state: TemplateState
): void {
  store.templates.set(templateId, state)
}

export function getTemplateFromStore(
  store: TemplateWritebackStore,
  templateId: string
): TemplateState | undefined {
  return store.templates.get(templateId)
}

export function addTemplateAction(
  store: TemplateWritebackStore,
  action: TemplateWritebackAction
): void {
  store.actions.set(action.actionId, action)
}

export function getTemplateAction(
  store: TemplateWritebackStore,
  actionId: string
): TemplateWritebackAction | undefined {
  return store.actions.get(actionId)
}

export function getTemplateActionsBySession(
  store: TemplateWritebackStore,
  sessionId: string
): TemplateWritebackAction[] {
  return Array.from(store.actions.values()).filter((a) => a.sessionId === sessionId)
}

export function addTemplateOutcome(
  store: TemplateWritebackStore,
  actionId: string,
  outcome: TemplateWritebackOutcome
): void {
  store.outcomes.set(actionId, outcome)
}

export function getTemplateOutcome(
  store: TemplateWritebackStore,
  actionId: string
): TemplateWritebackOutcome | undefined {
  return store.outcomes.get(actionId)
}

export function addTemplateTraces(
  store: TemplateWritebackStore,
  actionId: string,
  traces: TemplateWritebackTrace[]
): void {
  store.traces.set(actionId, traces)
}

export function getTemplateTraces(
  store: TemplateWritebackStore,
  actionId: string
): TemplateWritebackTrace[] | undefined {
  return store.traces.get(actionId)
}

export function addTemplateAuditEntry(
  store: TemplateWritebackStore,
  entry: WritebackAuditEntry
): void {
  store.auditEntries.push(entry)
}

// ============================================================================
// Serialization
// ============================================================================

export function serializeEditorRef(ref: EditorReference): string {
  return JSON.stringify(ref)
}

export function deserializeEditorRef(json: string): EditorReference {
  return JSON.parse(json) as EditorReference
}

export function serializeTemplateRef(ref: TemplateReference): string {
  return JSON.stringify(ref)
}

export function deserializeTemplateRef(json: string): TemplateReference {
  return JSON.parse(json) as TemplateReference
}

export function serializeEditorState(state: EditorState): string {
  return JSON.stringify(state)
}

export function deserializeEditorState(json: string): EditorState {
  return JSON.parse(json) as EditorState
}

export function serializeTemplateState(state: TemplateState): string {
  return JSON.stringify({
    ...state,
    dirtySlots: Array.from(state.dirtySlots),
  })
}

export function deserializeTemplateState(json: string): TemplateState {
  const parsed = JSON.parse(json)
  return {
    ...parsed,
    dirtySlots: new Set(parsed.dirtySlots),
  }
}

export function serializeEditorAction(action: EditorWritebackAction): string {
  return JSON.stringify(action)
}

export function deserializeEditorAction(json: string): EditorWritebackAction {
  return JSON.parse(json) as EditorWritebackAction
}

export function serializeTemplateAction(action: TemplateWritebackAction): string {
  return JSON.stringify(action)
}

export function deserializeTemplateAction(json: string): TemplateWritebackAction {
  return JSON.parse(json) as TemplateWritebackAction
}

export function serializeEditorContract(contract: EditorWritebackContract): string {
  return JSON.stringify(contract)
}

export function deserializeEditorContract(json: string): EditorWritebackContract {
  return JSON.parse(json) as EditorWritebackContract
}

export function serializeTemplateContract(contract: TemplateWritebackContract): string {
  return JSON.stringify(contract)
}

export function deserializeTemplateContract(json: string): TemplateWritebackContract {
  return JSON.parse(json) as TemplateWritebackContract
}

export function serializeEditorOutcome(outcome: EditorWritebackOutcome): string {
  return JSON.stringify(outcome)
}

export function deserializeEditorOutcome(json: string): EditorWritebackOutcome {
  return JSON.parse(json) as EditorWritebackOutcome
}

export function serializeTemplateOutcome(outcome: TemplateWritebackOutcome): string {
  return JSON.stringify(outcome)
}

export function deserializeTemplateOutcome(json: string): TemplateWritebackOutcome {
  return JSON.parse(json) as TemplateWritebackOutcome
}

export function serializeEditorWritebackStore(store: EditorWritebackStore): string {
  return JSON.stringify({
    editors: Array.from(store.editors.entries()),
    actions: Array.from(store.actions.entries()),
    contracts: Array.from(store.contracts.entries()),
    outcomes: Array.from(store.outcomes.entries()),
    traces: Array.from(store.traces.entries()),
    auditEntries: store.auditEntries,
  })
}

export function deserializeEditorWritebackStore(json: string): EditorWritebackStore {
  const parsed = JSON.parse(json)
  return {
    editors: new Map(parsed.editors),
    actions: new Map(parsed.actions),
    contracts: new Map(parsed.contracts),
    outcomes: new Map(parsed.outcomes),
    traces: new Map(parsed.traces),
    auditEntries: parsed.auditEntries,
  }
}

export function serializeTemplateWritebackStore(store: TemplateWritebackStore): string {
  return JSON.stringify({
    templates: Array.from(store.templates.entries()).map(([id, state]) => [
      id,
      { ...state, dirtySlots: Array.from(state.dirtySlots) },
    ]),
    actions: Array.from(store.actions.entries()),
    contracts: Array.from(store.contracts.entries()),
    outcomes: Array.from(store.outcomes.entries()),
    traces: Array.from(store.traces.entries()),
    auditEntries: store.auditEntries,
  })
}

export function deserializeTemplateWritebackStore(json: string): TemplateWritebackStore {
  const parsed = JSON.parse(json)
  return {
    templates: new Map(
      parsed.templates.map(([id, state]: [string, Record<string, unknown>]) => [
        id,
        { ...state, dirtySlots: new Set(state.dirtySlots as string[]) },
      ])
    ),
    actions: new Map(parsed.actions),
    contracts: new Map(parsed.contracts),
    outcomes: new Map(parsed.outcomes),
    traces: new Map(parsed.traces),
    auditEntries: parsed.auditEntries,
  }
}

// ============================================================================
// Debug Formatting
// ============================================================================

export function formatEditorRef(ref: EditorReference): string {
  const parts = [ref.editorId, ref.editorType]
  if (ref.filePath) parts.push(`file:${ref.filePath}`)
  if (ref.documentId) parts.push(`doc:${ref.documentId}`)
  return parts.join(' | ')
}

export function formatTemplateRef(ref: TemplateReference): string {
  const parts = [ref.templateId, ref.templateType, ref.name]
  if (ref.version) parts.push(`v${ref.version}`)
  return parts.join(' | ')
}

export function formatContentRange(range: ContentRange): string {
  return `L${range.start.line}:${range.start.column}-L${range.end.line}:${range.end.column}`
}

export function formatEditorState(state: EditorState): string {
  const lines = state.content.split('\n').length
  const chars = state.content.length
  const dirty = state.isDirty ? ' [dirty]' : ''
  return `Editor: ${lines} lines, ${chars} chars, v${state.version}${dirty}`
}

export function formatTemplateState(state: TemplateState): string {
  const slots = Object.keys(state.slotValues).length
  const dirty = state.dirtySlots.size
  return `Template: ${slots} slots, ${dirty} dirty, v${state.version}`
}

export function formatEditorWritebackResult(result: EditorWritebackResult): string {
  const status = result.success ? '✓' : '✗'
  const parts = [status, result.operationId, result.editorId]
  if (result.error) parts.push(`error: ${result.error}`)
  if (result.newVersion) parts.push(`v${result.newVersion}`)
  if (result.isDirty) parts.push('[dirty]')
  return parts.join(' | ')
}

export function formatTemplateWritebackResult(result: TemplateWritebackResult): string {
  const status = result.success ? '✓' : '✗'
  const parts = [status, result.operationId, result.templateId, result.slotName]
  if (result.error) parts.push(`error: ${result.error}`)
  return parts.join(' | ')
}

export function formatEditorWritebackOutcome(outcome: EditorWritebackOutcome): string {
  const status = outcome.success ? '✓' : '✗'
  return `Editor Writeback: ${status} (${outcome.successfulOperations}/${outcome.totalOperations})`
}

export function formatTemplateWritebackOutcome(outcome: TemplateWritebackOutcome): string {
  const status = outcome.success ? '✓' : '✗'
  return `Template Writeback: ${status} (${outcome.successfulOperations}/${outcome.totalOperations})`
}

export function formatEditorTrace(trace: EditorWritebackTrace): string {
  const time = new Date(trace.timestamp).toLocaleTimeString()
  const duration = trace.durationMs ? ` (${trace.durationMs}ms)` : ''
  return `[${time}] ${trace.operation} on ${trace.editorId}: ${trace.status}${duration}`
}

export function formatTemplateTrace(trace: TemplateWritebackTrace): string {
  const time = new Date(trace.timestamp).toLocaleTimeString()
  const duration = trace.durationMs ? ` (${trace.durationMs}ms)` : ''
  return `[${time}] ${trace.operation} on ${trace.templateId}.${trace.slotName}: ${trace.status}${duration}`
}
