import { useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Button } from '../../../components/ui/button'
import { Switch } from '../../../components/ui/switch'
import { Label } from '../../../components/ui/label'
import { useUIStore } from '../../../stores/uiStore'
import { ModelProviderSettings } from './ModelProviderSettings'
import { PromptDebugMode } from './PromptDebugMode'
import { SubAgentRegistry } from './SubAgentRegistry'
import { SubAgentPersonaConfig } from './SubAgentPersonaConfig'
import { SubAgentToolBinding } from './SubAgentToolBinding'
import { SubAgentPermissionConfig } from './SubAgentPermissionConfig'
import { SubAgentModelConfig } from './SubAgentModelConfig'
import { SubAgentRouting } from './SubAgentRouting'
import { SubAgentExecutionMonitor } from './SubAgentExecutionMonitor'
import { KnowledgeDocUpload } from './KnowledgeDocUpload'
import { KnowledgeQARetrieval } from './KnowledgeQARetrieval'
import { TicketKnowledgeGeneration } from './TicketKnowledgeGeneration'
import { KnowledgeEntryManagement } from './KnowledgeEntryManagement'
import { KnowledgeBaseAccessControl } from './KnowledgeBaseAccessControl'
import { KnowledgeQualityEvaluation } from './KnowledgeQualityEvaluation'
import { SkillMdParsing } from './SkillMdParsing'
import { SoulMdParsing } from './SoulMdParsing'
import { PluginAdaptation } from './PluginAdaptation'
import { ClawHubMarketplace } from './ClawHubMarketplace'
import { PrivateMarketConfig } from './PrivateMarketConfig'
import { ResourceSecurityManagement } from './ResourceSecurityManagement'
import { ResourceExecutionAudit } from './ResourceExecutionAudit'
import { ConnectorFrameworkAuth } from './ConnectorFrameworkAuth'

type SectionKey = 'general' | 'shortcuts' | 'agent' | 'updates' | 'prompt-debug' | 'sub-agent' | 'sub-agent-persona' | 'sub-agent-tool' | 'sub-agent-permission' | 'sub-agent-model' | 'sub-agent-routing' | 'sub-agent-execution' | 'knowledge' | 'knowledge-qa' | 'knowledge-generation' | 'knowledge-entry' | 'knowledge-access' | 'knowledge-quality' | 'skill-parsing' | 'soul-parsing' | 'plugin-adaptation' | 'clawhub-market' | 'private-market' | 'resource-security' | 'resource-execution-audit' | 'connector-framework'
type ShortcutKey = 'showApp' | 'openAiChat' | 'quickSearch' | 'openSettings'

const SHORTCUT_STORAGE_KEY = 'shortcuts'
const DEFAULT_SHORTCUTS: Record<ShortcutKey, string> = {
  showApp: 'Ctrl+Shift+A',
  openAiChat: 'Ctrl+Shift+D',
  quickSearch: 'Ctrl+Shift+F',
  openSettings: 'CmdOrCtrl+,',
}

/**
 * 读取本地快捷键配置
 */
function loadShortcutsFromStorage() {
  const saved = localStorage.getItem(SHORTCUT_STORAGE_KEY)
  if (!saved) {
    return DEFAULT_SHORTCUTS
  }
  try {
    const parsed = JSON.parse(saved) as Partial<Record<ShortcutKey, string>>
    return {
      ...DEFAULT_SHORTCUTS,
      ...parsed,
    }
  } catch {
    return DEFAULT_SHORTCUTS
  }
}

/**
 * 设置面板
 */
