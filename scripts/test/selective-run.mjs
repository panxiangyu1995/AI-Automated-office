import { execSync, spawnSync } from 'node:child_process'

const run = (command) => {
  const result = spawnSync(command, { shell: true, stdio: 'inherit' })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const detectChanges = () => {
  try {
    const output = execSync('git diff --name-only --diff-filter=ACMRTUXB HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
    if (!output) {
      return []
    }
    return output.split('\n').filter(Boolean)
  } catch {
    return null
  }
}

const changedFiles = detectChanges()
const codeChange =
  changedFiles === null
    ? true
    : changedFiles.some(
        (file) =>
          file.startsWith('src/') ||
          file.startsWith('tests/') ||
          file.startsWith('scripts/') ||
          file === 'package.json' ||
          file === 'playwright.config.ts' ||
          file === 'vitest.config.ts'
      )

run('pnpm vitest run --config vitest.config.ts tests/unit/smoke tests/integration/smoke')
run('pnpm playwright test --project=smoke')

if (codeChange) {
  run('pnpm vitest run --config vitest.config.ts tests/unit tests/integration tests/contracts tests/performance tests/security')
  run('pnpm playwright test --project=accessibility --project=resilience')
}
