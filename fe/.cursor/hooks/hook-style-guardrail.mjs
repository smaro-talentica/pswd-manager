// afterFileEdit: no inline styles, hex colors, or max-* breakpoints in fe/src.
// lucide-react is allowed (shadcn). Fails OPEN.

import { readFileSync } from 'node:fs'

function basename(p) {
  return String(p).split(/[/\\]/).pop() || ''
}

function isSrcFile(p) {
  if (!p) return false
  return /\/src\/.+\.(tsx|jsx)$/i.test(String(p).replace(/\\/g, '/'))
}

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

function scan(src) {
  const problems = []
  const lines = src.split(/\r?\n/)
  const codeOf = (l) => l.replace(/\/\/.*$/, '')
  let usesClassName = false
  const importsCn = /from\s+["']@\/utils\/cn["']/.test(src)

  const blockedIcons = src.match(
    /from\s+["'](react-icons|heroicons|@heroicons\/react|phosphor-react|@mui\/icons-material)["']/g,
  )
  if (blockedIcons) {
    problems.push(`Blocked icon library (${blockedIcons[0]}) — use lucide-react (shadcn).`)
  }

  lines.forEach((rawLine, i) => {
    const line = codeOf(rawLine)
    const n = i + 1
    if (/\bstyle=\{\{/.test(line)) problems.push(`L${n}: inline style={{}} — use Tailwind via cn().`)
    const hex = line.match(/#[0-9a-fA-F]{3,8}\b/)
    if (hex) problems.push(`L${n}: hardcoded color "${hex[0]}" — use theme tokens.`)
    if (/\bmax-(sm|md|lg|xl|2xl):/.test(line)) {
      problems.push(`L${n}: max-* breakpoint — use mobile-first sm:/md:.`)
    }
    if (/max-width\s*:/.test(line)) problems.push(`L${n}: max-width media query — use min-width.`)
    if (/className=/.test(line)) {
      usesClassName = true
      if (/className=("[^"]*"|'[^']*'|\{\s*["'][^"']*["']\s*\})/.test(line) && !/\bcn\s*\(/.test(line)) {
        problems.push(`L${n}: className not via cn() — wrap in cn() from @/utils/cn.`)
      }
    }
  })
  if (usesClassName && !importsCn) {
    problems.push(`File uses className but missing cn import from "@/utils/cn".`)
  }
  return problems
}

function run(raw) {
  let file
  try {
    const evt = JSON.parse(raw)
    file = getFilePath(evt)
  } catch {
    process.exit(0)
  }

  try {
    if (!isSrcFile(file)) {
      process.exit(0)
      return
    }
    let src
    try {
      src = readFileSync(file, 'utf8')
    } catch {
      process.exit(0)
      return
    }
    const problems = scan(src)
    if (problems.length === 0) {
      process.exit(0)
      return
    }

    const report =
      `style-guardrail — "${basename(file)}" has ${problems.length} issue(s):\n` +
      problems.map((p) => `  • ${p}`).join('\n') +
      `\n\nFix before PR.`
    try {
      process.stdout.write(JSON.stringify({ additional_context: report }) + '\n')
    } catch {
      /* ignore */
    }
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
