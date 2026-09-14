import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/feature/ThemeToggle'

type TotpStepProps = {
  onVerify: (code: string) => Promise<void>
  onBack: () => void
}

export function TotpStep({ onVerify, onBack }: TotpStepProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onVerify(code)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid authenticator code')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Authenticator code</h1>
          <ThemeToggle />
        </div>
        <p className="text-sm text-muted-foreground">Open Google Authenticator or a similar app and enter the 6-digit code.</p>
        <form className="flex flex-col gap-3" onSubmit={(event) => void onSubmit(event)}>
          <label className="flex flex-col gap-1 text-sm">
            Code
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3"
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? 'Checking…' : 'Continue'}
          </Button>
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        </form>
      </div>
    </main>
  )
}
