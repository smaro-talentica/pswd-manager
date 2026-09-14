# Client crypto

Zero-knowledge: encrypt and decrypt in the browser. The API stores ciphertext only.

## Requirements

### Requirement: Login password unwraps vault keys locally
Signup MUST generate an ECDH P-256 key pair, derive a KEK from the password and salt (PBKDF2 via Web Crypto), wrap the private key and vault DEK, and send those blobs to the API. Unlock MUST derive the KEK in the browser and unwrap. Keys MUST live in memory only.

#### Scenario: Unlock
- **WHEN** the user enters the correct password after a reload
- **THEN** the private key and vault DEK are available in memory and not written to `localStorage` or `sessionStorage`

### Requirement: Item payloads are ciphertext
Creating an item MUST AES-GCM encrypt the field payload in the client and send `encryptedPayload`, `nonce`, and `wrappedDek`. The client MUST NOT send plaintext passwords, notes, or TOTP secrets as item bodies.

#### Scenario: Save secret
- **WHEN** the user saves a website password
- **THEN** the request body contains ciphertext fields, not the plaintext password

### Requirement: Share wraps the item DEK
Sharing MUST wrap the item DEK with the recipient’s public key in the browser. The API MUST store `wrappedKey` bytes only.

#### Scenario: Share wrap
- **WHEN** the owner shares an item
- **THEN** the server receives a wrapped key, not the item DEK in the clear
