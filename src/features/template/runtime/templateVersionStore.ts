export type TemplateStatus = 'draft' | 'published' | 'archived'

export interface TemplateVersion {
  id: string
  templateId: string
  version: number
  status: TemplateStatus
  createdAt: string
  updatedAt: string
  content: string
}

export interface TemplateRuntimeState {
  templateId: string
  defaultVersionId?: string
  activeVersionId?: string
  versions: TemplateVersion[]
}

const STORAGE_PREFIX = 'template:version:'

function storageKey(templateId: string) {
  return `${STORAGE_PREFIX}${templateId}`
}

function loadState(templateId: string): TemplateRuntimeState {
  const raw = localStorage.getItem(storageKey(templateId))
  if (!raw) {
    return { templateId, versions: [] }
  }

  try {
    return JSON.parse(raw) as TemplateRuntimeState
  } catch {
    return { templateId, versions: [] }
  }
}

function saveState(state: TemplateRuntimeState) {
  localStorage.setItem(storageKey(state.templateId), JSON.stringify(state))
}

function nextVersionNumber(state: TemplateRuntimeState): number {
  const maxVersion = state.versions.reduce((max, version) => Math.max(max, version.version), 0)
  return maxVersion + 1
}

export function createDraft(templateId: string, content: string): TemplateVersion {
  const state = loadState(templateId)
  const now = new Date().toISOString()
  const version: TemplateVersion = {
    id: `${templateId}-v${nextVersionNumber(state)}`,
    templateId,
    version: nextVersionNumber(state),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    content,
  }

  state.versions.push(version)
  saveState(state)
  return version
}

export function publishVersion(templateId: string, versionId: string): TemplateVersion | null {
  const state = loadState(templateId)
  const now = new Date().toISOString()
  const version = state.versions.find((item) => item.id === versionId)
  if (!version) {
    return null
  }

  state.versions = state.versions.map((item) => {
    if (item.id === versionId) {
      return { ...item, status: 'published', updatedAt: now }
    }
    if (item.status === 'published') {
      return { ...item, status: 'archived', updatedAt: now }
    }
    return item
  })

  state.activeVersionId = versionId
  saveState(state)
  return state.versions.find((item) => item.id === versionId) ?? null
}

export function rollbackToVersion(templateId: string, versionId: string): TemplateVersion | null {
  const state = loadState(templateId)
  const now = new Date().toISOString()
  const version = state.versions.find((item) => item.id === versionId)
  if (!version) {
    return null
  }

  state.versions = state.versions.map((item) => {
    if (item.id === versionId) {
      return { ...item, status: 'published', updatedAt: now }
    }
    if (item.status === 'published') {
      return { ...item, status: 'archived', updatedAt: now }
    }
    return item
  })
  state.activeVersionId = versionId
  saveState(state)
  return state.versions.find((item) => item.id === versionId) ?? null
}

export function setDefaultTemplateVersion(templateId: string, versionId: string): boolean {
  const state = loadState(templateId)
  const version = state.versions.find((item) => item.id === versionId)
  if (!version) {
    return false
  }

  state.defaultVersionId = versionId
  saveState(state)
  return true
}

export function getActiveTemplateVersion(templateId: string): TemplateVersion | null {
  const state = loadState(templateId)
  const targetId = state.activeVersionId ?? state.defaultVersionId
  if (!targetId) {
    return null
  }
  return state.versions.find((item) => item.id === targetId) ?? null
}

export function listTemplateVersions(templateId: string): TemplateVersion[] {
  return loadState(templateId).versions
}

