# Design: 面板布局自定义

## 技术方案

### 布局状态持久化

```typescript
// src/stores/uiStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface LayoutConfig {
  sidebarWidth: number
  chatPanelWidth: number
  sidebarCollapsed: boolean
  chatPanelCollapsed: boolean
}

interface UIState extends LayoutConfig {
  setSidebarWidth: (width: number) => void
  setChatPanelWidth: (width: number) => void
  toggleSidebar: () => void
  toggleChatPanel: () => void
  resetLayout: () => void
}

const defaultLayout: LayoutConfig = {
  sidebarWidth: 240,
  chatPanelWidth: 400,
  sidebarCollapsed: false,
  chatPanelCollapsed: false,
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...defaultLayout,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setChatPanelWidth: (width) => set({ chatPanelWidth: width }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleChatPanel: () => set((s) => ({ chatPanelCollapsed: !s.chatPanelCollapsed })),
      resetLayout: () => set(defaultLayout),
    }),
    {
      name: 'ui-layout',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        chatPanelWidth: state.chatPanelWidth,
        sidebarCollapsed: state.sidebarCollapsed,
        chatPanelCollapsed: state.chatPanelCollapsed,
      }),
    }
  )
)
```

### 拖拽调整实现

```typescript
// src/components/common/ResizablePanel.tsx
import { useCallback, useRef, useEffect } from 'react'

interface ResizablePanelProps {
  width: number
  minWidth: number
  maxWidth: number
  direction: 'left' | 'right'
  onWidthChange: (width: number) => void
  onResizeStart?: () => void
  onResizeEnd?: () => void
  children: React.ReactNode
}

export function ResizablePanel({
  width,
  minWidth,
  maxWidth,
  direction,
  onWidthChange,
  onResizeStart,
  onResizeEnd,
  children,
}: ResizablePanelProps) {
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = width
    onResizeStart?.()
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width, onResizeStart])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      
      const delta = direction === 'right' 
        ? startX.current - e.clientX 
        : e.clientX - startX.current
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta))
      
      onWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false
        onResizeEnd?.()
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [minWidth, maxWidth, direction, onWidthChange, onResizeEnd])

  return (
    <div style={{ width }} className="relative h-full">
      {children}
      {direction === 'right' && (
        <div
          className="absolute top-0 left-0 w-1 h-full bg-transparent hover:bg-blue-500 cursor-col-resize transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}
      {direction === 'left' && (
        <div
          className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-blue-500 cursor-col-resize transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  )
}
```

### 重置布局功能

```typescript
// src/features/settings/components/LayoutSettings.tsx
import { useUIStore } from '@/stores/uiStore'

export function LayoutSettings() {
  const { resetLayout } = useUIStore()
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">布局设置</h3>
      <button
        onClick={resetLayout}
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded"
      >
        重置为默认布局
      </button>
    </div>
  )
}
```

## 性能考虑

1. 使用防抖保存布局配置
2. 拖拽时使用 requestAnimationFrame
3. 避免频繁触发重新渲染
