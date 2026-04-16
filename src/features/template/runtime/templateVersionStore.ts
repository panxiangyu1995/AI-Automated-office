/**
 * Template Version Store
 *
 * I3: 前端模板存储接入 SQLite (替代 localStorage)
 * 铁律来源: 架构ADR-003 本地优先 SQLite 存储
 *
 * 优先通过 Tauri IPC 调用 template_store Rust 后端，
 * 当 Tauri 环境不可用时回退到 localStorage。
 */

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

// ==================== Storage Adapter ====================

const STORAGE_PREFIX = 'template:version:'

function storageKey(templateId: string) {
  return `${STORAGE_PREFIX}${templateId}`
}

/** localStorage fallback 适配器 */
const localStorageAdapter = {
  loadState(templateId: string): TemplateRuntimeState {
    const raw = localStorage.getItem(storageKey(templateId))
    if (!raw) return { templateId, versions: [] }
    try {
      return JSON.parse(raw) as TemplateRuntimeState
    } catch {
      return { templateId, versions: [] }
    }
  },

  saveState(state: TemplateRuntimeState) {
    localStorage.setItem(storageKey(state.templateId), JSON.stringify(state))
  },
}

/** Tauri IPC 适配器 */
let tauriAvailable: boolean | null = null

async function isTauriAvailable(): Promise<boolean> {
  if (tauriAvailable !== null) return tauriAvailable
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('plugin:template-store|ping')
    tauriAvailable = true
  } catch {
    tauriAvailable = false
  }
  return tauriAvailable
}

const tauriAdapter = {
  async loadState(templateId: string): Promise<TemplateRuntimeState> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const versions = await invoke<TemplateVersion[]>('list_template_versions', { templateId })
      const activeVersionId = await invoke<string | null>('get_active_template_version', { templateId })
      const defaultVersionId = await invoke<string | null>('get_default_template_version', { templateId })
      return { templateId, versions, activeVersionId: activeVersionId ?? undefined, defaultVersionId: defaultVersionId ?? undefined }
    } catch {
      return localStorageAdapter.loadState(templateId)
    }
  },

  async saveState(state: TemplateRuntimeState): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('save_template_state', { state })
    } catch {
      localStorageAdapter.saveState(state)
    }
  },
}

// ==================== Unified API ====================

async function loadState(templateId: string): Promise<TemplateRuntimeState> {
  if (await isTauriAvailable()) {
    return tauriAdapter.loadState(templateId)
  }
  return localStorageAdapter.loadState(templateId)
}

async function saveState(state: TemplateRuntimeState): Promise<void> {
  if (await isTauriAvailable()) {
    return tauriAdapter.saveState(state)
  }
  localStorageAdapter.saveState(state)
}

function nextVersionNumber(state: TemplateRuntimeState): number {
  const maxVersion = state.versions.reduce((max, version) => Math.max(max, version.version), 0)
  return maxVersion + 1
}

// ==================== Public API ====================

export async function createDraft(templateId: string, content: string): Promise<TemplateVersion> {
  const state = await loadState(templateId)
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
  await saveState(state)
  return version
}

export async function publishVersion(templateId: string, versionId: string): Promise<TemplateVersion | null> {
  const state = await loadState(templateId)
  const now = new Date().toISOString()
  const version = state.versions.find((item) => item.id === versionId)
  if (!version) return null

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
  await saveState(state)
  return state.versions.find((item) => item.id === versionId) ?? null
}

export async function rollbackToVersion(templateId: string, versionId: string): Promise<TemplateVersion | null> {
  const state = await loadState(templateId)
  const now = new Date().toISOString()
  const version = state.versions.find((item) => item.id === versionId)
  if (!version) return null

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
  await saveState(state)
  return state.versions.find((item) => item.id === versionId) ?? null
}

export async function setDefaultTemplateVersion(templateId: string, versionId: string): Promise<boolean> {
  const state = await loadState(templateId)
  const version = state.versions.find((item) => item.id === versionId)
  if (!version) return false

  state.defaultVersionId = versionId
  await saveState(state)
  return true
}

export async function getActiveTemplateVersion(templateId: string): Promise<TemplateVersion | null> {
  const state = await loadState(templateId)
  const targetId = state.activeVersionId ?? state.defaultVersionId
  if (!targetId) return null
  return state.versions.find((item) => item.id === targetId) ?? null
}

export async function listTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
  const state = await loadState(templateId)
  return state.versions
}
