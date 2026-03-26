import { existsSync } from 'node:fs'

import {
  IRON_LAW_DOCUMENT_PATHS,
  TASK_MANIFEST_PATHS,
  readIronLawDocument,
  readTaskManifest,
  readUtf8Json,
} from './manifest-io.mjs'

const validateTaskManifest = (name, filePath) => {
  const manifest = readTaskManifest(name)

  if (typeof manifest !== 'object' || manifest === null) {
    throw new Error(`Task manifest "${name}" did not parse into an object`)
  }

  if ('tasks' in manifest && !Array.isArray(manifest.tasks)) {
    throw new Error(`Task manifest "${name}" has a non-array "tasks" field`)
  }

  if ('sourceOfTruth' in manifest) {
    const changePath = `${process.cwd()}\\${String(manifest.sourceOfTruth).replaceAll('/', '\\')}`
    if (!existsSync(changePath)) {
      throw new Error(`Task manifest "${name}" points to a missing sourceOfTruth: ${manifest.sourceOfTruth}`)
    }
  }

  return {
    name,
    filePath,
    taskCount: Array.isArray(manifest.tasks) ? manifest.tasks.length : 0,
  }
}

const validateIronLawDocument = (name, filePath) => {
  const content = readIronLawDocument(name)

  if (!content.trim()) {
    throw new Error(`Iron-law document "${name}" is empty`)
  }

  return {
    name,
    filePath,
    length: content.length,
  }
}

const taskResults = Object.entries(TASK_MANIFEST_PATHS).map(([name, filePath]) =>
  validateTaskManifest(name, filePath)
)
const documentResults = Object.entries(IRON_LAW_DOCUMENT_PATHS).map(([name, filePath]) =>
  validateIronLawDocument(name, filePath)
)

const summary = {
  taskManifests: taskResults.map(({ name, taskCount }) => ({ name, taskCount })),
  ironLawDocuments: documentResults.map(({ name, length }) => ({ name, length })),
}

console.log(JSON.stringify(summary, null, 2))
