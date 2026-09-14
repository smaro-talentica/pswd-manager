import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/feature/AuthSession'
import { ThemeToggle } from '@/components/feature/ThemeToggle'
import { PasswordStrength } from '@/pages/SignUp/PasswordStrength'
import { toUserMessage } from '@/utils/api'
import { cn } from '@/utils/cn'
import { isStrongPassword, PASSWORD_HINT, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/utils/password'

const fieldClass = 'h-9 rounded-md border border-input bg-background px-3'

export function SignUp() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (!isStrongPassword(password)) {
      setError(PASSWORD_HINT)
      return
    }
    setPending(true)
    setError(null)
    try {
      await register(email, password)
      void navigate('/password-manager')
    } catch (cause) {
      setError(toUserMessage(cause, 'Could not create the account'))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className={cn('flex min-h-dvh w-full items-center justify-center px-4 py-8')}>
      <div className={cn('flex w-full max-w-sm flex-col gap-4')}>
        <div className={cn('flex items-center justify-between gap-3')}>
          <h1 className={cn('text-2xl font-semibold')}>Create account</h1>
          <ThemeToggle />
        </div>
        <form className={cn('flex flex-col gap-3')} onSubmit={(event) => void onSubmit(event)}>
          <label className={cn('flex flex-col gap-1 text-sm')}>
            Email
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={cn(fieldClass)}
            />
          </label>
          <label className={cn('flex flex-col gap-1 text-sm')}>
            Password
            <input
              required
              type="password"
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={cn(fieldClass)}
            />
            {password.length === 0 ? (
              <span className={cn('text-muted-foreground')}>{PASSWORD_HINT}</span>
            ) : (
              <PasswordStrength value={password} />
            )}
          </label>
          <label className={cn('flex flex-col gap-1 text-sm')}>
            Confirm password
            <input
              required
              type="password"
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={cn(fieldClass)}
            />
          </label>
          {error ? <p className={cn('text-sm text-destructive')}>{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className={cn('text-sm text-muted-foreground')}>
          Already have an account?{' '}
          <Link to="/" className={cn('underline-offset-4 hover:underline')}>
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}
