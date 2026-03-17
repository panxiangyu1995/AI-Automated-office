import { readFileSync } from 'node:fs'

const summaryPath = new URL('../../coverage/coverage-summary.json', import.meta.url)

const raw = readFileSync(summaryPath, 'utf-8')
const data = JSON.parse(raw)
const total = data.total || {}

const thresholds = {
  lines: 5,
  statements: 5,
  functions: 5,
  branches: 2,
}

const failures = Object.entries(thresholds).filter(([key, threshold]) => {
  const metric = total[key]
  if (!metric || typeof metric.pct !== 'number') {
    return true
  }
  return metric.pct < threshold
})

if (failures.length > 0) {
  const message = failures
    .map(([key, threshold]) => `${key} ${total[key]?.pct ?? 0}% < ${threshold}%`)
    .join(', ')
  throw new Error(`Coverage threshold failed: ${message}`)
}
