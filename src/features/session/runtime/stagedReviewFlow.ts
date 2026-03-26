import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { DetailWritebackAction } from './detailSectionWriteback'
import type { TemplateWritebackAction, EditorWritebackAction } from './editorTemplateWriteback'
import type { WritebackAction as FormWritebackAction } from './formWritebackAdapter'
import type { CardWritebackAction } from './workbenchCardWriteback'

export type ReviewTargetKind = 'form' | 'detail' | 'workbench' | 'editor' | 'template'
export type CandidateChangeStatus = 'staged' | 'accepted' | 'rejected'
export type ReviewPackageStatus = 'staged' | 'partially_accepted' | 'accepted' | 'rejected' | 'rolled_back'
export type ReviewActorType = 'user' | 'agent' | 'system'

export interface ReviewActionResult {
  ok: boolean
  reason?: string
  package?: StagedReviewPackage
}

export interface CandidateChange {
  changeId: string
  sourceActionId: string
  sourceKind: ReviewTargetKind
  targetKind: ReviewTargetKind
  targetId: string
  targetLabel: string
  label: string
  summary: string
  preview?: string
  status: CandidateChangeStatus
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}

export interface StagedReviewPackage {
  packageId: string
  sessionId: string
  title: string
  summary?: string
  sourceTool?: string
  sourceKind: ReviewTargetKind
  changes: CandidateChange[]
  status: ReviewPackageStatus
  humanReviewRequired: boolean
  createdAt: number
  updatedAt: number
  rolledBackAt?: number
}

export interface ReviewPackageOptions {
  title?: string
  summary?: string
  sourceTool?: string
}

export interface StagedReviewState {
  packagesBySession: Record<string, StagedReviewPackage[]>
  stageReviewPackage: (reviewPackage: StagedReviewPackage) => void
  stageFormWriteback: (action: FormWritebackAction, options?: ReviewPackageOptions) => StagedReviewPackage
  stageDetailWriteback: (action: DetailWritebackAction, options?: ReviewPackageOptions) => StagedReviewPackage
  stageWorkbenchWriteback: (action: CardWritebackAction, options?: ReviewPackageOptions) => StagedReviewPackage
  stageEditorWriteback: (action: EditorWritebackAction, options?: ReviewPackageOptions) => StagedReviewPackage
  stageTemplateWriteback: (action: TemplateWritebackAction, options?: ReviewPackageOptions) => StagedReviewPackage
  acceptCandidateChange: (sessionId: string, packageId: string, changeId: string, actor?: ReviewActorType) => ReviewActionResult
  rejectCandidateChange: (sessionId: string, packageId: string, changeId: string, actor?: ReviewActorType) => ReviewActionResult
  acceptReviewPackage: (sessionId: string, packageId: string, actor?: ReviewActorType) => ReviewActionResult
  rejectReviewPackage: (sessionId: string, packageId: string, actor?: ReviewActorType) => ReviewActionResult
  rollbackReviewPackage: (sessionId: string, packageId: string, actor?: ReviewActorType) => ReviewActionResult
  clearSessionReviewPackages: (sessionId: string) => void
  reset: () => void
}

const initialState = {
  packagesBySession: {},
}

function generateReviewId(prefix: string): string {
  return `${prefix}-${Date.now()}-${crypto.randomUUID()}`
}

function derivePackageStatus(changes: CandidateChange[]): ReviewPackageStatus {
  if (changes.length === 0) {
    return 'staged'
  }

  const acceptedCount = changes.filter((change) => change.status === 'accepted').length
  const rejectedCount = changes.filter((change) => change.status === 'rejected').length

  if (acceptedCount === changes.length) {
    return 'accepted'
  }

  if (rejectedCount === changes.length) {
    return 'rejected'
  }

  if (acceptedCount > 0) {
    return 'partially_accepted'
  }

  return 'staged'
}

function ensureHumanReviewer(actor: ReviewActorType, action: string): ReviewActionResult | null {
  if (actor === 'user') {
    return null
  }

  return {
    ok: false,
    reason: `Only a user can ${action}. AI may stage candidate changes but cannot finalize them.`,
  }
}

