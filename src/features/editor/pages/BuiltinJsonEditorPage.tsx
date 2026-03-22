import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Braces, CheckCircle2, Lock, Pencil, Save, Wand2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUIStore } from '@/stores/uiStore'
import { useEditorStore } from '@/stores/editorStore'
import type { WorkbenchPageContext } from '@/components/common'
import { loadJsonDocument, saveJsonDocument } from '../storage/textDocumentStorage'

interface BuiltinJsonEditorPageProps {
  context: WorkbenchPageContext
}

function getDocumentId(context: WorkbenchPageContext) {
  const paramId = context.params.docId?.trim()
  return paramId && paramId.length > 0 ? decodeURIComponent(paramId) : 'untitled.json'
}

function getDocumentTitle(docId: string) {
  return docId.split('/').filter(Boolean).at(-1) ?? docId
}

function normalizeInitialJsonContent(content: string) {
  if (content.trim().length === 0) {
    return '{\n  \n}'
  }
  return content
}

function parseJsonSafely(content: string): { value: unknown | null; error: string | null } {
  try {
    return { value: JSON.parse(content), error: null }
  } catch (error) {
    return { value: null, error: error instanceof Error ? error.message : 'Invalid JSON content' }
  }
}

function isTemplateOrConfigFile(documentId: string) {
  return /template|config/i.test(documentId)
}

export function BuiltinJsonEditorPage({ context }: BuiltinJsonEditorPageProps) {
  const navigate = useNavigate()
  const setEditorSidebarEntries = useUIStore((state) => state.setEditorSidebarEntries)
  const setActiveDocument = useEditorStore((state) => state.setActiveDocument)
  const clearActiveDocument = useEditorStore((state) => state.clearActiveDocument)

  const documentId = useMemo(() => getDocumentId(context), [context])
  const documentTitle = useMemo(() => getDocumentTitle(documentId), [documentId])
  const readonly = context.searchParams.get('mode') === 'readonly'
  const inTemplateConfigFlow = isTemplateOrConfigFile(documentId)

  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const snapshot = loadJsonDocument(documentId)
    const normalized = normalizeInitialJsonContent(snapshot.content)
    setContent(normalized)
    setSavedContent(normalized)
    setLastSavedAt(snapshot.updatedAt)
    setEditorSidebarEntries([
      {
        id: `json:${documentId}`,
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
  const parseResult = useMemo(() => parseJsonSafely(content), [content])
  const topLevelKeys = useMemo(() => {
    if (!parseResult.value || typeof parseResult.value !== 'object' || Array.isArray(parseResult.value)) {
      return []
    }
    return Object.keys(parseResult.value as Record<string, unknown>)
  }, [parseResult.value])

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
    if (readonly || !isDirty || parseResult.error) {
      return
    }

    setIsSaving(true)
    try {
      const snapshot = saveJsonDocument(documentId, content)
      setSavedContent(snapshot.content)
      setLastSavedAt(snapshot.updatedAt)
    } finally {
      setIsSaving(false)
    }
  }, [content, documentId, isDirty, parseResult.error, readonly])

  const handleFormat = useCallback(() => {
    if (readonly || parseResult.error || parseResult.value === null) {
      return
    }
    setContent(JSON.stringify(parseResult.value, null, 2))
  }, [parseResult.error, parseResult.value, readonly])

  const handleClose = useCallback(() => {
    if (isDirty) {
      const shouldClose = window.confirm('Current JSON has unsaved changes. Close anyway?')
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
          {parseResult.error ? (
            <span className="flex items-center gap-1 text-xs text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Invalid JSON
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Valid JSON
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleFormat} disabled={readonly || !!parseResult.error}>
            <Wand2 className="mr-1 h-4 w-4" />
            Format JSON
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
          <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || readonly || isSaving || !!parseResult.error}>
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
        <div className="flex h-full w-2/3 flex-col">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">JSON Source</p>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            readOnly={readonly}
            placeholder="{ }"
            className="h-full min-h-full resize-none border-slate-300 bg-white font-mono text-sm leading-6 text-slate-800"
            aria-label="Built-in json editor"
          />
        </div>

        <div className="w-1/3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Parsed View</p>
          <div className="h-full overflow-auto rounded-md border border-slate-200 bg-white p-4">
            {parseResult.error ? (
              <p className="text-sm text-red-700">{parseResult.error}</p>
            ) : (
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Braces className="h-4 w-4 text-slate-500" />
                  <span>Top-level keys: {topLevelKeys.length}</span>
                </div>
                {topLevelKeys.length > 0 && (
                  <ul className="ml-5 list-disc space-y-1">
                    {topLevelKeys.map((key) => (
                      <li key={key}>{key}</li>
                    ))}
                  </ul>
                )}
                {inTemplateConfigFlow && (
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                    Template/Config workflow mode is active for this file. Validation and key summary are ready for
                    downstream template/config processing.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

