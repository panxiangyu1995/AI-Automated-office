import { spawnSync } from 'node:child_process'

const run = (command) => {
  const result = spawnSync(command, { shell: true, stdio: 'inherit' })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run('pnpm lint')
run('pnpm test')
run('pnpm test:coverage')
run('node scripts/test/coverage-check.mjs')
run('pnpm test:contract')
run('pnpm test:performance')
run('pnpm test:security')
run('pnpm test:e2e')
