import { api } from '@/utils/api'
import {
  createItemDek,
  decryptJson,
  encryptJson,
  exportRawKey,
  unwrapFromSender,
  unwrapWithVaultKey,
  wrapForRecipient,
  wrapWithVaultKey,
} from '@/utils/crypto'
import type { VaultTemplate } from '@/utils/templates'

export type ItemType = 'LOGIN' | 'NOTE' | 'CARD' | 'IDENTITY' | 'CUSTOM'

export type SecretValue = { id: string; label: string; value: string }

export type SecretFields = {
  title: string
  templateName: string
  values: SecretValue[]
}

type LegacySecretFields =
  | { kind: 'LOGIN'; title: string; email: string; password: string }
  | { kind: 'CARD'; title: string; number: string; expiry: string; cvv: string }
  | { kind: 'IDENTITY'; title: string; pan: string }
  | { kind: 'NOTE'; title: string; text: string }
  | { kind: 'CUSTOM'; title: string; fields: Array<{ name: string; value: string }> }
  | SecretFields

export type OwnedItemDto = {
  id: string
  vaultId: string
  templateId?: string | null
  type: ItemType
  encryptedPayload: string
  nonce: string
  wrappedDek: string
  createdAt: string
  shares: Array<{ id: string; email: string; userId: string }>
}

export type ReceivedShareDto = {
  shareId: string
  fromEmail: string
  fromPublicKey: string
  wrappedKey: string
  item: {
    id: string
    vaultId: string
    type: ItemType
    encryptedPayload: string
    nonce: string
    createdAt: string
  }
}

export type DecryptedSecret = {
  id: string
  type: ItemType
  fields: SecretFields
  itemDek: CryptoKey
  shares: Array<{ id: string; email: string }>
  fromEmail?: string
  owned: boolean
}

export function listOwnedItems() {
  return api<OwnedItemDto[]>('/api/items')
}

export function listReceivedShares() {
  return api<ReceivedShareDto[]>('/api/shares/received')
}

export function lookupUser(email: string) {
  return api<{ id: string; email: string; publicKey: string }>(
    `/api/users/lookup?email=${encodeURIComponent(email.trim().toLowerCase())}`,
  )
}

export function normalizeSecretFields(raw: LegacySecretFields): SecretFields {
  if ('values' in raw && Array.isArray(raw.values)) {
    return {
      title: raw.title,
      templateName: raw.templateName,
      values: raw.values,
    }
  }
  if (!('kind' in raw)) {
    return { title: 'Secret', templateName: 'Custom', values: [] }
  }
  if (raw.kind === 'LOGIN') {
    return {
      title: raw.title,
      templateName: 'Website',
      values: [
        { id: 'email', label: 'Email', value: raw.email },
        { id: 'password', label: 'Password', value: raw.password },
      ],
    }
  }
  if (raw.kind === 'CARD') {
    return {
      title: raw.title,
      templateName: 'Credit card',
      values: [
        { id: 'number', label: 'Number', value: raw.number },
        { id: 'expiry', label: 'Expiry', value: raw.expiry },
        { id: 'cvv', label: 'CVV', value: raw.cvv },
      ],
    }
  }
  if (raw.kind === 'IDENTITY') {
    return {
      title: raw.title,
      templateName: 'PAN card',
      values: [{ id: 'pan', label: 'PAN ID', value: raw.pan }],
    }
  }
  if (raw.kind === 'NOTE') {
    return {
      title: raw.title,
      templateName: 'Secure note',
      values: [{ id: 'text', label: 'Note', value: raw.text }],
    }
  }
  return {
    title: raw.title,
    templateName: 'Custom',
    values: raw.fields.map((field, index) => ({
      id: `field-${index}`,
      label: field.name,
      value: field.value,
    })),
  }
}

export async function createOwnedSecret(
  vaultId: string,
  vaultKey: CryptoKey,
  template: VaultTemplate,
  values: Record<string, string>,
): Promise<OwnedItemDto> {
  const itemDek = await createItemDek()
  const raw = await exportRawKey(itemDek)
  const mapped = template.fields.map((field) => ({
    id: field.id,
    label: field.label,
    value: values[field.id] ?? '',
  }))
  const fields: SecretFields = {
    title:
      mapped.find((field) => field.id === 'name')?.value.trim() ||
      mapped.find((field) => field.id === 'text')?.value.trim() ||
      mapped[0]?.value.trim() ||
      template.name,
    templateName: template.name,
    values: mapped,
  }
  const wrapped = await encryptJson(itemDek, fields)
  return api<OwnedItemDto>('/api/items', {
    method: 'POST',
    body: JSON.stringify({
      vaultId,
      type: template.itemType,
      templateId: template.id,
      encryptedPayload: wrapped.encryptedPayload,
      nonce: wrapped.nonce,
      wrappedDek: await wrapWithVaultKey(vaultKey, raw),
    }),
  })
}

export async function decryptOwnedItem(item: OwnedItemDto, vaultKey: CryptoKey): Promise<DecryptedSecret> {
  const itemDek = await unwrapWithVaultKey(vaultKey, item.wrappedDek)
  const fields = normalizeSecretFields(
    await decryptJson<LegacySecretFields>(itemDek, item.nonce, item.encryptedPayload),
  )
  return {
    id: item.id,
    type: item.type,
    fields,
    itemDek,
    shares: item.shares.map((share) => ({ id: share.id, email: share.email })),
    owned: true,
  }
}

export async function decryptReceivedShare(
  share: ReceivedShareDto,
  privateKey: CryptoKey,
): Promise<DecryptedSecret> {
  const itemDek = await unwrapFromSender(privateKey, share.fromPublicKey, share.wrappedKey)
  const fields = normalizeSecretFields(
    await decryptJson<LegacySecretFields>(itemDek, share.item.nonce, share.item.encryptedPayload),
  )
  return {
    id: share.item.id,
    type: share.item.type,
    fields,
    itemDek,
    shares: [],
    fromEmail: share.fromEmail,
    owned: false,
  }
}

export async function shareSecret(itemId: string, email: string, itemDek: CryptoKey, privateKey: CryptoKey) {
  const recipient = await lookupUser(email)
  const wrappedKey = await wrapForRecipient(privateKey, recipient.publicKey, await exportRawKey(itemDek))
  return api<{ id: string; email: string; userId: string }>('/api/shares', {
    method: 'POST',
    body: JSON.stringify({ itemId, email: recipient.email, wrappedKey }),
  })
}

export function revokeShare(shareId: string) {
  return api<void>(`/api/shares/${shareId}`, { method: 'DELETE' })
}

export function deleteOwnedSecret(itemId: string) {
  return api<void>(`/api/items/${itemId}`, { method: 'DELETE' })
}
