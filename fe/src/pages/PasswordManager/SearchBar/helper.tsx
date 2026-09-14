import type { DecryptedSecret } from '@/utils/secrets'

export function secretMatchesQuery(secret: DecryptedSecret, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return true
  }
  const haystack = [
    secret.fields.title,
    secret.fields.templateName,
    secret.fromEmail ?? '',
    ...secret.shares.map((share) => share.email),
    ...secret.fields.values.flatMap((field) => [field.label, field.value]),
  ]
  return haystack.some((part) => part.toLowerCase().includes(needle))
}
