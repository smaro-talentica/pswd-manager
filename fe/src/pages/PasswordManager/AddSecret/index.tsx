import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { listTemplates, type VaultTemplate } from '@/utils/templates'

type AddSecretProps = {
  onAdd: (template: VaultTemplate, values: Record<string, string>) => Promise<void>
}

const inputClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm'

export function AddSecret({ onAdd }: AddSecretProps) {
  const [open, setOpen] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: listTemplates,
  })

  const templates = templatesQuery.data ?? []
  const template = templates.find((entry) => entry.id === templateId) ?? null

  function reset() {
    setTemplateId('')
    setValues({})
    setError(null)
  }

  function close() {
    reset()
    setOpen(false)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!template) {
      setError('Select a template')
      return
    }
    setPending(true)
    setError(null)
    try {
      await onAdd(template, values)
      close()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the secret')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button type="button" className="w-full md:w-auto" onClick={() => setOpen(true)}>
        Add secret
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <form
            className="flex max-h-[90%] w-full max-w-sm flex-col gap-3 overflow-y-auto rounded-lg bg-card p-5 shadow-sm md:max-w-md"
            onSubmit={(event) => void onSubmit(event)}
          >
            <h2 className="text-lg font-semibold">Add secret</h2>
            <label className="flex flex-col gap-1 text-sm">
              Template
              <select
                required
                className={inputClass}
                value={templateId}
                onChange={(event) => {
                  setTemplateId(event.target.value)
                  setValues({})
                }}
              >
                <option value="">Select template</option>
                {templates.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            {template
              ? template.fields.map((field) =>
                  field.input === 'textarea' ? (
                    <label key={field.id} className="flex flex-col gap-1 text-sm">
                      {field.label}
                      <textarea
                        required
                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={values[field.id] ?? ''}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, [field.id]: event.target.value }))
                        }
                      />
                    </label>
                  ) : (
                    <label key={field.id} className="flex flex-col gap-1 text-sm">
                      {field.label}
                      <input
                        required
                        type={field.input === 'email' || field.input === 'password' ? field.input : 'text'}
                        placeholder={field.id === 'expiry' ? 'MM/YY' : undefined}
                        className={inputClass}
                        value={values[field.id] ?? ''}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, [field.id]: event.target.value }))
                        }
                      />
                    </label>
                  ),
                )
              : null}
            {templatesQuery.isPending ? <p className="text-sm text-muted-foreground">Loading templates…</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={pending || !template}>
                {pending ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
