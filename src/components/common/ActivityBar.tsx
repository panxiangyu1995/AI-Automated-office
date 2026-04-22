import {
  LayoutGrid,
  Users,
  FileText,
  MessageSquare,
  CheckSquare,
  ShoppingBag,
  Package,
  BookOpen,
  Settings,
  User,
} from 'lucide-react'
import { useUIStore, type ActivityBarItem } from '../../stores/uiStore'

interface ActivityItem {
  id: ActivityBarItem
  icon: typeof LayoutGrid
  label: string
  badge?: number | string
}

const activityItems: ActivityItem[] = [
  { id: 'dashboard', icon: LayoutGrid, label: '仪表盘' },
  { id: 'hr', icon: Users, label: '人事部' },
  { id: 'finance', icon: FileText, label: '财务部' },
  { id: 'sales', icon: MessageSquare, label: '销售部' },
  { id: 'approval', icon: CheckSquare, label: '审批中心', badge: 3 },
  { id: 'service', icon: ShoppingBag, label: '售后服务' },
  { id: 'warehouse', icon: Package, label: '仓储部' },
  { id: 'knowledge', icon: BookOpen, label: '知识库' },
]

/**
 * 活动栏组件 - 对齐UX规范设计
 * 功能：
 * - 一级导航（切换活动域）
 * - 激活状态高亮
 * - 徽章显示
 * - 设置和账号入口
 */
export function ActivityBar() {
  const activeActivityItem = useUIStore((state) => state.activeActivityItem)
  const setActiveActivityItem = useUIStore((state) => state.setActiveActivityItem)
  const activityBarBadges = useUIStore((state) => state.activityBarBadges)

  return (
    <aside
      className="flex flex-col items-center py-2 flex-shrink-0"
      style={{
        width: '48px',
        backgroundColor: 'var(--ao-activityBar-background)',
        gap: '2px',
      }}
    >
      {/* 顶部活动图标区域 */}
      <div
        className="flex flex-col items-center"
        style={{ gap: '2px', width: '100%' }}
      >
        {activityItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeActivityItem === id
          const badge = activityBarBadges[id]?.count || activityItems.find(i => i.id === id)?.badge
          const badgeColor = activityBarBadges[id]?.color

          return (
            <div key={id} className="relative">
              <button
                onClick={() => setActiveActivityItem(id)}
                className="flex items-center justify-center w-10 h-10 rounded-md transition-colors cursor-pointer"
                style={{
                  backgroundColor: isActive
                    ? 'var(--ao-activityBar-activeBackground)'
                    : 'transparent',
                }}
                aria-label={label}
                title={label}
              >
                <Icon
                  size={22}
                  style={{
                    color: isActive
                      ? 'var(--ao-activityBar-activeForeground)'
                      : 'var(--ao-activityBar-foreground)',
                  }}
                />
              </button>

              {/* 徽章 */}
              {badge !== undefined && badge !== 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[9px] font-medium rounded-full"
                  style={{
                    backgroundColor: badgeColor || 'var(--ao-errorForeground, #F85149)',
                    color: '#FFFFFF',
                    fontSize: '9px',
                    minWidth: '14px',
                    height: '14px',
                    padding: '0 3px',
                  }}
                >
                  {typeof badge === 'number' && badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* 弹性空间 */}
      <div className="flex-1" />

      {/* 底部设置和账号按钮 */}
      <div
        className="flex flex-col items-center"
        style={{ gap: '2px', width: '100%' }}
      >
        {/* 分隔线 */}
        <div
          className="w-6 h-px mb-1"
          style={{ backgroundColor: 'var(--ao-activityBar-border)' }}
        />

        {/* 账号按钮 */}
        <button
          onClick={() => setActiveActivityItem('settings')}
          className="flex items-center justify-center w-10 h-10 rounded-md transition-colors cursor-pointer"
          style={{
            backgroundColor: 'transparent',
          }}
          aria-label="账号"
          title="账号"
        >
          <User
            size={22}
            style={{
              color: 'var(--ao-activityBar-foreground)',
            }}
          />
        </button>

        {/* 设置按钮 */}
        <button
          onClick={() => setActiveActivityItem('settings')}
          className="flex items-center justify-center w-10 h-10 rounded-md transition-colors cursor-pointer"
          style={{
            backgroundColor:
              activeActivityItem === 'settings'
                ? 'var(--ao-activityBar-activeBackground)'
                : 'transparent',
          }}
          aria-label="设置"
          title="设置"
        >
          <Settings
            size={22}
            style={{
              color:
                activeActivityItem === 'settings'
                  ? 'var(--ao-activityBar-activeForeground)'
                  : 'var(--ao-activityBar-foreground)',
            }}
          />
        </button>
      </div>
    </aside>
  )
}
