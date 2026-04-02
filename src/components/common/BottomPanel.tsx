import { ResizablePanel } from './ResizablePanel'
import { useUIStore } from '../../stores/uiStore'

export function BottomPanel() {
  const bottomPanelHeight = useUIStore((state) => state.bottomPanelHeight)
  const bottomPanelCollapsed = useUIStore((state) => state.bottomPanelCollapsed)
  const setBottomPanelHeight = useUIStore((state) => state.setBottomPanelHeight)

  return (
    <ResizablePanel
      width={bottomPanelHeight}
      minWidth={100}
      maxWidth={600}
      onWidthChange={setBottomPanelHeight}
      direction="top"
      collapsed={bottomPanelCollapsed}
      className="border-t"
      style={{ borderColor: '#30363D' }}
    >
      <div 
        className="h-full flex flex-col"
        style={{ backgroundColor: '#161B22' }}
      >
        <div 
          className="flex items-center px-4" 
          style={{ height: '36px', borderBottom: '1px solid #21262D' }}
        >
          <span className="text-xs font-medium uppercase" style={{ color: '#8B949E' }}>面板</span>
        </div>
        <div 
          className="flex-1 p-4 overflow-auto"
          style={{ color: '#C9D1D9' }}
        >
          <p className="text-sm" style={{ color: '#8B949E' }}>底部面板内容区域 (终端/输出/调试控制台)</p>
        </div>
      </div>
    </ResizablePanel>
  )
}
