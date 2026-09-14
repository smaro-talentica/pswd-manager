import { SecretValueRow } from '@/pages/PasswordManager/SecretDetails/SecretValueRow'
import type { SecretFields } from '@/utils/secrets'

export function SecretDetails({ fields, revealed }: { fields: SecretFields; revealed: boolean }) {
  const rows = fields.values.filter((field) => field.id !== 'name')
  if (rows.length === 0) {
    return null
  }
  return (
    <div className="flex flex-col gap-1 text-sm">
      {rows.map((field) => (
        <SecretValueRow
          key={field.id}
          label={field.label}
          value={field.value}
          visible={revealed}
          multiline={field.id === 'text'}
        />
      ))}
    </div>
  )
}
