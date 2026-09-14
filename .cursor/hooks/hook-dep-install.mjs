// beforeShellExecution guard: intercept npm install <package> and ask for approval.
// Fails OPEN.

function getPackages(cmd) {
  if (!cmd) return null
  const s = String(cmd).trim()
  if (!/^npm\s/.test(s)) return null
  const norm = s.replace(/\s+/g, ' ')
  if (!/^npm\s+(install|i|add)\b/i.test(norm)) return null
  const afterSub = norm.replace(/^npm\s+(install|i|add)\s*/i, '').trim()
  if (!afterSub) return null
  if (/^(--[a-z][\w\-]*(=\S+)?\s*|-[a-zA-Z]+\s*)*$/.test(afterSub)) return null
  const packages = afterSub.split(/\s+/).filter((t) => !t.startsWith('-'))
  return packages.length > 0 ? packages : null
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
    const packages = getPackages(cmd)
    if (!packages) { respond({ permission: 'allow' }); return }

    respond({
      permission: 'ask',
      user_message: `AI wants to run: \`${cmd}\`\n\nThis adds **${packages.join(', ')}** to package.json.\n\nApprove to continue or deny to discuss first.`,
      agent_message: `dep-install-guard: paused before adding [${packages.join(', ')}]. Waiting for user approval.`,
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
