import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/feature/AuthSession'
import { PwaInstallBanner, usePwaInstall } from '@/components/feature/PwaInstall'
import { ThemeToggle } from '@/components/feature/ThemeToggle'
import { TotpStep } from './TotpStep'
import { toUserMessage } from '@/utils/api'
import { cn } from '@/utils/cn'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/utils/password'

function LoginChrome({ children }: { children: ReactNode }) {
  const { bannerKind } = usePwaInstall()
  return (
    <>
      <div className={cn(bannerKind !== 'none' && 'pb-28')}>{children}</div>
      <PwaInstallBanner />
    </>
  )
}

export function Login() {
  const { status, login, verifyLoginTotp, cancelTotp, needsTotp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await login(email, password)
    } catch (cause) {
      setError(toUserMessage(cause, 'Could not log in'))
    } finally {
      setPending(false)
    }
  }

  if (status === 'loading') {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center px-4 py-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    )
  }

  if (status === 'signedIn') {
    return <Navigate to="/password-manager" replace />
  }

  if (needsTotp) {
    return (
      <LoginChrome>
        <TotpStep
          onVerify={verifyLoginTotp}
          onBack={() => {
            setPassword('')
            cancelTotp()
          }}
        />
      </LoginChrome>
    )
  }

  return (
    <LoginChrome>
    <main className="flex min-h-dvh w-full items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <div className={cn('flex items-center justify-between gap-3')}>
          <h1 className={cn('text-2xl font-semibold')}>Log in</h1>
          <ThemeToggle />
        </div>
        <form className="flex flex-col gap-3" onSubmit={(event) => void onSubmit(event)}>
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              required
              type="password"
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3"
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? 'Signing in…' : 'Log in'}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          New here?{' '}
          <Link to="/signup" className="underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
    </LoginChrome>
  )
}
