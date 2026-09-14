import type { ItemType } from '@/utils/secrets'

export const TYPE_TAG_CLASS: Record<ItemType, string> = {
  LOGIN: 'tag-website',
  CARD: 'tag-card',
  IDENTITY: 'tag-identity',
  NOTE: 'tag-note',
  CUSTOM: 'tag-custom',
}
