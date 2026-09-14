// afterFileEdit hook: oxlint --fix + prettier --write. Fails OPEN.

import { spawnSync } from 'node:child_process'

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

function run(raw) {
  let file
  try {
    const evt = JSON.parse(raw)
    file = getFilePath(evt)
  } catch {
    process.exit(0)
  }

  if (!file || !/\.(ts|js|json)$/.test(file)) process.exit(0)

  const isCode = /\.(ts|js)$/.test(file)
  const exec = (bin, args) =>
    spawnSync(bin, args, { stdio: 'inherit', shell: true, cwd: process.cwd() })

  if (isCode) exec('npx', ['oxlint', '--fix', file])
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
