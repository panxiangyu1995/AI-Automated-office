import { useState, useCallback } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-shell'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import {
  Bot,
  CircleUserRound,
  Edit3,
  Eye,
  FileText,
  HardDrive,
  HelpCircle,
  Info,
  Keyboard,
  LayoutTemplate,
  Maximize2,
  Package,
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Database,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { ScanDialog } from './ScanDialog'
import { PrintDialog } from './PrintDialog'
import { HardwareDialog } from './HardwareDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
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
import { useChatStore } from '../../features/agent'
import { DEFAULT_SHORTCUTS, formatShortcutLabel } from '../../lib/shortcutConfig'

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
    openChatPanel,
    toggleSidebar,
    toggleChatPanel,
    openAgentSecondarySurface,
    closeAgentSecondarySurface,
    toggleBottomPanel,
    setActiveActivityItem,
    toggleActivityBar,
    activityBarVisible,
    zoomLevel,
    setZoomLevel,
    resetZoom,
  } = useUIStore(
    useShallow((state) => ({
      sidebarCollapsed: state.sidebarCollapsed,
      chatPanelCollapsed: state.chatPanelCollapsed,
      bottomPanelCollapsed: state.bottomPanelCollapsed,
      openChatPanel: state.openChatPanel,
      toggleSidebar: state.toggleSidebar,
      toggleChatPanel: state.toggleChatPanel,
      openAgentSecondarySurface: state.openAgentSecondarySurface,
      closeAgentSecondarySurface: state.closeAgentSecondarySurface,
      toggleBottomPanel: state.toggleBottomPanel,
      setActiveActivityItem: state.setActiveActivityItem,
      toggleActivityBar: state.toggleActivityBar,
      activityBarVisible: state.activityBarVisible,
      zoomLevel: state.zoomLevel,
      setZoomLevel: state.setZoomLevel,
      resetZoom: state.resetZoom,
    }))
  )
  const createSession = useChatStore((state) => state.createSession)
  const { user, isAuthenticated, clearAuthSession, switchAccount } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      clearAuthSession: state.clearAuthSession,
      switchAccount: state.switchAccount,
    }))
  )

  // 硬件对话框状态
  const [scanDialogOpen, setScanDialogOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [hardwareDialogOpen, setHardwareDialogOpen] = useState(false)
  // 辅助对话框状态
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false)
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)

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
    onOpenLayoutDialog?.()
  }

  const aiPanelShortcutLabel = formatShortcutLabel(DEFAULT_SHORTCUTS.openAiChat)

  /**
   * 打开设置页面
   */
  const handleOpenSettings = () => {
    setActiveActivityItem('settings')
  }

  const handleNewChat = useCallback(() => {
    openChatPanel()
    closeAgentSecondarySurface()
    createSession()
  }, [closeAgentSecondarySurface, createSession, openChatPanel])

  // 视图菜单处理
  const handleToggleActivityBar = useCallback(() => {
    toggleActivityBar()
  }, [toggleActivityBar])

  const handleToggleFullscreen = useCallback(async () => {
    const win = getCurrentWindow()
    const isFullscreen = await win.isFullscreen()
    await win.setFullscreen(!isFullscreen)
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoomLevel(zoomLevel + 10)
  }, [zoomLevel, setZoomLevel])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(zoomLevel - 10)
  }, [zoomLevel, setZoomLevel])

  const handleResetZoom = useCallback(() => {
    resetZoom()
  }, [resetZoom])

  // 助手菜单处理
  const handleOpenAgentSettings = useCallback(() => {
    setActiveActivityItem('settings')
  }, [setActiveActivityItem])

  const handleOpenApiKeyManagement = useCallback(() => {
    setActiveActivityItem('settings')
  }, [setActiveActivityItem])

  // 插件菜单处理
  const handleOpenPluginMarket = useCallback(() => {
    setActiveActivityItem('settings')
  }, [setActiveActivityItem])

  // 工具菜单处理
  const handleOpenDataSync = useCallback(() => {
    setSyncDialogOpen(true)
  }, [])

  const handleOpenSystemLogs = useCallback(() => {
    setLogsDialogOpen(true)
  }, [])

  // 帮助菜单处理
  const handleOpenShortcuts = useCallback(() => {
    setShortcutsDialogOpen(true)
  }, [])

  const handleOpenAbout = useCallback(() => {
    setAboutDialogOpen(true)
  }, [])

  const handleOpenChatHistory = useCallback(() => {
    openChatPanel()
    openAgentSecondarySurface('history')
  }, [openAgentSecondarySurface, openChatPanel])

  const navigateToLogin = useCallback(() => {
    navigate('/login', { replace: true })
  }, [navigate])

  const handleSwitchAccount = useCallback(async () => {
    await switchAccount()
    navigateToLogin()
  }, [switchAccount, navigateToLogin])

  const handleLogout = useCallback(async () => {
    await clearAuthSession()
    navigateToLogin()
  }, [clearAuthSession, navigateToLogin])

  if (!visible) return null

  return (
    <header 
      className="h-10 flex items-center justify-between px-4 select-none"
      style={{ backgroundColor: 'var(--ao-topbar-background)' }}
    >
      {/* 左侧菜单 */}
      <div className="flex items-center gap-3">
        {/* 品牌标识 */}
        <div className="flex items-center gap-2 select-none mr-1">
          <div
            className="flex items-center justify-center w-6 h-6 rounded"
            style={{ backgroundColor: 'var(--ao-primary, #1E3A5F)' }}
          >
            <Sparkles size={14} className="text-white" />
          </div>
          <span
            className="font-semibold text-sm tracking-tight"
            style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
          >
            AI-Office
          </span>
        </div>

        {/* 分隔线 */}
        <div
          className="h-5 w-px"
          style={{ backgroundColor: 'var(--ao-topbar-border)' }}
        />
        
        <Menubar className="border-none bg-transparent h-auto p-0">
          <MenubarMenu>
            <MenubarTrigger
              className="text-xs px-2.5 py-1.5 rounded transition-colors hover:bg-[var(--ao-topbar-menuItemHoverBackground)] data-[state=open]:bg-[var(--ao-topbar-menuItemActiveBackground)]"
              style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
            >
              文件
            </MenubarTrigger>
            <MenubarContent style={{ backgroundColor: 'var(--ao-topbar-menuBackground)', borderColor: 'var(--ao-topbar-menuBorder)' }}>
              <MenubarItem onSelect={handleMenuAction('File: New')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <FileText size={14} className="mr-2" />
                新建
                <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('File: Open')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <FileText size={14} className="mr-2" />
                打开...
                <MenubarShortcut>⌘O</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('File: Save')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <FileText size={14} className="mr-2" />
                保存
                <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('File: Save As')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <FileText size={14} className="mr-2" />
                另存为...
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('File: Import')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <FileText size={14} className="mr-2" />
                导入...
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('File: Export')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <FileText size={14} className="mr-2" />
                导出...
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('File: Settings', handleOpenSettings)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Settings size={14} className="mr-2" />
                设置...
                <MenubarShortcut>⌘,</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('File: Print', handleOpenPrintDialog)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <FileText size={14} className="mr-2" />
                打印...
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem 
                className="text-red-400"
                onSelect={handleMenuAction('File: Exit', handleExit)} 
                style={{ color: 'var(--ao-topbar-dangerForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}
              >
                <FileText size={14} className="mr-2" />
                退出
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger
              className="text-xs px-2.5 py-1.5 rounded transition-colors hover:bg-[var(--ao-topbar-menuItemHoverBackground)] data-[state=open]:bg-[var(--ao-topbar-menuItemActiveBackground)]"
              style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
            >
              编辑
            </MenubarTrigger>
            <MenubarContent style={{ backgroundColor: 'var(--ao-topbar-menuBackground)', borderColor: 'var(--ao-topbar-menuBorder)' }}>
              <MenubarItem onSelect={handleMenuAction('Edit: Undo')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Edit3 size={14} className="mr-2" />
                撤销
                <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Edit: Redo')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Edit3 size={14} className="mr-2" />
                重做
                <MenubarShortcut>⌘⇧Z</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('Edit: Cut')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Edit3 size={14} className="mr-2" />
                剪切
                <MenubarShortcut>⌘X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Edit: Copy')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Edit3 size={14} className="mr-2" />
                复制
                <MenubarShortcut>⌘C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Edit: Paste')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Edit3 size={14} className="mr-2" />
                粘贴
                <MenubarShortcut>⌘V</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('Edit: Find')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Edit3 size={14} className="mr-2" />
                查找...
                <MenubarShortcut>⌘F</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Edit: Replace')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Edit3 size={14} className="mr-2" />
                替换...
                <MenubarShortcut>⌘H</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('Edit: Select All')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Edit3 size={14} className="mr-2" />
                全选
                <MenubarShortcut>⌘A</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger
              className="text-xs px-2.5 py-1.5 rounded transition-colors hover:bg-[var(--ao-topbar-menuItemHoverBackground)] data-[state=open]:bg-[var(--ao-topbar-menuItemActiveBackground)]"
              style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
            >
              视图
            </MenubarTrigger>
            <MenubarContent style={{ backgroundColor: 'var(--ao-topbar-menuBackground)', borderColor: 'var(--ao-topbar-menuBorder)' }}>
              <MenubarItem onSelect={handleMenuAction('View: Toggle Menu Bar', onToggle)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Eye size={14} className="mr-2" />
                切换菜单栏
                <MenubarShortcut>⌘⇧M</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('View: Activity Bar', handleToggleActivityBar)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Eye size={14} className="mr-2" />
                活动栏
                <MenubarShortcut>{activityBarVisible ? '✓' : ''}</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('View: Sidebar', toggleSidebar)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Eye size={14} className="mr-2" />
                侧边栏
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('View: AI Chat Panel', toggleChatPanel)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Eye size={14} className="mr-2" />
                AI 对话面板
                <MenubarShortcut>{aiPanelShortcutLabel}</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('View: Full Screen', handleToggleFullscreen)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Maximize2 size={14} className="mr-2" />
                全屏
                <MenubarShortcut>F11</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('View: Zoom In', handleZoomIn)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <ZoomIn size={14} className="mr-2" />
                放大
                <MenubarShortcut>Ctrl+=</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('View: Zoom Out', handleZoomOut)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <ZoomOut size={14} className="mr-2" />
                缩小
                <MenubarShortcut>Ctrl+-</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('View: Reset Zoom', handleResetZoom)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <RotateCcw size={14} className="mr-2" />
                重置缩放
                <MenubarShortcut>Ctrl+0</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger
              className="text-xs px-2.5 py-1.5 rounded transition-colors hover:bg-[var(--ao-topbar-menuItemHoverBackground)] data-[state=open]:bg-[var(--ao-topbar-menuItemActiveBackground)]"
              style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
            >
              助手
            </MenubarTrigger>
            <MenubarContent style={{ backgroundColor: 'var(--ao-topbar-menuBackground)', borderColor: 'var(--ao-topbar-menuBorder)' }}>
              <MenubarItem onSelect={handleMenuAction('Agent: New Chat', handleNewChat)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Bot size={14} className="mr-2" />
                新对话
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Agent: Chat History', handleOpenChatHistory)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Bot size={14} className="mr-2" />
                历史记录...
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('Agent: Model Settings', handleOpenAgentSettings)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Bot size={14} className="mr-2" />
                模型设置...
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Agent: API Key Management', handleOpenApiKeyManagement)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Bot size={14} className="mr-2" />
                API 密钥管理...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger
              className="text-xs px-2.5 py-1.5 rounded transition-colors hover:bg-[var(--ao-topbar-menuItemHoverBackground)] data-[state=open]:bg-[var(--ao-topbar-menuItemActiveBackground)]"
              style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
            >
              插件
            </MenubarTrigger>
            <MenubarContent style={{ backgroundColor: 'var(--ao-topbar-menuBackground)', borderColor: 'var(--ao-topbar-menuBorder)' }}>
              <MenubarItem onSelect={handleMenuAction('Plugins: Plugin Market', handleOpenPluginMarket)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Package size={14} className="mr-2" />
                插件市场...
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Plugins: Installed Plugins', handleOpenPluginMarket)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Puzzle size={14} className="mr-2" />
                已安装插件...
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Plugins: Plugin Settings', handleOpenPluginMarket)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Settings size={14} className="mr-2" />
                插件设置...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger
              className="text-xs px-2.5 py-1.5 rounded transition-colors hover:bg-[var(--ao-topbar-menuItemHoverBackground)] data-[state=open]:bg-[var(--ao-topbar-menuItemActiveBackground)]"
              style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
            >
              工具
            </MenubarTrigger>
            <MenubarContent style={{ backgroundColor: 'var(--ao-topbar-menuBackground)', borderColor: 'var(--ao-topbar-menuBorder)' }}>
              <MenubarItem onSelect={handleMenuAction('Tools: Data Sync', handleOpenDataSync)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Database size={14} className="mr-2" />
                数据同步
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Tools: System Logs', handleOpenSystemLogs)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <BookOpen size={14} className="mr-2" />
                系统日志...
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Tools: Performance Monitor')} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Wrench size={14} className="mr-2" />
                性能监控...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger
              className="text-xs px-2.5 py-1.5 rounded transition-colors hover:bg-[var(--ao-topbar-menuItemHoverBackground)] data-[state=open]:bg-[var(--ao-topbar-menuItemActiveBackground)]"
              style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
            >
              硬件
            </MenubarTrigger>
            <MenubarContent style={{ backgroundColor: 'var(--ao-topbar-menuBackground)', borderColor: 'var(--ao-topbar-menuBorder)' }}>
              <MenubarItem onSelect={handleMenuAction('Hardware: Scan Document', handleOpenScanDialog)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Scan size={14} className="mr-2" />
                扫描文档...
                <MenubarShortcut>Ctrl+Shift+S</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Hardware: Print Document', handleOpenPrintDialog)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Printer size={14} className="mr-2" />
                打印文档...
                <MenubarShortcut>Ctrl+P</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('Hardware: Device Management', handleOpenHardwareDialog)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <HardDrive size={14} className="mr-2" />
                设备管理...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger
              className="text-xs px-2.5 py-1.5 rounded transition-colors hover:bg-[var(--ao-topbar-menuItemHoverBackground)] data-[state=open]:bg-[var(--ao-topbar-menuItemActiveBackground)]"
              style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
            >
              帮助
            </MenubarTrigger>
            <MenubarContent style={{ backgroundColor: 'var(--ao-topbar-menuBackground)', borderColor: 'var(--ao-topbar-menuBorder)' }}>
              <MenubarItem onSelect={handleMenuAction('Help: Settings', handleOpenSettings)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Settings size={14} className="mr-2" />
                设置...
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('Help: Documentation', handleOpenDocs)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <HelpCircle size={14} className="mr-2" />
                文档
              </MenubarItem>
              <MenubarItem onSelect={handleMenuAction('Help: Keyboard Shortcuts', handleOpenShortcuts)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Keyboard size={14} className="mr-2" />
                快捷键列表...
              </MenubarItem>
              <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
              <MenubarItem onSelect={handleMenuAction('Help: About', handleOpenAbout)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
                <Info size={14} className="mr-2" />
                关于...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      {/* 右侧控制按钮 */}
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
          aiPanelShortcutLabel={aiPanelShortcutLabel}
          onOpenLayoutDialog={handleOpenLayoutDialog}
        />
      </div>

      {/* 硬件相关对话框 */}
      <ScanDialog open={scanDialogOpen} onOpenChange={setScanDialogOpen} />
      <PrintDialog open={printDialogOpen} onOpenChange={setPrintDialogOpen} />
      <HardwareDialog open={hardwareDialogOpen} onOpenChange={setHardwareDialogOpen} />

      {/* 快捷键列表对话框 */}
      <Dialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>快捷键列表</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between"><span>显示应用</span><kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+Shift+A</kbd></div>
              <div className="flex justify-between"><span>打开 AI 对话</span><kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+Shift+I</kbd></div>
              <div className="flex justify-between"><span>快速搜索</span><kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+Shift+F</kbd></div>
              <div className="flex justify-between"><span>快速提问</span><kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+L</kbd></div>
              <div className="flex justify-between"><span>打开设置</span><kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+,</kbd></div>
              <div className="flex justify-between"><span>切换菜单栏</span><kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+Shift+M</kbd></div>
              <div className="flex justify-between"><span>切换侧边栏</span><kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+B</kbd></div>
              <div className="flex justify-between"><span>全屏</span><kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">F11</kbd></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 关于对话框 */}
      <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>AI-Automated-office</DialogTitle>
            <DialogDescription>版本 1.0.0</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>AI 赋能的 ERP 系统，采用部门化架构设计。</p>
            <p>核心能力：每个部门专属 AI 助手、跨部门数据联动、统一数据中台。</p>
            <p className="text-xs pt-2">Built with Tauri + React + TypeScript</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setAboutDialogOpen(false)}>关闭</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 数据同步对话框 */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>数据同步</DialogTitle>
            <DialogDescription>管理本地数据与云端服务的同步状态</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex justify-between text-sm"><span>同步状态</span><span className="text-green-500 font-medium">已同步</span></div>
            <div className="flex justify-between text-sm"><span>最后同步</span><span className="text-muted-foreground">刚刚</span></div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => {}}>立即同步</Button>
              <Button variant="outline" size="sm" onClick={() => setSyncDialogOpen(false)}>关闭</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 系统日志对话框 */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[70vh]">
          <DialogHeader>
            <DialogTitle>系统日志</DialogTitle>
            <DialogDescription>查看系统运行日志</DialogDescription>
          </DialogHeader>
          <div className="bg-black/90 rounded p-3 font-mono text-xs text-green-400 h-64 overflow-auto">
            <div>[INFO] 系统启动完成</div>
            <div>[INFO] 加载插件: HR, Finance, Sales</div>
            <div>[INFO] 数据同步服务已连接</div>
            <div>[INFO] AI Agent 初始化成功</div>
            <div className="text-yellow-400">[WARN] 检测到 2 个可用更新</div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setLogsDialogOpen(false)}>关闭</Button>
          </div>
        </DialogContent>
      </Dialog>
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
  onSwitchAccount: () => Promise<void>
  onLogout: () => Promise<void>
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
        className="h-7 w-7 hover:bg-[var(--ao-topbar-border)]"
        style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
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
          className="h-7 w-7 justify-center rounded-md p-0 hover:bg-[var(--ao-topbar-border)] data-[state=open]:bg-[var(--ao-topbar-border)]"
          style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
        >
          <CircleUserRound size={16} />
        </MenubarTrigger>
        <MenubarContent 
          align="end" 
          sideOffset={8} 
          className="min-w-[240px]"
          style={{ backgroundColor: 'var(--ao-topbar-menuBackground)', borderColor: 'var(--ao-topbar-menuBorder)' }}
        >
          <MenubarLabel className="text-xs" style={{ color: 'var(--ao-sidebar-secondaryForeground)' }}>当前账号</MenubarLabel>
          <div 
            className="rounded-md px-3 py-2 text-xs leading-5"
            style={{ backgroundColor: 'var(--ao-sidebar-searchBackground)', color: 'var(--ao-topbar-menuItemForeground)' }}
          >
            <div>用户名：{resolveField(user?.username, '未设置用户名')}</div>
            <div>姓名：{resolveField(user?.name, '未设置姓名')}</div>
            <div>部门：{resolveField(user?.department, '未设置部门')}</div>
            <div>角色：{resolveField(user?.role, '未设置角色')}</div>
          </div>
          <MenubarSeparator style={{ backgroundColor: 'var(--ao-topbar-menuBorder)' }} />
          <MenubarItem onSelect={handleMenuAction('Account: Switch Account', onSwitchAccount)} style={{ color: 'var(--ao-topbar-menuItemForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}>
            <RefreshCw size={14} className="mr-2" />
            切换账号
          </MenubarItem>
          <MenubarItem 
            onSelect={handleMenuAction('Account: Logout', onLogout)} 
            style={{ color: 'var(--ao-topbar-dangerForeground)', backgroundColor: 'var(--ao-topbar-menuBackground)' }}
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
  aiPanelShortcutLabel: string
  onOpenLayoutDialog?: () => void
}

function LayoutControlButtons({
  sidebarCollapsed,
  chatPanelCollapsed,
  bottomPanelCollapsed,
  toggleSidebar,
  toggleChatPanel,
  toggleBottomPanel,
  aiPanelShortcutLabel,
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
                className="h-7 w-7 hover:bg-[var(--ao-topbar-border)]"
                style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
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
                className={`h-7 w-7 hover:bg-[var(--ao-topbar-border)] ${!sidebarCollapsed ? 'bg-[var(--ao-topbar-border)]' : ''}`}
                style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
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
                className={`h-7 w-7 hover:bg-[var(--ao-topbar-border)] ${!chatPanelCollapsed ? 'bg-[var(--ao-topbar-border)]' : ''}`}
                style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
                onClick={toggleChatPanel}
              >
                <PanelRight size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{`切换辅助侧栏 (${aiPanelShortcutLabel})`}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 hover:bg-[var(--ao-topbar-border)] ${!bottomPanelCollapsed ? 'bg-[var(--ao-topbar-border)]' : ''}`}
                style={{ color: 'var(--ao-topbar-menuItemForeground)' }}
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
