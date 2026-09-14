import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { createTemplate, deleteTemplate, listTemplates, updateTemplate, type VaultTemplate } from '@/utils/templates'

const inputClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm'

export function ManageTemplates() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [fieldLabels, setFieldLabels] = useState([''])
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: listTemplates,
  })

  const templates = templatesQuery.data ?? []
  const standard = templates.filter((template) => template.builtIn)
  const custom = templates.filter((template) => !template.builtIn)
  const count = templatesQuery.data?.length
  const formOpen = creating || Boolean(editingId)

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['templates'] })
  }

  function resetForm() {
    setCreating(false)
    setEditingId(null)
    setName('')
    setFieldLabels([''])
    setError(null)
  }

  function close() {
    setOpen(false)
    resetForm()
  }

  function startCreate() {
    setCreating(true)
    setEditingId(null)
    setName('')
    setFieldLabels([''])
    setError(null)
  }

  function startEdit(template: VaultTemplate) {
    if (template.builtIn) {
      return
    }
    setCreating(false)
    setEditingId(template.id)
    setName(template.name)
    setFieldLabels(template.fields.map((field) => field.label))
    setError(null)
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = fieldLabels.map((label) => label.trim()).filter((label) => label.length > 0)
    if (fields.length === 0) {
      setError('Add at least one field')
      return
    }
    setPending(true)
    setError(null)
    try {
      if (editingId) {
        await updateTemplate(
          editingId,
          name,
          fields.map((label) => ({ label })),
        )
      } else {
        await createTemplate(
          name,
          fields.map((label) => ({ label })),
        )
      }
      resetForm()
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the template')
    } finally {
      setPending(false)
    }
  }

  async function onDelete(templateId: string) {
    setPending(true)
    setError(null)
    try {
      await deleteTemplate(templateId)
      if (editingId === templateId) {
        resetForm()
      }
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete the template')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label={count == null ? 'Template' : `Template (${count})`}
        onClick={() => setOpen(true)}
      >
        {count == null ? 'Template' : `Template (${count})`}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="flex max-h-[90%] w-full max-w-sm flex-col gap-3 overflow-y-auto rounded-lg bg-card p-5 shadow-sm md:max-w-2xl">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Template</h2>
              <Button type="button" variant="outline" size="sm" onClick={close}>
                Close
              </Button>
            </div>

            {formOpen ? (
              <form className="flex flex-col gap-3" onSubmit={(event) => void onSave(event)}>
                <label className="flex flex-col gap-1 text-sm">
                  Title
                  <input
                    required
                    className={inputClass}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                {fieldLabels.map((label, index) => (
                  <input
                    key={index}
                    required
                    placeholder="Field"
                    className={inputClass}
                    value={label}
                    onChange={(event) => {
                      const next = [...fieldLabels]
                      next[index] = event.target.value
                      setFieldLabels(next)
                    }}
                  />
                ))}
                <Button type="button" variant="outline" onClick={() => setFieldLabels([...fieldLabels, ''])}>
                  Add field
                </Button>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <div className="flex gap-2">
                  <Button type="submit" disabled={pending}>
                    {pending ? 'Saving…' : editingId ? 'Save changes' : 'Save template'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button type="button" onClick={startCreate}>
                Add new template
              </Button>
            )}
            {error && !formOpen ? <p className="text-sm text-destructive">{error}</p> : null}

            <p className="text-sm font-medium">Standard</p>
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {standard.map((template) => (
                <li key={template.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
                  <div className="flex items-center gap-1">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{template.name}</p>
                    <span className="group relative inline-flex">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="pointer-events-none shrink-0"
                        disabled
                        aria-label="Edit template, not allowed"
                      >
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4 stroke-current">
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"
                          />
                        </svg>
                      </Button>
                      <span className="pointer-events-none absolute top-full right-0 z-20 mt-1 hidden rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background group-hover:block">
                        Not allowed
                      </span>
                    </span>
                    <span className="group relative inline-flex">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="pointer-events-none shrink-0 text-destructive"
                        disabled
                        aria-label="Delete template, not allowed"
                      >
                        <svg viewBox="3 3 18 19" fill="none" aria-hidden="true" className="size-4 stroke-current">
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
                          />
                        </svg>
                      </Button>
                      <span className="pointer-events-none absolute top-full right-0 z-20 mt-1 hidden rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background group-hover:block">
                        Not allowed
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.fields.map((field) => field.label).join(', ')}
                  </p>
                </li>
              ))}
            </ul>

            <p className="text-sm font-medium">Your templates</p>
            {custom.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom templates yet.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {custom.map((template) => (
                  <li key={template.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
                    <div className="flex items-center gap-1">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{template.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0"
                        disabled={pending}
                        aria-label="Edit template"
                        onClick={() => startEdit(template)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4 stroke-current">
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"
                          />
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-destructive"
                        disabled={pending}
                        aria-label="Delete template"
                        onClick={() => void onDelete(template.id)}
                      >
                        <svg viewBox="3 3 18 19" fill="none" aria-hidden="true" className="size-4 stroke-current">
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
                          />
                        </svg>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.fields.map((field) => field.label).join(', ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
