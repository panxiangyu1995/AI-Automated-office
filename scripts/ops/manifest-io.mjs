import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))

export const ROOT_DIR = resolve(scriptDir, '..', '..')

export const TASK_MANIFEST_PATHS = Object.freeze({
  primary: resolve(ROOT_DIR, 'task.json'),
  courseCorrection: resolve(ROOT_DIR, 'task-course-correction.json'),
  archived: resolve(ROOT_DIR, 'task-archived.json'),
  archived1: resolve(ROOT_DIR, 'task-archived-1.json'),
  phase2RuntimeMvp: resolve(ROOT_DIR, 'task-phase2-agent-runtime-mvp.json'),
  batch2: resolve(ROOT_DIR, 'task-batch-2.json'),
})

export const IRON_LAW_DOCUMENT_PATHS = Object.freeze({
  prd: resolve(ROOT_DIR, '_bmad-output', 'planning-artifacts', 'prd.md'),
  architecture: resolve(ROOT_DIR, '_bmad-output', 'planning-artifacts', 'architecture.md'),
  ux: resolve(ROOT_DIR, '_bmad-output', 'planning-artifacts', 'ux-design-specification.md'),
  epics: resolve(ROOT_DIR, '_bmad-output', 'planning-artifacts', 'epics.md'),
  correctiveGovernance: resolve(
    ROOT_DIR,
    'openspec',
    'changes',
    'agent-platform-course-correction',
    'legacy-governance.md'
  ),
})

export function readUtf8Text(filePath) {
  return readFileSync(filePath, { encoding: 'utf8' })
}

export function readUtf8Json(filePath) {
  return JSON.parse(readUtf8Text(filePath))
}

export function readTaskManifest(name = 'primary') {
  const manifestPath = TASK_MANIFEST_PATHS[name]
  if (!manifestPath) {
    throw new Error(`Unknown task manifest: ${name}`)
  }

  return readUtf8Json(manifestPath)
}

export function readIronLawDocument(name) {
  const documentPath = IRON_LAW_DOCUMENT_PATHS[name]
  if (!documentPath) {
    throw new Error(`Unknown iron-law document: ${name}`)
  }

  return readUtf8Text(documentPath)
}
