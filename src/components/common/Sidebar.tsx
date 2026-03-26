import { type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import {
  Building2,
  FileText,
  FolderOpen,
  History,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { ResizablePanel } from './ResizablePanel'
import { useUIStore, type ActivityBarItem, type SidebarResourceEntry } from '../../stores/uiStore'

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

export function Sidebar({ children }: SidebarProps) {
  const {
    sidebarWidth,
    sidebarCollapsed,
    setSidebarWidth,
    dynamicSidebarEntries,
    editorSidebarEntries,
    recentSidebarEntries,
    setActiveActivityItem,
  } = useUIStore(
    useShallow((state) => ({
      sidebarWidth: state.sidebarWidth,
      sidebarCollapsed: state.sidebarCollapsed,
      setSidebarWidth: state.setSidebarWidth,
      dynamicSidebarEntries: state.dynamicSidebarEntries,
      editorSidebarEntries: state.editorSidebarEntries,
      recentSidebarEntries: state.recentSidebarEntries,
      setActiveActivityItem: state.setActiveActivityItem,
    }))
  )
  const location = useLocation()
  const navigate = useNavigate()

  const isAdminRoute = location.pathname.startsWith('/admin')
  const fixedEntries = isAdminRoute ? adminMenuItems : []

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
      <div className="flex h-full flex-col" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex-1 overflow-y-auto p-4">
          {children || (
            <div className="space-y-6">
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
                <div className="rounded-lg border border-slate-700/80 bg-slate-800/60 p-3 text-xs leading-5 text-slate-400">
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
      <p className="mb-2 text-xs font-bold text-slate-400">{title}</p>
      <nav className="space-y-1">
        {entries.map((entry) => {
          const Icon = entry.icon
          const isActive = activePath.startsWith(entry.target.path)

          return (
            <button
              key={entry.id}
              onClick={() => onOpen(entry)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
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
      <p className="mb-2 text-xs font-bold text-slate-400">{title}</p>
      <nav className="space-y-1">
        {entries.map((entry) => {
          const isActive = activePath === entry.target.path

          return (
            <button
              key={entry.id}
              onClick={() => onOpen(entry)}
              className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0">
                <span className="block truncate">{entry.label}</span>
                {entry.description && (
                  <span className={`block truncate text-xs ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
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
