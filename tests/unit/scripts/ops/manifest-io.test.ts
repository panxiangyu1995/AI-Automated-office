import { execFileSync } from 'node:child_process'

import { describe, expect, it } from 'vitest'

import {
  IRON_LAW_DOCUMENT_PATHS,
  ROOT_DIR,
  TASK_MANIFEST_PATHS,
  readIronLawDocument,
  readTaskManifest,
} from '../../../../scripts/ops/manifest-io.mjs'

describe('manifest-io', () => {
  it('reads root task manifests through explicit utf8 helpers', () => {
    const primaryManifest = readTaskManifest('primary')
    const correctiveManifest = readTaskManifest('courseCorrection')

    expect(primaryManifest.version).toBe('2.0.0')
    expect(primaryManifest.tasks).toHaveLength(104)
    expect(primaryManifest.sourceOfTruth).toBe('openspec/changes/agent-platform-course-correction')

    expect(correctiveManifest.version).toBe('1.0.0')
    expect(correctiveManifest.tasks).toHaveLength(1)
    expect(correctiveManifest.tasks[0].passes).toBe(true)
  })

  it('reads iron-law documents through explicit utf8 helpers', () => {
    const prd = readIronLawDocument('prd')
    const architecture = readIronLawDocument('architecture')
    const ux = readIronLawDocument('ux')
    const epics = readIronLawDocument('epics')

    expect(prd.length).toBeGreaterThan(1000)
    expect(architecture.length).toBeGreaterThan(1000)
    expect(ux.length).toBeGreaterThan(1000)
    expect(epics.length).toBeGreaterThan(1000)

    expect(prd).toContain('Agent')
    expect(architecture).toContain('Layer')
    expect(ux).toContain('VSCode')
    expect(epics).toContain('Epic')
  })

  it('keeps manifest and iron-law path registries available for reuse', () => {
    expect(TASK_MANIFEST_PATHS.primary).toContain('task.json')
    expect(TASK_MANIFEST_PATHS.courseCorrection).toContain('task-course-correction.json')
    expect(IRON_LAW_DOCUMENT_PATHS.prd).toContain('_bmad-output')
    expect(IRON_LAW_DOCUMENT_PATHS.correctiveGovernance).toContain('legacy-governance.md')
  })

  it('validates manifests from the shared script entry point', () => {
    const output = execFileSync(process.execPath, ['scripts/ops/validate-agent-manifests.mjs'], {
      cwd: ROOT_DIR,
      encoding: 'utf8',
    })
    const summary = JSON.parse(output) as {
      taskManifests: Array<{ name: string; taskCount: number }>
      ironLawDocuments: Array<{ name: string; length: number }>
    }

    expect(summary.taskManifests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'primary', taskCount: 104 }),
        expect.objectContaining({ name: 'courseCorrection', taskCount: 1 }),
      ])
    )
    expect(summary.ironLawDocuments).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'prd' })])
    )
  })
})
