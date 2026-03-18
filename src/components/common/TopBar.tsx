import { useState, useCallback } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-shell'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  CircleUserRound,
  Edit3,
  Eye,
  FileText,
  HardDrive,
  HelpCircle,
  LayoutTemplate,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Printer,
  Puzzle,
  RefreshCw,
  Scan,
  Settings,
  LogOut,
  Wrench,
} from 'lucide-react'
import { ScanDialog } from './ScanDialog'
import { PrintDialog } from './PrintDialog'
import { HardwareDialog } from './HardwareDialog'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '../ui/menubar'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'

interface TopBarProps {
  visible: boolean
  onToggle: () => void
  onOpenLayoutDialog?: () => void
}

export function TopBar({ visible, onToggle, onOpenLayoutDialog }: TopBarProps) {
  const navigate = useNavigate()
  const {
    sidebarCollapsed,
    chatPanelCollapsed,
    bottomPanelCollapsed,
    toggleSidebar,
    toggleChatPanel,
    toggleBottomPanel,
    setActiveActivityItem,
  } = useUIStore()
  const { user, isAuthenticated, clearAuthSession, switchAccount } = useAuthStore()

  // 硬件对话框状态
  const [scanDialogOpen, setScanDialogOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [hardwareDialogOpen, setHardwareDialogOpen] = useState(false)

  // 硬件对话框回调
  const handleOpenScanDialog = useCallback(() => {
    setScanDialogOpen(true)
  }, [])

  const handleOpenPrintDialog = useCallback(() => {
    setPrintDialogOpen(true)
  }, [])

  const handleOpenHardwareDialog = useCallback(() => {
    setHardwareDialogOpen(true)
  }, [])

  const handleMenuAction = (label: string, handler?: () => void | Promise<void>) => {
    return (event?: Event) => {
      event?.preventDefault()
      console.log(`[TopBar] ${label}`)
      if (handler) {
        Promise.resolve(handler()).catch((error) => {
          console.error(`[TopBar] ${label} failed:`, error)
        })
      }
    }
  }

  const handleExit = async () => {
    const window = getCurrentWindow()
    await window.close()
  }

  const handleOpenDocs = async () => {
    await open('https://docs.ai-automated-office.com')
  }

  const handleOpenLayoutDialog = () => {
    console.log('[TopBar] Layout dialog requested')
    onOpenLayoutDialog?.()
  }

  /**
   * 打开设置页面
   */
  const handleOpenSettings = () => {
    setActiveActivityItem('settings')
  }

  const navigateToLogin = useCallback(() => {
    navigate('/login', { replace: true })
  }, [navigate])

  const handleSwitchAccount = useCallback(() => {
    switchAccount()
    navigateToLogin()
  }, [switchAccount, navigateToLogin])

  const handleLogout = useCallback(() => {
    clearAuthSession()
    navigateToLogin()
  }, [clearAuthSession, navigateToLogin])

  if (!visible) return null

  return (
    <header className="h-8 bg-[#1E3A5F] border-b border-[#152A45] flex items-center justify-between px-2 select-none">
      <div className="flex items-center">
        <div className="flex items-center gap-2 mr-6">
          <span className="text-white font-bold text-sm">Realline</span>
        </div>
        <Menubar className="border-none bg-transparent">
          <MenubarMenu>
            <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
              文件
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={handleMenuAction('File: New')}>
                <FileText size={14} className="mr-2" />
                新建
                <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('File: Open')}>
                <FileText size={14} className="mr-2" />
                打开...
                <MenubarShortcut>⌘O</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('File: Save')}>
                <FileText size={14} className="mr-2" />
                保存
                <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('File: Save As')}>
                <FileText size={14} className="mr-2" />
                另存为...
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('File: Import')}>
                <FileText size={14} className="mr-2" />
                导入...
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('File: Export')}>
                <FileText size={14} className="mr-2" />
                导出...
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('File: Settings', handleOpenSettings)}>
                <Settings size={14} className="mr-2" />
                设置...
                <MenubarShortcut>⌘,</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('File: Print', handleOpenPrintDialog)}>
                <FileText size={14} className="mr-2" />
                打印...
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onSelect={handleMenuAction('File: Exit', handleExit)}
              >
                <FileText size={14} className="mr-2" />
                退出
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
              编辑
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={handleMenuAction('Edit: Undo')}>
                <Edit3 size={14} className="mr-2" />
                撤销
                <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Edit: Redo')}>
                <Edit3 size={14} className="mr-2" />
                重做
                <MenubarShortcut>⌘⇧Z</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('Edit: Cut')}>
                <Edit3 size={14} className="mr-2" />
                剪切
                <MenubarShortcut>⌘X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Edit: Copy')}>
                <Edit3 size={14} className="mr-2" />
                复制
                <MenubarShortcut>⌘C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Edit: Paste')}>
                <Edit3 size={14} className="mr-2" />
                粘贴
                <MenubarShortcut>⌘V</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('Edit: Find')}>
                <Edit3 size={14} className="mr-2" />
                查找...
                <MenubarShortcut>⌘F</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Edit: Replace')}>
                <Edit3 size={14} className="mr-2" />
                替换...
                <MenubarShortcut>⌘H</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('Edit: Select All')}>
                <Edit3 size={14} className="mr-2" />
                全选
                <MenubarShortcut>⌘A</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
              视图
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={handleMenuAction('View: Toggle Menu Bar', onToggle)}>
                <Eye size={14} className="mr-2" />
                切换菜单栏
                <MenubarShortcut>⌘⇧M</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('View: Activity Bar')}>
                <Eye size={14} className="mr-2" />
                活动栏
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('View: Sidebar')}>
                <Eye size={14} className="mr-2" />
                侧边栏
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('View: AI Chat Panel')}>
                <Eye size={14} className="mr-2" />
                AI 对话面板
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('View: Full Screen')}>
                <Eye size={14} className="mr-2" />
                全屏
                <MenubarShortcut>F11</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('View: Zoom In')}>
                <Eye size={14} className="mr-2" />
                放大
                <MenubarShortcut>⌘+</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('View: Zoom Out')}>
                <Eye size={14} className="mr-2" />
                缩小
                <MenubarShortcut>⌘-</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('View: Reset Zoom')}>
                <Eye size={14} className="mr-2" />
                重置缩放
                <MenubarShortcut>⌘0</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
              助手
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={handleMenuAction('Agent: New Chat')}>
                <Bot size={14} className="mr-2" />
                新对话
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Agent: Chat History')}>
                <Bot size={14} className="mr-2" />
                历史记录...
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('Agent: Model Settings')}>
                <Bot size={14} className="mr-2" />
                模型设置...
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Agent: API Key Management')}>
                <Bot size={14} className="mr-2" />
                API 密钥管理...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
              插件
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={handleMenuAction('Plugins: Plugin Market')}>
                <Puzzle size={14} className="mr-2" />
                插件市场...
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Plugins: Installed Plugins')}>
                <Puzzle size={14} className="mr-2" />
                已安装插件...
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Plugins: Plugin Settings')}>
                <Puzzle size={14} className="mr-2" />
                插件设置...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
              工具
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={handleMenuAction('Tools: Data Sync')}>
                <Wrench size={14} className="mr-2" />
                数据同步
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Tools: System Logs')}>
                <Wrench size={14} className="mr-2" />
                系统日志...
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Tools: Performance Monitor')}>
                <Wrench size={14} className="mr-2" />
                性能监控...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
              硬件
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={handleMenuAction('Hardware: Scan Document', handleOpenScanDialog)}>
                <Scan size={14} className="mr-2" />
                扫描文档...
                <MenubarShortcut>Ctrl+Shift+S</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Hardware: Print Document', handleOpenPrintDialog)}>
                <Printer size={14} className="mr-2" />
                打印文档...
                <MenubarShortcut>Ctrl+P</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('Hardware: Device Management', handleOpenHardwareDialog)}>
                <HardDrive size={14} className="mr-2" />
                设备管理...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
              帮助
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={handleMenuAction('Help: Settings', handleOpenSettings)}>
                <Settings size={14} className="mr-2" />
                设置...
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('Help: Documentation', handleOpenDocs)}>
                <HelpCircle size={14} className="mr-2" />
                文档
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Help: Keyboard Shortcuts')}>
                <HelpCircle size={14} className="mr-2" />
                快捷键列表...
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onSelect={handleMenuAction('Help: About')}>
                <HelpCircle size={14} className="mr-2" />
                关于...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      <div className="flex items-center gap-2">
        <AccountMenu
          isAuthenticated={isAuthenticated}
          user={user}
          onNavigateToLogin={navigateToLogin}
          onSwitchAccount={handleSwitchAccount}
          onLogout={handleLogout}
          handleMenuAction={handleMenuAction}
        />
        <LayoutControlButtons
          sidebarCollapsed={sidebarCollapsed}
          chatPanelCollapsed={chatPanelCollapsed}
          bottomPanelCollapsed={bottomPanelCollapsed}
          toggleSidebar={toggleSidebar}
          toggleChatPanel={toggleChatPanel}
          toggleBottomPanel={toggleBottomPanel}
          onOpenLayoutDialog={handleOpenLayoutDialog}
        />
      </div>

      {/* 硬件相关对话框 */}
      <ScanDialog open={scanDialogOpen} onOpenChange={setScanDialogOpen} />
      <PrintDialog open={printDialogOpen} onOpenChange={setPrintDialogOpen} />
      <HardwareDialog open={hardwareDialogOpen} onOpenChange={setHardwareDialogOpen} />
    </header>
  )
}

