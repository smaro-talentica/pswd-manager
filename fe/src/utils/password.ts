export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/

export const PASSWORD_HINT =
  'At least 8 characters, with uppercase, lowercase, a number, and a special character'

export type PasswordCheckId = 'length' | 'lower' | 'upper' | 'digit' | 'special'

export type PasswordCheck = {
  id: PasswordCheckId
  label: string
  met: boolean
}

export type StrengthLevel = 'empty' | 'weak' | 'fair' | 'strong'

export function isStrongPassword(value: string) {
  return PASSWORD_PATTERN.test(value)
}

export function passwordChecks(value: string): PasswordCheck[] {
  return [
    { id: 'length', label: 'At least 8 characters', met: value.length >= PASSWORD_MIN_LENGTH },
    { id: 'lower', label: 'A lowercase letter', met: /[a-z]/.test(value) },
    { id: 'upper', label: 'An uppercase letter', met: /[A-Z]/.test(value) },
    { id: 'digit', label: 'A number', met: /\d/.test(value) },
    { id: 'special', label: 'A special character', met: /[^A-Za-z0-9]/.test(value) },
  ]
}

export function passwordStrength(value: string): StrengthLevel {
  if (value.length === 0) {
    return 'empty'
  }
  const met = passwordChecks(value).filter((check) => check.met).length
  if (met <= 2) {
    return 'weak'
  }
  if (met <= 4) {
    return 'fair'
  }
  return 'strong'
}
