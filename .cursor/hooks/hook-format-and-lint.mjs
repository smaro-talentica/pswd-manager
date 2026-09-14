// afterFileEdit: eslint or oxlint + prettier based on fe/ vs be/. Fails OPEN.

import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

function getFilePath(evt) {
  return (
    evt?.file_path ??
    evt?.filePath ??
    evt?.tool_response?.filePath ??
    evt?.tool_input?.file_path ??
    evt?.path ??
    null
  )
}

function projectCwd(file) {
  const n = String(file).replace(/\\/g, '/')
  if (n.includes('/fe/')) return join(repoRoot, 'fe')
  if (n.includes('/be/')) return join(repoRoot, 'be')
  return repoRoot
}

function run(raw) {
  let file
  try {
    const evt = JSON.parse(raw)
    file = getFilePath(evt)
  } catch {
    process.exit(0)
  }

  if (!file || !/\.(ts|tsx|js|jsx|json|css)$/.test(file)) process.exit(0)

  const cwd = projectCwd(file)
  const isFe = /[/\\]fe[/\\]/.test(file)
  const isBe = /[/\\]be[/\\]/.test(file)
  const isCode = /\.(ts|tsx|js|jsx)$/.test(file)
  const exec = (bin, args) => spawnSync(bin, args, { stdio: 'inherit', shell: true, cwd })

  if (isCode && isFe) exec('npx', ['eslint', '--fix', file])
  if (isCode && isBe) exec('npx', ['oxlint', '--fix', file])
  exec('npx', ['prettier', '--write', file])

  try {
    process.stdout.write(JSON.stringify({ additional_context: `Formatted and linted: ${file}` }) + '\n')
  } catch {
    /* ignore */
  }
  process.exit(0)
}

let raw = ''
let timer = null
function flush() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  run(raw)
}

process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => {
  raw += c
  if (timer) clearTimeout(timer)
  timer = setTimeout(flush, 100)
})
process.stdin.on('end', flush)
process.stdin.on('error', () => process.exit(0))
setTimeout(() => process.exit(0), 8000)
