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

// 活动栏配置 - 对齐设置页设计风格
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
      className="flex flex-col items-center py-3 flex-shrink-0"
      style={{
        width: '48px',
        backgroundColor: '#1C2128',
        gap: '4px',
      }}
    >
      {/* 顶部活动图标区域 */}
      <div
        className="flex flex-col items-center"
        style={{ gap: '4px', width: '100%' }}
      >
        {activityItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeActivityItem === id
          return (
            <button
              key={id}
              onClick={() => setActiveActivityItem(id)}
              className="flex items-center justify-center w-10 h-10 rounded-md transition-colors cursor-pointer"
              style={{
                backgroundColor: isActive ? '#0F1419' : 'transparent',
              }}
              aria-label={label}
              title={label}
            >
              <Icon
                size={22}
                style={{
                  color: isActive ? '#FFFFFF' : '#C9D1D9',
                }}
              />
            </button>
          )
        })}
      </div>

      {/* 弹性空间 */}
      <div className="flex-1" />

      {/* 底部设置和账号按钮 */}
      <div
        className="flex flex-col items-center"
        style={{ gap: '4px', width: '100%' }}
      >
        {/* 分隔线 */}
        <div
          className="w-6 h-px mb-2"
          style={{ backgroundColor: '#30363D' }}
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
              color: '#C9D1D9',
            }}
          />
        </button>

        {/* 设置按钮 */}
        <button
          onClick={() => setActiveActivityItem('settings')}
          className="flex items-center justify-center w-10 h-10 rounded-md transition-colors cursor-pointer"
          style={{
            backgroundColor: activeActivityItem === 'settings' ? '#0F1419' : 'transparent',
          }}
          aria-label="设置"
          title="设置"
        >
          <Settings
            size={22}
            style={{
              color: activeActivityItem === 'settings' ? '#FFFFFF' : '#C9D1D9',
            }}
          />
        </button>
      </div>
    </aside>
  )
}
