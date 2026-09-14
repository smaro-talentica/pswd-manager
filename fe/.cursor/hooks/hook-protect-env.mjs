// preToolUse guardrail: block AI reads/writes/shell commands targeting secret .env files.
//
// Blocks: .env, .env.local, .env.production, .env.staging, .env.development
// Allows: .env.example, .env.sample, .env.template, .env.defaults, .env.dist
//
// Fails OPEN on parse errors — only deny on confirmed env file access.

const TEMPLATE_SUFFIXES = [
  '.example', '.sample', '.template', '.defaults', '.dist', '.local.example',
]
const ENV_BASENAME = /^\.env(\.[^/\\]*)?$/i

function basename(p) {
  return String(p).split(/[/\\]/).pop() || ''
}

function isProtectedEnvPath(p) {
  if (!p) return false
  const base = basename(p).toLowerCase()
  if (!ENV_BASENAME.test(base)) return false
  return !TEMPLATE_SUFFIXES.some((s) => base === '.env' + s || base.endsWith(s))
}

function commandHitsEnv(cmd) {
  if (!cmd) return null
  const s = String(cmd)
  const quoteRe = /(['"`])((?:\\.|(?!\1).)*)\1/g
  let m
  while ((m = quoteRe.exec(s))) {
    const inner = m[2]
    if (!/\s/.test(inner) && isProtectedEnvPath(inner)) return inner
  }
  const bare = s.replace(quoteRe, ' ')
  const tokens = bare.match(/[^\s;|&()<>]*\.env[^\s;|&()<>]*/gi) || []
  return tokens.find((t) => isProtectedEnvPath(t)) ?? null
}

function respond(obj) {
  try { process.stdout.write(JSON.stringify(obj) + '\n') } catch { /* ignore */ }
  process.exit(0)
}

function deny(reason) {
  respond({ permission: 'deny', agent_message: reason, user_message: `Blocked: ${reason}` })
}

function allow() {
  respond({ permission: 'allow' })
}

function run(raw) {
  let evt
  try { evt = JSON.parse(raw) } catch { allow(); return }
  if (!evt || typeof evt !== 'object') { allow(); return }

  try {
    const tool = String(evt?.tool_name ?? evt?.toolName ?? '').toLowerCase()
    const input = evt?.tool_input ?? evt?.toolInput ?? evt?.input ?? {}

    const paths = [
      input?.file_path, input?.path, input?.filePath, input?.notebook_path,
      evt?.file_path, evt?.path,
    ].filter((v) => typeof v === 'string' && v.length > 0)

    for (const p of paths) {
      if (isProtectedEnvPath(p)) {
        deny(`access to secret env file "${basename(p)}" is blocked. Use .env.example instead.`)
        return
      }
    }

    if (['bash', 'shell', 'runterminalcommand'].includes(tool)) {
      const cmd = input?.command ?? input?.cmd ?? evt?.command ?? ''
      const hit = commandHitsEnv(cmd)
      if (hit) { deny(`command touches secret env file "${basename(hit)}" — blocked.`); return }
    }

    allow()
  } catch { allow() }
}

// Windows-safe stdin reading: collect data, run on close or after short idle
let raw = ''
let timer = null

function flush() {
  if (timer) { clearTimeout(timer); timer = null }
  run(raw)
}

process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  raw += chunk
  // Reset idle timer — run 100ms after last chunk if 'end' never fires
  if (timer) clearTimeout(timer)
  timer = setTimeout(flush, 100)
})
process.stdin.on('end', flush)
process.stdin.on('error', () => allow())

// Hard safety net: if nothing happens in 8s, allow through
setTimeout(() => allow(), 8000)
