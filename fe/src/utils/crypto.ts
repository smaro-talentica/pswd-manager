const IV_LENGTH = 12
const SALT_LENGTH = 16
const KDF_ITERATIONS = 600_000

export type KdfParams = {
  name: 'PBKDF2'
  hash: 'SHA-256'
  iterations: number
  length: number
}

export const defaultKdfParams: KdfParams = {
  name: 'PBKDF2',
  hash: 'SHA-256',
  iterations: KDF_ITERATIONS,
  length: 256,
}

export type CryptoPayload = {
  kdfSalt: string
  kdfParams: KdfParams
  encryptedPrivateKey: string
  vaults: Array<{ id: string; encryptedDek: string }>
}

export type RegisterCrypto = {
  kdfSalt: string
  kdfParams: KdfParams
  publicKey: string
  encryptedPrivateKey: string
  encryptedDek: string
}

export type UnlockedKeys = {
  privateKey: CryptoKey
  vaultKeys: Record<string, CryptoKey>
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function concatIv(iv: Uint8Array, wrapped: ArrayBuffer): Uint8Array {
  const payload = new Uint8Array(wrapped)
  const out = new Uint8Array(iv.length + payload.length)
  out.set(iv, 0)
  out.set(payload, iv.length)
  return out
}

function splitIv(blob: Uint8Array): { iv: Uint8Array; data: Uint8Array } {
  if (blob.length <= IV_LENGTH) {
    throw new Error('Ciphertext is too short')
  }
  return {
    iv: blob.slice(0, IV_LENGTH),
    data: blob.slice(IV_LENGTH),
  }
}

async function importPassword(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
}

export async function deriveKek(
  password: string,
  salt: Uint8Array,
  params: KdfParams,
): Promise<CryptoKey> {
  const keyMaterial = await importPassword(password)
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: params.iterations,
      hash: params.hash,
    },
    keyMaterial,
    { name: 'AES-GCM', length: params.length },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function encryptBytes(kek: CryptoKey, plaintext: BufferSource): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    kek,
    plaintext,
  )
  return concatIv(iv, ciphertext)
}

async function decryptBytes(kek: CryptoKey, blob: Uint8Array): Promise<ArrayBuffer> {
  const { iv, data } = splitIv(blob)
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    kek,
    toArrayBuffer(data),
  )
}

export async function createRegisterCrypto(masterPassword: string): Promise<RegisterCrypto> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const kek = await deriveKek(masterPassword, salt, defaultKdfParams)

  const keyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveKey',
    'deriveBits',
  ])
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey))
  const privatePkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

  const dek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
  const dekRaw = await crypto.subtle.exportKey('raw', dek)

  return {
    kdfSalt: bytesToBase64(salt),
    kdfParams: defaultKdfParams,
    publicKey: bytesToBase64(publicKey),
    encryptedPrivateKey: bytesToBase64(await encryptBytes(kek, privatePkcs8)),
    encryptedDek: bytesToBase64(await encryptBytes(kek, dekRaw)),
  }
}

export async function unlockKeys(masterPassword: string, payload: CryptoPayload): Promise<UnlockedKeys> {
  const kek = await deriveKek(masterPassword, base64ToBytes(payload.kdfSalt), payload.kdfParams)
  const privatePkcs8 = await decryptBytes(kek, base64ToBytes(payload.encryptedPrivateKey))
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privatePkcs8,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey', 'deriveBits'],
  )

  const vaultKeys: Record<string, CryptoKey> = {}
  for (const vault of payload.vaults) {
    const dekRaw = await decryptBytes(kek, base64ToBytes(vault.encryptedDek))
    vaultKeys[vault.id] = await crypto.subtle.importKey('raw', dekRaw, { name: 'AES-GCM', length: 256 }, false, [
      'encrypt',
      'decrypt',
    ])
  }

  return { privateKey, vaultKeys }
}

export async function encryptJson(
  key: CryptoKey,
  data: unknown,
): Promise<{ nonce: string; encryptedPayload: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(JSON.stringify(data))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    encoded,
  )
  return {
    nonce: bytesToBase64(iv),
    encryptedPayload: bytesToBase64(new Uint8Array(ciphertext)),
  }
}

export async function decryptJson<T>(key: CryptoKey, nonce: string, encryptedPayload: string): Promise<T> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(nonce)) },
    key,
    toArrayBuffer(base64ToBytes(encryptedPayload)),
  )
  return JSON.parse(new TextDecoder().decode(plaintext)) as T
}

export async function createItemDek(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

export async function exportRawKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key)
}

export async function importItemDek(raw: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
}

export async function wrapWithVaultKey(vaultKey: CryptoKey, raw: BufferSource): Promise<string> {
  return bytesToBase64(await encryptBytes(vaultKey, raw))
}

export async function unwrapWithVaultKey(vaultKey: CryptoKey, wrappedDek: string): Promise<CryptoKey> {
  const raw = await decryptBytes(vaultKey, base64ToBytes(wrappedDek))
  return importItemDek(raw)
}

async function importSpki(publicKeyB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    toArrayBuffer(base64ToBytes(publicKeyB64)),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )
}

async function ecdhAes(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function wrapForRecipient(
  myPrivateKey: CryptoKey,
  recipientPublicKeyB64: string,
  itemDekRaw: BufferSource,
): Promise<string> {
  const theirPublic = await importSpki(recipientPublicKeyB64)
  const shared = await ecdhAes(myPrivateKey, theirPublic)
  return bytesToBase64(await encryptBytes(shared, itemDekRaw))
}

export async function unwrapFromSender(
  myPrivateKey: CryptoKey,
  senderPublicKeyB64: string,
  wrappedKey: string,
): Promise<CryptoKey> {
  const theirPublic = await importSpki(senderPublicKeyB64)
  const shared = await ecdhAes(myPrivateKey, theirPublic)
  const raw = await decryptBytes(shared, base64ToBytes(wrappedKey))
  return importItemDek(raw)
}
