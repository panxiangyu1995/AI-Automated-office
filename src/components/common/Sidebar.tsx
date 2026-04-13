import { type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import {
  Bot,
  Brain,
  Building2,
  Database,
  FileText,
  FolderOpen,
  History,
  Package,
  PlugZap,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wrench,
  HeadphonesIcon,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { ResizablePanel } from './ResizablePanel'
import { useUIStore, type ActivityBarItem, type SidebarResourceEntry } from '../../stores/uiStore'
import {
  SETTINGS_CATEGORIES,
  getSettingsSections,
  type SettingsCategoryKey,
  type SettingsSectionKey,
} from '../../features/settings/settingsRegistry'

interface SidebarProps {
  children?: ReactNode
}

type FixedSidebarEntry = {
  id: string
  label: string
  icon: LucideIcon
  target: {
    path: string
    mode: 'static'
    activityItem?: ActivityBarItem
  }
}

const adminMenuItems: FixedSidebarEntry[] = [
  {
    id: 'service',
    label: '售后服务',
    icon: HeadphonesIcon,
    target: { path: '/service', mode: 'static' },
  },
  {
    id: 'knowledge',
    label: '知识库管理',
    icon: Database,
    target: { path: '/admin/knowledge', mode: 'static' },
  },
  {
    id: 'users',
    label: '用户管理',
    icon: Users,
    target: { path: '/admin/users', mode: 'static' },
  },
  {
    id: 'organization',
    label: '组织架构',
    icon: Building2,
    target: { path: '/admin/organization', mode: 'static' },
  },
]

const defaultMenuItems: FixedSidebarEntry[] = [
  {
    id: 'service',
    label: '售后服务',
    icon: HeadphonesIcon,
    target: { path: '/service', mode: 'static' },
  },
  {
    id: 'tender',
    label: '招投标',
    icon: FileText,
    target: { path: '/tender', mode: 'static' },
  },
]

export function Sidebar({ children }: SidebarProps) {
  const {
    sidebarWidth,
    sidebarCollapsed,
    setSidebarWidth,
    dynamicSidebarEntries,
    editorSidebarEntries,
    recentSidebarEntries,
    setActiveActivityItem,
    activeActivityItem,
    settingsActiveCategory,
    settingsActiveSection,
    setSettingsActiveCategory,
    setSettingsActiveSection,
  } = useUIStore(
    useShallow((state) => ({
      sidebarWidth: state.sidebarWidth,
      sidebarCollapsed: state.sidebarCollapsed,
      setSidebarWidth: state.setSidebarWidth,
      dynamicSidebarEntries: state.dynamicSidebarEntries,
      editorSidebarEntries: state.editorSidebarEntries,
      recentSidebarEntries: state.recentSidebarEntries,
      setActiveActivityItem: state.setActiveActivityItem,
      activeActivityItem: state.activeActivityItem,
      settingsActiveCategory: state.settingsActiveCategory,
      settingsActiveSection: state.settingsActiveSection,
      setSettingsActiveCategory: state.setSettingsActiveCategory,
      setSettingsActiveSection: state.setSettingsActiveSection,
    }))
  )
  const location = useLocation()
  const navigate = useNavigate()

  const isAdminRoute = location.pathname.startsWith('/admin')
  const isSettingsRoute = activeActivityItem === 'settings'
  const fixedEntries = isAdminRoute ? adminMenuItems : defaultMenuItems;

  const openEntry = (entry: { target: { path: string; activityItem?: ActivityBarItem } }) => {
    if (entry.target.activityItem) {
      setActiveActivityItem(entry.target.activityItem)
    }
    navigate(entry.target.path)
  }

  return (
    <ResizablePanel
      width={sidebarWidth}
      minWidth={220}
      maxWidth={320}
      onWidthChange={setSidebarWidth}
      direction="right"
      collapsed={sidebarCollapsed}
      className="h-full"
    >
      <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--ao-sidebar-background)' }}>
        {/* 侧边栏头部 */}
        <div
          className="flex items-center px-4"
          style={{ height: '56px', borderBottom: '1px solid var(--ao-sidebar-border)' }}
        >
          <span className="text-base font-semibold" style={{ color: 'var(--ao-sidebar-foreground)' }}>
            {isAdminRoute ? '系统管理' : isSettingsRoute ? '设置中心' : '资源浏览器'}
          </span>
        </div>

        {/* 搜索框 - 非设置页面显示 */}
        {!isSettingsRoute && (
          <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--ao-sidebar-border)' }}>
            <div
              className="flex items-center rounded-md px-3 py-2"
              style={{ backgroundColor: 'var(--ao-sidebar-searchBackground)', gap: '8px' }}
            >
              <Search size={14} style={{ color: 'var(--ao-sidebar-secondaryForeground)' }} />
              <input
                type="text"
                placeholder="搜索..."
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--ao-sidebar-foreground)' }}
              />
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* 设置页面专用侧边栏 */}
          {isSettingsRoute ? (
            <SettingsSidebarContent
              activeCategory={settingsActiveCategory}
              activeSection={settingsActiveSection}
              onSelectCategory={setSettingsActiveCategory}
              onSelectSection={setSettingsActiveSection}
            />
          ) : children || (
            <div className="space-y-4">
              <SidebarSection
                title={isAdminRoute ? '系统管理' : '固定导航'}
                entries={fixedEntries}
                activePath={location.pathname}
                onOpen={openEntry}
              />

              {dynamicSidebarEntries.length > 0 && (
                <SidebarResourceSection
                  title="动态资源"
                  entries={dynamicSidebarEntries}
                  activePath={location.pathname}
                  icon={FolderOpen}
                  onOpen={openEntry}
                />
              )}

              {editorSidebarEntries.length > 0 && (
                <SidebarResourceSection
                  title="编辑器"
                  entries={editorSidebarEntries}
                  activePath={location.pathname}
                  icon={FileText}
                  onOpen={openEntry}
                />
              )}

              {recentSidebarEntries.length > 0 && (
                <SidebarResourceSection
                  title="最近打开"
                  entries={recentSidebarEntries}
                  activePath={location.pathname}
                  icon={History}
                  onOpen={openEntry}
                />
              )}

              {!isAdminRoute && fixedEntries.length === 0 && dynamicSidebarEntries.length === 0 && editorSidebarEntries.length === 0 && (
                <div
                  className="rounded-lg p-3 text-xs leading-5"
                  style={{
                    backgroundColor: 'var(--ao-sidebar-border)',
                    color: 'var(--ao-sidebar-secondaryForeground)',
                    border: '1px solid var(--ao-sidebar-border)',
                  }}
                >
                  当前工作区尚未注册固定资源或编辑器入口。
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ResizablePanel>
  )
}

// 设置页面专用侧边栏内容
const CATEGORY_ICONS: Record<string, typeof SlidersHorizontal> = {
  workspace: SlidersHorizontal,
  ai: Brain,
  'sub-agents': Bot,
  knowledge: Database,
  integrations: PlugZap,
  plugins: Package,
  security: ShieldCheck,
  system: Wrench,
}

function SettingsSidebarContent({
  activeCategory,
  activeSection,
  onSelectCategory,
  onSelectSection,
}: {
  activeCategory: SettingsCategoryKey
  activeSection: SettingsSectionKey
  onSelectCategory: (category: Exclude<SettingsCategoryKey, 'home'>) => void
  onSelectSection: (section: SettingsSectionKey) => void
}) {
  const categories = SETTINGS_CATEGORIES.filter(
    (category): category is (typeof SETTINGS_CATEGORIES)[number] & {
      key: Exclude<SettingsCategoryKey, 'home'>
    } => category.key !== 'home'
  )

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const IconComponent = CATEGORY_ICONS[category.key] || SlidersHorizontal
        const sections = getSettingsSections(category.key)
        const isActive = activeCategory === category.key
        const hasActiveChild = sections.some((s) => s.key === activeSection)

        return (
          <div key={category.key}>
            {/* 分类按钮 */}
            <button
              type="button"
              onClick={() => onSelectCategory(category.key)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--ao-sidebar-border)' : 'transparent',
                color: hasActiveChild || isActive ? '#FFFFFF' : 'var(--ao-sidebar-foreground)',
              }}
            >
              <IconComponent size={16} style={{ color: hasActiveChild || isActive ? '#FFFFFF' : 'var(--ao-sidebar-secondaryForeground)' }} />
              <span className="flex-1 text-left truncate">{category.title}</span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0"
                style={{ borderColor: 'var(--ao-sidebar-border)', color: 'var(--ao-sidebar-secondaryForeground)' }}
              >
                {sections.length}
              </Badge>
            </button>

            {/* 子选项 */}
            {(isActive || hasActiveChild) && (
              <div className="ml-3 mt-1 space-y-0.5">
                {sections.slice(0, 6).map((section) => (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => onSelectSection(section.key)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors"
                    style={{
                      backgroundColor: activeSection === section.key ? 'var(--ao-sidebar-searchBackground)' : 'transparent',
                      color: activeSection === section.key ? '#FFFFFF' : 'var(--ao-sidebar-secondaryForeground)',
                    }}
                  >
                    <span
                      className="w-1 h-1 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: activeSection === section.key ? 'var(--ao-sidebar-activeIndicator)' : 'transparent',
                      }}
                    />
                    <span className="truncate">{section.title}</span>
                  </button>
                ))}
                {sections.length > 6 && (
                  <div className="px-3 py-1 text-xs" style={{ color: 'var(--ao-sidebar-secondaryForeground)' }}>
                    +{sections.length - 6} 更多
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SidebarSection({
  title,
  entries,
  activePath,
  onOpen,
}: {
  title: string
  entries: FixedSidebarEntry[]
  activePath: string
  onOpen: (entry: FixedSidebarEntry) => void
}) {
  if (entries.length === 0) {
    return null
  }

  return (
    <section>
      <p className="mb-2 px-3 text-xs font-semibold" style={{ color: 'var(--ao-sidebar-secondaryForeground)' }}>{title}</p>
      <nav className="space-y-1">
        {entries.map((entry) => {
          const Icon = entry.icon
          const isActive = activePath.startsWith(entry.target.path)

          return (
            <button
              key={entry.id}
              onClick={() => onOpen(entry)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--ao-sidebar-border)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--ao-sidebar-foreground)',
              }}
            >
              <Icon className="h-4 w-4" style={{ color: isActive ? '#FFFFFF' : 'var(--ao-sidebar-secondaryForeground)' }} />
              {entry.label}
            </button>
          )
        })}
      </nav>
    </section>
  )
}

function SidebarResourceSection({
  title,
  entries,
  activePath,
  icon: Icon,
  onOpen,
}: {
  title: string
  entries: SidebarResourceEntry[]
  activePath: string
  icon: LucideIcon
  onOpen: (entry: SidebarResourceEntry) => void
}) {
  return (
    <section>
      <p className="mb-2 px-3 text-xs font-semibold" style={{ color: 'var(--ao-sidebar-secondaryForeground)' }}>{title}</p>
      <nav className="space-y-1">
        {entries.map((entry) => {
          const isActive = activePath === entry.target.path

          return (
            <button
              key={entry.id}
              onClick={() => onOpen(entry)}
              className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--ao-sidebar-border)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--ao-sidebar-foreground)',
              }}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: isActive ? '#FFFFFF' : 'var(--ao-sidebar-secondaryForeground)' }} />
              <span className="min-w-0">
                <span className="block truncate">{entry.label}</span>
                {entry.description && (
                  <span className="block truncate text-xs" style={{ color: isActive ? 'var(--ao-sidebar-foreground)' : 'var(--ao-sidebar-secondaryForeground)' }}>
                    {entry.description}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </nav>
    </section>
  )
}
