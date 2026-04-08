/**
 * Markdown Editor Component
 * 
 * Story 22.1 - Editor RichText/Markdown Support
 * FR1201-FR1212
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Bold, Italic, Code, Link, List, ListOrdered, Quote, Heading, Eye, Edit, SplitSquareHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface MarkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minHeight?: string
  viewMode?: 'edit' | 'preview' | 'split'
}

interface MarkdownToolbarButton {
  icon: React.ReactNode
  label: string
  before: string
  after?: string
  placeholder?: string
  shortcut?: string
}

const defaultToolbarButtons: MarkdownToolbarButton[] = [
  { icon: <Bold size={16} />, label: '粗体', before: '**', after: '**', placeholder: '粗体文本', shortcut: 'Ctrl+B' },
  { icon: <Italic size={16} />, label: '斜体', before: '*', after: '*', placeholder: '斜体文本', shortcut: 'Ctrl+I' },
  { icon: <Code size={16} />, label: '代码', before: '`', after: '`', placeholder: '代码' },
  { icon: <Link size={16} />, label: '链接', before: '[', after: '](url)', placeholder: '链接文本' },
  { icon: <Heading size={16} />, label: '标题', before: '## ', placeholder: '标题' },
  { icon: <List size={16} />, label: '无序列表', before: '- ', placeholder: '列表项' },
  { icon: <ListOrdered size={16} />, label: '有序列表', before: '1. ', placeholder: '列表项' },
  { icon: <Quote size={16} />, label: '引用', before: '> ', placeholder: '引用文本' },
]

// Simple markdown to HTML converter
function parseMarkdownToHtml(markdown: string): string {
  const html = markdown
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]+?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
  
  return `<p>${html}</p>`
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value = '',
  onChange,
  placeholder = '在此使用 Markdown 编写...',
  disabled = false,
  className,
  minHeight = '200px',
  viewMode: initialViewMode = 'split',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>(initialViewMode)
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onChange?.(newValue)
  }, [onChange])

  const handleToolbarClick = useCallback((button: MarkdownToolbarButton) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = localValue.substring(start, end) || button.placeholder || ''
    
    const newText = localValue.substring(0, start) 
      + button.before 
      + selectedText 
      + (button.after || '') 
      + localValue.substring(end)
    
    setLocalValue(newText)
    onChange?.(newText)

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + button.before.length + selectedText.length + (button.after?.length || 0)
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [localValue, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          handleToolbarClick(defaultToolbarButtons[0]) // Bold
          break
        case 'i':
          e.preventDefault()
          handleToolbarClick(defaultToolbarButtons[1]) // Italic
          break
      }
    }
    
    // Tab handling for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newText = localValue.substring(0, start) + '  ' + localValue.substring(end)
      setLocalValue(newText)
      onChange?.(newText)
      
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2)
      }, 0)
    }
  }, [handleToolbarClick, localValue, onChange])

  const previewHtml = useMemo(() => parseMarkdownToHtml(localValue), [localValue])

  const toolbarButtons = useMemo(() => defaultToolbarButtons.map((button) => (
    <Tooltip key={button.label} delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToolbarClick(button)}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          {button.icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{button.label}</p>
        {button.shortcut && <p className="text-xs text-muted-foreground">{button.shortcut}</p>}
      </TooltipContent>
    </Tooltip>
  )), [disabled, handleToolbarClick])

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-1">
          {toolbarButtons}
        </div>
        <div className="flex items-center gap-1 border rounded-md p-0.5 bg-background">
          <Button
            variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('edit')}
            className="h-7 px-2"
          >
            <Edit size={14} className="mr-1" />
            编辑
          </Button>
          <Button
            variant={viewMode === 'split' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('split')}
            className="h-7 px-2"
          >
            <SplitSquareHorizontal size={14} className="mr-1" />
            分屏
          </Button>
          <Button
            variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('preview')}
            className="h-7 px-2"
          >
            <Eye size={14} className="mr-1" />
            预览
          </Button>
        </div>
      </div>

      <div className="flex">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={cn('flex-1', viewMode === 'split' && 'border-r')}>
            <textarea
              ref={textareaRef}
              value={localValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'w-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 font-mono text-sm',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{ minHeight }}
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={cn(
              'flex-1 p-4 overflow-auto',
              'prose prose-sm dark:prose-invert max-w-none'
            )}
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>
    </div>
  )
}
