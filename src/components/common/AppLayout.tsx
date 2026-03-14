import { useUIStore } from '../../stores/uiStore'
import { TopBar } from './TopBar'
import { ActivityBar } from './ActivityBar'
import { Sidebar } from './Sidebar'
import { Workbench } from './Workbench'
import { AiChatPanel } from './AiChatPanel'
import { StatusBar } from './StatusBar'

// 部门名称映射
const departmentNames: Record<string, string> = {
  dashboard: '首页',
  hr: '人事部',
  finance: '财务部',
  sales: '销售部',
  approval: '审批中心',
  service: '售后服务',
  warehouse: '仓储部',
  knowledge: '知识库',
  settings: '系统设置',
}

export function AppLayout() {
  const { activeActivityItem, sidebarCollapsed } = useUIStore()
  const departmentName = departmentNames[activeActivityItem] || '首页'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 顶部工具栏 - 必须 */}
      <TopBar department={departmentName} />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 活动栏 */}
        <ActivityBar />

        {/* 侧边栏 */}
        {!sidebarCollapsed && <Sidebar />}

        {/* 工作区 */}
        <Workbench />

        {/* AI 对话面板 */}
        <AiChatPanel />
      </div>

      {/* 状态栏 */}
      <StatusBar />
    </div>
  )
}
