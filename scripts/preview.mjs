import {
  attachShutdownHandlers,
  beDir,
  feDir,
  run,
  startNpmScript,
  waitForDatabase,
} from './stack-utils.mjs'

const children = []
const shutdown = attachShutdownHandlers(children)

try {
  process.stdout.write('Starting Postgres (docker compose)…\n')
  await waitForDatabase()
  process.stdout.write('Postgres is ready.\n')

  process.stdout.write('Building PWA (production)…\n')
  await run('npm', ['run', 'build'], { cwd: feDir })

  process.stdout.write('Starting API (be) and PWA preview (fe). Press Ctrl+C to stop both.\n')
  process.stdout.write('PWA preview: https://localhost:5173 — API proxy: /api → http://localhost:3000\n')
  process.stdout.write('(Production build + service worker — use this to test install prompt.)\n\n')

  startNpmScript('API', beDir, 'start:dev', children, shutdown)
  startNpmScript('PWA preview', feDir, 'preview', children, shutdown)
} catch (error) {
  const message = error instanceof Error ? error.message : 'Failed to start local preview stack'
  process.stderr.write(`${message}\n`)
  process.exit(1)
}
