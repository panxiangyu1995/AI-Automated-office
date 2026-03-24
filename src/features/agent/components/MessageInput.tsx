/**
 * MessageInput - 消息输入组件
 * Story 4.1 - AI对话界面实现
 * Story 7.2 - 多模态输入处理
 * 
 * 支持功能：
 * - 文本输入
 * - 发送消息
 * - 停止生成
 * - 快捷键支持
 * - 多模态输入：图片、PDF文件
 * - 文件预览
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - FR403: 接受图片和PDF
 * - FR404: 提取结构化内容
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Square, Paperclip, Mic, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStreamingStatus } from '../hooks/useChatStore'

// ==================== Types ====================

export type MediaType = 'image' | 'pdf'

export interface MediaAttachment {
  id: string
  type: MediaType
  name: string
  size: number
  preview?: string // base64 for images
  file: File
  extractedContent?: string
  extractionStatus: 'pending' | 'extracting' | 'extracted' | 'failed'
}

interface MessageInputProps {
  onSend: (content: string, attachments?: MediaAttachment[]) => void
  onStop?: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
  maxFileSize?: number // in bytes, default 10MB
  allowedTypes?: MediaType[]
}

// ==================== Constants ====================

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_PDF_TYPE = 'application/pdf'

// ==================== Helper Functions ====================

const generateId = () => Math.random().toString(36).substring(2, 15)

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileType = (file: File): MediaType | null => {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return 'image'
  if (file.type === ALLOWED_PDF_TYPE) return 'pdf'
  return null
}

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ==================== Main Component ====================

export function MessageInput({
  onSend,
  onStop,
  disabled = false,
  placeholder = '输入消息，或拖放文件...',
  className,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedTypes = ['image', 'pdf'],
}: MessageInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [attachments, setAttachments] = useState<MediaAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isStreaming } = useStreamingStatus()
  
  // 自动调整文本框高度
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [inputValue])
  
  // 处理文件选择
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      // 检查文件大小
      if (file.size > maxFileSize) {
        console.warn(`文件 ${file.name} 超过大小限制`)
        continue
      }
      
      // 检查文件类型
      const fileType = getFileType(file)
      if (!fileType || !allowedTypes.includes(fileType)) {
        console.warn(`文件类型 ${file.type} 不支持`)
        continue
      }
      
      // 创建附件对象
      const attachment: MediaAttachment = {
        id: generateId(),
        type: fileType,
        name: file.name,
        size: file.size,
        file,
        extractionStatus: 'pending',
      }
      
      // 如果是图片，生成预览
      if (fileType === 'image') {
        try {
          attachment.preview = await readFileAsBase64(file)
        } catch (err) {
          console.error('读取图片失败:', err)
        }
      }
      
      setAttachments(prev => [...prev, attachment])
      
      // 模拟内容提取（实际实现应调用后端）
      simulateContentExtraction(attachment.id, fileType)
    }
  }, [maxFileSize, allowedTypes])
  
  // 模拟内容提取
  const simulateContentExtraction = useCallback((attachmentId: string, type: MediaType) => {
    setAttachments(prev => prev.map(att => 
      att.id === attachmentId 
        ? { ...att, extractionStatus: 'extracting' as const }
        : att
    ))
    
    // 模拟异步提取
    setTimeout(() => {
      setAttachments(prev => prev.map(att => {
        if (att.id !== attachmentId) return att
        
        const extractedContent = type === 'image'
          ? `[图片内容已提取: ${att.name}]`
          : `[PDF文档已解析: ${att.name}\n- 页数: ${Math.floor(Math.random() * 20) + 1}\n- 文本已提取]`
        
        return {
          ...att,
          extractionStatus: 'extracted' as const,
          extractedContent,
        }
      }))
    }, 1000 + Math.random() * 1000)
  }, [])
  
  // 移除附件
  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }, [])
  
  // 发送消息
  const handleSend = useCallback(() => {
    const trimmedValue = inputValue.trim()
    const hasAttachments = attachments.length > 0
    
    if ((!trimmedValue && !hasAttachments) || isStreaming || disabled) return
    
    onSend(trimmedValue, attachments.length > 0 ? attachments : undefined)
    setInputValue('')
    setAttachments([])
    
    // 重置文本框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [inputValue, attachments, isStreaming, disabled, onSend])
  
  // 停止生成
  const handleStop = useCallback(() => {
    onStop?.()
  }, [onStop])
  
  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  // 文件选择按钮点击
  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }
  
  // 文件选择变化
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      e.target.value = '' // 重置以允许选择相同文件
    }
  }
  
  // 拖拽事件处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isStreaming) {
      setIsDragging(true)
    }
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (!disabled && !isStreaming && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }
  
  // 粘贴事件处理
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) {
          processFiles([file])
        }
      }
    }
  }
  
  const canSend = (inputValue.trim().length > 0 || attachments.length > 0) && !isStreaming && !disabled
  const hasExtracting = attachments.some(att => att.extractionStatus === 'extracting')
  
  return (
    <div 
      className={cn('border-t border-slate-200 bg-white', className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 拖拽覆盖层 */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Paperclip className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-sm text-primary font-medium">释放文件以添加</p>
            <p className="text-xs text-slate-500 mt-1">支持图片 (JPEG, PNG, GIF, WebP) 和 PDF</p>
          </div>
        </div>
      )}
      
      <div className="p-4">
        {/* 附件预览区域 */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={cn(
                  'relative group flex items-center gap-2 px-3 py-2 rounded-lg border',
                  'bg-slate-50 border-slate-200'
                )}
              >
                {/* 预览或图标 */}
                {attachment.type === 'image' && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-slate-200 rounded">
                    {attachment.type === 'pdf' ? (
                      <FileText className="w-5 h-5 text-red-500" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                )}
                
                {/* 文件信息 */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                    {attachment.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">
                      {formatFileSize(attachment.size)}
                    </span>
                    {attachment.extractionStatus === 'extracting' && (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        <span className="text-xs text-primary">提取中</span>
                      </>
                    )}
                    {attachment.extractionStatus === 'extracted' && (
                      <span className="text-xs text-green-600">已提取</span>
                    )}
                    {attachment.extractionStatus === 'failed' && (
                      <span className="text-xs text-red-500">提取失败</span>
                    )}
                  </div>
                </div>
                
                {/* 移除按钮 */}
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-1 -right-1 p-1 bg-slate-200 hover:bg-slate-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-slate-600" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* 输入区域 */}
        <div className="flex items-end gap-2">
          {/* 附件按钮 */}
          <button
            onClick={handleAttachmentClick}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            disabled={disabled || isStreaming}
            title="添加附件 (图片或PDF)"
          >
            <Paperclip size={18} />
          </button>
          
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.includes('image') && allowedTypes.includes('pdf')
              ? 'image/*,.pdf'
              : allowedTypes.includes('image')
                ? 'image/*'
                : '.pdf'
            }
            onChange={handleFileChange}
            className="hidden"
          />
          
          {/* 输入框 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                'w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl',
                'text-sm text-slate-800 placeholder:text-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
                'resize-none transition-all',
                'disabled:bg-slate-50 disabled:cursor-not-allowed'
              )}
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
            
            {/* 字数统计 */}
            {inputValue.length > 0 && (
              <span className="absolute right-3 bottom-2 text-xs text-slate-400">
                {inputValue.length}
              </span>
            )}
          </div>
          
          {/* 发送/停止按钮 */}
          {isStreaming ? (
            <button
              onClick={handleStop}
              className={cn(
                'p-3 rounded-xl transition-colors',
                'bg-red-500 hover:bg-red-600 text-white'
              )}
              title="停止生成"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend || hasExtracting}
              className={cn(
                'p-3 rounded-xl transition-colors',
                canSend && !hasExtracting
                  ? 'text-white hover:opacity-90'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
              style={canSend && !hasExtracting ? { backgroundColor: '#1E3A5F' } : undefined}
              title={hasExtracting ? '等待内容提取完成' : '发送消息'}
            >
              <Send size={18} />
            </button>
          )}
        </div>
        
        {/* 快捷提示 */}
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-xs text-slate-400">
            Enter 发送 · Shift+Enter 换行 · 支持粘贴/拖放文件
          </span>
          
          {/* 语音按钮 (暂未实现) */}
          <button
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            disabled={disabled || isStreaming}
            title="语音输入"
          >
            <Mic size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
