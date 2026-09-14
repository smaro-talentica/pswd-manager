import type { StrengthLevel } from '@/utils/password'

export const STRENGTH_LABEL: Record<Exclude<StrengthLevel, 'empty'>, string> = {
  weak: 'Weak',
  fair: 'Fair',
  strong: 'Strong',
}

export function strengthFillCount(level: Exclude<StrengthLevel, 'empty'>) {
  if (level === 'weak') {
    return 1
  }
  if (level === 'fair') {
    return 2
  }
  return 3
}

export function strengthFillClass(level: Exclude<StrengthLevel, 'empty'>) {
  if (level === 'weak') {
    return 'bg-destructive'
  }
  if (level === 'fair') {
    return 'bg-tag-identity'
  }
  return 'bg-success'
}

export function strengthLabelClass(level: Exclude<StrengthLevel, 'empty'>) {
  if (level === 'weak') {
    return 'text-destructive'
  }
  if (level === 'fair') {
    return 'text-tag-identity'
  }
  return 'text-success'
}
