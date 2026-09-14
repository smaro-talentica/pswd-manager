import { cn } from '@/utils/cn'
import { passwordChecks, passwordStrength } from '@/utils/password'
import { STRENGTH_LABEL, strengthFillClass, strengthFillCount, strengthLabelClass } from './helper'

export function PasswordStrength({ value }: { value: string }) {
  const level = passwordStrength(value)
  if (level === 'empty') {
    return null
  }
  const checks = passwordChecks(value)
  const filled = strengthFillCount(level)
  const fillClass = strengthFillClass(level)

  return (
    <div className={cn('flex flex-col gap-2')}>
      <div className={cn('grid grid-cols-3 gap-1')} aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span key={index} className={cn('h-1 rounded-full', index < filled ? fillClass : 'bg-muted')} />
        ))}
      </div>
      <p className={cn('text-sm font-medium', strengthLabelClass(level))}>{STRENGTH_LABEL[level]}</p>
      <ul className={cn('flex flex-col gap-1')}>
        {checks.map((check) => (
          <li
            key={check.id}
            className={cn('text-sm', check.met ? 'text-success' : 'text-muted-foreground')}
          >
            {check.met ? 'Met — ' : 'Need — '}
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
