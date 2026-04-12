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
        <div className="flex items-center justify-between border-b border-[#21262D] px-4 py-2">
          <span className="text-sm font-medium" style={{ color: '#8B949E' }}>
            {title}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: '#21262D' }}
            >
              <FileText className="h-5 w-5" style={{ color: '#8B949E' }} />
            </div>
            <span className="text-sm" style={{ color: '#8B949E' }}>
              暂无预览内容
            </span>
            <span className="text-xs" style={{ color: '#6E7681' }}>
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
      <div className="flex items-center justify-between border-b border-[#21262D] px-4 py-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: '#8B949E' }} />
          <span className="text-sm font-medium" style={{ color: '#8B949E' }}>
            {title}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-xs uppercase"
            style={{ backgroundColor: '#21262D', color: '#8B949E' }}
          >
            {preview.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="缩小"
            className="rounded p-1 hover:bg-[#21262D] disabled:opacity-50"
            onClick={handleZoomOut}
            disabled={zoom <= 25}
          >
            <ZoomOut className="h-4 w-4" style={{ color: '#8B949E' }} />
          </button>
          <span
            className="min-w-[3rem] text-center text-xs"
            style={{ color: '#8B949E' }}
          >
            {zoom}%
          </span>
          <button
            type="button"
            aria-label="放大"
            className="rounded p-1 hover:bg-[#21262D] disabled:opacity-50"
            onClick={handleZoomIn}
            disabled={zoom >= 300}
          >
            <ZoomIn className="h-4 w-4" style={{ color: '#8B949E' }} />
          </button>
          <button
            type="button"
            aria-label="重置"
            className="rounded p-1 hover:bg-[#21262D]"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" style={{ color: '#8B949E' }} />
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
              style={{ backgroundColor: '#161B22' }}
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
              style={{ backgroundColor: '#161B22' }}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className="h-12 w-12" style={{ color: '#8B949E' }} />
                <span className="text-sm" style={{ color: '#8B949E' }}>
                  文档预览
                </span>
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                  style={{ color: '#58A6FF' }}
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
