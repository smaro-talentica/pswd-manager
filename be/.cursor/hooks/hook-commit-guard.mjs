// beforeShellExecution guard: enforce Conventional Commits on git commit.
// Fails OPEN.

const CONVENTIONAL_RE = /^(feat|fix|chore|refactor|test|docs|style|perf|build|ci|revert)(\(.+\))?(!)?\s*:\s*.+/i
const TYPES = ['feat','fix','chore','refactor','test','docs','style','perf','build','ci','revert']

function extractMessage(cmd) {
  if (!cmd) return null
  const s = String(cmd)
  const patterns = [
    /git\s+commit\b[^"']*(?:-m|--message)\s+"((?:[^"\\]|\\.)*)"/i,
    /git\s+commit\b[^"']*(?:-m|--message)\s+'((?:[^'\\]|\\.)*)'/i,
    /git\s+commit\b[^=]*(?:-m|--message)=["']?(\S+)/i,
  ]
  for (const re of patterns) { const m = s.match(re); if (m) return m[1].trim() }
  return null
}

function respond(obj) {
  try { process.stdout.write(JSON.stringify(obj) + '\n') } catch { /* ignore */ }
  process.exit(0)
}

function run(raw) {
  let evt = {}
  try { evt = JSON.parse(raw) || {} } catch { respond({ permission: 'allow' }); return }

  try {
    const cmd = evt?.command ?? evt?.cmd ?? ''
    if (!/\bgit\s+commit\b/.test(String(cmd))) { respond({ permission: 'allow' }); return }
    if (/--amend/.test(cmd) && !/-m|--message/.test(cmd)) { respond({ permission: 'allow' }); return }

    const msg = extractMessage(cmd)
    if (!msg) { respond({ permission: 'allow' }); return }
    if (CONVENTIONAL_RE.test(msg)) { respond({ permission: 'allow' }); return }

    const examples = '  feat: add cookie-based auth session\n  fix: restore session from /api/auth/me\n  chore: update vite'
    respond({
      permission: 'deny',
      agent_message: `commit-guard: "${msg}" does not follow Conventional Commits (S9).\nTypes: ${TYPES.join('|')}\nExamples:\n${examples}`,
      user_message: `Commit blocked — use Conventional Commits format (feat: / fix: / chore: etc.)`,
    })
  } catch { respond({ permission: 'allow' }) }
}

let raw = ''
let timer = null
function flush() { if (timer) { clearTimeout(timer); timer = null } run(raw) }

process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => { raw += c; if (timer) clearTimeout(timer); timer = setTimeout(flush, 100) })
process.stdin.on('end', flush)
process.stdin.on('error', () => process.stdout.write(JSON.stringify({ permission: 'allow' }) + '\n') || process.exit(0))
setTimeout(() => process.stdout.write(JSON.stringify({ permission: 'allow' }) + '\n') || process.exit(0), 8000)
