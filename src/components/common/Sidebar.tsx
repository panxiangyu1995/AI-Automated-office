import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../stores/uiStore'
import {
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  BarChart3,
  FolderOpen,
  Clock,
  ChevronLeft,
} from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'

interface SidebarSection {
  id: string
  title: string
  items: SidebarItem[]
}

interface SidebarItem {
  id: string
  label: string
  icon?: React.ReactNode
  path?: string
  badge?: number | string
  children?: SidebarItem[]
}

const defaultSections: SidebarSection[] = [
  {
    id: 'navigation',
    title: '资源',
    items: [
      { id: 'files', label: '文件管理', icon: <FileText size={16} />, path: '/files' },
      { id: 'dashboard', label: '数据看板', icon: <BarChart3 size={16} />, path: '/dashboard' },
      { id: 'documents', label: '文档库', icon: <FolderOpen size={16} />, path: '/documents' },
    ],
  },
  {
    id: 'recent',
    title: '最近',
    items: [
      { id: 'recent-1', label: '报价单-2024-001.pdf', icon: <Clock size={16} />, path: '/file/1' },
      { id: 'recent-2', label: 'Q1财务汇总.xlsx', icon: <Clock size={16} />, path: '/file/2' },
    ],
  },
]

/**
 * 侧边栏组件 - 对齐UX规范的VSCode风格设计
 * 功能：
 * - 56px Header区域（标题 + 搜索框）
 * - 分组导航和折叠
 * - 搜索过滤
 * - 激活指示条
 */
export function Sidebar() {
  const navigate = useNavigate()
  const setActiveModule = useUIStore((s) => s.setActiveModule)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    navigation: true,
    recent: true,
  })
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return defaultSections

    const query = searchQuery.toLowerCase()
    return defaultSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.children?.some((child) => child.label.toLowerCase().includes(query))
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [searchQuery])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const handleItemClick = (item: SidebarItem) => {
    setActiveItem(item.id)
    if (item.path) {
      navigate(item.path)
      setActiveModule(item.path.split('/')[1] || 'dashboard')
    }
  }

  if (sidebarCollapsed) {
    return (
      <aside
        className="flex h-full flex-col items-center py-2 border-r flex-shrink-0"
        style={{
          width: '48px',
          backgroundColor: 'var(--ao-sidebar-background)',
          borderColor: 'var(--ao-sidebar-border)',
        }}
      >
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-9 h-9 rounded-md transition-colors cursor-pointer hover:bg-[var(--ao-sidebar-activeBackground)]"
          title="展开侧边栏"
        >
          <ChevronRight size={18} style={{ color: 'var(--ao-sidebar-foreground)' }} />
        </button>
      </aside>
    )
  }

  return (
    <aside
      className="flex h-full flex-col border-r flex-shrink-0"
      style={{
        width: '240px',
        backgroundColor: 'var(--ao-sidebar-background)',
        borderColor: 'var(--ao-sidebar-border)',
      }}
    >
      {/* Header区域 */}
      <div
        className="flex items-center justify-between px-3 h-14 border-b flex-shrink-0"
        style={{ borderColor: 'var(--ao-sidebar-headerBorder)' }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--ao-sidebar-foreground)' }}
        >
          资源浏览器
        </span>
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-6 h-6 rounded transition-colors cursor-pointer hover:bg-[var(--ao-sidebar-activeBackground)]"
          title="收起侧边栏"
        >
          <ChevronLeft size={14} style={{ color: 'var(--ao-sidebar-secondaryForeground)' }} />
        </button>
      </div>

      {/* 搜索框 */}
      <div className="px-3 py-2 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-2.5 h-8 rounded-md"
          style={{
            backgroundColor: 'var(--ao-sidebar-searchBackground)',
            border: '1px solid var(--ao-sidebar-border)',
          }}
        >
          <Search size={14} style={{ color: 'var(--ao-sidebar-searchIcon)' }} />
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs"
            style={{
              color: 'var(--ao-sidebar-foreground)',
            }}
          />
        </div>
      </div>

      {/* 内容区域 */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredSections.length === 0 ? (
            <div
              className="px-3 py-4 text-center text-xs"
              style={{ color: 'var(--ao-sidebar-secondaryForeground)' }}
            >
              没有找到匹配的项
            </div>
          ) : (
            filteredSections.map((section) => (
              <div key={section.id} className="mb-1">
                {/* 分组标题 */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center gap-1 w-full px-2 py-1.5 text-left rounded transition-colors cursor-pointer hover:bg-[var(--ao-sidebar-activeBackground)]"
                >
                  {section.items.length > 0 &&
                    (expandedSections[section.id] ? (
                      <ChevronDown size={12} style={{ color: 'var(--ao-sidebar-secondaryForeground)' }} />
                    ) : (
                      <ChevronRight size={12} style={{ color: 'var(--ao-sidebar-secondaryForeground)' }} />
                    ))}
                  <span
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--ao-sidebar-sectionTitle)' }}
                  >
                    {section.title}
                  </span>
                </button>

                {/* 分组项 */}
                {expandedSections[section.id] && (
                  <div className="mt-0.5">
                    {section.items.map((item) => {
                      const isActive = activeItem === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className="group relative flex items-center gap-2 w-full px-2 py-1.5 text-left rounded-md transition-colors cursor-pointer"
                          style={{
                            backgroundColor: isActive
                              ? 'var(--ao-sidebar-activeBackground)'
                              : 'transparent',
                            marginLeft: '12px',
                          }}
                        >
                          {/* 激活指示条 */}
                          {isActive && (
                            <div
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
                              style={{ backgroundColor: 'var(--ao-sidebar-activeIndicator)' }}
                            />
                          )}

                          {/* 图标 */}
                          {item.icon && (
                            <span
                              className="flex-shrink-0"
                              style={{ color: isActive ? 'var(--ao-sidebar-activeForeground)' : 'var(--ao-sidebar-secondaryForeground)' }}
                            >
                              {item.icon}
                            </span>
                          )}

                          {/* 标签 */}
                          <span
                            className="flex-1 truncate text-xs"
                            style={{
                              color: isActive
                                ? 'var(--ao-sidebar-activeForeground)'
                                : 'var(--ao-sidebar-foreground)',
                            }}
                          >
                            {item.label}
                          </span>

                          {/* 徽章 */}
                          {item.badge !== undefined && (
                            <span
                              className="px-1.5 py-0.5 text-[10px] rounded"
                              style={{
                                backgroundColor: 'var(--ao-sidebar-badgeBorder)',
                                color: 'var(--ao-sidebar-badgeForeground)',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
