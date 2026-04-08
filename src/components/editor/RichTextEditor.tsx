/**
 * Rich Text Editor Component
 * 
 * Story 22.1 - Editor RichText/Markdown Support
 * FR1201-FR1212
 */

import React, { useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Bold, Italic, Underline, Strikethrough, Code, Link, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Undo, Redo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minHeight?: string
}

interface ToolbarButton {
  icon: React.ReactNode
  label: string
  action: string
  shortcut?: string
}

const defaultToolbarButtons: ToolbarButton[][] = [
  [
    { icon: <Undo size={16} />, label: '撤销', action: 'undo', shortcut: 'Ctrl+Z' },
    { icon: <Redo size={16} />, label: '重做', action: 'redo', shortcut: 'Ctrl+Y' },
  ],
  [
    { icon: <Heading1 size={16} />, label: '标题1', action: 'h1' },
    { icon: <Heading2 size={16} />, label: '标题2', action: 'h2' },
    { icon: <Heading3 size={16} />, label: '标题3', action: 'h3' },
  ],
  [
    { icon: <Bold size={16} />, label: '粗体', action: 'bold', shortcut: 'Ctrl+B' },
    { icon: <Italic size={16} />, label: '斜体', action: 'italic', shortcut: 'Ctrl+I' },
    { icon: <Underline size={16} />, label: '下划线', action: 'underline', shortcut: 'Ctrl+U' },
    { icon: <Strikethrough size={16} />, label: '删除线', action: 'strikeThrough' },
    { icon: <Code size={16} />, label: '代码', action: 'code' },
  ],
  [
    { icon: <List size={16} />, label: '无序列表', action: 'unorderedList' },
    { icon: <ListOrdered size={16} />, label: '有序列表', action: 'orderedList' },
    { icon: <Quote size={16} />, label: '引用', action: 'blockquote' },
    { icon: <Link size={16} />, label: '链接', action: 'link' },
  ],
]

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = '在此输入内容...',
  disabled = false,
  className,
  minHeight = '200px',
}) => {
  const editorRef = React.useRef<HTMLDivElement>(null)

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    onChange?.(editorRef.current?.innerHTML || '')
  }, [onChange])

  const handleInput = useCallback(() => {
    onChange?.(editorRef.current?.innerHTML || '')
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          execCommand('bold')
          break
        case 'i':
          e.preventDefault()
          execCommand('italic')
          break
        case 'u':
          e.preventDefault()
          execCommand('underline')
          break
        case 'z':
          e.preventDefault()
          execCommand(e.shiftKey ? 'redo' : 'undo')
          break
        case 'y':
          e.preventDefault()
          execCommand('redo')
          break
      }
    }
  }, [execCommand])

  const insertLink = useCallback(() => {
    const url = window.prompt('请输入链接地址:')
    if (url) {
      execCommand('createLink', url)
    }
  }, [execCommand])

  const toolbarButtonGroups = useMemo(() => defaultToolbarButtons.map((group, groupIndex) => (
    <div key={groupIndex} className="flex items-center gap-1">
      {group.map((button) => (
        <Tooltip key={button.action} delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (button.action === 'link') {
                  insertLink()
                } else {
                  execCommand(button.action)
                }
              }}
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
      ))}
      {groupIndex < defaultToolbarButtons.length - 1 && (
        <div className="h-6 w-px bg-border mx-1" />
      )}
    </div>
  )), [disabled, execCommand, insertLink])

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <div className="flex items-center flex-wrap gap-1 p-2 border-b bg-muted/30">
        {toolbarButtonGroups}
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(
          'p-4 focus:outline-none focus:ring-2 focus:ring-ring/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ minHeight }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
      `}</style>
    </div>
  )
}
