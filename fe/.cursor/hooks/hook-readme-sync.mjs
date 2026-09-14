// stop hook: keep README.md in sync with source changes automatically.
// Fires ONCE per unique changeset. Fails OPEN.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DOC_FILES = ['README.md', 'architecture.md']
const SOURCE_RE = /\.(ts|tsx|js|jsx|mjs|cjs|css|json|html)$/i
const STATE_FILE = join(dirname(fileURLToPath(import.meta.url)), '.docs-sync-state')

function respond(obj) {
  try { process.stdout.write(JSON.stringify(obj) + '\n') } catch { /* ignore */ }
  process.exit(0)
}

function changedFiles() {
  const out = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8', cwd: process.cwd() })
  if (out.status !== 0 || !out.stdout) return []
  return out.stdout.split('\n').map((l) => l.slice(3).trim()).filter(Boolean)
    .map((p) => (p.includes('->') ? p.split('->').pop().trim() : p))
    .map((p) => p.replace(/^"|"$/g, ''))
}

function fingerprint(paths) {
  return createHash('sha1').update([...paths].sort().join('\n')).digest('hex')
}

function run(raw) {
  let evt = {}
  try { evt = JSON.parse(raw) || {} } catch { respond({}); return }

  if (evt.stop_hook_active) { respond({}); return }

  const changed = changedFiles()
  const changedSource = changed.filter((p) => SOURCE_RE.test(p) && !DOC_FILES.includes(p.split(/[/\\]/).pop()))
  if (changedSource.length === 0) { respond({}); return }

  const existingDocs = DOC_FILES.filter((d) => existsSync(d))
  if (existingDocs.length === 0) { respond({}); return }

  const fp = fingerprint(changedSource)
  try {
    if (readFileSync(STATE_FILE, 'utf8').trim() === fp) { respond({}); return }
  } catch { /* no state file yet */ }
  try { writeFileSync(STATE_FILE, fp) } catch { /* ignore */ }

  const fileList = changedSource.slice(0, 20).join(', ')
  respond({
    followup_message:
      `Documentation sync: source files changed (${fileList}). ` +
      `Review and update ONLY affected sections in: ${existingDocs.join(', ')}. ` +
      `If already accurate, say so. Do not create new docs or touch unrelated sections.`,
  })
}

let raw = ''
let timer = null
function flush() { if (timer) { clearTimeout(timer); timer = null } run(raw) }

process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => { raw += c; if (timer) clearTimeout(timer); timer = setTimeout(flush, 100) })
process.stdin.on('end', flush)
process.stdin.on('error', () => respond({}))
setTimeout(() => respond({}), 8000)
