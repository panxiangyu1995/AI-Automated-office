# Design: 面板布局自定义

## 技术方案

### 布局状态持久化

```typescript
// src/stores/uiStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutConfig {
  sidebarWidth: number
  chatPanelWidth: number
  sidebarCollapsed: boolean
  chatPanelCollapsed: boolean
  bottomPanelHeight: number
  bottomPanelCollapsed: boolean
}

interface UIState extends LayoutConfig {
  setSidebarWidth: (width: number) => void
  setChatPanelWidth: (width: number) => void
  setBottomPanelHeight: (height: number) => void
  toggleSidebar: () => void
  toggleChatPanel: () => void
  toggleBottomPanel: () => void
  resetLayout: () => void
}

const defaultLayout: LayoutConfig = {
  sidebarWidth: 240,
  chatPanelWidth: 400,
  sidebarCollapsed: false,
  chatPanelCollapsed: false,
  bottomPanelHeight: 200,
  bottomPanelCollapsed: true,
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...defaultLayout,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setChatPanelWidth: (width) => set({ chatPanelWidth: width }),
      setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleChatPanel: () => set((s) => ({ chatPanelCollapsed: !s.chatPanelCollapsed })),
      toggleBottomPanel: () => set((s) => ({ bottomPanelCollapsed: !s.bottomPanelCollapsed })),
      resetLayout: () => set(defaultLayout),
    }),
    {
      name: 'ui-layout',
      storage: createDebouncedStorage(localStorage, 100),
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        chatPanelWidth: state.chatPanelWidth,
        sidebarCollapsed: state.sidebarCollapsed,
        chatPanelCollapsed: state.chatPanelCollapsed,
        bottomPanelHeight: state.bottomPanelHeight,
        bottomPanelCollapsed: state.bottomPanelCollapsed,
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
  direction?: 'left' | 'right' | 'top' | 'bottom'
  onWidthChange: (width: number) => void
  collapsed?: boolean
  children: React.ReactNode
  className?: string
}

export function ResizablePanel({
  width,
  minWidth,
  maxWidth,
  direction = 'right',
  onWidthChange,
  collapsed = false,
  children,
  className = '',
}: ResizablePanelProps) {
  const isResizing = useRef(false)
  const startPos = useRef(0)
  const startSize = useRef(0)
  const frameRef = useRef<number | null>(null)
  const pendingSize = useRef(width)
  const [activeSize, setActiveSize] = useState(width)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    startPos.current = isVertical ? e.clientY : e.clientX
    startSize.current = width
    setActiveSize(width)
    document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width, isVertical])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      
      const currentPos = isVertical ? e.clientY : e.clientX
      const delta = currentPos - startPos.current
      const nextSize = direction === 'right' || direction === 'bottom'
        ? startSize.current + delta
        : startSize.current - delta
      const clampedSize = Math.min(maxWidth, Math.max(minWidth, nextSize))
      pendingSize.current = clampedSize

      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null
          setActiveSize(pendingSize.current)
          onWidthChange(pendingSize.current)
        })
      }
    }

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [minWidth, maxWidth, direction, onWidthChange, isVertical])

  return (
    <div className={`relative ${className}`} style={style}>
      {children}
      <div
        className={`absolute z-10 ${
          isVertical 
            ? 'left-0 w-full h-1 cursor-row-resize' 
            : 'top-0 w-1 h-full cursor-col-resize'
        } ${
          direction === 'right' ? 'right-0 translate-x-1/2' : 
          direction === 'left' ? 'left-0 -translate-x-1/2' :
          direction === 'bottom' ? 'bottom-0 translate-y-1/2' : 
          'top-0 -translate-y-1/2'
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className={`bg-transparent group-hover:bg-primary/50 transition-colors ${
          isVertical ? 'w-full h-px' : 'w-px h-full'
        }`} />
      </div>
      {isResizing.current && (
        <div className="absolute right-3 top-3 rounded bg-slate-900/80 px-2 py-1 text-xs text-white">
          {Math.round(activeSize)}px
        </div>
      )}
    </div>
  )
}
```

### 重置布局功能

```typescript
// src/components/common/LayoutSettingsDialog.tsx
import { useUIStore } from '@/stores/uiStore'

export function LayoutSettingsDialog() {
  const { resetLayout } = useUIStore()
  
  return (
    <Button
      variant="outline"
      onClick={resetLayout}
    >
      重置为默认布局
    </Button>
  )
}
```

## 性能考虑

1. 使用防抖保存布局配置
2. 拖拽时使用 requestAnimationFrame
3. 避免频繁触发重新渲染
