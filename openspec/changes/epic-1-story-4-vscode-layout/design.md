# Design: 类VSCode四栏布局

## 技术方案

### 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│                         Header (可选)                        │
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
    <div className="h-screen flex flex-col bg-slate-50">
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

### Tailwind 类名
```css
/* 活动栏 */
.activity-bar: w-12 bg-slate-800

/* 侧边栏 */
.sidebar: bg-slate-900

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
