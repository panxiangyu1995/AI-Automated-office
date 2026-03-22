import { beforeEach, describe, expect, it } from 'vitest'
import {
  createDraft,
  publishVersion,
  rollbackToVersion,
  setDefaultTemplateVersion,
  getActiveTemplateVersion,
  listTemplateVersions,
} from '@/features/template/runtime/templateVersionStore'

describe('Template version store', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('creates drafts and publishes versions', () => {
    const draft1 = createDraft('approval', '{ "title": "Draft 1" }')
    const draft2 = createDraft('approval', '{ "title": "Draft 2" }')

    expect(listTemplateVersions('approval')).toHaveLength(2)
    expect(draft1.status).toBe('draft')
    expect(draft2.version).toBe(2)

    const published = publishVersion('approval', draft2.id)
    expect(published?.status).toBe('published')
    expect(getActiveTemplateVersion('approval')?.id).toBe(draft2.id)
  })

  it('rolls back to a published version and archives previous', () => {
    const v1 = createDraft('contract', '{ "name": "v1" }')
    const v2 = createDraft('contract', '{ "name": "v2" }')
    publishVersion('contract', v1.id)
    publishVersion('contract', v2.id)

    const rolledBack = rollbackToVersion('contract', v1.id)
    expect(rolledBack?.status).toBe('published')
    expect(getActiveTemplateVersion('contract')?.id).toBe(v1.id)
  })

  it('supports default template selection when no active version exists', () => {
    createDraft('sales', '{ "name": "baseline" }')
    const v2 = createDraft('sales', '{ "name": "next" }')

    expect(setDefaultTemplateVersion('sales', v2.id)).toBe(true)
    expect(getActiveTemplateVersion('sales')?.id).toBe(v2.id)
  })
})
