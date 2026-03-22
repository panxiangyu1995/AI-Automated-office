import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, Lock, Pencil, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUIStore } from '@/stores/uiStore'
import { useEditorStore } from '@/stores/editorStore'
import type { WorkbenchPageContext } from '@/components/common'
import { loadMarkdownDocument, saveMarkdownDocument } from '../storage/textDocumentStorage'

interface BuiltinMarkdownEditorPageProps {
  context: WorkbenchPageContext
}

interface MarkdownTable {
  header: string[]
  rows: string[][]
  startLine: number
  endLine: number
}

function getDocumentId(context: WorkbenchPageContext) {
  const paramId = context.params.docId?.trim()
  return paramId && paramId.length > 0 ? decodeURIComponent(paramId) : 'untitled.md'
}

function getDocumentTitle(docId: string) {
  return docId.split('/').filter(Boolean).at(-1) ?? docId
}

function parseTableLine(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isDelimiterLine(line: string) {
  const cells = parseTableLine(line)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function findFirstMarkdownTable(content: string): MarkdownTable | null {
  const lines = content.split('\n')

  for (let i = 0; i < lines.length - 1; i += 1) {
    if (!lines[i].includes('|') || !lines[i + 1].includes('|')) {
      continue
    }
    if (!isDelimiterLine(lines[i + 1])) {
      continue
    }

    const header = parseTableLine(lines[i])
    const rows: string[][] = []
    let endLine = i + 1
    for (let rowIndex = i + 2; rowIndex < lines.length; rowIndex += 1) {
      if (!lines[rowIndex].includes('|')) {
        break
      }
      rows.push(parseTableLine(lines[rowIndex]))
      endLine = rowIndex
    }

    return {
      header,
      rows,
      startLine: i,
      endLine,
    }
  }

  return null
}

function serializeTableLine(cells: string[]) {
  return `| ${cells.join(' | ')} |`
}

function writeBackMarkdownTable(content: string, table: MarkdownTable): string {
  const lines = content.split('\n')
  const nextLines = [...lines]
  const delimiter = `| ${table.header.map(() => '---').join(' | ')} |`
  const serialized = [serializeTableLine(table.header), delimiter, ...table.rows.map(serializeTableLine)]
  nextLines.splice(table.startLine, table.endLine - table.startLine + 1, ...serialized)
  return nextLines.join('\n')
}

function renderPreview(content: string) {
  const lines = content.split('\n')
  const table = findFirstMarkdownTable(content)
  const output: JSX.Element[] = []

  lines.forEach((line, index) => {
    if (table && index >= table.startLine && index <= table.endLine) {
      if (index === table.startLine) {
        output.push(
          <div key={`table-${index}`} className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  {table.header.map((cell, cellIndex) => (
                    <th key={`header-${cellIndex}`} className="border border-slate-200 px-3 py-2 text-left font-semibold">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className="bg-white">
                    {row.map((cell, cellIndex) => (
                      <td key={`cell-${rowIndex}-${cellIndex}`} className="border border-slate-200 px-3 py-2 text-slate-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      return
    }

    if (line.startsWith('# ')) {
      output.push(
        <h1 key={`h1-${index}`} className="text-2xl font-semibold text-slate-900">
          {line.slice(2)}
        </h1>
      )
      return
    }

    if (line.startsWith('## ')) {
      output.push(
        <h2 key={`h2-${index}`} className="text-xl font-semibold text-slate-900">
          {line.slice(3)}
        </h2>
      )
      return
    }

    if (line.startsWith('- ')) {
      output.push(
        <li key={`li-${index}`} className="ml-5 list-disc text-slate-700">
          {line.slice(2)}
        </li>
      )
      return
    }

    if (line.trim().length === 0) {
      output.push(<div key={`spacer-${index}`} className="h-2" />)
      return
    }

    output.push(
      <p key={`p-${index}`} className="text-slate-700">
        {line}
      </p>
    )
  })

  return output
}

export function BuiltinMarkdownEditorPage({ context }: BuiltinMarkdownEditorPageProps) {
  const navigate = useNavigate()
  const setEditorSidebarEntries = useUIStore((state) => state.setEditorSidebarEntries)
  const setActiveDocument = useEditorStore((state) => state.setActiveDocument)
  const clearActiveDocument = useEditorStore((state) => state.clearActiveDocument)

  const documentId = useMemo(() => getDocumentId(context), [context])
  const documentTitle = useMemo(() => getDocumentTitle(documentId), [documentId])
  const readonly = context.searchParams.get('mode') === 'readonly'

  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'split' | 'preview'>('split')

  useEffect(() => {
    const snapshot = loadMarkdownDocument(documentId)
    setContent(snapshot.content)
    setSavedContent(snapshot.content)
    setLastSavedAt(snapshot.updatedAt)
    setEditorSidebarEntries([
      {
        id: `markdown:${documentId}`,
        label: documentTitle,
        description: documentId,
        kind: 'editor',
        target: {
          path: `/editor/${encodeURIComponent(documentId)}`,
          mode: 'editor',
          activityItem: 'knowledge',
        },
      },
    ])
  }, [documentId, documentTitle, setEditorSidebarEntries])

  const isDirty = content !== savedContent
  const parsedTable = useMemo(() => findFirstMarkdownTable(content), [content])

  useEffect(() => {
    setActiveDocument({
      id: documentId,
      title: documentTitle,
      isDirty,
      isSaving,
      lastSavedAt,
    })
  }, [documentId, documentTitle, isDirty, isSaving, lastSavedAt, setActiveDocument])

  useEffect(() => {
    return () => {
      clearActiveDocument()
    }
  }, [clearActiveDocument])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [isDirty])

  const handleSave = useCallback(() => {
    if (readonly || !isDirty) {
      return
    }

    setIsSaving(true)
    try {
      const snapshot = saveMarkdownDocument(documentId, content)
      setSavedContent(snapshot.content)
      setLastSavedAt(snapshot.updatedAt)
    } finally {
      setIsSaving(false)
    }
  }, [content, documentId, isDirty, readonly])

  const handleClose = useCallback(() => {
    if (isDirty) {
      const shouldClose = window.confirm('Current markdown has unsaved changes. Close anyway?')
      if (!shouldClose) {
        return
      }
    }

    navigate('/')
  }, [isDirty, navigate])

  const updateTableCell = useCallback(
    (rowIndex: number, cellIndex: number, value: string) => {
      if (readonly || !parsedTable) {
        return
      }

      const nextRows = parsedTable.rows.map((row) => [...row])
      if (!nextRows[rowIndex]) {
        return
      }
      nextRows[rowIndex][cellIndex] = value
      const nextContent = writeBackMarkdownTable(content, { ...parsedTable, rows: nextRows })
      setContent(nextContent)
    },
    [content, parsedTable, readonly]
  )

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate text-sm font-semibold text-slate-900">{documentTitle}</h2>
          <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {readonly ? 'Read-only' : 'Editable'}
          </span>
          {isDirty && (
            <span className="flex items-center gap-1 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPreviewMode((mode) => (mode === 'split' ? 'preview' : 'split'))}>
            <Eye className="mr-1 h-4 w-4" />
            {previewMode === 'split' ? 'Preview Only' : 'Split View'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/editor/${encodeURIComponent(documentId)}?mode=${readonly ? 'edit' : 'readonly'}`)}
          >
            {readonly ? <Pencil className="mr-1 h-4 w-4" /> : <Lock className="mr-1 h-4 w-4" />}
            {readonly ? 'Switch to Edit' : 'Switch to Read-only'}
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || readonly || isSaving}>
            <Save className="mr-1 h-4 w-4" />
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            <X className="mr-1 h-4 w-4" />
            Close
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 p-4">
        {previewMode === 'split' && (
          <div className="flex h-full w-1/2 flex-col">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Markdown Source</p>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              readOnly={readonly}
              placeholder="# Heading"
              className="h-full min-h-full resize-none border-slate-300 bg-white font-mono text-sm leading-6 text-slate-800"
              aria-label="Built-in markdown editor"
            />
          </div>
        )}

        <div className={previewMode === 'split' ? 'w-1/2' : 'w-full'}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
          <div className="h-full overflow-auto rounded-md border border-slate-200 bg-white p-4">
            <div className="space-y-3">{renderPreview(content)}</div>

            {parsedTable && (
              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Table Cells</p>
                <div className="grid gap-2">
                  {parsedTable.rows.map((row, rowIndex) => (
                    <div key={`editor-row-${rowIndex}`} className="grid grid-cols-3 gap-2">
                      {row.map((cell, cellIndex) => (
                        <input
                          key={`editor-cell-${rowIndex}-${cellIndex}`}
                          aria-label={`table-cell-${rowIndex}-${cellIndex}`}
                          className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-800"
                          value={cell}
                          readOnly={readonly}
                          onChange={(event) => updateTableCell(rowIndex, cellIndex, event.target.value)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

