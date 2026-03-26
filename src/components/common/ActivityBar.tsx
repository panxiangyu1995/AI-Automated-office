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
} from 'lucide-react'
import { useUIStore, type ActivityBarItem } from '../../stores/uiStore'

// 活动栏配置 - 对齐 pencil-new.pen 设计
const activityItems: { id: ActivityBarItem; icon: typeof LayoutGrid; label: string }[] = [
  { id: 'dashboard', icon: LayoutGrid, label: '仪表盘' },
  { id: 'hr', icon: Users, label: '人事部' },
  { id: 'finance', icon: FileText, label: '财务部' },
  { id: 'sales', icon: MessageSquare, label: '销售部' },
  { id: 'approval', icon: CheckSquare, label: '审批中心' },
  { id: 'service', icon: ShoppingBag, label: '售后服务' },
  { id: 'warehouse', icon: Package, label: '仓储部' },
  { id: 'knowledge', icon: BookOpen, label: '知识库' },
]

export function ActivityBar() {
  const activeActivityItem = useUIStore((state) => state.activeActivityItem)
  const setActiveActivityItem = useUIStore((state) => state.setActiveActivityItem)

  return (
    <aside
      className="flex flex-col items-center py-4 flex-shrink-0"
      style={{
        width: '48px',
        backgroundColor: '#1E293B',
        gap: '24px',
      }}
    >
      {/* 活动图标 */}
      {activityItems.map(({ id, icon: Icon, label }) => {
        const isActive = activeActivityItem === id
        return (
          <button
            key={id}
            onClick={() => setActiveActivityItem(id)}
            className="relative flex items-center justify-center w-6 h-6 transition-colors group"
            aria-label={label}
            title={label}
          >
            <Icon
              size={24}
              style={{
                color: isActive ? '#FFFFFF' : '#94A3B8',
              }}
            />
            {/* 激活指示条 */}
            {isActive && (
              <div
                className="absolute"
                style={{
                  width: '2px',
                  height: '24px',
                  backgroundColor: '#FFFFFF',
                  left: '-12px',
                }}
              />
            )}
          </button>
        )
      })}

      {/* 弹性空间 */}
      <div className="flex-1" />

      {/* 设置按钮 */}
      <button
        onClick={() => setActiveActivityItem('settings')}
        className="flex items-center justify-center w-6 h-6 transition-colors"
        aria-label="设置"
        title="设置"
      >
        <Settings
          size={24}
          style={{
            color: activeActivityItem === 'settings' ? '#FFFFFF' : '#94A3B8',
          }}
        />
      </button>
    </aside>
  )
}
