# Items

Encrypted vault items. The API stores ciphertext only.

## Requirements

### Requirement: List owned items
Authenticated `GET /api/items` MUST return the caller’s items (ciphertext, nonce, wrapped DEK, type, template id). It MUST NOT decrypt payloads.

#### Scenario: List
- **WHEN** the owner lists items
- **THEN** each row includes encryptedPayload, nonce, and wrappedDek

### Requirement: Create ciphertext only
`POST /api/items` MUST accept `vaultId`, `type`, optional `templateId`, and non-empty `encryptedPayload`, `nonce`, and `wrappedDek`. The vault MUST belong to the caller.

#### Scenario: Create
- **WHEN** the owner posts a valid ciphertext item
- **THEN** the item is stored and returned without plaintext fields

### Requirement: Delete is owner-only
`DELETE /api/items/:id` MUST succeed only for the vault owner and MUST cascade shares. Recipients MUST NOT delete the source item.

#### Scenario: Owner delete
- **WHEN** the owner deletes an item
- **THEN** the item and its shares are removed
