import { useCallback, useRef, useEffect, useState, type ReactNode } from 'react'

interface ResizablePanelProps {
  width: number
  minWidth: number
  maxWidth: number
  onWidthChange: (width: number) => void
  direction?: 'left' | 'right' | 'top' | 'bottom'
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
  const startPos = useRef(0)
  const startSize = useRef(0)
  const frameRef = useRef<number | null>(null)
  const pendingSize = useRef(width)
  const [activeSize, setActiveSize] = useState(width)
  const [isDragging, setIsDragging] = useState(false)

  const isVertical = direction === 'top' || direction === 'bottom'

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    startPos.current = isVertical ? e.clientY : e.clientX
    startSize.current = width
    pendingSize.current = width
    setActiveSize(width)
    setIsDragging(true)
    document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width, isVertical])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return
    
    const currentPos = isVertical ? e.clientY : e.clientX
    const delta = currentPos - startPos.current
    
    let newSize = startSize.current
    if (direction === 'right' || direction === 'bottom') {
      newSize += delta
    } else {
      newSize -= delta
    }
    
    const clampedSize = Math.min(maxWidth, Math.max(minWidth, newSize))
    pendingSize.current = clampedSize

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null
        setActiveSize(pendingSize.current)
        onWidthChange(pendingSize.current)
      })
    }
  }, [direction, minWidth, maxWidth, onWidthChange, isVertical])

  const handleMouseUp = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      setActiveSize(pendingSize.current)
      onWidthChange(pendingSize.current)
    }
    isResizing.current = false
    setIsDragging(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [onWidthChange])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [handleMouseMove, handleMouseUp])

  if (collapsed) {
    return (
      <div 
        className={className} 
        style={{ 
          [isVertical ? 'height' : 'width']: 0, 
          overflow: 'hidden' 
        }} 
      >
        {children}
      </div>
    )
  }

  const style = {
    [isVertical ? 'height' : 'width']: `${width}px`,
    flexShrink: 0
  }

  return (
    <div 
      className={`relative ${className}`}
      style={style}
    >
      {children}
      {/* 拖拽手柄 */}
      <div
        className={`absolute z-10 ${
          isVertical 
            ? 'left-0 w-full h-1 cursor-row-resize' 
            : 'top-0 w-1 h-full cursor-col-resize'
        } group ${
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
      {isDragging && (
        <div className="absolute right-3 top-3 rounded bg-slate-900/80 px-2 py-1 text-xs text-white">
          {Math.round(activeSize)}px
        </div>
      )}
    </div>
  )
}
