export interface ShortcutConfig {
  showApp: string
  openAiChat: string
  quickSearch: string
  quickAsk: string
  openSettings: string
}

export type ShortcutKey = keyof ShortcutConfig

export const SHORTCUT_STORAGE_KEY = 'shortcuts'

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  showApp: 'CmdOrCtrl+Shift+A',
  openAiChat: 'CmdOrCtrl+Shift+I',
  quickSearch: 'CmdOrCtrl+Shift+F',
  quickAsk: 'CmdOrCtrl+L',
  openSettings: 'CmdOrCtrl+,',
}

const LEGACY_SHORTCUT_MIGRATIONS: Partial<Record<ShortcutKey, Record<string, string>>> = {
  showApp: {
    'Ctrl+Shift+A': DEFAULT_SHORTCUTS.showApp,
  },
  openAiChat: {
    'Ctrl+Shift+D': DEFAULT_SHORTCUTS.openAiChat,
    'Ctrl+Shift+I': DEFAULT_SHORTCUTS.openAiChat,
    'CmdOrCtrl+Shift+D': DEFAULT_SHORTCUTS.openAiChat,
  },
  quickSearch: {
    'Ctrl+Shift+F': DEFAULT_SHORTCUTS.quickSearch,
  },
}

function migrateLegacyShortcutValue(key: ShortcutKey, value: string): string {
  return LEGACY_SHORTCUT_MIGRATIONS[key]?.[value] ?? value
}

export function normalizeShortcutConfig(
  parsed: Partial<Record<ShortcutKey, string>> | null | undefined
): ShortcutConfig {
  return {
    showApp: migrateLegacyShortcutValue('showApp', parsed?.showApp?.trim() || DEFAULT_SHORTCUTS.showApp),
    openAiChat: migrateLegacyShortcutValue(
      'openAiChat',
      parsed?.openAiChat?.trim() || DEFAULT_SHORTCUTS.openAiChat
    ),
    quickSearch: migrateLegacyShortcutValue(
      'quickSearch',
      parsed?.quickSearch?.trim() || DEFAULT_SHORTCUTS.quickSearch
    ),
    quickAsk: parsed?.quickAsk?.trim() || DEFAULT_SHORTCUTS.quickAsk,
    openSettings: parsed?.openSettings?.trim() || DEFAULT_SHORTCUTS.openSettings,
  }
}

export function parseShortcutConfig(raw: string | null): ShortcutConfig {
  if (!raw) {
    return DEFAULT_SHORTCUTS
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Record<ShortcutKey, string>>
    return normalizeShortcutConfig(parsed)
  } catch {
    return DEFAULT_SHORTCUTS
  }
}

export function formatShortcutLabel(shortcut: string): string {
  return shortcut.replace('CmdOrCtrl', 'Ctrl')
}