function createCandidateChange(input: Omit<CandidateChange, 'changeId' | 'createdAt' | 'updatedAt' | 'status'>): CandidateChange {
  const timestamp = Date.now()
  return {
    ...input,
    changeId: generateReviewId('change'),
    status: 'staged',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function createReviewPackage(
  sessionId: string,
  sourceKind: ReviewTargetKind,
  changes: CandidateChange[],
  options?: ReviewPackageOptions,
): StagedReviewPackage {
  const timestamp = Date.now()
  return {
    packageId: generateReviewId('review'),
    sessionId,
    title: options?.title ?? 'AI 候选改动',
    summary: options?.summary,
    sourceTool: options?.sourceTool,
    sourceKind,
    changes,
    status: derivePackageStatus(changes),
    humanReviewRequired: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function normalizeFormWritebackToReviewPackage(
  action: FormWritebackAction,
  options?: ReviewPackageOptions,
): StagedReviewPackage {
  const changes = action.updates.map((update) =>
    createCandidateChange({
      sourceActionId: action.actionId,
      sourceKind: 'form',
      targetKind: 'form',
      targetId: update.field.formId,
      targetLabel: update.field.fieldPath ?? update.field.fieldId,
      label: `字段 ${update.field.fieldId}`,
      summary: `更新表单字段 ${update.field.fieldId}`,
      preview: JSON.stringify(update.newValue),
      metadata: {
        fieldId: update.field.fieldId,
        fieldPath: update.field.fieldPath,
        dataType: update.field.dataType,
      },
    }),
  )

  return createReviewPackage(action.sessionId, 'form', changes, {
    title: options?.title ?? `表单候选改动 · ${action.formId}`,
    summary: options?.summary ?? `AI 已为表单 ${action.formId} 暂存 ${changes.length} 条候选字段更新。`,
    sourceTool: options?.sourceTool ?? action.source,
  })
}

export function normalizeDetailWritebackToReviewPackage(
  action: DetailWritebackAction,
  options?: ReviewPackageOptions,
): StagedReviewPackage {
  const changes = action.updates.map((update) =>
    createCandidateChange({
      sourceActionId: action.actionId,
      sourceKind: 'detail',
      targetKind: 'detail',
      targetId: action.sectionRef.sectionId,
      targetLabel: update.blockRef.blockId,
      label: `区块 ${update.blockRef.blockId}`,
      summary: `${update.operation} detail block ${update.blockRef.blockType}`,
      preview:
        update.operation === 'append'
          ? `${update.appendContent?.length ?? 0} 条时间线追加`
          : JSON.stringify(update.content),
      metadata: {
        blockType: update.blockRef.blockType,
        operation: update.operation,
      },
    }),
  )

  return createReviewPackage(action.sessionId, 'detail', changes, {
    title: options?.title ?? `详情页候选改动 · ${action.sectionRef.sectionId}`,
    summary:
      options?.summary ??
      `AI 已为详情区块 ${action.sectionRef.sectionId} 暂存 ${changes.length} 条候选改动。`,
    sourceTool: options?.sourceTool ?? 'workspace_stage_change',
  })
}

export function normalizeWorkbenchWritebackToReviewPackage(
  action: CardWritebackAction,
  options?: ReviewPackageOptions,
): StagedReviewPackage {
  const changes = action.operations.map((operation) =>
    createCandidateChange({
      sourceActionId: action.actionId,
      sourceKind: 'workbench',
      targetKind: 'workbench',
      targetId: action.containerRef.containerId,
      targetLabel: operation.cardRef.cardId,
      label: `卡片 ${operation.cardRef.cardId}`,
      summary: `${operation.operation} workbench card`,
      preview: operation.cardData?.title ?? operation.cardData?.description ?? JSON.stringify(operation.cardData),
      metadata: {
        operation: operation.operation,
        containerId: action.containerRef.containerId,
      },
    }),
  )

  return createReviewPackage(action.sessionId, 'workbench', changes, {
    title: options?.title ?? `工作台候选改动 · ${action.containerRef.containerId}`,
    summary:
      options?.summary ??
      `AI 已向工作台容器 ${action.containerRef.containerId} 暂存 ${changes.length} 条候选卡片改动。`,
    sourceTool: options?.sourceTool ?? 'workspace_stage_change',
  })
}

export function normalizeEditorWritebackToReviewPackage(
  action: EditorWritebackAction,
  options?: ReviewPackageOptions,
): StagedReviewPackage {
  const changes = action.operations.map((operation) =>
    createCandidateChange({
      sourceActionId: action.actionId,
      sourceKind: 'editor',
      targetKind: 'editor',
      targetId: action.editorRef.editorId,
      targetLabel: action.editorRef.filePath ?? action.editorRef.documentId ?? action.editorRef.editorId,
      label: `编辑器 ${operation.operation}`,
      summary: `向 ${action.editorRef.editorType} 编辑器写入候选内容`,
      preview: operation.newContent ?? operation.update?.content,
      metadata: {
        operation: operation.operation,
        editorType: action.editorRef.editorType,
      },
    }),
  )

  return createReviewPackage(action.sessionId, 'editor', changes, {
    title: options?.title ?? `编辑器候选改动 · ${action.editorRef.editorId}`,
    summary:
      options?.summary ??
      `AI 已在编辑器 ${action.editorRef.editorId} 中暂存 ${changes.length} 条候选内容变更。`,
    sourceTool: options?.sourceTool ?? 'workspace_stage_change',
  })
}

export function normalizeTemplateWritebackToReviewPackage(
  action: TemplateWritebackAction,
  options?: ReviewPackageOptions,
): StagedReviewPackage {
  const changes = action.operations.map((operation) =>
    createCandidateChange({
      sourceActionId: action.actionId,
      sourceKind: 'template',
      targetKind: 'template',
      targetId: action.templateRef.templateId,
      targetLabel: operation.slot.slotName,
      label: `模板槽位 ${operation.slot.slotName}`,
      summary: `${operation.operation} template slot`,
      preview:
        typeof operation.update?.content === 'string'
          ? operation.update.content
          : JSON.stringify(operation.update?.content),
      metadata: {
        operation: operation.operation,
        templateType: action.templateRef.templateType,
      },
    }),
  )

  return createReviewPackage(action.sessionId, 'template', changes, {
    title: options?.title ?? `模板候选改动 · ${action.templateRef.name}`,
    summary:
      options?.summary ??
      `AI 已在模板 ${action.templateRef.name} 中暂存 ${changes.length} 条候选槽位改动。`,
    sourceTool: options?.sourceTool ?? 'workspace_stage_change',
  })
}

function updatePackage(
  state: StagedReviewState,
  sessionId: string,
  packageId: string,
  updater: (reviewPackage: StagedReviewPackage) => StagedReviewPackage,
): { nextPackages: Record<string, StagedReviewPackage[]>; updatedPackage?: StagedReviewPackage } {
  let updatedPackage: StagedReviewPackage | undefined

  const nextSessionPackages = (state.packagesBySession[sessionId] ?? []).map((reviewPackage) => {
    if (reviewPackage.packageId !== packageId) {
      return reviewPackage
    }

    updatedPackage = updater(reviewPackage)
    return updatedPackage
  })

  return {
    nextPackages: {
      ...state.packagesBySession,
      [sessionId]: nextSessionPackages,
    },
    updatedPackage,
  }
}

export const useStagedReviewStore = create<StagedReviewState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    stageReviewPackage: (reviewPackage) => {
      set((state) => ({
        packagesBySession: {
          ...state.packagesBySession,
          [reviewPackage.sessionId]: [...(state.packagesBySession[reviewPackage.sessionId] ?? []), reviewPackage],
        },
      }))
    },

    stageFormWriteback: (action, options) => {
      const reviewPackage = normalizeFormWritebackToReviewPackage(action, options)
      get().stageReviewPackage(reviewPackage)
      return reviewPackage
    },

    stageDetailWriteback: (action, options) => {
      const reviewPackage = normalizeDetailWritebackToReviewPackage(action, options)
      get().stageReviewPackage(reviewPackage)
      return reviewPackage
    },

    stageWorkbenchWriteback: (action, options) => {
      const reviewPackage = normalizeWorkbenchWritebackToReviewPackage(action, options)
      get().stageReviewPackage(reviewPackage)
      return reviewPackage
    },

    stageEditorWriteback: (action, options) => {
      const reviewPackage = normalizeEditorWritebackToReviewPackage(action, options)
      get().stageReviewPackage(reviewPackage)
      return reviewPackage
    },

    stageTemplateWriteback: (action, options) => {
      const reviewPackage = normalizeTemplateWritebackToReviewPackage(action, options)
      get().stageReviewPackage(reviewPackage)
      return reviewPackage
    },

    acceptCandidateChange: (sessionId, packageId, changeId, actor = 'user') => {
      const guard = ensureHumanReviewer(actor, 'accept staged candidate changes')
      if (guard) {
        return guard
      }

      const state = get()
      let result: ReviewActionResult = { ok: false, reason: 'Review package not found.' }

      set(() => {
        const { nextPackages, updatedPackage } = updatePackage(state, sessionId, packageId, (reviewPackage) => {
          const nextChanges = reviewPackage.changes.map((change) =>
            change.changeId === changeId
              ? { ...change, status: 'accepted' as const, updatedAt: Date.now() }
              : change,
          )
          return {
            ...reviewPackage,
            changes: nextChanges,
            status: derivePackageStatus(nextChanges),
            updatedAt: Date.now(),
            rolledBackAt: undefined,
          }
        })
        result = updatedPackage ? { ok: true, package: updatedPackage } : result
        return { packagesBySession: nextPackages }
      })

      return result
    },

    rejectCandidateChange: (sessionId, packageId, changeId, actor = 'user') => {
      const guard = ensureHumanReviewer(actor, 'reject staged candidate changes')
      if (guard) {
        return guard
      }

      const state = get()
      let result: ReviewActionResult = { ok: false, reason: 'Review package not found.' }

      set(() => {
        const { nextPackages, updatedPackage } = updatePackage(state, sessionId, packageId, (reviewPackage) => {
          const nextChanges = reviewPackage.changes.map((change) =>
            change.changeId === changeId
              ? { ...change, status: 'rejected' as const, updatedAt: Date.now() }
              : change,
          )
          return {
            ...reviewPackage,
            changes: nextChanges,
            status: derivePackageStatus(nextChanges),
            updatedAt: Date.now(),
            rolledBackAt: undefined,
          }
        })
        result = updatedPackage ? { ok: true, package: updatedPackage } : result
        return { packagesBySession: nextPackages }
      })

      return result
    },

    acceptReviewPackage: (sessionId, packageId, actor = 'user') => {
      const guard = ensureHumanReviewer(actor, 'accept all staged candidate changes')
      if (guard) {
        return guard
      }

      const state = get()
      let result: ReviewActionResult = { ok: false, reason: 'Review package not found.' }

      set(() => {
        const { nextPackages, updatedPackage } = updatePackage(state, sessionId, packageId, (reviewPackage) => {
          const nextChanges = reviewPackage.changes.map((change) => ({
            ...change,
            status: 'accepted' as const,
            updatedAt: Date.now(),
          }))
          return {
            ...reviewPackage,
            changes: nextChanges,
            status: 'accepted',
            updatedAt: Date.now(),
            rolledBackAt: undefined,
          }
        })
        result = updatedPackage ? { ok: true, package: updatedPackage } : result
        return { packagesBySession: nextPackages }
      })

      return result
    },

    rejectReviewPackage: (sessionId, packageId, actor = 'user') => {
      const guard = ensureHumanReviewer(actor, 'reject all staged candidate changes')
      if (guard) {
        return guard
      }

      const state = get()
      let result: ReviewActionResult = { ok: false, reason: 'Review package not found.' }

      set(() => {
        const { nextPackages, updatedPackage } = updatePackage(state, sessionId, packageId, (reviewPackage) => {
          const nextChanges = reviewPackage.changes.map((change) => ({
            ...change,
            status: 'rejected' as const,
            updatedAt: Date.now(),
          }))
          return {
            ...reviewPackage,
            changes: nextChanges,
            status: 'rejected',
            updatedAt: Date.now(),
            rolledBackAt: undefined,
          }
        })
        result = updatedPackage ? { ok: true, package: updatedPackage } : result
        return { packagesBySession: nextPackages }
      })

      return result
    },

    rollbackReviewPackage: (sessionId, packageId, actor = 'user') => {
      const guard = ensureHumanReviewer(actor, 'rollback accepted candidate changes')
      if (guard) {
        return guard
      }

      const state = get()
      let result: ReviewActionResult = { ok: false, reason: 'Review package not found.' }

      set(() => {
        const { nextPackages, updatedPackage } = updatePackage(state, sessionId, packageId, (reviewPackage) => {
          const nextChanges = reviewPackage.changes.map((change) => ({
            ...change,
            status: 'staged' as const,
            updatedAt: Date.now(),
          }))
          return {
            ...reviewPackage,
            changes: nextChanges,
            status: 'rolled_back',
            updatedAt: Date.now(),
            rolledBackAt: Date.now(),
          }
        })
        result = updatedPackage ? { ok: true, package: updatedPackage } : result
        return { packagesBySession: nextPackages }
      })

      return result
    },

    clearSessionReviewPackages: (sessionId) => {
      set((state) => ({
        packagesBySession: {
          ...state.packagesBySession,
          [sessionId]: [],
        },
      }))
    },

    reset: () => {
      set(initialState)
    },
  })),
)

export function useStagedReviewPackages(sessionId: string | null | undefined): StagedReviewPackage[] {
  return useStagedReviewStore((state) => {
    if (!sessionId) {
      return []
    }

    return state.packagesBySession[sessionId] ?? []
  })
}

export function countPendingCandidateChanges(reviewPackages: StagedReviewPackage[]): number {
  return reviewPackages.reduce(
    (sum, reviewPackage) =>
      sum + reviewPackage.changes.filter((change) => change.status === 'staged').length,
    0,
  )
}
