import { useCallback, useRef, useEffect, type ReactNode } from 'react'

interface ResizablePanelProps {
  width: number
  minWidth: number
  maxWidth: number
  onWidthChange: (width: number) => void
  direction?: 'left' | 'right'
  collapsed?: boolean
  children: ReactNode
  className?: string
}

export function ResizablePanel({
  width,
  minWidth,
  maxWidth,
  onWidthChange,
  direction = 'right',
  collapsed = false,
  children,
  className = '',
}: ResizablePanelProps) {
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return
    
    const deltaX = e.clientX - startX.current
    const newWidth = direction === 'right'
      ? startWidth.current - deltaX
      : startWidth.current + deltaX
    
    const clampedWidth = Math.min(maxWidth, Math.max(minWidth, newWidth))
    onWidthChange(clampedWidth)
  }, [direction, minWidth, maxWidth, onWidthChange])

  const handleMouseUp = useCallback(() => {
    isResizing.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  if (collapsed) {
    return (
      <div className={className} style={{ width: 0, overflow: 'hidden' }}>
        {children}
      </div>
    )
  }

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: `${width}px`, flexShrink: 0 }}
    >
      {children}
      {/* 拖拽手柄 */}
      <div
        className={`absolute top-0 w-1 h-full cursor-col-resize group ${
          direction === 'right' ? 'left-0' : 'right-0'
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="w-px h-full bg-transparent group-hover:bg-primary/50 transition-colors" />
      </div>
    </div>
  )
}