export function SettingsPanel() {
  const [active, setActive] = useState<SectionKey>('general')
  const [shortcuts, setShortcuts] = useState<Record<ShortcutKey, string>>(() => loadShortcutsFromStorage())
  const [draftShortcuts, setDraftShortcuts] = useState<Record<ShortcutKey, string>>(() => loadShortcutsFromStorage())
  const [shortcutErrors, setShortcutErrors] = useState<Partial<Record<ShortcutKey, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const {
    topBarVisible,
    toggleTopBar,
    sidebarCollapsed,
    toggleSidebar,
    chatPanelCollapsed,
    toggleChatPanel,
    bottomPanelCollapsed,
    toggleBottomPanel,
    resetLayout,
  } = useUIStore()

  const hasShortcutChanges = useMemo(() => {
    return (
      draftShortcuts.showApp !== shortcuts.showApp ||
      draftShortcuts.openAiChat !== shortcuts.openAiChat ||
      draftShortcuts.quickSearch !== shortcuts.quickSearch ||
      draftShortcuts.openSettings !== shortcuts.openSettings
    )
  }, [draftShortcuts, shortcuts])

  /**
   * 更新快捷键配置
   */
  const handleSaveShortcuts = async () => {
    setSaving(true)
    setSaveMessage(null)
    setShortcutErrors({})
    const nextErrors: Partial<Record<ShortcutKey, string>> = {}

    const keys: ShortcutKey[] = ['showApp', 'openAiChat', 'quickSearch', 'openSettings']
    for (const key of keys) {
      const value = draftShortcuts[key]?.trim()
      if (!value) {
        nextErrors[key] = '快捷键不能为空'
        continue
      }
      try {
        await invoke<boolean>('check_shortcut_available', { shortcutStr: value })
      } catch (error) {
        nextErrors[key] = error instanceof Error ? error.message : '快捷键格式无效'
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setShortcutErrors(nextErrors)
      setSaving(false)
      return
    }

    try {
      await invoke('update_shortcut', { action: 'show_app', newShortcut: draftShortcuts.showApp })
      await invoke('update_shortcut', { action: 'open_ai_chat', newShortcut: draftShortcuts.openAiChat })
      await invoke('update_shortcut', { action: 'quick_search', newShortcut: draftShortcuts.quickSearch })
      await invoke('update_shortcut', { action: 'open_settings', newShortcut: draftShortcuts.openSettings })
      localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(draftShortcuts))
      setShortcuts(draftShortcuts)
      setSaveMessage('快捷键已更新并生效')
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '快捷键更新失败')
    } finally {
      setSaving(false)
    }
  }

  /**
   * 恢复快捷键默认配置
   */
  const handleResetShortcuts = async () => {
    setSaving(true)
    setSaveMessage(null)
    setShortcutErrors({})
    try {
      await invoke('update_shortcut', { action: 'show_app', newShortcut: DEFAULT_SHORTCUTS.showApp })
      await invoke('update_shortcut', { action: 'open_ai_chat', newShortcut: DEFAULT_SHORTCUTS.openAiChat })
      await invoke('update_shortcut', { action: 'quick_search', newShortcut: DEFAULT_SHORTCUTS.quickSearch })
      await invoke('update_shortcut', { action: 'open_settings', newShortcut: DEFAULT_SHORTCUTS.openSettings })
      localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(DEFAULT_SHORTCUTS))
      setShortcuts(DEFAULT_SHORTCUTS)
      setDraftShortcuts(DEFAULT_SHORTCUTS)
      setSaveMessage('已恢复默认快捷键')
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '恢复默认失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full w-full flex">
      <aside
        className="flex flex-col p-4 border-r border-slate-200"
        style={{ width: 220, backgroundColor: '#FFFFFF' }}
      >
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'general' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('general')}
        >
          通用
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'shortcuts' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('shortcuts')}
        >
          快捷键
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'agent' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('agent')}
        >
          Agent
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'updates' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('updates')}
        >
          更新
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'prompt-debug' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('prompt-debug')}
        >
          提示词调试
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'sub-agent' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('sub-agent')}
        >
          Sub-Agent 管理
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'sub-agent-persona' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('sub-agent-persona')}
        >
          Sub-Agent 角色配置
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'sub-agent-tool' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('sub-agent-tool')}
        >
          Sub-Agent 工具绑定
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'sub-agent-permission' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('sub-agent-permission')}
        >
          Sub-Agent 权限配置
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'sub-agent-model' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('sub-agent-model')}
        >
          Sub-Agent 模型配置
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'sub-agent-routing' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('sub-agent-routing')}
        >
          Sub-Agent 调用路由
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'sub-agent-execution' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('sub-agent-execution')}
        >
          Sub-Agent 执行监控
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'knowledge' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('knowledge')}
        >
          知识文档管理
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'knowledge-qa' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('knowledge-qa')}
        >
          知识问答检索
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'knowledge-generation' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('knowledge-generation')}
        >
          知识自动生成
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'knowledge-entry' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('knowledge-entry')}
        >
          知识条目管理
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'knowledge-access' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('knowledge-access')}
        >
          知识库权限控制
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'knowledge-quality' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('knowledge-quality')}
        >
          知识质量评估
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'skill-parsing' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('skill-parsing')}
        >
          SKILL.md解析
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'soul-parsing' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('soul-parsing')}
        >
          SOUL.md解析
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'plugin-adaptation' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('plugin-adaptation')}
        >
          Plugin适配转换
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'clawhub-market' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('clawhub-market')}
        >
          ClawHub市场
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'private-market' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('private-market')}
        >
          私有市场
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'resource-security' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('resource-security')}
        >
          资源安全
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'resource-execution-audit' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('resource-execution-audit')}
        >
          执行审计
        </button>
        <button
          className={`text-left px-3 py-2 rounded-md text-sm ${
            active === 'connector-framework' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setActive('connector-framework')}
        >
          连接器框架
        </button>
      </aside>

      <section className="flex-1 p-6 overflow-auto" style={{ backgroundColor: '#FFFFFF' }}>
        {active === 'general' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">通用设置</h2>
            <div className="flex items-center justify-between">
              <Label htmlFor="top-bar">显示顶部菜单栏</Label>
              <Switch id="top-bar" checked={topBarVisible} onCheckedChange={toggleTopBar} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sidebar">显示左侧栏</Label>
              <Switch id="sidebar" checked={!sidebarCollapsed} onCheckedChange={toggleSidebar} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-panel">显示 AI 面板</Label>
              <Switch id="ai-panel" checked={!chatPanelCollapsed} onCheckedChange={toggleChatPanel} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="bottom-panel">显示底部面板</Label>
              <Switch id="bottom-panel" checked={!bottomPanelCollapsed} onCheckedChange={toggleBottomPanel} />
            </div>
            <div className="pt-2">
              <Button variant="outline" onClick={resetLayout}>
                恢复默认布局
              </Button>
            </div>
          </div>
        )}

        {active === 'shortcuts' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">快捷键</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border border-slate-200 p-4 space-y-2">
                <div className="text-sm text-slate-600 font-medium">显示/隐藏应用</div>
                <input
                  value={draftShortcuts.showApp}
                  onChange={(event) =>
                    setDraftShortcuts((prev) => ({ ...prev, showApp: event.target.value }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  placeholder="Ctrl+Shift+A"
                />
                {shortcutErrors.showApp && (
                  <div className="text-xs text-red-500">{shortcutErrors.showApp}</div>
                )}
              </div>
              <div className="rounded-md border border-slate-200 p-4 space-y-2">
                <div className="text-sm text-slate-600 font-medium">打开 AI 对话</div>
                <input
                  value={draftShortcuts.openAiChat}
                  onChange={(event) =>
                    setDraftShortcuts((prev) => ({ ...prev, openAiChat: event.target.value }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  placeholder="Ctrl+Shift+D"
                />
                {shortcutErrors.openAiChat && (
                  <div className="text-xs text-red-500">{shortcutErrors.openAiChat}</div>
                )}
              </div>
              <div className="rounded-md border border-slate-200 p-4 space-y-2">
                <div className="text-sm text-slate-600 font-medium">快速搜索</div>
                <input
                  value={draftShortcuts.quickSearch}
                  onChange={(event) =>
                    setDraftShortcuts((prev) => ({ ...prev, quickSearch: event.target.value }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  placeholder="Ctrl+Shift+F"
                />
                {shortcutErrors.quickSearch && (
                  <div className="text-xs text-red-500">{shortcutErrors.quickSearch}</div>
                )}
              </div>
              <div className="rounded-md border border-slate-200 p-4 space-y-2">
                <div className="text-sm text-slate-600 font-medium">打开设置</div>
                <input
                  value={draftShortcuts.openSettings}
                  onChange={(event) =>
                    setDraftShortcuts((prev) => ({ ...prev, openSettings: event.target.value }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  placeholder="CmdOrCtrl+,"
                />
                {shortcutErrors.openSettings && (
                  <div className="text-xs text-red-500">{shortcutErrors.openSettings}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveShortcuts} disabled={saving || !hasShortcutChanges}>
                {saving ? '保存中...' : '保存并生效'}
              </Button>
              <Button variant="outline" onClick={handleResetShortcuts} disabled={saving}>
                恢复默认
              </Button>
              {saveMessage && <span className="text-sm text-slate-500">{saveMessage}</span>}
            </div>
          </div>
        )}

        {active === 'agent' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Agent 设置</h2>
            <ModelProviderSettings />
          </div>
        )}

        {active === 'updates' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">更新</h2>
            <p className="text-slate-600 text-sm">后续将提供更新策略与版本信息。</p>
          </div>
        )}

        {active === 'prompt-debug' && (
          <PromptDebugMode />
        )}

        {active === 'sub-agent' && (
          <SubAgentRegistry />
        )}

        {active === 'sub-agent-persona' && (
          <SubAgentPersonaConfig />
        )}

        {active === 'sub-agent-tool' && (
          <SubAgentToolBinding />
        )}

        {active === 'sub-agent-permission' && (
          <SubAgentPermissionConfig />
        )}

        {active === 'sub-agent-model' && (
          <SubAgentModelConfig />
        )}

        {active === 'sub-agent-routing' && (
          <SubAgentRouting />
        )}

        {active === 'sub-agent-execution' && (
          <SubAgentExecutionMonitor />
        )}

        {active === 'knowledge' && (
          <KnowledgeDocUpload />
        )}

        {active === 'knowledge-qa' && (
          <KnowledgeQARetrieval />
        )}

        {active === 'knowledge-generation' && (
          <TicketKnowledgeGeneration />
        )}

        {active === 'knowledge-entry' && (
          <KnowledgeEntryManagement />
        )}

        {active === 'knowledge-access' && (
          <KnowledgeBaseAccessControl />
        )}

        {active === 'knowledge-quality' && (
          <KnowledgeQualityEvaluation />
        )}

        {active === 'skill-parsing' && (
          <SkillMdParsing />
        )}

        {active === 'soul-parsing' && (
          <SoulMdParsing />
        )}

        {active === 'plugin-adaptation' && (
          <PluginAdaptation />
        )}

        {active === 'clawhub-market' && (
          <ClawHubMarketplace />
        )}

        {active === 'private-market' && (
          <PrivateMarketConfig />
        )}

        {active === 'resource-security' && (
          <ResourceSecurityManagement />
        )}

        {active === 'resource-execution-audit' && (
          <ResourceExecutionAudit />
        )}

        {active === 'connector-framework' && (
          <ConnectorFrameworkAuth />
        )}
      </section>
    </div>
  )
}
