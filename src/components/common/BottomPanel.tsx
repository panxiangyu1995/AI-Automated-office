import { ResizablePanel } from './ResizablePanel'
import { useUIStore } from '../../stores/uiStore'

export function BottomPanel() {
  const bottomPanelHeight = useUIStore((state) => state.bottomPanelHeight)
  const bottomPanelCollapsed = useUIStore((state) => state.bottomPanelCollapsed)
  const setBottomPanelHeight = useUIStore((state) => state.setBottomPanelHeight)

  return (
    <ResizablePanel
      width={bottomPanelHeight} // ResizablePanel 暂时使用 width 属性来表示尺寸，这里实际是高度
      minWidth={100}
      maxWidth={600}
      onWidthChange={setBottomPanelHeight}
      direction="top" // 向上调整大小
      collapsed={bottomPanelCollapsed}
      className="border-t border-slate-200"
    >
      <div 
        className="h-full flex flex-col bg-white"
      >
        <div className="flex items-center px-4 h-9 border-b border-slate-200 bg-slate-50">
          <span className="text-xs font-medium text-slate-600 uppercase">面板</span>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          <p className="text-sm text-slate-500">底部面板内容区域 (终端/输出/调试控制台)</p>
        </div>
      </div>
    </ResizablePanel>
  )
}
