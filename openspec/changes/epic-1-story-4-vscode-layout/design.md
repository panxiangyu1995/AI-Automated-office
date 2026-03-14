# Design: 类VSCode四栏布局

## 技术方案

### 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│                      TopBar (必须)                           │
│                    高度: 40px, 背景色: #1E3A5F              │
├────┬─────────────┬────────────────────────┬─────────────────┤
│    │             │                        │                 │
│ A  │   Sidebar   │      Workbench        │   AI Chat Panel │
│ c  │             │                        │                 │
│ t  │  (可折叠)    │      (自适应)          │    (可折叠)      │
│ i  │             │                        │                 │
│ v  │  200-280px  │                        │    300-500px    │
│ i  │             │                        │                 │
│ t  │             │                        │                 │
│ y  │             │                        │                 │
│    │             │                        │                 │
│ 48 │             │                        │                 │
│ px │             │                        │                 │
├────┴─────────────┴────────────────────────┴─────────────────┤
│                       Status Bar                             │
└─────────────────────────────────────────────────────────────┘
```

### 前端实现

```typescript
// src/components/common/AppLayout.tsx
import { useState, useCallback } from 'react'
import { TopBar } from './TopBar'
import { ActivityBar } from './ActivityBar'
import { Sidebar } from './Sidebar'
import { Workbench } from './Workbench'
import { AiChatPanel } from './AiChatPanel'
import { StatusBar } from './StatusBar'

export function AppLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [chatPanelWidth, setChatPanelWidth] = useState(400)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatPanelCollapsed, setChatPanelCollapsed] = useState(false)

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F8FAFC' }}>
      {/* 顶部工具栏 - 必须 */}
      <TopBar />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 活动栏 */}
        <ActivityBar
          activeItem={activeItem}
          onItemClick={setActiveItem}
        />

        {/* 侧边栏 */}
        <Sidebar
          width={sidebarWidth}
          collapsed={sidebarCollapsed}
          onWidthChange={setSidebarWidth}
          onCollapse={setSidebarCollapsed}
        />

        {/* 工作区 */}
        <Workbench className="flex-1" />

        {/* AI 对话面板 */}
        <AiChatPanel
          width={chatPanelWidth}
          collapsed={chatPanelCollapsed}
          onWidthChange={setChatPanelWidth}
          onCollapse={setChatPanelCollapsed}
        />
      </div>

      {/* 状态栏 */}
      <StatusBar />
    </div>
  )
}
```

### 面板拖拽实现

```typescript
// src/components/common/ResizablePanel.tsx
import { useState, useCallback, useRef } from 'react'

interface ResizablePanelProps {
  width: number
  minWidth: number
  maxWidth: number
  onWidthChange: (width: number) => void
  children: React.ReactNode
}

export function ResizablePanel({
  width,
  minWidth,
  maxWidth,
  onWidthChange,
  children,
}: ResizablePanelProps) {
  const isResizing = useRef(false)
  
  const handleMouseDown = useCallback(() => {
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return
    const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX))
    onWidthChange(newWidth)
  }, [minWidth, maxWidth, onWidthChange])
  
  const handleMouseUp = useCallback(() => {
    isResizing.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])
  
  return (
    <div style={{ width }} className="relative">
      {children}
      <div
        className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-blue-500 cursor-col-resize"
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}
```

## 组件设计

### 顶部工具栏 (TopBar)
- **必须** - 显示系统标识和当前部门信息
- 固定高度 40px
- 背景色: `#1E3A5F` (品牌主色)
- 内容:
  - 左侧: "AI-Automated-Office - {部门名称}"
  - 右侧: 用户信息、通知、设置等入口

```typescript
// src/components/common/TopBar.tsx
import { Bell, Settings, User } from 'lucide-react'

interface TopBarProps {
  department?: string
  userName?: string
}

export function TopBar({ department = '财务管理', userName }: TopBarProps) {
  return (
    <header
      className="h-10 px-4 flex items-center justify-between"
      style={{ backgroundColor: '#1E3A5F' }}
    >
      <h1 className="text-white font-bold text-sm">
        AI-Automated-Office - {department}
      </h1>
      <div className="flex items-center gap-4">
        <button className="text-white hover:opacity-80">
          <Bell size={16} />
        </button>
        <button className="text-white hover:opacity-80">
          <Settings size={16} />
        </button>
        {userName && (
          <div className="flex items-center gap-2 text-white text-sm">
            <User size={16} />
            <span>{userName}</span>
          </div>
        )}
      </div>
    </header>
  )
}
```

### 活动栏 (ActivityBar)
- 固定宽度 48px
- 图标按钮列表
- 当前选中项高亮

### 侧边栏 (Sidebar)
- 可拖拽调整宽度 (200-280px)
- 支持折叠
- 内容区由各功能模块填充

### 工作区 (Workbench)
- 自适应剩余宽度
- 最小宽度 400px
- 内容区由各功能模块填充

### AI 对话面板 (AiChatPanel)
- 可拖拽调整宽度 (300-500px)
- 支持折叠
- 包含对话输入区

## 样式规范

### 颜色系统（对齐 UX 规范）

| 区域 | 颜色属性 | 精确色值 | Tailwind 配置建议 |
|------|----------|----------|-------------------|
| 顶部工具栏 | 背景色 | `#1E3A5F` | 品牌主色 |
| 活动栏 | 背景色 | `#1E293B` | 自定义 `bg-sidebar` |
| 活动栏图标 | 激活状态 | `#FFFFFF` | - |
| 活动栏图标 | 默认状态 | `#94A3B8` | `text-slate-400` |
| 侧边栏 | 背景色 | `#1E293B` | 自定义 `bg-sidebar` |
| 工作区 | 背景色 | `#F8FAFC` | `bg-slate-50` |
| AI 面板 | 背景色 | `#FFFFFF` | `bg-white` |
| 边框 | 分隔线 | `#E2E8F0` | `border-slate-200` |

### Tailwind 配置更新

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // 品牌主色（顶部工具栏）
        brand: {
          DEFAULT: '#1E3A5F',
        },
        // 侧边栏背景色（活动栏 + 侧边栏）
        sidebar: '#1E293B',
      },
    },
  },
}
```

### 组件样式类名

```css
/* 顶部工具栏 - 必须 */
.topbar: h-10 px-4 flex items-center justify-between bg-brand text-white

/* 活动栏 */
.activity-bar: w-12 bg-sidebar text-slate-400

/* 侧边栏 */
.sidebar: bg-sidebar border-r border-slate-700

/* 工作区 */
.workbench: bg-slate-50

/* AI 面板 */
.ai-panel: bg-white border-l border-slate-200
```

## 状态管理

```typescript
// src/stores/uiStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarWidth: number
  chatPanelWidth: number
  sidebarCollapsed: boolean
  chatPanelCollapsed: boolean
  setSidebarWidth: (width: number) => void
  setChatPanelWidth: (width: number) => void
  toggleSidebar: () => void
  toggleChatPanel: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarWidth: 240,
      chatPanelWidth: 400,
      sidebarCollapsed: false,
      chatPanelCollapsed: false,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setChatPanelWidth: (width) => set({ chatPanelWidth: width }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleChatPanel: () => set((s) => ({ chatPanelCollapsed: !s.chatPanelCollapsed })),
    }),
    { name: 'ui-layout' }
  )
)
```

## 性能考虑

1. 使用 CSS transform 进行动画
2. 拖拽时使用 requestAnimationFrame
3. 避免不必要的重渲染
