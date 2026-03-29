/**
 * PresetPicker Component
 * Story 41.7 - Workspace Layout Presets System
 *
 * Component for selecting and switching between layout presets.
 */

import { useState, useCallback } from 'react'
import { useLayoutPresetStore } from '../../stores/layoutPresetStore'
import { useUIStore } from '../../stores/uiStore'
import { useCurrentWorkspace } from '../../stores/workspaceStore'
import { PresetMode, PresetType } from '../../features/workspace/types/layout'
import type { LayoutPreset } from '../../features/workspace/types/layout'

// ==================== Icons ====================

const LayoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const StarIcon = ({ filled, className }: { filled?: boolean; className?: string }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

// ==================== Preset Card ====================

interface PresetCardProps {
  preset: LayoutPreset
  isActive: boolean
  isBuiltIn: boolean
  onSelect: () => void
  onSetDefault?: () => void
}

function PresetCard({
  preset,
  isActive,
  isBuiltIn,
  onSelect,
  onSetDefault,
}: PresetCardProps) {
  const getModeLabel = (mode?: PresetMode) => {
    switch (mode) {
      case PresetMode.Focus:
        return '专注模式'
      case PresetMode.Approval:
        return '审批模式'
      case PresetMode.Draft:
        return '起草模式'
      case PresetMode.Audit:
        return '审计模式'
      default:
        return '自定义'
    }
  }

  const getModeColor = (mode?: PresetMode) => {
    switch (mode) {
      case PresetMode.Focus:
        return 'bg-blue-500/10 text-blue-500'
      case PresetMode.Approval:
        return 'bg-green-500/10 text-green-500'
      case PresetMode.Draft:
        return 'bg-purple-500/10 text-purple-500'
      case PresetMode.Audit:
        return 'bg-orange-500/10 text-orange-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  return (
    <div
      className={`
        group relative p-3 rounded-lg border cursor-pointer transition-all duration-150
        ${isActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
      `}
      onClick={onSelect}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <CheckIcon />
          </div>
        </div>
      )}

      {/* Preset info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <LayoutIcon />
          <span className="font-medium text-sm">{preset.name}</span>
          {preset.isDefault && (
            <StarIcon filled={true} className="text-yellow-500" />
          )}
        </div>

        {preset.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {preset.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          <span className={`text-xs px-1.5 py-0.5 rounded ${getModeColor(preset.mode)}`}>
            {getModeLabel(preset.mode)}
          </span>
          {isBuiltIn && (
            <span className="text-xs text-muted-foreground">内置</span>
          )}
        </div>
      </div>

      {/* Layout preview */}
      <div className="mt-3 h-12 rounded bg-muted/50 flex items-center justify-center">
        <div className="flex gap-0.5">
          <div
            className="h-8 bg-primary/20 rounded"
            style={{ width: `${Math.max(20, Math.min(60, preset.layout.sidebarWidth / 6))}px` }}
          />
          <div className="h-8 bg-muted-foreground/10 rounded flex-1 mx-0.5" />
          {!preset.layout.chatPanelCollapsed && (
            <div
              className="h-8 bg-accent/20 rounded"
              style={{ width: `${Math.max(20, Math.min(80, preset.layout.chatPanelWidth / 6))}px` }}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      {!isBuiltIn && onSetDefault && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSetDefault()
            }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="设为默认"
          >
            <StarIcon filled={preset.isDefault} className={preset.isDefault ? 'text-yellow-500' : 'text-muted-foreground'} />
          </button>
        </div>
      )}
    </div>
  )
}

// ==================== Preset Picker Component ====================

interface PresetPickerProps {
  /** Whether the picker is open */
  isOpen: boolean
  /** Callback when picker is closed */
  onClose: () => void
}

