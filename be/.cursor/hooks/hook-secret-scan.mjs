// preToolUse guardrail: scan file content being written for hardcoded secrets.
// Fails OPEN.

const SECRET_PATTERNS = [
  { name: 'OpenAI API key',           re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: 'Anthropic API key',        re: /\bsk-ant-[A-Za-z0-9\-_]{20,}\b/ },
  { name: 'AWS Access Key ID',        re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'GitHub token',             re: /\b(ghp_|gho_|ghu_|ghs_|ghr_|github_pat_)[A-Za-z0-9_]{20,}\b/ },
  { name: 'Generic secret assignment',re: /\b(secret|apiKey|api_key|accessKey|privateKey|authToken|clientSecret|password|passwd)\s*[:=]\s*["'][A-Za-z0-9+\/=_\-\.]{8,}["']/i },
  { name: 'Bearer token literal',     re: /Bearer\s+[A-Za-z0-9\-_\.]{20,}/ },
  { name: 'JWT secret string',        re: /\b(jwt|sign)\s*\(.*["'][A-Za-z0-9+\/=_\-]{32,}["']/i },
]
const SCANNABLE = /\.(ts|tsx|js|jsx|mjs)$/i

function basename(p) { return String(p).split(/[/\\]/).pop() || '' }

function respond(obj) {
  try { process.stdout.write(JSON.stringify(obj) + '\n') } catch { /* ignore */ }
  process.exit(0)
}

function run(raw) {
  let evt = {}
  try { evt = JSON.parse(raw) || {} } catch { respond({ permission: 'allow' }); return }

  try {
    const tool = String(evt?.tool_name ?? evt?.toolName ?? '').toLowerCase()
    const writeTools = ['write', 'edit', 'str_replace_editor', 'str_replace_based_edit_tool']
    if (!writeTools.includes(tool)) { respond({ permission: 'allow' }); return }

    const input = evt?.tool_input ?? evt?.toolInput ?? evt?.input ?? {}
    const file = input?.file_path ?? input?.path ?? input?.filePath ?? evt?.file_path ?? null
    if (!file || !SCANNABLE.test(basename(file))) { respond({ permission: 'allow' }); return }

    const content = input?.content ?? input?.new_content ?? input?.new_string ?? evt?.content ?? null
    if (!content) { respond({ permission: 'allow' }); return }

    const findings = []
    String(content).split(/\r?\n/).forEach((line, i) => {
      if (/^\s*(\/\/|#|\/\*)/.test(line)) return
      SECRET_PATTERNS.forEach(({ name, re }) => { if (re.test(line)) findings.push(`  L${i+1}: ${name}`) })
    })

    if (findings.length === 0) { respond({ permission: 'allow' }); return }

    respond({
      permission: 'deny',
      agent_message: `secret-scan: possible secret(s) in "${basename(file)}":\n${findings.join('\n')}\n\nUse ConfigService + .env.example instead.`,
      user_message: `Secret scan blocked this write — hardcoded secret detected.`,
    })
  } catch { respond({ permission: 'allow' }) }
}

let raw = ''
let timer = null
function flush() { if (timer) { clearTimeout(timer); timer = null } run(raw) }

process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => { raw += c; if (timer) clearTimeout(timer); timer = setTimeout(flush, 100) })
process.stdin.on('end', flush)
process.stdin.on('error', () => respond({ permission: 'allow' }))
setTimeout(() => respond({ permission: 'allow' }), 8000)
