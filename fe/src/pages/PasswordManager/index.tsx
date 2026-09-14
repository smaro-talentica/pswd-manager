import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/feature/AuthSession'
import { ThemeToggle } from '@/components/feature/ThemeToggle'
import { AddSecret } from '@/pages/PasswordManager/AddSecret'
import { PAGE_SHELL, SECRET_GRID } from './constant'
import { ManageTemplates } from '@/pages/PasswordManager/ManageTemplates'
import { SearchBar } from '@/pages/PasswordManager/SearchBar'
import { secretMatchesQuery } from '@/pages/PasswordManager/SearchBar/helper'
import { SecretCard } from '@/pages/PasswordManager/SecretCard'
import { ShareDialog } from '@/pages/PasswordManager/ShareDialog'
import { TwoFactorSetup } from '@/pages/PasswordManager/TwoFactorSetup'
import { ApiError } from '@/utils/api'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/utils/password'
import {
  createOwnedSecret,
  decryptOwnedItem,
  decryptReceivedShare,
  deleteOwnedSecret,
  listOwnedItems,
  listReceivedShares,
  revokeShare,
  shareSecret,
} from '@/utils/secrets'
import { cn } from '@/utils/cn'
import type { VaultTemplate } from '@/utils/templates'

export function PasswordManager() {
  const { status, user, logout, hasKeys, vaultId, getVaultKey, getPrivateKey, unlockWithPassword } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'private' | 'shared'>('private')
  const [sharingId, setSharingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [password, setPassword] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)

  const secretsQuery = useQuery({
    queryKey: ['secrets', user?.id],
    enabled: status === 'signedIn' && hasKeys && Boolean(vaultId) && Boolean(user),
    queryFn: async () => {
      const currentVaultId = vaultId
      if (!currentVaultId) {
        return []
      }
      const vaultKey = getVaultKey(currentVaultId)
      const privateKey = getPrivateKey()
      if (!vaultKey || !privateKey) {
        return []
      }
      const [owned, received] = await Promise.all([listOwnedItems(), listReceivedShares()])
      const decryptedOwned = await Promise.all(owned.map((item) => decryptOwnedItem(item, vaultKey)))
      const decryptedReceived = await Promise.all(
        received.map((share) => decryptReceivedShare(share, privateKey)),
      )
      return [...decryptedOwned, ...decryptedReceived]
    },
  })

  const privateSecrets = useMemo(
    () => (secretsQuery.data ?? []).filter((secret) => secret.owned && secret.shares.length === 0),
    [secretsQuery.data],
  )
  const sharedSecrets = useMemo(
    () => (secretsQuery.data ?? []).filter((secret) => !secret.owned || secret.shares.length > 0),
    [secretsQuery.data],
  )

  const sharingSecret = (secretsQuery.data ?? []).find((secret) => secret.id === sharingId) ?? null

  async function refreshSecrets() {
    await queryClient.invalidateQueries({ queryKey: ['secrets'] })
  }

  async function onAdd(template: VaultTemplate, values: Record<string, string>) {
    if (!vaultId) {
      throw new Error('No vault available')
    }
    const vaultKey = getVaultKey(vaultId)
    if (!vaultKey) {
      throw new Error('Unlock the vault first')
    }
    await createOwnedSecret(vaultId, vaultKey, template, values)
    await refreshSecrets()
  }

  async function onShare(email: string) {
    const secret = sharingSecret
    const privateKey = getPrivateKey()
    if (!secret || !privateKey) {
      throw new Error('Unlock the vault first')
    }
    await shareSecret(secret.id, email, secret.itemDek, privateKey)
    await refreshSecrets()
    setTab('shared')
  }

  async function onRevoke(shareId: string) {
    await revokeShare(shareId)
    await refreshSecrets()
  }

  async function onDelete(itemId: string) {
    await deleteOwnedSecret(itemId)
    await refreshSecrets()
  }

  if (status === 'loading') {
    return (
      <main className={cn(PAGE_SHELL, 'min-h-dvh')}>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    )
  }

  if (status !== 'signedIn' || !user) {
    return <Navigate to="/" replace />
  }

  if (!hasKeys) {
    return (
      <main className={cn(PAGE_SHELL, 'min-h-dvh')}>
        <header className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm">{user.email}</p>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Button type="button" variant="outline" onClick={() => void logout()}>
              Log out
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center">
          <form
            className="flex w-full max-w-sm flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              setUnlocking(true)
              setUnlockError(null)
              void unlockWithPassword(password)
                .then(() => {
                  setPassword('')
                  return queryClient.invalidateQueries({ queryKey: ['secrets'] })
                })
                .catch((cause: unknown) => {
                  setUnlockError(
                    cause instanceof ApiError && cause.status === 401
                      ? 'Session expired. Log in again.'
                      : 'Could not open secrets',
                  )
                })
                .finally(() => setUnlocking(false))
            }}
          >
            <p className="text-sm text-muted-foreground">Enter your password to view secrets.</p>
            <input
              required
              type="password"
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {unlockError ? <p className="text-sm text-destructive">{unlockError}</p> : null}
            <Button type="submit" disabled={unlocking}>
              {unlocking ? 'Opening…' : 'Continue'}
            </Button>
          </form>
        </div>
      </main>
    )
  }

  const visible = (tab === 'private' ? privateSecrets : sharedSecrets).filter((secret) =>
    secretMatchesQuery(secret, search),
  )
  const tabSecrets = tab === 'private' ? privateSecrets : sharedSecrets

  return (
    <main className={cn(PAGE_SHELL, 'h-dvh')}>
      <header className="flex shrink-0 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm">{user.email}</p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <ManageTemplates />
          <TwoFactorSetup />
          <ThemeToggle />
          <Button type="button" variant="outline" onClick={() => void logout()}>
            Log out
          </Button>
        </div>
      </header>

      <div className="flex shrink-0 border-b border-border">
        <button
          type="button"
          className={
            tab === 'private'
              ? 'flex-1 border-b-2 border-foreground py-2 text-sm font-medium'
              : 'flex-1 py-2 text-sm text-muted-foreground'
          }
          onClick={() => setTab('private')}
        >
          Private vault
        </button>
        <button
          type="button"
          className={
            tab === 'shared'
              ? 'flex-1 border-b-2 border-foreground py-2 text-sm font-medium'
              : 'flex-1 py-2 text-sm text-muted-foreground'
          }
          onClick={() => setTab('shared')}
        >
          Shared vault
        </button>
      </div>

      <div className={cn(SECRET_GRID, 'shrink-0 overflow-y-auto md:items-center [scrollbar-gutter:stable]')}>
        <SearchBar query={search} onQueryChange={setSearch} />
        {tab === 'private' ? (
          <div className="md:justify-self-end">
            <AddSecret onAdd={onAdd} />
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto [scrollbar-gutter:stable]">
        {secretsQuery.isPending ? <p className="text-sm text-muted-foreground">Loading secrets…</p> : null}
        {secretsQuery.isError ? <p className="text-sm text-destructive">Could not load secrets.</p> : null}
        {tabSecrets.length === 0 && !secretsQuery.isPending ? (
          <p className="text-sm text-muted-foreground">
            {tab === 'private' ? 'No private vault secrets yet.' : 'No shared vault secrets yet.'}
          </p>
        ) : null}
        {tabSecrets.length > 0 && visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching secrets.</p>
        ) : null}

        <ul className={SECRET_GRID}>
          {visible.map((secret) => (
            <SecretCard
              key={secret.owned ? secret.id : `${secret.id}-received`}
              secret={secret}
              onShare={secret.owned ? () => setSharingId(secret.id) : undefined}
              onDelete={secret.owned ? () => void onDelete(secret.id) : undefined}
              onRevoke={(shareId) => void onRevoke(shareId)}
            />
          ))}
        </ul>
      </div>

      <ShareDialog open={Boolean(sharingSecret)} onClose={() => setSharingId(null)} onShare={onShare} />
    </main>
  )
}
