# Design: 可切换TopBar菜单栏

## 技术方案

### 布局结构（更新后）

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         TopBar (可切换)                                        │
│                   高度: 32px, 背景色: #1E3A5F                                 │
│   🏠 AI-Automated-office | File|Edit|View|Agent|...|Help    [≡] [▤] [⬚] [⬜]  │
│                                                                       ↑   ↑   ↑   ↑
│                                                                   自定义 左侧 面板 辅助
├────┬─────────────┬────────────────────────┬─────────────────────────────────────┤
│    │             │                        │                                     │
│ A  │   Sidebar   │      Workbench        │        AI Chat Panel                │
│ c  │             │                        │        (Auxiliary Sidebar)          │
│ t  │  (可折叠)    │      (自适应)          │          (可折叠)                    │
│ i  │             │                        │                                     │
│ v  │  200-280px  │                        │         300-500px                   │
│ i  │             │                        │                                     │
│ t  │             │                        │                                     │
│ y  │             │                        │                                     │
│    │             │                        │                                     │
│ 48 │             │                        │                                     │
│ px │             │                        │                                     │
├────┴─────────────┴────────────────────────┴─────────────────────────────────────┤
│                           Status Bar                                              │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 右侧布局控制按钮

| 按钮 | 图标 | 功能 | 快捷键 |
|:-----|:-----|:-----|:-------|
| **自定义布局** | `LayoutTemplate` | 打开布局自定义对话框 | - |
| **切换左侧栏** | `PanelLeft` | 显示/隐藏左侧 Sidebar | `Ctrl+B` |
| **切换面板** | `PanelBottom` | 显示/隐藏底部面板（预留，当前禁用）| `Ctrl+J` |
| **切换辅助侧栏** | `PanelRight` | 显示/隐藏右侧 AI Chat Panel | `Ctrl+Shift+I` |

**按钮状态：**
- 面板显示时：图标高亮（背景色 #3A5A83）
- 面板隐藏时：默认色
- "切换面板"按钮：当前禁用（灰色 + 禁用提示）

### 前端实现

#### 1. TopBar 组件