interface AccountMenuProps {
  isAuthenticated: boolean
  user: {
    username: string
    name: string
    department: string
    role: string
  } | null
  onNavigateToLogin: () => void
  onSwitchAccount: () => void
  onLogout: () => void
  handleMenuAction: (label: string, handler?: () => void | Promise<void>) => (event?: Event) => void
}

function AccountMenu({
  isAuthenticated,
  user,
  onNavigateToLogin,
  onSwitchAccount,
  onLogout,
  handleMenuAction,
}: AccountMenuProps) {
  const resolveField = (value: string | undefined, placeholder: string) => {
    if (!value || value.trim().length === 0) {
      return placeholder
    }
    return value
  }

  if (!isAuthenticated) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-white hover:bg-[#2A4A73]"
        aria-label="登录账号"
        onClick={onNavigateToLogin}
      >
        <CircleUserRound size={16} />
      </Button>
    )
  }

  return (
    <Menubar className="h-auto border-none bg-transparent p-0">
      <MenubarMenu>
        <MenubarTrigger
          aria-label="账号菜单"
          className="h-6 w-6 justify-center rounded-md p-0 text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]"
        >
          <CircleUserRound size={16} />
        </MenubarTrigger>
        <MenubarContent align="end" sideOffset={8} className="min-w-[240px]">
          <MenubarLabel className="text-xs text-muted-foreground">当前账号</MenubarLabel>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            <div>用户名：{resolveField(user?.username, '未设置用户名')}</div>
            <div>姓名：{resolveField(user?.name, '未设置姓名')}</div>
            <div>部门：{resolveField(user?.department, '未设置部门')}</div>
            <div>角色：{resolveField(user?.role, '未设置角色')}</div>
          </div>
          <MenubarSeparator />
          <MenubarItem onSelect={handleMenuAction('Account: Switch Account', onSwitchAccount)}>
            <RefreshCw size={14} className="mr-2" />
            切换账号
          </MenubarItem>
          <MenubarItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onSelect={handleMenuAction('Account: Logout', onLogout)}
          >
            <LogOut size={14} className="mr-2" />
            退出登录
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

interface LayoutControlButtonsProps {
  sidebarCollapsed: boolean
  chatPanelCollapsed: boolean
  bottomPanelCollapsed: boolean
  toggleSidebar: () => void
  toggleChatPanel: () => void
  toggleBottomPanel: () => void
  onOpenLayoutDialog?: () => void
}

function LayoutControlButtons({
  sidebarCollapsed,
  chatPanelCollapsed,
  bottomPanelCollapsed,
  toggleSidebar,
  toggleChatPanel,
  toggleBottomPanel,
  onOpenLayoutDialog,
}: LayoutControlButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-[#2A4A73]"
                onClick={onOpenLayoutDialog}
              >
                <LayoutTemplate size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>自定义布局</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 text-white hover:bg-[#2A4A73] ${
                  !sidebarCollapsed ? 'bg-[#3A5A83]' : ''
                }`}
                onClick={toggleSidebar}
              >
                <PanelLeft size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>切换左侧栏 (Ctrl+B)</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 text-white hover:bg-[#2A4A73] ${
                  !chatPanelCollapsed ? 'bg-[#3A5A83]' : ''
                }`}
                onClick={toggleChatPanel}
              >
                <PanelRight size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>切换辅助侧栏 (Ctrl+Shift+I)</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 text-white hover:bg-[#2A4A73] ${
                  !bottomPanelCollapsed ? 'bg-[#3A5A83]' : ''
                }`}
                onClick={toggleBottomPanel}
              >
                <PanelBottom size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>切换面板</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}
