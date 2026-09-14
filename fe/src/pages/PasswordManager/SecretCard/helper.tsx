import { TYPE_TAG_CLASS } from './constant'
import type { ItemType } from '@/utils/secrets'

export function tagClassForSecret(type: ItemType, templateName: string): string {
  const name = templateName.trim().toLowerCase()
  if (name === 'website') {
    return TYPE_TAG_CLASS.LOGIN
  }
  if (name === 'credit card') {
    return TYPE_TAG_CLASS.CARD
  }
  if (name === 'pan card') {
    return TYPE_TAG_CLASS.IDENTITY
  }
  if (name === 'secure note' || name === 'secured note') {
    return TYPE_TAG_CLASS.NOTE
  }
  if (name === 'custom') {
    return TYPE_TAG_CLASS.CUSTOM
  }
  return TYPE_TAG_CLASS[type]
}
