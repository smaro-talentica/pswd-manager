/* eslint-disable react-refresh/only-export-components */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, subscribeSessionExpired } from '@/utils/api'
import { createRegisterCrypto, unlockKeys, type CryptoPayload, type UnlockedKeys } from '@/utils/crypto'

export type PublicUser = {
  id: string
  email: string
  twoFactorEnabled: boolean
}

type AuthResult = {
  user: PublicUser
  crypto: CryptoPayload
}

type AuthStatus = 'loading' | 'anonymous' | 'signedIn'

type AuthContextValue = {
  status: AuthStatus
  user: PublicUser | null
  error: string | null
  hasKeys: boolean
  vaultId: string | null
  needsTotp: boolean
  getVaultKey: (vaultId: string) => CryptoKey | null
  getPrivateKey: () => CryptoKey | null
  register: (email: string, masterPassword: string) => Promise<void>
  login: (email: string, masterPassword: string) => Promise<void>
  verifyLoginTotp: (code: string) => Promise<void>
  cancelTotp: () => void
  unlockWithPassword: (masterPassword: string) => Promise<void>
  logout: () => Promise<void>
}

const SESSION_QUERY_KEY = ['auth', 'me'] as const

const AuthContext = createContext<AuthContextValue | null>(null)

async function readSession(): Promise<PublicUser | null> {
  try {
    return await api<PublicUser>('/api/auth/me')
  } catch {
    return null
  }
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [hasKeys, setHasKeys] = useState(false)
  const [vaultId, setVaultId] = useState<string | null>(null)
  const [needsTotp, setNeedsTotp] = useState(false)
  const keysRef = useRef<UnlockedKeys | null>(null)
  const pendingPasswordRef = useRef<string | null>(null)

  const session = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: readSession,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })

  const user = session.data ?? null
  const status: AuthStatus = session.isPending ? 'loading' : user ? 'signedIn' : 'anonymous'

  const applyKeys = useCallback((keys: UnlockedKeys) => {
    keysRef.current = keys
    setVaultId(Object.keys(keys.vaultKeys)[0] ?? null)
    setHasKeys(true)
  }, [])

  const enterApp = useCallback(
    async (result: AuthResult, masterPassword: string) => {
      applyKeys(await unlockKeys(masterPassword, result.crypto))
      await queryClient.cancelQueries({ queryKey: SESSION_QUERY_KEY })
      queryClient.setQueryData(SESSION_QUERY_KEY, result.user)
      setError(null)
    },
    [applyKeys, queryClient],
  )

  const register = useCallback(
    async (email: string, masterPassword: string) => {
      setError(null)
      const cryptoPayload = await createRegisterCrypto(masterPassword)
      const result = await api<AuthResult>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: masterPassword,
          ...cryptoPayload,
        }),
      })
      await enterApp(result, masterPassword)
    },
    [enterApp],
  )

  const login = useCallback(
    async (email: string, masterPassword: string) => {
      setError(null)
      const result = await api<AuthResult | { twoFactorRequired: true }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: masterPassword }),
      })
      if ('twoFactorRequired' in result) {
        pendingPasswordRef.current = masterPassword
        setNeedsTotp(true)
        return
      }
      pendingPasswordRef.current = null
      setNeedsTotp(false)
      await enterApp(result, masterPassword)
    },
    [enterApp],
  )

  const verifyLoginTotp = useCallback(
    async (code: string) => {
      const masterPassword = pendingPasswordRef.current
      if (!masterPassword) {
        throw new Error('Sign in with your password first')
      }
      const result = await api<AuthResult>('/api/auth/2fa/verify-login', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      pendingPasswordRef.current = null
      setNeedsTotp(false)
      await enterApp(result, masterPassword)
    },
    [enterApp],
  )

  const cancelTotp = useCallback(() => {
    pendingPasswordRef.current = null
    setNeedsTotp(false)
    void api<void>('/api/auth/logout', { method: 'POST' })
  }, [])

  const unlockWithPassword = useCallback(
    async (masterPassword: string) => {
      const payload = await api<CryptoPayload>('/api/auth/crypto')
      applyKeys(await unlockKeys(masterPassword, payload))
    },
    [applyKeys],
  )

  const logout = useCallback(async () => {
    setError(null)
    await api<void>('/api/auth/logout', { method: 'POST' })
    keysRef.current = null
    setHasKeys(false)
    setVaultId(null)
    pendingPasswordRef.current = null
    setNeedsTotp(false)
    queryClient.removeQueries({ queryKey: ['secrets'] })
    queryClient.setQueryData(SESSION_QUERY_KEY, null)
  }, [queryClient])

  const dropSession = useCallback(() => {
    keysRef.current = null
    setHasKeys(false)
    setVaultId(null)
    pendingPasswordRef.current = null
    setNeedsTotp(false)
    queryClient.removeQueries({ queryKey: ['secrets'] })
    queryClient.setQueryData(SESSION_QUERY_KEY, null)
  }, [queryClient])

  useEffect(() => subscribeSessionExpired(dropSession), [dropSession])

  const getVaultKey = useCallback((id: string) => keysRef.current?.vaultKeys[id] ?? null, [])
  const getPrivateKey = useCallback(() => keysRef.current?.privateKey ?? null, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      hasKeys,
      vaultId,
      needsTotp,
      getVaultKey,
      getPrivateKey,
      register,
      login,
      verifyLoginTotp,
      cancelTotp,
      unlockWithPassword,
      logout,
    }),
    [
      status,
      user,
      error,
      hasKeys,
      vaultId,
      needsTotp,
      getVaultKey,
      getPrivateKey,
      register,
      login,
      verifyLoginTotp,
      cancelTotp,
      unlockWithPassword,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthSessionProvider')
  }
  return value
}
