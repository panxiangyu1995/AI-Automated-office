import { useState, useCallback } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, FileText, Image, File } from 'lucide-react'
import type { PreviewData } from './types'

interface PreviewPanelProps {
  preview?: PreviewData
  title?: string
}

const PREVIEW_ICONS = {
  image: Image,
  pdf: FileText,
  document: File,
}

export function PreviewPanel({ preview, title = '预览' }: PreviewPanelProps) {
  const [zoom, setZoom] = useState(preview?.zoom ?? 100)

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 25, 300))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 25, 25))
  }, [])

  const handleReset = useCallback(() => {
    setZoom(100)
  }, [])

  if (!preview) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: 'var(--ao-bottomPanel-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
            {title}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--ao-bottomPanel-activeBackground)' }}
            >
              <FileText className="h-5 w-5" style={{ color: 'var(--ao-bottomPanel-foreground)' }} />
            </div>
            <span className="text-sm" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
              暂无预览内容
            </span>
            <span className="text-xs" style={{ color: 'var(--ao-workbench-secondaryForeground)' }}>
              打开文件或图片以查看预览
            </span>
          </div>
        </div>
      </div>
    )
  }

  const Icon = PREVIEW_ICONS[preview.type] ?? FileText

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: 'var(--ao-bottomPanel-border)' }}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: 'var(--ao-bottomPanel-foreground)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
            {title}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-xs uppercase"
            style={{ backgroundColor: 'var(--ao-bottomPanel-activeBackground)', color: 'var(--ao-bottomPanel-foreground)' }}
          >
            {preview.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="缩小"
            className="rounded p-1 disabled:opacity-50"
            onClick={handleZoomOut}
            disabled={zoom <= 25}
          >
            <ZoomOut className="h-4 w-4" style={{ color: 'var(--ao-bottomPanel-foreground)' }} />
          </button>
          <span
            className="min-w-[3rem] text-center text-xs"
            style={{ color: 'var(--ao-bottomPanel-foreground)' }}
          >
            {zoom}%
          </span>
          <button
            type="button"
            aria-label="放大"
            className="rounded p-1 disabled:opacity-50"
            onClick={handleZoomIn}
            disabled={zoom >= 300}
          >
            <ZoomIn className="h-4 w-4" style={{ color: 'var(--ao-bottomPanel-foreground)' }} />
          </button>
          <button
            type="button"
            aria-label="重置"
            className="rounded p-1"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" style={{ color: 'var(--ao-bottomPanel-foreground)' }} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div
          className="mx-auto transition-transform duration-200"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          {preview.type === 'image' ? (
            <img
              src={preview.url}
              alt="预览"
              className="max-w-full rounded"
              style={{ backgroundColor: 'var(--ao-bottomPanel-background)' }}
            />
          ) : preview.type === 'pdf' ? (
            <iframe
              src={preview.url}
              className="h-[600px] w-full rounded"
              title="PDF 预览"
            />
          ) : (
            <div
              className="flex h-[400px] w-[600px] items-center justify-center rounded"
              style={{ backgroundColor: 'var(--ao-bottomPanel-background)' }}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className="h-12 w-12" style={{ color: 'var(--ao-bottomPanel-foreground)' }} />
                <span className="text-sm" style={{ color: 'var(--ao-bottomPanel-foreground)' }}>
                  文档预览
                </span>
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                  style={{ color: 'var(--ao-button-linkForeground)' }}
                >
                  在新窗口打开
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
