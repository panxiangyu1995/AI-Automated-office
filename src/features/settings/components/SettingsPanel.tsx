import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { AlertTriangle, ArrowRight, Clock3, Info, Search, Star, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { Switch } from '../../../components/ui/switch'
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_STORAGE_KEY,
  formatShortcutLabel,
  parseShortcutConfig,
  type ShortcutConfig,
  type ShortcutKey,
} from '../../../lib/shortcutConfig'
import { cn } from '../../../lib/utils'
import { useUIStore } from '../../../stores/uiStore'
import {
  DEFAULT_SECTION_BY_CATEGORY,
  getSettingsCategory,
  getSettingsSection,
  getSettingsSectionGovernance,
  getSettingsSections,
  SETTINGS_CATEGORIES,
  SETTINGS_SECTIONS,
  type SettingsCategoryKey,
  type SettingsRiskLevel,
  type SettingsSaveMode,
  type SettingsSectionDescriptor,
  type SettingsSectionKey,
  type SettingsSectionKind,
} from '../settingsRegistry'
import { ClawHubMarketplace } from './ClawHubMarketplace'
import { ConnectorFrameworkAuth } from './ConnectorFrameworkAuth'
import { ConnectorHealthMonitor } from './ConnectorHealthMonitor'
import { KnowledgeBaseAccessControl } from './KnowledgeBaseAccessControl'
import { KnowledgeDocUpload } from './KnowledgeDocUpload'
import { KnowledgeEntryManagement } from './KnowledgeEntryManagement'
import { KnowledgeQARetrieval } from './KnowledgeQARetrieval'
import { KnowledgeQualityEvaluation } from './KnowledgeQualityEvaluation'
import { ModelProviderSettings } from './ModelProviderSettings'
import { PluginAdaptation } from './PluginAdaptation'
import { PrivateMarketConfig } from './PrivateMarketConfig'
import { PromptDebugMode } from './PromptDebugMode'
import { ResourceExecutionAudit } from './ResourceExecutionAudit'
import { ResourceSecurityManagement } from './ResourceSecurityManagement'
import { SkillMdParsing } from './SkillMdParsing'
import { SoulMdParsing } from './SoulMdParsing'
import { SubAgentExecutionMonitor } from './SubAgentExecutionMonitor'
import { SubAgentModelConfig } from './SubAgentModelConfig'
import { SubAgentPermissionConfig } from './SubAgentPermissionConfig'
import { SubAgentPersonaConfig } from './SubAgentPersonaConfig'
import { SubAgentRegistry } from './SubAgentRegistry'
import { SubAgentRouting } from './SubAgentRouting'
import { SubAgentToolBinding } from './SubAgentToolBinding'
import { TicketKnowledgeGeneration } from './TicketKnowledgeGeneration'

const SETTINGS_FAVORITES_STORAGE_KEY = 'settings-favorite-sections'
const SETTINGS_RECENTS_STORAGE_KEY = 'settings-recent-sections'
const MAX_RECENT_SECTIONS = 6
const MAX_FAVORITE_SECTIONS = 6

const SHORTCUT_FIELDS: Array<{
  key: ShortcutKey
  label: string
  description: string
  placeholder: string
}> = [
  {
    key: 'showApp',
    label: '显示/隐藏应用',
    description: '快速唤起桌面端主窗口。',
    placeholder: formatShortcutLabel(DEFAULT_SHORTCUTS.showApp),
  },
  {
    key: 'openAiChat',
    label: '打开 AI 对话',
    description: '直接进入右侧 AI 对话面板。',
    placeholder: formatShortcutLabel(DEFAULT_SHORTCUTS.openAiChat),
  },
  {
    key: 'quickSearch',
    label: '快速搜索',
    description: '打开工作台搜索能力。',
    placeholder: formatShortcutLabel(DEFAULT_SHORTCUTS.quickSearch),
  },
  {
    key: 'openSettings',
    label: '打开设置',
    description: '快速进入平台治理中心。',
    placeholder: formatShortcutLabel(DEFAULT_SHORTCUTS.openSettings),
  },
]

const KIND_LABELS: Record<SettingsSectionKind, string> = {
  config: '配置',
  monitor: '监控',
  audit: '审计',
}

const KIND_STYLES: Record<SettingsSectionKind, string> = {
  config: 'border-slate-200 bg-slate-100 text-slate-700',
  monitor: 'border-blue-200 bg-blue-50 text-blue-700',
  audit: 'border-amber-200 bg-amber-50 text-amber-700',
}

const RISK_LABELS: Record<SettingsRiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
}

const RISK_STYLES: Record<SettingsRiskLevel, string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  high: 'border-rose-200 bg-rose-50 text-rose-700',
}

const SAVE_MODE_LABELS: Record<SettingsSaveMode, string> = {
  instant: '即时生效',
  manual: '手动保存',
  managed: '页面内管理',
  readonly: '只读视图',
}