```typescript
// src/components/layout/TopBar.tsx
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarShortcut, MenubarSeparator } from "@/components/ui/menubar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileText, Edit3, Eye, Bot, Puzzle, Wrench, HelpCircle, LayoutTemplate, PanelLeft, PanelBottom, PanelRight } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

interface TopBarProps {
  visible: boolean
  onToggle: () => void
  onOpenLayoutDialog?: () => void
}

export function TopBar({ visible, onOpenLayoutDialog }: TopBarProps) {
  const { sidebarCollapsed, chatPanelCollapsed, toggleSidebar, toggleChatPanel } = useUIStore()

  if (!visible) return null

  return (
    <header className="h-8 bg-[#1E3A5F] border-b border-[#152A45] flex items-center justify-between px-2 select-none">
      {/* 左侧：应用标题 + 菜单栏 */}
      <div className="flex items-center">
        {/* 应用标题 */}
        <div className="flex items-center gap-2 mr-6">
          <span className="text-white font-bold text-sm">🏠 AI-Automated-office</span>
        </div>

        {/* 菜单栏 */}
        <Menubar className="border-none bg-transparent">
          <FileMenu />
          <EditMenu />
          <ViewMenu />
          <AgentMenu />
          <PluginsMenu />
          <ToolsMenu />
          <HelpMenu />
        </Menubar>
      </div>

      {/* 右侧：布局控制按钮 */}
      <div className="flex items-center gap-1">
        <LayoutControlButtons
          sidebarCollapsed={sidebarCollapsed}
          chatPanelCollapsed={chatPanelCollapsed}
          toggleSidebar={toggleSidebar}
          toggleChatPanel={toggleChatPanel}
          onOpenLayoutDialog={onOpenLayoutDialog}
        />
      </div>
    </header>
  )
}

// 布局控制按钮组件
interface LayoutControlButtonsProps {
  sidebarCollapsed: boolean
  chatPanelCollapsed: boolean
  toggleSidebar: () => void
  toggleChatPanel: () => void
  onOpenLayoutDialog?: () => void
}

function LayoutControlButtons({
  sidebarCollapsed,
  chatPanelCollapsed,
  toggleSidebar,
  toggleChatPanel,
  onOpenLayoutDialog,
}: LayoutControlButtonsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        {/* 自定义布局 */}
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

        {/* 切换左侧栏 */}
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

        {/* 切换面板（底部面板 - 当前禁用） */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/40 cursor-not-allowed"
              disabled
            >
              <PanelBottom size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>切换面板 (暂未实现)</p>
          </TooltipContent>
        </Tooltip>

        {/* 切换辅助侧栏（AI Chat Panel） */}
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
      </div>
    </TooltipProvider>
  )
}

// File 菜单
function FileMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
        File
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          <FileText size={14} className="mr-2" />
          New
          <MenubarShortcut>⌘N</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          Open...
          <MenubarShortcut>⌘O</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem>
          Save
          <MenubarShortcut>⌘S</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>Save As...</MenubarItem>
        <MenubarSeparator />
        <MenubarItem>Import...</MenubarItem>
        <MenubarItem>Export...</MenubarItem>
        <MenubarSeparator />
        <MenubarItem>Print...</MenubarItem>
        <MenubarSeparator />
        <MenubarItem variant="destructive">Exit</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}

// Edit 菜单
function EditMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
        Edit
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          Undo
          <MenubarShortcut>⌘Z</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          Redo
          <MenubarShortcut>⌘⇧Z</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem>
          Cut
          <MenubarShortcut>⌘X</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          Copy
          <MenubarShortcut>⌘C</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          Paste
          <MenubarShortcut>⌘V</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem>
          Find...
          <MenubarShortcut>⌘F</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          Replace...
          <MenubarShortcut>⌘H</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem>
          Select All
          <MenubarShortcut>⌘A</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}

// View 菜单
function ViewMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
        View
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          <Eye size={14} className="mr-2" />
          Toggle Menu Bar
          <MenubarShortcut>⌘⇧M</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem>Activity Bar</MenubarItem>
        <MenubarItem>Sidebar</MenubarItem>
        <MenubarItem>AI Chat Panel</MenubarItem>
        <MenubarSeparator />
        <MenubarItem>
          Full Screen
          <MenubarShortcut>F11</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem>
          Zoom In
          <MenubarShortcut>⌘+</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          Zoom Out
          <MenubarShortcut>⌘-</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          Reset Zoom
          <MenubarShortcut>⌘0</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}

// Agent 菜单
function AgentMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
        Agent
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          <Bot size={14} className="mr-2" />
          New Chat
        </MenubarItem>
        <MenubarItem>Chat History...</MenubarItem>
        <MenubarSeparator />
        <MenubarItem>Model Settings...</MenubarItem>
        <MenubarItem>API Key Management...</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}

// Plugins 菜单
function PluginsMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
        Plugins
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          <Puzzle size={14} className="mr-2" />
          Plugin Market...
        </MenubarItem>
        <MenubarItem>Installed Plugins...</MenubarItem>
        <MenubarItem>Plugin Settings...</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}

// Tools 菜单
function ToolsMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
        Tools
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          <Wrench size={14} className="mr-2" />
          Data Sync
        </MenubarItem>
        <MenubarItem>System Logs...</MenubarItem>
        <MenubarItem>Performance Monitor...</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}

// Help 菜单
function HelpMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className="text-white hover:bg-[#2A4A73] data-[state=open]:bg-[#2A4A73]">
        Help
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          <HelpCircle size={14} className="mr-2" />
          Documentation
        </MenubarItem>
        <MenubarItem>Keyboard Shortcuts...</MenubarItem>
        <MenubarSeparator />
        <MenubarItem>About...</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}
```

#### 2. 更新 AppLayout 组件

```typescript
// src/components/layout/AppLayout.tsx
import { TopBar } from './TopBar'
import { ActivityBar } from './ActivityBar'
import { Sidebar } from './Sidebar'
import { Workbench } from './Workbench'
import { AiChatPanel } from './AiChatPanel'
import { StatusBar } from './StatusBar'
import { useUIStore } from '@/stores/uiStore'

export function AppLayout() {
  const { topBarVisible, toggleTopBar } = useUIStore()

  // 注册快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+M or Cmd+Shift+M
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'm') {
        e.preventDefault()
        toggleTopBar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleTopBar])

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F8FAFC' }}>
      {/* 顶部菜单栏（可切换） */}
      <TopBar visible={topBarVisible} onToggle={toggleTopBar} />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        <ActivityBar />
        <Sidebar />
        <Workbench className="flex-1" />
        <AiChatPanel />
      </div>

      {/* 状态栏 */}
      <StatusBar />
    </div>
  )
}
```

#### 3. 更新状态管理

```typescript
// src/stores/uiStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // 现有状态
  sidebarWidth: number
  chatPanelWidth: number
  sidebarCollapsed: boolean
  chatPanelCollapsed: boolean

  // 新增：TopBar 状态
  topBarVisible: boolean
  toggleTopBar: () => void

  // 现有方法
  setSidebarWidth: (width: number) => void
  setChatPanelWidth: (width: number) => void
  toggleSidebar: () => void
  toggleChatPanel: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 现有初始值
      sidebarWidth: 240,
      chatPanelWidth: 400,
      sidebarCollapsed: false,
      chatPanelCollapsed: false,

      // 新增：TopBar 默认显示
      topBarVisible: true,

      // 新增方法
      toggleTopBar: () => set((s) => ({ topBarVisible: !s.topBarVisible })),

      // 现有方法
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setChatPanelWidth: (width) => set({ chatPanelWidth: width }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleChatPanel: () => set((s) => ({ chatPanelCollapsed: !s.chatPanelCollapsed })),
    }),
    {
      name: 'ui-layout',
      // 持久化所有 UI 状态
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        chatPanelWidth: state.chatPanelWidth,
        sidebarCollapsed: state.sidebarCollapsed,
        chatPanelCollapsed: state.chatPanelCollapsed,
        topBarVisible: state.topBarVisible,
      }),
    }
  )
)
```

