import {
  attachShutdownHandlers,
  beDir,
  feDir,
  startNpmScript,
  waitForDatabase,
} from './stack-utils.mjs'

const children = []
const shutdown = attachShutdownHandlers(children)

try {
  process.stdout.write('Starting Postgres (docker compose)…\n')
  await waitForDatabase()
  process.stdout.write('Postgres is ready.\n')
  process.stdout.write('Starting API (be) and PWA (fe). Press Ctrl+C to stop both.\n')
  process.stdout.write('PWA: https://localhost:5173 — API proxy: /api → http://localhost:3000\n\n')

  startNpmScript('API', beDir, 'start:dev', children, shutdown)
  startNpmScript('PWA', feDir, 'dev', children, shutdown)
} catch (error) {
  const message = error instanceof Error ? error.message : 'Failed to start local dev stack'
  process.stderr.write(`${message}\n`)
  process.exit(1)
}
