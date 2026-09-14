import { env } from '@/utils/env'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const SKIP_REFRESH = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/2fa/verify-login',
])

const sessionExpiredListeners = new Set<() => void>()
let refreshInFlight: Promise<boolean> | null = null

export function subscribeSessionExpired(listener: () => void) {
  sessionExpiredListeners.add(listener)
  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

function notifySessionExpired() {
  for (const listener of sessionExpiredListeners) {
    listener()
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  const body: unknown = await res.json().catch(() => null)
  if (body && typeof body === 'object' && 'message' in body) {
    const parsed = flattenErrorMessage((body as { message: unknown }).message)
    if (parsed) {
      return parsed
    }
  }
  return res.statusText || 'Request failed'
}

function flattenErrorMessage(message: unknown): string | null {
  if (typeof message === 'string' && message.length > 0) {
    return message
  }
  if (!Array.isArray(message)) {
    return null
  }
  const parts = message.flatMap((item) => {
    if (typeof item === 'string') {
      return [item]
    }
    if (item && typeof item === 'object' && 'constraints' in item) {
      return Object.values((item as { constraints: Record<string, string> }).constraints)
    }
    return []
  })
  return parts.length > 0 ? parts.join(', ') : null
}

async function send<T>(path: string, init: RequestInit): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })

  if (res.status === 204) {
    return undefined as T
  }

  if (!res.ok) {
    throw new ApiError(res.status, await readErrorMessage(res))
  }

  return res.json() as Promise<T>
}

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${env.apiBaseUrl}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        return res.ok
      } catch {
        return false
      }
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await send<T>(path, init)
  } catch (cause) {
    if (!(cause instanceof ApiError) || cause.status !== 401 || SKIP_REFRESH.has(path)) {
      throw cause
    }
    const refreshed = await refreshSession()
    if (!refreshed) {
      notifySessionExpired()
      throw cause
    }
    return send<T>(path, init)
  }
}

export function toUserMessage(cause: unknown, fallback: string) {
  if (cause instanceof ApiError && cause.message.length > 0) {
    return cause.message
  }
  if (cause instanceof Error && cause.message.length > 0) {
    return cause.message
  }
  return fallback
}
