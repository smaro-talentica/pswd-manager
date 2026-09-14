// beforeShellExecution guard: enforce branch naming convention on git checkout -b / git switch -c.
//
// Valid patterns:
//   feature/<ticket_or_desc>   e.g. feature/SAFE-123  feature/cookie-auth
//   bugfix/<ticket_or_desc>    e.g. bugfix/SAFE-456   bugfix/session-restore
//
// Always allows: switching to existing branches (no -b / -c flag), main, develop, release/*
// Fails OPEN — a guardrail bug must never block all branch creation.

const VALID_BRANCH = /^(feature|bugfix)\/[a-zA-Z0-9][a-zA-Z0-9\-\.]*$/
const EXEMPT_BRANCHES = /^(main|master|develop|development|release\/.+|hotfix\/.+)$/

function extractNewBranchName(cmd) {
  if (!cmd) return null
  const s = String(cmd)

  // git checkout -b <name> or git checkout -b <name> <base>
  const checkoutB = s.match(/git\s+checkout\s+(?:[^\s]+\s+)*-b\s+([^\s]+)/i)
    ?? s.match(/git\s+checkout\s+-b\s+([^\s]+)/i)
  if (checkoutB) return checkoutB[1].trim()

  // git switch -c <name> or git switch --create <name>
  const switchC = s.match(/git\s+switch\s+(?:[^\s]+\s+)*(?:-c|--create)\s+([^\s]+)/i)
    ?? s.match(/git\s+switch\s+(?:-c|--create)\s+([^\s]+)/i)
  if (switchC) return switchC[1].trim()

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
    const branchName = extractNewBranchName(cmd)

    // Not a new branch creation — allow
    if (!branchName) { respond({ permission: 'allow' }); return }

    // Exempt branch names (main, develop, release/*, hotfix/*)
    if (EXEMPT_BRANCHES.test(branchName)) { respond({ permission: 'allow' }); return }

    // Valid feature/ or bugfix/ branch — allow
    if (VALID_BRANCH.test(branchName)) { respond({ permission: 'allow' }); return }

    // Invalid — deny with clear guidance
    respond({
      permission: 'deny',
      agent_message:
        `branch-guard: branch name "${branchName}" does not follow the naming convention.\n\n` +
        `Required format:\n` +
        `  feature/<ticket-or-desc>   e.g. feature/SAFE-123  feature/cookie-auth\n` +
        `  bugfix/<ticket-or-desc>    e.g. bugfix/SAFE-456   bugfix/session-restore\n\n` +
        `Rules: lowercase, hyphens only, no spaces or underscores in the description part.\n` +
        `Rename the branch and retry.`,
      user_message: `Branch "${branchName}" blocked — must follow feature/<name> or bugfix/<name> convention.`,
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
