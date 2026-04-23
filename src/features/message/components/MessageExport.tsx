/**
 * Message Export Component
 * 消息导出组件
 */

import { useState, useCallback } from 'react'
import { Download, FileText, FileJson, File, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useExportMessages } from '../hooks/useMessage'
import type { MessageFilter, ExportFormat } from '../types/message.types'

interface MessageExportProps {
  filter?: MessageFilter
  className?: string
  onExport?: (result: { format: ExportFormat; data: string; filename: string }) => void
}

export function MessageExport({ filter, className, onExport }: MessageExportProps) {
  const { exportMessages, isLoading } = useExportMessages()
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [includeContent, setIncludeContent] = useState(true)
  const [lastExport, setLastExport] = useState<{ format: ExportFormat; count: number; filename: string } | null>(null)

  const formats: { value: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'csv',
      label: 'CSV',
      icon: <FileText className="h-5 w-5" />,
      description: '适合Excel分析',
    },
    {
      value: 'json',
      label: 'JSON',
      icon: <FileJson className="h-5 w-5" />,
      description: '适合程序处理',
    },
    {
      value: 'txt',
      label: 'TXT',
      icon: <File className="h-5 w-5" />,
      description: '纯文本格式',
    },
  ]

  const _handleExport = useCallback(async () => {
    const result = await exportMessages({
      filter: filter || {
        pinnedOnly: false,
      },
      format: selectedFormat,
      includeContent,
    })

    if (result) {
      setLastExport({
        format: result.format,
        count: result.messageCount,
        filename: result.filename,
      })
      onExport?.({
        format: result.format,
        data: result.data,
        filename: result.filename,
      })
    }
  }, [filter, selectedFormat, includeContent, exportMessages, onExport])

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-5 w-5" />
          导出消息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">导出格式</label>
          <div className="grid grid-cols-3 gap-2">
            {formats.map((format) => (
              <Button
                key={format.value}
                variant={selectedFormat === format.value ? 'default' : 'outline'}
                size="sm"
                className="justify-start h-auto py-3"
                onClick={() => setSelectedFormat(format.value)}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    {format.icon}
                    <span className="font-medium">{format.label}</span>
                  </div>
                  <span className="text-xs opacity-70">{format.description}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">包含消息内容</p>
            <p className="text-xs text-muted-foreground">
              取消勾选可减小导出文件大小
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludeContent(!includeContent)}
          >
            {includeContent ? (
              <Check className="h-4 w-4 mr-1" />
            ) : null}
            {includeContent ? '已包含' : '不包含'}
          </Button>
        </div>

        <Button
          className="w-full"
          onClick={_handleExport}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              导出中...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              开始导出
            </>
          )}
        </Button>

        {/* Last Export Info */}
        {lastExport && (
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">上次导出</span>
              <Badge variant="secondary">{lastExport.format.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>共 {lastExport.count} 条消息</span>
              <span>{lastExport.filename}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                _handleExport().then(() => {
                  // Trigger download
                })
              }
            >
              <Download className="h-3 w-3 mr-1" />
              重新下载
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