### Shadcn/ui 组件安装

```bash
# 安装 Menubar 组件
npx shadcn@latest add menubar
```

### 样式规范

| 区域 | 属性 | 色值 | Tailwind 类 |
|------|------|------|-----------|
| TopBar 背景 | 背景色 | `#1E3A5F` | `bg-[#1E3A5F]` |
| TopBar 边框 | 边框色 | `#152A45` | `border-[#152A45]` |
| 菜单项文字 | 文字色 | `#FFFFFF` | `text-white` |
| 菜单项悬停 | 悬停色 | `#2A4A73` | `hover:bg-[#2A4A73]` |
| 菜单项展开 | 展开色 | `#2A4A73` | `data-[state=open]:bg-[#2A4A73]` |
| TopBar 高度 | 高度 | `32px` | `h-8` |

### 首次启动提示

```typescript
// 在 App 组件中添加首次启动提示
import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function App() {
  const [showTopBarHint, setShowTopBarHint] = useState(false)

  useEffect(() => {
    const hasSeenHint = localStorage.getItem('topbar-hint-seen')
    if (!hasSeenHint) {
      setShowTopBarHint(true)
    }
  }, [])

  const handleDismissHint = () => {
    localStorage.setItem('topbar-hint-seen', 'true')
    setShowTopBarHint(false)
  }

  return (
    <div>
      {showTopBarHint && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              按 <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Shift+M</kbd>
              可以隐藏/显示菜单栏
              <button onClick={handleDismissHint} className="ml-2 text-xs underline">
                知道了
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      <AppLayout />
    </div>
  )
}
```

## 文件结构

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx          # 更新：集成 TopBar
│   │   ├── TopBar.tsx             # 🆕 顶部菜单栏组件
│   │   ├── ActivityBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Workbench.tsx
│   │   ├── AiChatPanel.tsx
│   │   └── StatusBar.tsx
│   └── ui/
│       └── menubar.tsx            # 🆕 Shadcn/ui Menubar 组件
├── stores/
│   └── uiStore.ts                 # 更新：添加 topBarVisible 状态
└── App.tsx                        # 更新：添加首次启动提示
```

## 菜单项功能映射

| 菜单 | 菜单项 | 功能 | 实现方式 |
|------|-------|------|---------|
| File | New | 新建文档/会话 | 调用新建 API |
| File | Open | 打开文件 | 触发文件选择器 |
| File | Save | 保存 | 调用保存 API |
| File | Save As | 另存为 | 触发另存为对话框 |
| File | Import | 导入 | 触发导入对话框 |
| File | Export | 导出 | 触发导出对话框 |
| File | Print | 打印 | 调用打印 API |
| File | Exit | 退出 | Tauri 关闭窗口 |
| Edit | Undo/Redo | 撤销/重做 | 调用编辑器 API |
| Edit | Cut/Copy/Paste | 剪切/复制/粘贴 | 调用剪贴板 API |
| Edit | Find/Replace | 查找/替换 | 打开查找对话框 |
| View | Toggle Menu Bar | 切换菜单栏 | 调用 toggleTopBar() |
| View | Activity Bar | 切换活动栏 | 调用 toggleActivityBar() |
| View | Sidebar | 切换侧边栏 | 调用 toggleSidebar() |
| View | AI Chat Panel | 切换 AI 面板 | 调用 toggleChatPanel() |
| View | Full Screen | 全屏 | 调用全屏 API |
| Agent | New Chat | 新对话 | 调用新建会话 API |
| Agent | Chat History | 历史记录 | 打开历史记录对话框 |
| Agent | Model Settings | 模型设置 | 打开设置面板 |
| Agent | API Key Management | API 密钥管理 | 打开密钥管理对话框 |
| Plugins | Plugin Market | 插件市场 | 打开插件市场页面 |
| Plugins | Installed Plugins | 已安装插件 | 打开已安装插件列表 |
| Plugins | Plugin Settings | 插件设置 | 打开插件设置页面 |
| Tools | Data Sync | 数据同步 | 触发数据同步 |
| Tools | System Logs | 系统日志 | 打开日志查看器 |
| Tools | Performance Monitor | 性能监控 | 打开性能监控面板 |
| Help | Documentation | 文档 | 打开外部文档链接 |
| Help | Keyboard Shortcuts | 快捷键 | 打开快捷键对话框 |
| Help | About | 关于 | 打开关于对话框 |
