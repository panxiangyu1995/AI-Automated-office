const TEXT_STORAGE_PREFIX = 'editor:text:'
const TEXT_STORAGE_INDEX_KEY = 'editor:text:index'
const MARKDOWN_STORAGE_PREFIX = 'editor:markdown:'
const MARKDOWN_STORAGE_INDEX_KEY = 'editor:markdown:index'

export interface TextDocumentSnapshot {
  id: string
  content: string
  updatedAt: string
}

interface StoredTextDocument {
  content: string
  updatedAt: string
}

function readDocument(storagePrefix: string, id: string): StoredTextDocument | null {
  const raw = localStorage.getItem(`${storagePrefix}${id}`)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as StoredTextDocument
  } catch {
    return null
  }
}

function writeDocument(storagePrefix: string, id: string, payload: StoredTextDocument) {
  localStorage.setItem(`${storagePrefix}${id}`, JSON.stringify(payload))
}

function readIndex(storageIndexKey: string): string[] {
  const raw = localStorage.getItem(storageIndexKey)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeIndex(storageIndexKey: string, next: string[]) {
  localStorage.setItem(storageIndexKey, JSON.stringify(next))
}

function loadDocument(storagePrefix: string, id: string): TextDocumentSnapshot {
  const stored = readDocument(storagePrefix, id)
  if (!stored) {
    return {
      id,
      content: '',
      updatedAt: new Date(0).toISOString(),
    }
  }

  return {
    id,
    content: stored.content,
    updatedAt: stored.updatedAt,
  }
}

function saveDocument(storagePrefix: string, storageIndexKey: string, id: string, content: string): TextDocumentSnapshot {
  const updatedAt = new Date().toISOString()
  writeDocument(storagePrefix, id, { content, updatedAt })

  const index = readIndex(storageIndexKey)
  if (!index.includes(id)) {
    writeIndex(storageIndexKey, [id, ...index])
  }

  return {
    id,
    content,
    updatedAt,
  }
}

export function loadTextDocument(id: string): TextDocumentSnapshot {
  return loadDocument(TEXT_STORAGE_PREFIX, id)
}

export function saveTextDocument(id: string, content: string): TextDocumentSnapshot {
  return saveDocument(TEXT_STORAGE_PREFIX, TEXT_STORAGE_INDEX_KEY, id, content)
}

export function listTextDocuments(): TextDocumentSnapshot[] {
  return readIndex(TEXT_STORAGE_INDEX_KEY).map((id) => loadTextDocument(id))
}

export function loadMarkdownDocument(id: string): TextDocumentSnapshot {
  return loadDocument(MARKDOWN_STORAGE_PREFIX, id)
}

export function saveMarkdownDocument(id: string, content: string): TextDocumentSnapshot {
  return saveDocument(MARKDOWN_STORAGE_PREFIX, MARKDOWN_STORAGE_INDEX_KEY, id, content)
}

export function listMarkdownDocuments(): TextDocumentSnapshot[] {
  return readIndex(MARKDOWN_STORAGE_INDEX_KEY).map((id) => loadMarkdownDocument(id))
}