export function PresetPicker({ isOpen, onClose }: PresetPickerProps) {
  const { workspaceId } = useCurrentWorkspace()
  const { applyLayoutPreset } = useUIStore()
  const {
    activePresetId,
    setActivePresetId,
    getBuiltInPresets,
    getCustomPresets,
    updatePreset,
    createPreset,
  } = useLayoutPresetStore()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [filter, setFilter] = useState<'all' | 'builtin' | 'custom'>('all')

  // Get presets
  const builtInPresets = getBuiltInPresets()
  const customPresets = workspaceId ? getCustomPresets(workspaceId) : []

  const filteredBuiltIn = filter === 'custom' ? [] : builtInPresets
  const filteredCustom = filter === 'builtin' ? [] : customPresets

  const handleSelectPreset = useCallback((preset: LayoutPreset) => {
    applyLayoutPreset(preset.layout, preset.id, preset.mode)
    setActivePresetId(preset.id)
    onClose()
  }, [applyLayoutPreset, setActivePresetId, onClose])

  const handleSaveCurrentAsPreset = useCallback(() => {
    if (!newPresetName.trim()) return

    const { sidebarWidth, sidebarCollapsed, chatPanelWidth, chatPanelCollapsed,
            bottomPanelHeight, bottomPanelCollapsed, topBarVisible, aiPanelVisible } = useUIStore.getState()

    createPreset({
      name: newPresetName.trim(),
      description: '自定义布局预设',
      type: PresetType.Custom,
      workspaceId: workspaceId ?? undefined,
      layout: {
        sidebarWidth,
        sidebarCollapsed,
        chatPanelWidth,
        chatPanelCollapsed,
        bottomPanelHeight,
        bottomPanelCollapsed,
        topBarVisible,
        aiPanelVisible,
      },
      isDefault: false,
    })

    setNewPresetName('')
    setShowCreateForm(false)
  }, [newPresetName, workspaceId, createPreset])

  const handleSetDefault = useCallback((presetId: string) => {
    // Update all presets to not be default
    customPresets.forEach((p) => {
      if (p.id === presetId) {
        updatePreset(p.id, { isDefault: true })
      } else if (p.isDefault) {
        updatePreset(p.id, { isDefault: false })
      }
    })
  }, [customPresets, updatePreset])

  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-background rounded-lg border shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="font-medium text-sm">布局预设</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="保存当前布局"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b">
        {(['all', 'builtin', 'custom'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? '全部' : f === 'builtin' ? '内置' : '自定义'}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="p-3 border-b bg-muted/30">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="预设名称"
            className="w-full px-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveCurrentAsPreset()
              } else if (e.key === 'Escape') {
                setShowCreateForm(false)
                setNewPresetName('')
              }
            }}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setShowCreateForm(false)
                setNewPresetName('')
              }}
              className="px-2 py-1 text-xs rounded hover:bg-muted"
            >
              取消
            </button>
            <button
              onClick={handleSaveCurrentAsPreset}
              disabled={!newPresetName.trim()}
              className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* Preset list */}
      <div className="max-h-80 overflow-y-auto p-2 space-y-2">
        {filteredBuiltIn.length === 0 && filteredCustom.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {filter === 'custom' ? '暂无自定义预设' : '暂无预设'}
          </div>
        )}

        {/* Built-in presets */}
        {filteredBuiltIn.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            isBuiltIn={true}
            onSelect={() => handleSelectPreset(preset)}
          />
        ))}

        {/* Custom presets */}
        {filteredCustom.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            isBuiltIn={false}
            onSelect={() => handleSelectPreset(preset)}
            onSetDefault={() => handleSetDefault(preset.id)}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground">
          点击预设名称切换布局 · 按 <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl</kbd>+<kbd className="px-1 py-0.5 rounded bg-muted text-xs">K</kbd> 打开快速切换
        </p>
      </div>
    </div>
  )
}

// ==================== Preset Picker Trigger ====================

interface PresetPickerTriggerProps {
  /** Current preset name */
  presetName?: string
  /** Callback when picker is toggled */
  onToggle: () => void
}

export function PresetPickerTrigger({ presetName, onToggle }: PresetPickerTriggerProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors text-sm"
    >
      <LayoutIcon />
      <span>{presetName || '默认布局'}</span>
      <ChevronDownIcon />
    </button>
  )
}

export default PresetPicker
