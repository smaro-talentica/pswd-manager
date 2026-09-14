import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useAuth, type PublicUser } from '@/components/feature/AuthSession'
import { api, ApiError } from '@/utils/api'
import { cn } from '@/utils/cn'
import { QrCode } from './QrCode'

type SetupPayload = {
  secret: string
  otpauthUrl: string
}

const inputClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm'

function groupedSecret(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim()
}

export function TwoFactorSetup() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [setup, setSetup] = useState<SetupPayload | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const enabled = user?.twoFactorEnabled === true

  function close() {
    setOpen(false)
    setSetup(null)
    setCode('')
    setError(null)
  }

  async function openDialog() {
    setOpen(true)
    setError(null)
    try {
      queryClient.setQueryData(['auth', 'me'], await api<PublicUser>('/api/auth/me'))
    } catch {
      // Keep the signed-in account from session if /me cannot refresh.
    }
  }

  async function startSetup() {
    setPending(true)
    setError(null)
    try {
      setSetup(await api<SetupPayload>('/api/auth/2fa/setup', { method: 'POST' }))
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not start authenticator setup')
    } finally {
      setPending(false)
    }
  }

  async function onEnable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const updated = await api<PublicUser>('/api/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      queryClient.setQueryData(['auth', 'me'], updated)
      setSetup(null)
      setCode('')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not turn on authenticator')
    } finally {
      setPending(false)
    }
  }

  async function onDisable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const updated = await api<PublicUser>('/api/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      queryClient.setQueryData(['auth', 'me'], updated)
      setCode('')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not turn off authenticator')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-pressed={enabled}
        className={cn(
          enabled
            ? 'border-success text-success hover:bg-success/10 hover:text-success'
            : 'border-foreground text-foreground',
        )}
        onClick={() => void openDialog()}
      >
        2FA
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="flex max-h-[90%] w-full max-w-sm flex-col gap-3 overflow-y-auto rounded-lg bg-card p-5 shadow-sm md:max-w-md">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Authenticator</h2>
              <Button type="button" variant="outline" size="sm" onClick={close}>
                Close
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use Google Authenticator or a similar app as a second factor when you log in.
            </p>
            {enabled && !setup ? (
              <form className="flex flex-col gap-3" onSubmit={(event) => void onDisable(event)}>
                <p className="text-sm">Authenticator is on for this account.</p>
                <label className="flex flex-col gap-1 text-sm">
                  Code from the app
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    className={inputClass}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                  />
                </label>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" disabled={pending}>
                  {pending ? 'Turning off…' : 'Turn off 2FA'}
                </Button>
              </form>
            ) : setup ? (
              <form className="flex flex-col gap-3" onSubmit={(event) => void onEnable(event)}>
                <div className="flex justify-center">{setup.otpauthUrl ? <QrCode value={setup.otpauthUrl} /> : null}</div>
                <p className="text-sm">Scan the QR code, or type this key into the app:</p>
                <p className="break-all font-mono text-sm">{groupedSecret(setup.secret)}</p>
                <a href={setup.otpauthUrl} className="text-sm underline-offset-4 hover:underline">
                  Open in authenticator app
                </a>
                <label className="flex flex-col gap-1 text-sm">
                  Code from the app
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    className={inputClass}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                  />
                </label>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" disabled={pending}>
                  {pending ? 'Confirming…' : 'Confirm and turn on'}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm">Authenticator is off for this account.</p>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="button" disabled={pending} onClick={() => void startSetup()}>
                  {pending ? 'Preparing…' : 'Turn on 2FA'}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
