import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Lock, Pencil, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUIStore } from '@/stores/uiStore'
import { useEditorStore } from '@/stores/editorStore'
import type { WorkbenchPageContext } from '@/components/common'
import { loadTextDocument, saveTextDocument } from '../storage/textDocumentStorage'

interface BuiltinTextEditorPageProps {
  context: WorkbenchPageContext
}

function getDocumentId(context: WorkbenchPageContext) {
  const paramId = context.params.docId?.trim()
  return paramId && paramId.length > 0 ? decodeURIComponent(paramId) : 'untitled.txt'
}

function getDocumentTitle(docId: string) {
  return docId.split('/').filter(Boolean).at(-1) ?? docId
}

export function BuiltinTextEditorPage({ context }: BuiltinTextEditorPageProps) {
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

  useEffect(() => {
    const snapshot = loadTextDocument(documentId)
    setContent(snapshot.content)
    setSavedContent(snapshot.content)
    setLastSavedAt(snapshot.updatedAt)
    setEditorSidebarEntries([
      {
        id: `text:${documentId}`,
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
      const snapshot = saveTextDocument(documentId, content)
      setSavedContent(snapshot.content)
      setLastSavedAt(snapshot.updatedAt)
    } finally {
      setIsSaving(false)
    }
  }, [content, documentId, isDirty, readonly])

  const handleClose = useCallback(() => {
    if (isDirty) {
      const shouldClose = window.confirm('Current text has unsaved changes. Close anyway?')
      if (!shouldClose) {
        return
      }
    }

    navigate('/')
  }, [isDirty, navigate])

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

      <div className="flex-1 p-4">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          readOnly={readonly}
          placeholder="Type plain text content here..."
          className="h-full min-h-full resize-none border-slate-300 bg-white font-mono text-sm leading-6 text-slate-800"
          aria-label="Built-in text editor"
        />
      </div>
    </div>
  )
}

