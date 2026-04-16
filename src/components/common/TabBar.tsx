import { useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Tab } from './Tab'
import { useWorkbenchStore } from '../../stores/workbenchStore'
import { useTabShortcuts } from '../../hooks/useTabShortcuts'

export interface TabBarProps {
  onNewTab?: () => void
  className?: string
}

export function TabBar({ onNewTab, className = '' }: TabBarProps) {
  const { tabs, activeTabId, setActiveTab, removeTab } = useWorkbenchStore()
  useTabShortcuts()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [showRightScroll, setShowRightScroll] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const { scrollLeft, scrollWidth, clientWidth } = el
    setShowLeftScroll(scrollLeft > 0)
    setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 1)
  }, [])

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const el = scrollContainerRef.current
    if (!el) return

    const scrollAmount = el.clientWidth * 0.6
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }, [])

  const handleScroll = useCallback(() => {
    checkScroll()
  }, [checkScroll])

  const handleCloseTab = useCallback(
    (tabId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      const tab = tabs.find((t) => t.id === tabId)
      if (tab?.dirty) {
        const confirmed = window.confirm(
          `"${tab.title}" 有未保存的更改，确定要关闭吗？`
        )
        if (!confirmed) return
      }
      removeTab(tabId)
    },
    [tabs, removeTab]
  )

  if (tabs.length === 0) {
    return (
      <div
        className={`flex h-10 items-center border-b px-4 ${className}`}
        style={{ backgroundColor: 'var(--ao-tabBar-background)', borderBottomColor: 'var(--ao-tabBar-border)' }}
      >
        <span className="text-xs" style={{ color: 'var(--ao-tabBar-foreground)' }}>暂无打开的标签页</span>
      </div>
    )
  }

  return (
    <div
      className={`relative flex h-10 items-center border-b ${className}`}
      style={{ backgroundColor: 'var(--ao-tabBar-background)', borderBottomColor: 'var(--ao-tabBar-border)' }}
    >
      {showLeftScroll && (
        <button
          type="button"
          aria-label="向左滚动"
          className="absolute left-0 top-0 z-10 flex h-full w-6 items-center justify-center shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--ao-tabBar-background) 95%, transparent)' }}
          onClick={() => scrollBy('left')}
        >
          <ChevronLeft className="h-4 w-4" style={{ color: 'var(--ao-tabBar-foreground)' }} />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label="标签页列表"
        className="flex h-full flex-1 items-center overflow-x-auto scroll-smooth scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={handleScroll}
      >
        <div className="flex h-full">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onClick={() => setActiveTab(tab.id)}
              onClose={(e) => handleCloseTab(tab.id, e)}
            />
          ))}
        </div>
      </div>

      {showRightScroll && (
        <button
          type="button"
          aria-label="向右滚动"
          className="absolute right-10 top-0 z-10 flex h-full w-6 items-center justify-center shadow-[-2px_0_4px_rgba(0,0,0,0.3)]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--ao-tabBar-background) 95%, transparent)' }}
          onClick={() => scrollBy('right')}
        >
          <ChevronRight className="h-4 w-4" style={{ color: 'var(--ao-tabBar-foreground)' }} />
        </button>
      )}

      {onNewTab && (
        <button
          type="button"
          aria-label="新建标签页"
          className="absolute right-0 top-0 flex h-full w-10 items-center justify-center border-l"
          style={{ borderColor: 'var(--ao-tabBar-border)', color: 'var(--ao-tabBar-foreground)' }}
          onClick={onNewTab}
        >
          <Plus className="h-4 w-4" />
        </button>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