const SAVE_MODE_STYLES: Record<SettingsSaveMode, string> = {
  instant: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  manual: 'border-blue-200 bg-blue-50 text-blue-700',
  managed: 'border-slate-200 bg-slate-100 text-slate-700',
  readonly: 'border-slate-200 bg-slate-100 text-slate-700',
}

type SectionStatusTone = 'neutral' | 'success' | 'warning' | 'danger'

interface SectionStatusDescriptor {
  label: string
  description: string
  tone: SectionStatusTone
}

interface RecentSectionVisit {
  sectionKey: SettingsSectionKey
  category: Exclude<SettingsCategoryKey, 'home'>
  visitedAt: number
}

const STATUS_STYLES: Record<SectionStatusTone, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
}

function loadShortcutsFromStorage() {
  return parseShortcutConfig(localStorage.getItem(SHORTCUT_STORAGE_KEY))
}

function loadFavoriteSections() {
  const saved = localStorage.getItem(SETTINGS_FAVORITES_STORAGE_KEY)
  if (!saved) {
    return [] as SettingsSectionKey[]
  }

  try {
    const parsed = JSON.parse(saved) as SettingsSectionKey[]
    return parsed.filter((key) => Boolean(getSettingsSection(key))).slice(0, MAX_FAVORITE_SECTIONS)
  } catch {
    return [] as SettingsSectionKey[]
  }
}

function loadRecentSections() {
  const saved = localStorage.getItem(SETTINGS_RECENTS_STORAGE_KEY)
  if (!saved) {
    return [] as RecentSectionVisit[]
  }

  try {
    const parsed = JSON.parse(saved) as RecentSectionVisit[]
    return parsed
      .filter((item) => Boolean(getSettingsSection(item.sectionKey)))
      .slice(0, MAX_RECENT_SECTIONS)
  } catch {
    return [] as RecentSectionVisit[]
  }
}

function matchesQuery(section: SettingsSectionDescriptor, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  return [section.title, section.description, ...section.keywords].some((value) =>
    value.toLowerCase().includes(normalized)
  )
}

function formatVisitTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function WorkspacePreferencesSection(props: {
  topBarVisible: boolean
  sidebarCollapsed: boolean
  chatPanelCollapsed: boolean
  bottomPanelCollapsed: boolean
  onToggleTopBar: () => void
  onToggleSidebar: () => void
  onToggleChatPanel: () => void
  onToggleBottomPanel: () => void
  onResetLayout: () => void
}) {
  const items = [
    {
      id: 'top-bar',
      title: '显示顶部菜单栏',
      description: '保留 VSCode 式固定壳层中的顶部菜单区域。',
      checked: props.topBarVisible,
      onCheckedChange: props.onToggleTopBar,
    },
    {
      id: 'sidebar',
      title: '显示左侧栏',
      description: '控制 Sidebar 的展开状态，保持平台导航清晰。',
      checked: !props.sidebarCollapsed,
      onCheckedChange: props.onToggleSidebar,
    },
    {
      id: 'ai-panel',
      title: '显示 AI 面板',
      description: '固定右侧 AI 面板是系统一级入口，可按需收起。',
      checked: !props.chatPanelCollapsed,
      onCheckedChange: props.onToggleChatPanel,
    },
    {
      id: 'bottom-panel',
      title: '显示底部面板',
      description: '用于日志、诊断或输出等底部辅助视图。',
      checked: !props.bottomPanelCollapsed,
      onCheckedChange: props.onToggleBottomPanel,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className="border-slate-200 shadow-none">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-slate-900" htmlFor={item.id}>
                  {item.title}
                </Label>
                <p className="text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
              <Switch id={item.id} checked={item.checked} onCheckedChange={item.onCheckedChange} />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-dashed border-slate-300 bg-slate-50 shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-900">恢复默认布局</div>
            <p className="text-sm leading-6 text-slate-500">重置固定壳层结构，回到平台推荐布局。</p>
          </div>
          <Button variant="outline" onClick={props.onResetLayout}>
            恢复默认布局
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ShortcutSettingsSection(props: {
  draftShortcuts: ShortcutConfig
  shortcutErrors: Partial<Record<ShortcutKey, string>>
  hasShortcutChanges: boolean
  saving: boolean
  saveMessage: string | null
  onChange: (key: ShortcutKey, value: string) => void
  onSave: () => Promise<void>
  onReset: () => Promise<void>
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-2">
        {SHORTCUT_FIELDS.map((field) => (
          <Card key={field.key} className="border-slate-200 shadow-none">
            <CardHeader className="space-y-1 p-5">
              <CardTitle className="text-base font-semibold text-slate-900">{field.label}</CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-500">
                {field.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-5 pt-0">
              <Input
                value={props.draftShortcuts[field.key]}
                onChange={(event) => props.onChange(field.key, event.target.value)}
                placeholder={field.placeholder}
              />
              {props.shortcutErrors[field.key] && (
                <div className="text-xs text-red-500">{props.shortcutErrors[field.key]}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={props.onSave} disabled={props.saving || !props.hasShortcutChanges}>
          {props.saving ? '保存中...' : '保存并生效'}
        </Button>
        <Button variant="outline" onClick={props.onReset} disabled={props.saving}>
          恢复默认
        </Button>
        {props.saveMessage && <span className="text-sm text-slate-500">{props.saveMessage}</span>}
      </div>
    </div>
  )
}

function resolveSectionStatus(options: {
  sectionKey: SettingsSectionKey
  hasShortcutChanges: boolean
  saving: boolean
  saveMessage: string | null
  saveTone: 'idle' | 'success' | 'error'
  saveMode: SettingsSaveMode
  kind: SettingsSectionKind
}): SectionStatusDescriptor {
  if (options.sectionKey === 'shortcuts') {
    if (options.saving) {
      return {
        label: '保存中',
        description: '快捷键校验与写入正在进行，请稍候。',
        tone: 'neutral',
      }
    }

    if (options.saveTone === 'error') {
      return {
        label: '保存失败',
        description: options.saveMessage ?? '当前快捷键配置未能成功写入。',
        tone: 'danger',
      }
    }

    if (options.hasShortcutChanges) {
      return {
        label: '有未保存更改',
        description: '当前快捷键草稿尚未保存，请确认后手动提交。',
        tone: 'warning',
      }
    }

    if (options.saveTone === 'success') {
      return {
        label: '已保存',
        description: options.saveMessage ?? '快捷键配置已同步到本地并即时生效。',
        tone: 'success',
      }
    }

    return {
      label: '已同步',
      description: '当前快捷键配置与本地生效状态一致。',
      tone: 'success',
    }
  }

  if (options.saveMode === 'instant') {
    return {
      label: '即时生效',
      description: '修改后直接作用于当前工作台布局，无需额外保存动作。',
      tone: 'success',
    }
  }

  if (options.saveMode === 'readonly') {
    return {
      label: options.kind === 'audit' ? '审计视图' : '只读监控',
      description: options.kind === 'audit'
        ? '当前页面用于查看审计证据和执行记录，不承担正式配置修改。'
        : '当前页面用于监控运行状态和诊断信息，配置动作由页面内专用流程处理。',
      tone: 'neutral',
    }
  }

  return {
    label: '页面内管理',
    description: '具体保存、测试或发布动作在当前页面内部按能力域单独处理。',
    tone: 'neutral',
  }
}

function SettingsSectionShell(props: {
  section: SettingsSectionDescriptor
  isFavorite: boolean
  riskLevel: SettingsRiskLevel
  saveMode: SettingsSaveMode
  audience: string
  governanceNote: string
  changeImpact: string
  auditTrail: string
  status: SectionStatusDescriptor
  onOpenAudit: () => void
  onToggleFavorite: () => void
  children: ReactNode
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="border-slate-200 bg-white shadow-none">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn('border', KIND_STYLES[props.section.kind])}>
                  {KIND_LABELS[props.section.kind]}
                </Badge>
                <Badge variant="outline" className={cn('border', RISK_STYLES[props.riskLevel])}>
                  {RISK_LABELS[props.riskLevel]}
                </Badge>
                <Badge variant="outline" className={cn('border', SAVE_MODE_STYLES[props.saveMode])}>
                  {SAVE_MODE_LABELS[props.saveMode]}
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={props.isFavorite ? `取消收藏${props.section.title}` : `收藏${props.section.title}`}
                onClick={props.onToggleFavorite}
                className={cn(
                  'px-2 text-slate-500 hover:text-slate-900',
                  props.isFavorite && 'text-amber-500 hover:text-amber-600'
                )}
              >
                <Star className={cn(props.isFavorite && 'fill-current')} />
                {props.isFavorite ? '已收藏' : '收藏'}
              </Button>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl text-slate-900">{props.section.title}</CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-500">
                {props.section.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Card className="border-slate-200 bg-slate-50 shadow-none">
                <CardContent className="space-y-1 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">适用对象</div>
                  <div className="text-sm font-medium text-slate-900">{props.audience}</div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-slate-50 shadow-none">
                <CardContent className="space-y-1 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">风险级别</div>
                  <div className="text-sm font-medium text-slate-900">{RISK_LABELS[props.riskLevel]}</div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-slate-50 shadow-none">
                <CardContent className="space-y-1 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">保存方式</div>
                  <div className="text-sm font-medium text-slate-900">{SAVE_MODE_LABELS[props.saveMode]}</div>
                </CardContent>
              </Card>
            </div>

            <Alert className="border-slate-200 bg-slate-50 text-slate-700">
              <Info className="h-4 w-4" />
              <AlertTitle>治理说明</AlertTitle>
              <AlertDescription>{props.governanceNote}</AlertDescription>
            </Alert>

            <Alert className={cn('border', STATUS_STYLES[props.status.tone])}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>保存状态</AlertTitle>
              <AlertDescription>
                <div className="font-medium">{props.status.label}</div>
                <div className="mt-1">{props.status.description}</div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {props.children}
      </div>

      <div className="space-y-4">
        <Card className="border-slate-200 bg-white shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-slate-900">变更影响</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-500">{props.changeImpact}</CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-slate-900">审计与可追溯</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-slate-500">{props.auditTrail}</p>
            {props.section.key !== 'resource-execution-audit' && (
              <Button type="button" variant="outline" className="w-full justify-between" onClick={props.onOpenAudit}>
                打开统一审计入口
                <ArrowRight />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SettingsQuickAccessCard(props: {
  title: string
  emptyText: string
  items: Array<{
    key: SettingsSectionKey
    title: string
    subtitle: string
    meta?: string
    isFavorite?: boolean
  }>
  onOpenSection: (key: SettingsSectionKey) => void
  onToggleFavorite?: (key: SettingsSectionKey) => void
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base text-slate-900">{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.items.length === 0 ? (
          <div className="text-sm leading-6 text-slate-500">{props.emptyText}</div>
        ) : (
          props.items.map((item) => (
            <div key={item.key} className="flex items-start gap-2 rounded-lg border border-slate-200 p-3">
              <button
                type="button"
                className="min-w-0 flex-1 cursor-pointer text-left"
                aria-label={`打开${item.title}`}
                onClick={() => props.onOpenSection(item.key)}
              >
                <div className="text-sm font-medium text-slate-900">{item.title}</div>
                <div className="text-xs leading-5 text-slate-500">{item.subtitle}</div>
                {item.meta && <div className="pt-1 text-[11px] text-slate-400">{item.meta}</div>}
              </button>
              {props.onToggleFavorite && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={item.isFavorite ? `取消收藏${item.title}` : `收藏${item.title}`}
                  onClick={() => props.onToggleFavorite?.(item.key)}
                  className={cn(item.isFavorite && 'text-amber-500 hover:text-amber-600')}
                >
                  <Star className={cn(item.isFavorite && 'fill-current')} />
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function SettingsSearchResults(props: {
  query: string
  favoriteKeys: Set<SettingsSectionKey>
  recentLookup: Map<SettingsSectionKey, RecentSectionVisit>
  onOpenSection: (key: SettingsSectionKey) => void
  onToggleFavorite: (key: SettingsSectionKey) => void
}) {
  const normalized = props.query.trim().toLowerCase()
  const results = SETTINGS_SECTIONS.filter((section) => matchesQuery(section, normalized)).sort((left, right) => {
    const leftFavorite = props.favoriteKeys.has(left.key) ? 1 : 0
    const rightFavorite = props.favoriteKeys.has(right.key) ? 1 : 0

    if (leftFavorite !== rightFavorite) {
      return rightFavorite - leftFavorite
    }

    const leftRecent = props.recentLookup.get(left.key)?.visitedAt ?? 0
    const rightRecent = props.recentLookup.get(right.key)?.visitedAt ?? 0
    return rightRecent - leftRecent
  })

  if (results.length === 0) {
    return (
      <Card className="border-dashed border-slate-300 bg-white shadow-none">
        <CardContent className="space-y-2 p-8">
          <div className="text-base font-medium text-slate-900">没有找到匹配的设置项</div>
          <div className="text-sm leading-6 text-slate-500">
            试试搜索治理域、设置项名称、能力关键词，例如“审计”“模型”“连接器”。
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg text-slate-900">全局搜索结果</CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-500">
            共找到 {results.length} 个与 “{props.query}” 相关的治理项，可直接打开目标设置页。
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {results.map((section) => {
          const category = getSettingsCategory(section.category)
          const governance = getSettingsSectionGovernance(section.key)
          const recent = props.recentLookup.get(section.key)

          return (
            <Card key={section.key} className="border-slate-200 bg-white shadow-none">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-slate-200 text-slate-600">
                      {category?.title ?? '治理域'}
                    </Badge>
                    <Badge variant="outline" className={cn('border', KIND_STYLES[section.kind])}>
                      {KIND_LABELS[section.kind]}
                    </Badge>
                    <Badge variant="outline" className={cn('border', RISK_STYLES[governance.riskLevel])}>
                      {RISK_LABELS[governance.riskLevel]}
                    </Badge>
                  </div>
                  <div className="text-base font-semibold text-slate-900">{section.title}</div>
                  <div className="text-sm leading-6 text-slate-500">{section.description}</div>
                  {recent && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      最近访问于 {formatVisitTime(recent.visitedAt)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={props.favoriteKeys.has(section.key) ? `取消收藏${section.title}` : `收藏${section.title}`}
                    onClick={() => props.onToggleFavorite(section.key)}
                    className={cn(props.favoriteKeys.has(section.key) && 'text-amber-500 hover:text-amber-600')}
                  >
                    <Star className={cn(props.favoriteKeys.has(section.key) && 'fill-current')} />
                  </Button>
                  <Button type="button" variant="outline" onClick={() => props.onOpenSection(section.key)}>
                    打开设置
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function SettingsHome(props: {
  query: string
  onOpenCategory: (category: Exclude<SettingsCategoryKey, 'home'>) => void
  favoriteSections: SettingsSectionDescriptor[]
  recentSections: Array<RecentSectionVisit & { descriptor: SettingsSectionDescriptor }>
  onOpenSection: (key: SettingsSectionKey) => void
  onOpenAudit: () => void
  onToggleFavorite: (key: SettingsSectionKey) => void
}) {
  const normalized = props.query.trim().toLowerCase()
  const categories = SETTINGS_CATEGORIES.filter(
    (
      category
    ): category is (typeof SETTINGS_CATEGORIES)[number] & {
      key: Exclude<SettingsCategoryKey, 'home'>
    } => category.key !== 'home'
  ).filter((category) => {
    if (!normalized) {
      return true
    }

    return [category.title, category.description].some((value) => value.toLowerCase().includes(normalized)) ||
      getSettingsSections(category.key).some((section) => matchesQuery(section, normalized))
  })

  if (categories.length === 0) {
    return (
      <Card className="border-dashed border-slate-300 bg-white shadow-none">
        <CardContent className="p-8 text-sm text-slate-500">没有找到匹配的治理域，请尝试其他关键词。</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white shadow-none">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl text-slate-900">平台治理中心</CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-500">
            设置页已按固定治理域收敛。一级导航只保留稳定边界，具体配置项下沉到二级页面。
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <SettingsQuickAccessCard
          title="收藏项"
          emptyText="将高频治理页加入收藏后，可在这里快速打开。"
          items={props.favoriteSections.map((section) => ({
            key: section.key,
            title: section.title,
            subtitle: getSettingsCategory(section.category)?.title ?? '治理域',
            isFavorite: true,
          }))}
          onOpenSection={props.onOpenSection}
          onToggleFavorite={props.onToggleFavorite}
        />
        <SettingsQuickAccessCard
          title="最近访问"
          emptyText="最近访问的设置页会记录在这里，方便继续处理未完成的治理动作。"
          items={props.recentSections.map((item) => ({
            key: item.sectionKey,
            title: item.descriptor.title,
            subtitle: item.descriptor.description,
            meta: `访问时间 ${formatVisitTime(item.visitedAt)}`,
          }))}
          onOpenSection={props.onOpenSection}
        />
        <Card className="border-slate-200 bg-white shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base text-slate-900">统一审计入口</CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-500">
              所有高风险治理动作最终都应回到统一审计页查看证据、异常模式与导出记录。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="w-full justify-between" onClick={props.onOpenAudit}>
              打开执行审计
              <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {categories.map((category) => {
          const sections = getSettingsSections(category.key)
          const previewSections = normalized
            ? sections.filter((section) => matchesQuery(section, normalized))
            : sections

          return (
            <button
              key={category.key}
              type="button"
              aria-label={`打开${category.title}`}
              onClick={() => props.onOpenCategory(category.key)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(30, 58, 95, 0.08)', color: '#1E3A5F' }}
                >
                  <category.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="border-slate-200 text-slate-600">
                  {sections.length} 项
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                <div className="text-base font-semibold text-slate-900">{category.title}</div>
                <p className="text-sm leading-6 text-slate-500">{category.description}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {previewSections.slice(0, 4).map((section) => (
                    <Badge key={section.key} variant="outline" className="border-slate-200 text-slate-600">
                      {section.title}
                    </Badge>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SettingsPanel() {
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryKey>('home')
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('general')
  const [searchQuery, setSearchQuery] = useState('')
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(() => loadShortcutsFromStorage())
  const [draftShortcuts, setDraftShortcuts] = useState<ShortcutConfig>(() => loadShortcutsFromStorage())
  const [shortcutErrors, setShortcutErrors] = useState<Partial<Record<ShortcutKey, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveTone, setSaveTone] = useState<'idle' | 'success' | 'error'>('idle')
  const [favoriteSections, setFavoriteSections] = useState<SettingsSectionKey[]>(() => loadFavoriteSections())
  const [recentSections, setRecentSections] = useState<RecentSectionVisit[]>(() => loadRecentSections())
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

  const isSearchMode = searchQuery.trim().length > 0
  const favoriteSectionSet = useMemo(() => new Set(favoriteSections), [favoriteSections])
  const recentSectionLookup = useMemo(
    () => new Map(recentSections.map((item) => [item.sectionKey, item])),
    [recentSections]
  )
  const favoriteSectionDescriptors = useMemo(
    () =>
      favoriteSections
        .map((key) => getSettingsSection(key))
        .filter((section): section is SettingsSectionDescriptor => Boolean(section)),
    [favoriteSections]
  )
  const recentSectionDescriptors = useMemo(
    () =>
      recentSections
        .map((item) => {
          const descriptor = getSettingsSection(item.sectionKey)
          if (!descriptor) {
            return null
          }

          return {
            ...item,
            descriptor,
          }
        })
        .filter(
          (
            item
          ): item is RecentSectionVisit & {
            descriptor: SettingsSectionDescriptor
          } => Boolean(item)
        ),
    [recentSections]
  )

  useEffect(() => {
    localStorage.setItem(SETTINGS_FAVORITES_STORAGE_KEY, JSON.stringify(favoriteSections))
  }, [favoriteSections])

  useEffect(() => {
    localStorage.setItem(SETTINGS_RECENTS_STORAGE_KEY, JSON.stringify(recentSections))
  }, [recentSections])

  const activeCategoryDescriptor = useMemo(() => {
    return getSettingsCategory(activeCategory) ?? SETTINGS_CATEGORIES[0]
  }, [activeCategory])

  const searchResultsCount = useMemo(() => {
    if (!isSearchMode) {
      return 0
    }

    return SETTINGS_SECTIONS.filter((section) => matchesQuery(section, searchQuery)).length
  }, [isSearchMode, searchQuery])

  const categorySections = useMemo(() => {
    if (activeCategory === 'home') {
      return []
    }

    return getSettingsSections(activeCategory)
  }, [activeCategory])

  const visibleSections = useMemo(() => {
    if (activeCategory === 'home') {
      return []
    }

    return searchQuery.trim()
      ? categorySections.filter((section) => matchesQuery(section, searchQuery))
      : categorySections
  }, [activeCategory, categorySections, searchQuery])

  useEffect(() => {
    if (activeCategory === 'home' || isSearchMode || visibleSections.length === 0) {
      return
    }

    if (!visibleSections.some((section) => section.key === activeSection)) {
      setActiveSection(visibleSections[0].key)
    }
  }, [activeCategory, activeSection, isSearchMode, visibleSections])

  const currentSectionDescriptor = useMemo(() => {
    if (activeCategory === 'home') {
      return null
    }

    return categorySections.find((section) => section.key === activeSection) ?? categorySections[0] ?? null
  }, [activeCategory, activeSection, categorySections])

  const currentSectionGovernance = useMemo(() => {
    if (!currentSectionDescriptor) {
      return null
    }

    return getSettingsSectionGovernance(currentSectionDescriptor.key)
  }, [currentSectionDescriptor])

  const currentSectionStatus = useMemo(() => {
    if (!currentSectionDescriptor || !currentSectionGovernance) {
      return null
    }

    return resolveSectionStatus({
      sectionKey: currentSectionDescriptor.key,
      hasShortcutChanges,
      saving,
      saveMessage,
      saveTone,
      saveMode: currentSectionGovernance.saveMode,
      kind: currentSectionDescriptor.kind,
    })
  }, [
    currentSectionDescriptor,
    currentSectionGovernance,
    hasShortcutChanges,
    saveMessage,
    saveTone,
    saving,
  ])

  const headerTitle = isSearchMode ? '全局搜索结果' : activeCategoryDescriptor.title
  const headerDescription = isSearchMode
    ? `在平台治理中心中查找与“${searchQuery}”相关的设置项，并直接跳转到目标治理页。`
    : currentSectionDescriptor?.description ?? activeCategoryDescriptor.description

  const registerRecentSection = (section: SettingsSectionDescriptor) => {
    setRecentSections((prev) => {
      const nextEntry: RecentSectionVisit = {
        sectionKey: section.key,
        category: section.category,
        visitedAt: Date.now(),
      }

      return [nextEntry, ...prev.filter((item) => item.sectionKey !== section.key)].slice(0, MAX_RECENT_SECTIONS)
    })
  }

  const handleToggleFavorite = (sectionKey: SettingsSectionKey) => {
    setFavoriteSections((prev) => {
      if (prev.includes(sectionKey)) {
        return prev.filter((key) => key !== sectionKey)
      }

      return [sectionKey, ...prev].slice(0, MAX_FAVORITE_SECTIONS)
    })
  }

  const handleOpenSection = (sectionKey: SettingsSectionKey) => {
    const section = getSettingsSection(sectionKey)
    if (!section) {
      return
    }

    setActiveCategory(section.category)
    setActiveSection(section.key)
    setSearchQuery('')
    registerRecentSection(section)
  }

  const handleSelectCategory = (category: SettingsCategoryKey) => {
    setSearchQuery('')
    setActiveCategory(category)
    if (category !== 'home') {
      const defaultSectionKey = DEFAULT_SECTION_BY_CATEGORY[category]
      setActiveSection(defaultSectionKey)
      const defaultSection = getSettingsSection(defaultSectionKey)
      if (defaultSection) {
        registerRecentSection(defaultSection)
      }
    }
  }

  const handleOpenAuditEntry = () => {
    handleOpenSection('resource-execution-audit')
  }

  const handleSaveShortcuts = async () => {
    setSaving(true)
    setSaveMessage(null)
    setSaveTone('idle')
    setShortcutErrors({})
    const nextErrors: Partial<Record<ShortcutKey, string>> = {}

    for (const key of ['showApp', 'openAiChat', 'quickSearch', 'openSettings'] as ShortcutKey[]) {
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
      setSaveTone('success')
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '快捷键更新失败')
      setSaveTone('error')
    } finally {
      setSaving(false)
    }
  }

  const handleResetShortcuts = async () => {
    setSaving(true)
    setSaveMessage(null)
    setSaveTone('idle')
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
      setSaveTone('success')
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '恢复默认失败')
      setSaveTone('error')
    } finally {
      setSaving(false)
    }
  }

  const renderSectionContent = (sectionKey: SettingsSectionKey) => {
    switch (sectionKey) {
      case 'general':
        return (
          <WorkspacePreferencesSection
            topBarVisible={topBarVisible}
            sidebarCollapsed={sidebarCollapsed}
            chatPanelCollapsed={chatPanelCollapsed}
            bottomPanelCollapsed={bottomPanelCollapsed}
            onToggleTopBar={toggleTopBar}
            onToggleSidebar={toggleSidebar}
            onToggleChatPanel={toggleChatPanel}
            onToggleBottomPanel={toggleBottomPanel}
            onResetLayout={resetLayout}
          />
        )
      case 'shortcuts':
        return (
          <ShortcutSettingsSection
            draftShortcuts={draftShortcuts}
            shortcutErrors={shortcutErrors}
            hasShortcutChanges={hasShortcutChanges}
            saving={saving}
            saveMessage={saveMessage}
            onChange={(key, value) => {
              setDraftShortcuts((prev) => ({ ...prev, [key]: value }))
              setSaveMessage(null)
              setSaveTone('idle')
            }}
            onSave={handleSaveShortcuts}
            onReset={handleResetShortcuts}
          />
        )
      case 'agent':
        return <ModelProviderSettings />
      case 'updates':
        return (
          <Card className="border-dashed border-slate-300 bg-white shadow-none">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">更新策略</CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-500">
                当前已为系统更新预留固定治理入口，后续将在此补齐版本策略、灰度更新与发布日志能力。
              </CardDescription>
            </CardHeader>
          </Card>
        )
      case 'prompt-debug':
        return <PromptDebugMode />
      case 'sub-agent':
        return <SubAgentRegistry />
      case 'sub-agent-persona':
        return <SubAgentPersonaConfig />
      case 'sub-agent-tool':
        return <SubAgentToolBinding />
      case 'sub-agent-permission':
        return <SubAgentPermissionConfig />
      case 'sub-agent-model':
        return <SubAgentModelConfig />
      case 'sub-agent-routing':
        return <SubAgentRouting />
      case 'sub-agent-execution':
        return <SubAgentExecutionMonitor />
      case 'knowledge':
        return <KnowledgeDocUpload />
      case 'knowledge-qa':
        return <KnowledgeQARetrieval />
      case 'knowledge-generation':
        return <TicketKnowledgeGeneration />
      case 'knowledge-entry':
        return <KnowledgeEntryManagement />
      case 'knowledge-access':
        return <KnowledgeBaseAccessControl />
      case 'knowledge-quality':
        return <KnowledgeQualityEvaluation />
      case 'skill-parsing':
        return <SkillMdParsing />
      case 'soul-parsing':
        return <SoulMdParsing />
      case 'plugin-adaptation':
        return <PluginAdaptation />
      case 'clawhub-market':
        return <ClawHubMarketplace />
      case 'private-market':
        return <PrivateMarketConfig />
      case 'resource-security':
        return <ResourceSecurityManagement />
      case 'resource-execution-audit':
        return <ResourceExecutionAudit />
      case 'connector-framework':
        return <ConnectorFrameworkAuth />
      case 'connector-health':
        return <ConnectorHealthMonitor />
      default:
        return null
    }
  }

  return (
    <div className="flex h-full w-full bg-slate-50 text-slate-900">
      <aside className="flex w-[280px] flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Workbench</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">设置中心</div>
          <p className="mt-1 text-sm leading-6 text-slate-500">固定治理 UI，集中承载平台级配置、监控与审计能力。</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-3">
            {SETTINGS_CATEGORIES.map((category, index) => {
              const isActive = category.key === activeCategory
              const sections = category.key === 'home' ? [] : getSettingsSections(category.key)

              return (
                <div key={category.key}>
                  {index === 1 && (
                    <div className="px-3 pb-2 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      治理域
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={`切换到${category.title}`}
                    onClick={() => handleSelectCategory(category.key)}
                    className={cn(
                      'flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200',
                      isActive ? 'border border-transparent' : 'border border-transparent hover:bg-slate-50'
                    )}
                    style={isActive ? { backgroundColor: 'rgba(30, 58, 95, 0.08)', color: '#1E3A5F' } : undefined}
                  >
                    <div
                      className={cn('mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg', isActive ? '' : 'bg-slate-100 text-slate-600')}
                      style={isActive ? { backgroundColor: '#1E3A5F', color: '#FFFFFF' } : undefined}
                    >
                      <category.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className={cn('text-sm font-medium', isActive ? 'text-current' : 'text-slate-900')}>
                        {category.title}
                      </div>
                      <p className={cn('text-xs leading-5', isActive ? 'text-current/80' : 'text-slate-500')}>
                        {category.description}
                      </p>
                      {category.key !== 'home' && (
                        <div className="pt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                          {sections.length} 项治理能力
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              )
            })}

            {(favoriteSectionDescriptors.length > 0 || recentSectionDescriptors.length > 0) && (
              <div className="space-y-3 px-3 pb-4 pt-5">
                {favoriteSectionDescriptors.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">收藏项</div>
                    {favoriteSectionDescriptors.slice(0, 3).map((section) => (
                      <button
                        key={section.key}
                        type="button"
                        aria-label={`打开${section.title}`}
                        onClick={() => handleOpenSection(section.key)}
                        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-white"
                      >
                        <span className="truncate">{section.title}</span>
                        <Star className="fill-current text-amber-500" />
                      </button>
                    ))}
                  </div>
                )}
                {recentSectionDescriptors.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">最近访问</div>
                    {recentSectionDescriptors.slice(0, 3).map((item) => (
                      <button
                        key={item.sectionKey}
                        type="button"
                        aria-label={`打开${item.descriptor.title}`}
                        onClick={() => handleOpenSection(item.sectionKey)}
                        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-white"
                      >
                        <span className="truncate">{item.descriptor.title}</span>
                        <Clock3 className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-slate-200 text-slate-600">
                  固定治理 UI
                </Badge>
                {!isSearchMode && currentSectionDescriptor && (
                  <Badge className={cn('border', KIND_STYLES[currentSectionDescriptor.kind])}>
                    {KIND_LABELS[currentSectionDescriptor.kind]}
                  </Badge>
                )}
                {!isSearchMode && currentSectionGovernance && (
                  <>
                    <Badge className={cn('border', RISK_STYLES[currentSectionGovernance.riskLevel])}>
                      {RISK_LABELS[currentSectionGovernance.riskLevel]}
                    </Badge>
                    <Badge className={cn('border', SAVE_MODE_STYLES[currentSectionGovernance.saveMode])}>
                      {SAVE_MODE_LABELS[currentSectionGovernance.saveMode]}
                    </Badge>
                  </>
                )}
                {isSearchMode && (
                  <Badge variant="outline" className="border-slate-200 text-slate-600">
                    {searchResultsCount} 个结果
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-slate-900">{headerTitle}</h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-500">{headerDescription}</p>
              </div>
              {!isSearchMode && currentSectionDescriptor && (
                <div className="text-sm font-medium text-slate-600">{currentSectionDescriptor.title}</div>
              )}
            </div>

            <div className="w-full max-w-md">
              <div className="relative flex items-center gap-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索设置项、能力或治理域"
                  className="pl-9"
                />
                {isSearchMode && (
                  <Button type="button" variant="ghost" size="icon" aria-label="清除搜索" onClick={() => setSearchQuery('')}>
                    <X />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {activeCategory !== 'home' && !isSearchMode && (
          <div className="border-b border-slate-200 bg-white px-6 py-3">
            <div className="flex flex-wrap gap-2">
              {visibleSections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  aria-label={`打开${section.title}`}
                  onClick={() => handleOpenSection(section.key)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors duration-200',
                    activeSection === section.key
                      ? 'border-transparent text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  )}
                  style={activeSection === section.key ? { backgroundColor: '#1E3A5F' } : undefined}
                >
                  <span>{section.title}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'border-current/20 bg-transparent',
                      activeSection === section.key ? 'text-white' : KIND_STYLES[section.kind]
                    )}
                  >
                    {KIND_LABELS[section.kind]}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-6">
            {isSearchMode ? (
              <SettingsSearchResults
                query={searchQuery}
                favoriteKeys={favoriteSectionSet}
                recentLookup={recentSectionLookup}
                onOpenSection={handleOpenSection}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : activeCategory === 'home' ? (
              <SettingsHome
                query={searchQuery}
                onOpenCategory={(category) => handleSelectCategory(category)}
                favoriteSections={favoriteSectionDescriptors}
                recentSections={recentSectionDescriptors}
                onOpenSection={handleOpenSection}
                onOpenAudit={handleOpenAuditEntry}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : visibleSections.length === 0 ? (
              <Card className="border-dashed border-slate-300 bg-white shadow-none">
                <CardContent className="p-8 text-sm text-slate-500">当前治理域下没有找到匹配的设置项。</CardContent>
              </Card>
            ) : currentSectionDescriptor && currentSectionGovernance && currentSectionStatus ? (
              <SettingsSectionShell
                section={currentSectionDescriptor}
                isFavorite={favoriteSectionSet.has(currentSectionDescriptor.key)}
                audience={currentSectionGovernance.audience}
                riskLevel={currentSectionGovernance.riskLevel}
                saveMode={currentSectionGovernance.saveMode}
                governanceNote={currentSectionGovernance.governanceNote}
                changeImpact={currentSectionGovernance.changeImpact}
                auditTrail={currentSectionGovernance.auditTrail}
                status={currentSectionStatus}
                onOpenAudit={handleOpenAuditEntry}
                onToggleFavorite={() => handleToggleFavorite(currentSectionDescriptor.key)}
              >
                {renderSectionContent(activeSection)}
              </SettingsSectionShell>
            ) : (
              renderSectionContent(activeSection)
            )}
          </div>
        </ScrollArea>
      </section>
    </div>
  )
}
