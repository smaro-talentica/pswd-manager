import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const beDir = path.join(root, 'be')
export const feDir = path.join(root, 'fe')

export function run(command, args, options = {}) {
  const { cwd = root, quiet = false } = options
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: true,
      stdio: quiet ? 'ignore' : 'inherit',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`))
    })
  })
}

export async function waitForDatabase() {
  try {
    await run('docker', ['compose', 'up', '-d', '--wait'], { quiet: true })
    return
  } catch {
    // Older Compose may not support --wait; fall back to pg_isready polling.
  }

  await run('docker', ['compose', 'up', '-d'])
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await run(
        'docker',
        ['compose', 'exec', '-T', 'db', 'pg_isready', '-U', 'password_manager', '-d', 'password_manager'],
        { quiet: true },
      )
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw new Error('Postgres did not become ready. Is Docker Desktop running?')
}

export function startNpmScript(label, cwd, npmScript, children, onShutdown) {
  const child = spawn('npm', ['run', npmScript], {
    cwd,
    shell: true,
    stdio: 'inherit',
    env: process.env,
  })
  child.on('exit', (code, signal) => {
    if (signal) {
      process.stderr.write(`${label} stopped (${signal}).\n`)
    } else if (code !== 0 && code !== null) {
      process.stderr.write(`${label} exited with code ${code}.\n`)
    }
    onShutdown(code ?? 1)
  })
  children.push(child)
  return child
}

export function attachShutdownHandlers(children) {
  function shutdown(exitCode = 0) {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGTERM')
      }
    }
    setTimeout(() => process.exit(exitCode), 100)
  }

  process.on('SIGINT', () => shutdown(0))
  process.on('SIGTERM', () => shutdown(0))
  return shutdown
}
