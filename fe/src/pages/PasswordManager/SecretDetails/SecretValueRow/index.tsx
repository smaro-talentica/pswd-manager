import { cn } from '@/utils/cn'

type SecretValueRowProps = {
  label: string
  value: string
  visible: boolean
  multiline?: boolean
}

const HIDDEN = '*******'

export function SecretValueRow({ label, value, visible, multiline = false }: SecretValueRowProps) {
  return (
    <p className={cn('min-w-0', multiline && visible && 'whitespace-pre-wrap')}>
      {label}: {visible ? value : HIDDEN}
    </p>
  )
}
