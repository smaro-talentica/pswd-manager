import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/utils/api'

type ShareDialogProps = {
  open: boolean
  onClose: () => void
  onShare: (email: string) => Promise<void>
}

const inputClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm'

export function ShareDialog({ open, onClose, onShare }: ShareDialogProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!open) {
    return null
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onShare(email)
      setEmail('')
      onClose()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not share')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <form
        className="flex w-full max-w-sm flex-col gap-3 rounded-lg bg-card p-5 shadow-sm md:max-w-md"
        onSubmit={(event) => void onSubmit(event)}
      >
        <h2 className="text-lg font-semibold">Share secret</h2>
        <p className="text-sm text-muted-foreground">Enter the email of someone who already has an account.</p>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            required
            type="email"
            className={inputClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? 'Sharing…' : 'Share'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null)
              setEmail('')
              onClose()
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
