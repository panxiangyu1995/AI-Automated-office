import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { useUIStore } from '../../stores/uiStore'

interface LayoutSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LayoutSettingsDialog({ open, onOpenChange }: LayoutSettingsDialogProps) {
  const {
    sidebarCollapsed,
    chatPanelCollapsed,
    bottomPanelCollapsed,
    topBarVisible,
    toggleSidebar,
    toggleChatPanel,
    toggleBottomPanel,
    toggleTopBar,
    resetLayout,
  } = useUIStore()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>自定义布局</DialogTitle>
          <DialogDescription>
            控制界面各部分的显示与隐藏
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="top-bar" className="flex flex-col space-y-1">
              <span>顶部菜单栏</span>
              <span className="font-normal text-xs text-muted-foreground">显示应用菜单和工具栏</span>
            </Label>
            <Switch
              id="top-bar"
              checked={topBarVisible}
              onCheckedChange={toggleTopBar}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="sidebar" className="flex flex-col space-y-1">
              <span>侧边栏</span>
              <span className="font-normal text-xs text-muted-foreground">显示左侧功能导航</span>
            </Label>
            <Switch
              id="sidebar"
              checked={!sidebarCollapsed}
              onCheckedChange={toggleSidebar}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="bottom-panel" className="flex flex-col space-y-1">
              <span>底部面板</span>
              <span className="font-normal text-xs text-muted-foreground">显示终端和输出面板</span>
            </Label>
            <Switch
              id="bottom-panel"
              checked={!bottomPanelCollapsed}
              onCheckedChange={toggleBottomPanel}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="chat-panel" className="flex flex-col space-y-1">
              <span>AI 助手面板</span>
              <span className="font-normal text-xs text-muted-foreground">显示右侧 AI 对话窗口</span>
            </Label>
            <Switch
              id="chat-panel"
              checked={!chatPanelCollapsed}
              onCheckedChange={toggleChatPanel}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={resetLayout}>
            重置为默认布局
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
