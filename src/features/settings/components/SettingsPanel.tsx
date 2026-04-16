import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Star,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
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
import { DepartmentPanel } from '../../department'

const SETTINGS_FAVORITES_STORAGE_KEY = 'settings-favorite-sections'
const SETTINGS_RECENTS_STORAGE_KEY = 'settings-recent-sections'
const MAX_RECENT_SECTIONS = 6
const MAX_FAVORITE_SECTIONS = 6

// CATEGORY_ICONS is now defined in Sidebar.tsx

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
  config: 'border-[var(--ao-border)] bg-[var(--ao-bottomPanel.activeBackground)] text-[var(--ao-foreground)]',
  monitor: 'border-[var(--ao-button.linkForeground)]/30 bg-[var(--ao-button.linkForeground)]/10 text-[var(--ao-button.linkForeground)]',
  audit: 'border-[var(--ao-warningForeground)]/30 bg-[var(--ao-warningForeground)]/10 text-[var(--ao-warningForeground)]',
}

const RISK_LABELS: Record<SettingsRiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
}

const RISK_STYLES: Record<SettingsRiskLevel, string> = {
  low: 'border-[var(--ao-successForeground)]/30 bg-[var(--ao-successForeground)]/10 text-[var(--ao-successForeground)]',
  medium: 'border-[var(--ao-warningForeground)]/30 bg-[var(--ao-warningForeground)]/10 text-[var(--ao-warningForeground)]',
  high: 'border-[var(--ao-errorForeground)]/30 bg-[var(--ao-errorForeground)]/10 text-[var(--ao-errorForeground)]',
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
  neutral: 'border-[var(--ao-border)] bg-[var(--ao-bottomPanel.background)] text-[var(--ao-foreground)]',
  success: 'border-[var(--ao-successForeground)]/30 bg-[var(--ao-successForeground)]/10 text-[var(--ao-successForeground)]',
  warning: 'border-[var(--ao-warningForeground)]/30 bg-[var(--ao-warningForeground)]/10 text-[var(--ao-warningForeground)]',
  danger: 'border-[var(--ao-errorForeground)]/30 bg-[var(--ao-errorForeground)]/10 text-[var(--ao-errorForeground)]',
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

function matchesCategoryQuery(category: (typeof SETTINGS_CATEGORIES)[number], query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  return [category.title, category.description].some((value) => value.toLowerCase().includes(normalized))
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
          <Card key={item.id}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1">
                <Label htmlFor={item.id} className="text-sm font-medium">
                  {item.title}
                </Label>
                <p className="text-sm leading-6">{item.description}</p>
              </div>
              <Switch id={item.id} checked={item.checked} onCheckedChange={item.onCheckedChange} />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">恢复默认布局</div>
            <p className="text-sm leading-6">重置固定壳层结构，回到平台推荐布局。</p>
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
      <div className="space-y-3">
        {SHORTCUT_FIELDS.map((field) => (
          <Card key={field.key}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">{field.label}</div>
                <div className="text-xs">{field.description}</div>
              </div>
              <div 
                className="flex items-center gap-1 rounded px-3 py-2 font-mono text-sm"
                style={{ backgroundColor: 'var(--ao-commandPalette.footerBackground)', color: 'var(--ao-foreground)' }}
              >
                {props.draftShortcuts[field.key]}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={props.onReset} disabled={props.saving}>
          恢复默认
        </Button>
        {props.saveMessage && <span className="text-sm">{props.saveMessage}</span>}
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
    <div className="space-y-6">
      {/* 状态信息 */}
      <Alert className={cn('border', STATUS_STYLES[props.status.tone])}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>保存状态</AlertTitle>
        <AlertDescription>
          <div className="font-medium">{props.status.label}</div>
          <div className="mt-1">{props.status.description}</div>
        </AlertDescription>
      </Alert>

      {props.children}
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
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.items.length === 0 ? (
          <div className="text-sm leading-6">{props.emptyText}</div>
        ) : (
          props.items.map((item) => (
            <div 
              key={item.key} 
              className="flex items-start gap-2 rounded-lg p-3"
              style={{ border: '1px solid var(--ao-border)', backgroundColor: 'var(--ao-commandPalette.footerBackground)' }}
            >
              <button
                type="button"
                className="min-w-0 flex-1 cursor-pointer text-left"
                aria-label={`打开${item.title}`}
                onClick={() => props.onOpenSection(item.key)}
              >
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs leading-5">{item.subtitle}</div>
                {item.meta && <div className="pt-1 text-[11px]">{item.meta}</div>}
              </button>
              {props.onToggleFavorite && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={item.isFavorite ? `取消收藏${item.title}` : `收藏${item.title}`}
                  onClick={() => props.onToggleFavorite?.(item.key)}
                  className={cn(item.isFavorite && 'text-[var(--ao-warningForeground)] hover:text-[var(--ao-warningForeground)]')}
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
      <Card>
        <CardContent className="space-y-2 p-8">
          <div className="text-base font-medium">没有找到匹配的设置项</div>
          <div className="text-sm leading-6">
            试试搜索治理域、设置项名称、能力关键词，例如"审计""模型""连接器"。
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">全局搜索结果</CardTitle>
          <CardDescription className="text-sm leading-6">
            共找到 {results.length} 个与 "{props.query}" 相关的治理项，可直接打开目标设置页。
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {results.map((section) => {
          const category = getSettingsCategory(section.category)
          const governance = getSettingsSectionGovernance(section.key)
          const recent = props.recentLookup.get(section.key)

          return (
            <Card key={section.key}>
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-[var(--ao-border)]">
                      {category?.title ?? '治理域'}
                    </Badge>
                    <Badge variant="outline" className={cn('border', KIND_STYLES[section.kind])}>
                      {KIND_LABELS[section.kind]}
                    </Badge>
                    <Badge variant="outline" className={cn('border', RISK_STYLES[governance.riskLevel])}>
                      {RISK_LABELS[governance.riskLevel]}
                    </Badge>
                  </div>
                  <div className="text-base font-semibold">{section.title}</div>
                  <div className="text-sm leading-6">{section.description}</div>
                  {recent && (
                    <div className="flex items-center gap-2 text-xs">
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
                    className={cn(props.favoriteKeys.has(section.key) && 'text-[var(--ao-warningForeground)] hover:text-[var(--ao-warningForeground)]')}
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

    return matchesCategoryQuery(category, normalized)
  })

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-sm">没有找到匹配的治理域，请尝试其他关键词。</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">平台治理中心</CardTitle>
          <CardDescription className="text-sm leading-6">
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
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">统一审计入口</CardTitle>
            <CardDescription className="text-sm leading-6">
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
              onClick={() => props.onOpenSection(sections[0]?.key ?? category.key)}
              className="cursor-pointer rounded-xl p-5 text-left transition-all duration-200 hover:shadow-lg"
              style={{ 
                border: '1px solid var(--ao-border)', 
                backgroundColor: 'var(--ao-bottomPanel.background)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(35, 134, 54, 0.15)', color: 'var(--ao-successForeground)' }}
                >
                  <category.icon className="h-5 w-5" />
                </div>
                <Badge 
                  variant="outline" 
                  className="border-[var(--ao-border)]"
                  style={{ color: 'var(--ao-workbench.secondaryForeground)', backgroundColor: 'var(--ao-bottomPanel.activeBackground)' }}
                >
                  {sections.length} 项
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                <div className="text-base font-semibold" style={{ color: 'var(--ao-foreground)' }}>{category.title}</div>
                <p className="text-sm leading-6" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>{category.description}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {previewSections.slice(0, 4).map((section) => (
                    <Badge 
                      key={section.key} 
                      variant="outline" 
                      className="border-[var(--ao-border)]"
                      style={{ color: 'var(--ao-foreground)', backgroundColor: 'transparent' }}
                    >
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

// No inline SettingsSidebar - use global Sidebar component

export function SettingsPanel() {
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
    settingsActiveCategory,
    settingsActiveSection,
    setSettingsActiveCategory,
    setSettingsActiveSection,
  } = useUIStore()

  // Local state for settings
  const [searchQuery, setSearchQuery] = useState('')
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(() => loadShortcutsFromStorage())
  const [draftShortcuts, setDraftShortcuts] = useState<ShortcutConfig>(() => loadShortcutsFromStorage())
  const [shortcutErrors, setShortcutErrors] = useState<Partial<Record<ShortcutKey, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveTone, setSaveTone] = useState<'idle' | 'success' | 'error'>('idle')
  const [favoriteSections, setFavoriteSections] = useState<SettingsSectionKey[]>(() => loadFavoriteSections())
  const [recentSections, setRecentSections] = useState<RecentSectionVisit[]>(() => loadRecentSections())

  // Use global state for navigation
  const activeCategory = settingsActiveCategory
  const activeSection = settingsActiveSection

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
      setSettingsActiveSection(visibleSections[0].key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const headerTitle = isSearchMode ? '全局搜索结果' : currentSectionDescriptor?.title ?? activeCategoryDescriptor.title
  const headerDescription = isSearchMode
    ? `在平台治理中心中查找与"${searchQuery}"相关的设置项，并直接跳转到目标治理页。`
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

    setSettingsActiveCategory(section.category)
    setSettingsActiveSection(section.key)
    setSearchQuery('')
    registerRecentSection(section)
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">更新策略</CardTitle>
              <CardDescription className="text-sm leading-6">
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
      case 'department-list':
        return <DepartmentPanel />
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
    <section 
      className="flex min-w-0 flex-1 flex-col h-full"
      style={{ backgroundColor: 'var(--ao-workbench.background)' }}
    >
      {/* Header */}
      <header 
        className="px-6 py-5"
        style={{ borderBottom: '1px solid var(--ao-bottomPanel.activeBackground)', backgroundColor: 'var(--ao-workbench.background)' }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            {/* 面包屑导航 */}
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>设置</span>
              <span style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>/</span>
              <span className="font-medium" style={{ color: 'var(--ao-foreground)' }}>{activeCategoryDescriptor.title}</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--ao-foreground)' }}>{headerTitle}</h1>
              <p className="max-w-3xl text-sm leading-6" style={{ color: 'var(--ao-workbench.secondaryForeground)' }}>{headerDescription}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
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
                favoriteSections={favoriteSectionDescriptors}
                recentSections={recentSectionDescriptors}
                onOpenSection={handleOpenSection}
                onOpenAudit={handleOpenAuditEntry}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : visibleSections.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-sm">当前治理域下没有找到匹配的设置项。</CardContent>
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
  )
}
