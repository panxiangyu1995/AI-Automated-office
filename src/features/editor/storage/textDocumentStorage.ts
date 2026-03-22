const STORAGE_PREFIX = 'editor:text:'
const STORAGE_INDEX_KEY = 'editor:text:index'

export interface TextDocumentSnapshot {
  id: string
  content: string
  updatedAt: string
}

interface StoredTextDocument {
  content: string
  updatedAt: string
}

function readDocument(id: string): StoredTextDocument | null {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as StoredTextDocument
  } catch {
    return null
  }
}

function writeDocument(id: string, payload: StoredTextDocument) {
  localStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(payload))
}

function readIndex(): string[] {
  const raw = localStorage.getItem(STORAGE_INDEX_KEY)
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

function writeIndex(next: string[]) {
  localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(next))
}

export function loadTextDocument(id: string): TextDocumentSnapshot {
  const stored = readDocument(id)
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

export function saveTextDocument(id: string, content: string): TextDocumentSnapshot {
  const updatedAt = new Date().toISOString()
  writeDocument(id, { content, updatedAt })

  const index = readIndex()
  if (!index.includes(id)) {
    writeIndex([id, ...index])
  }

  return {
    id,
    content,
    updatedAt,
  }
}

export function listTextDocuments(): TextDocumentSnapshot[] {
  return readIndex().map((id) => loadTextDocument(id))
}

