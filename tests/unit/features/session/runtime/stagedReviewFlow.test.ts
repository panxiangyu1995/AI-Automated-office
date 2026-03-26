import { beforeEach, describe, expect, it } from 'vitest'
import {
  createCardContainerReference,
  createCardReference,
  createCardUpdateOperation,
  createCardWritebackAction,
  createEditorReference,
  createEditorWritebackAction,
  createEditorWritebackOperation,
  createFieldReference,
  createFieldUpdate,
  createWritebackAction,
  createDetailSectionReference,
  createDetailBlockReference,
  createDetailBlockUpdate,
  createDetailWritebackAction,
  normalizeDetailWritebackToReviewPackage,
  normalizeEditorWritebackToReviewPackage,
  normalizeFormWritebackToReviewPackage,
  normalizeWorkbenchWritebackToReviewPackage,
  useStagedReviewStore,
} from '@/features/session/runtime'

describe('stagedReviewFlow', () => {
  beforeEach(() => {
    useStagedReviewStore.getState().reset()
  })

  it('normalizes form, detail, workbench, and editor writebacks into staged review packages', () => {
    const field = createFieldReference('tender-form', 'title', 'string', { fieldPath: 'document.title' })
    const formAction = createWritebackAction('session-1', 'trace-1', 'tender-form', 'workspace_stage_change', [
      createFieldUpdate(field, '投标文件草稿'),
    ])
    const formPackage = normalizeFormWritebackToReviewPackage(formAction)

    const sectionRef = createDetailSectionReference('detail-1', 'tender', 'tender-1', 'dept-tender')
    const blockRef = createDetailBlockReference('summary-block', 'summary', sectionRef)
    const detailAction = createDetailWritebackAction('session-1', sectionRef, [
      createDetailBlockUpdate(blockRef, 'replace', {
        content: {
          title: '摘要',
          content: '新的摘要候选内容',
          format: 'markdown',
        },
      }),
    ])
    const detailPackage = normalizeDetailWritebackToReviewPackage(detailAction)

    const containerRef = createCardContainerReference('wb-1', 'page-1', 'dept-tender', 'workbench')
    const cardRef = createCardReference('card-1', containerRef, 0)
    const workbenchAction = createCardWritebackAction('session-1', containerRef, [
      createCardUpdateOperation(cardRef, 'create', {
        cardData: {
          title: '待审阅卡片',
          contentType: 'text',
          content: { content: '候选内容', format: 'plain' },
        },
      }),
    ])
    const workbenchPackage = normalizeWorkbenchWritebackToReviewPackage(workbenchAction)

    const editorRef = createEditorReference('editor-1', 'markdown', { documentId: 'doc-1' })
    const editorAction = createEditorWritebackAction('session-1', editorRef, [
      createEditorWritebackOperation(editorRef, 'replace', {
        newContent: '# 候选标书大纲',
      }),
    ])
    const editorPackage = normalizeEditorWritebackToReviewPackage(editorAction)

    expect(formPackage.sourceKind).toBe('form')
    expect(formPackage.changes[0].targetLabel).toBe('document.title')
    expect(detailPackage.sourceKind).toBe('detail')
    expect(detailPackage.changes[0].targetLabel).toBe('summary-block')
    expect(workbenchPackage.sourceKind).toBe('workbench')
    expect(workbenchPackage.changes[0].targetId).toBe('wb-1')
    expect(editorPackage.sourceKind).toBe('editor')
    expect(editorPackage.changes[0].preview).toContain('候选标书大纲')
  })

  it('rejects review decisions made by agents and only allows user review actions', () => {
    const field = createFieldReference('tender-form', 'title', 'string')
    const action = createWritebackAction('session-2', 'trace-2', 'tender-form', 'workspace_stage_change', [
      createFieldUpdate(field, '新标题'),
    ])
    const reviewPackage = useStagedReviewStore.getState().stageFormWriteback(action)

    const denied = useStagedReviewStore
      .getState()
      .acceptReviewPackage('session-2', reviewPackage.packageId, 'agent')

    expect(denied.ok).toBe(false)
    expect(denied.reason).toContain('Only a user can')

    const storedPackage = useStagedReviewStore.getState().packagesBySession['session-2'][0]
    expect(storedPackage.status).toBe('staged')
  })

  it('supports user accept, reject, and rollback across staged candidate changes', () => {
    const field = createFieldReference('tender-form', 'title', 'string')
    const action = createWritebackAction('session-3', 'trace-3', 'tender-form', 'workspace_stage_change', [
      createFieldUpdate(field, '标题 A'),
      createFieldUpdate(createFieldReference('tender-form', 'summary', 'string'), '摘要 B'),
    ])

    const reviewPackage = useStagedReviewStore.getState().stageFormWriteback(action)
    const [firstChange, secondChange] = reviewPackage.changes

    const accepted = useStagedReviewStore
      .getState()
      .acceptCandidateChange('session-3', reviewPackage.packageId, firstChange.changeId, 'user')
    expect(accepted.ok).toBe(true)
    expect(accepted.package?.status).toBe('partially_accepted')

    const rejected = useStagedReviewStore
      .getState()
      .rejectCandidateChange('session-3', reviewPackage.packageId, secondChange.changeId, 'user')
    expect(rejected.ok).toBe(true)
    expect(rejected.package?.changes[1].status).toBe('rejected')

    const rolledBack = useStagedReviewStore
      .getState()
      .rollbackReviewPackage('session-3', reviewPackage.packageId, 'user')
    expect(rolledBack.ok).toBe(true)
    expect(rolledBack.package?.status).toBe('rolled_back')
    expect(rolledBack.package?.changes.every((change) => change.status === 'staged')).toBe(true)
  })
})
