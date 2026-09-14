# Shares

Wrap an item DEK for a recipient. The server stores `wrappedKey` bytes only.

## Requirements

### Requirement: Lookup by email
Authenticated `GET /api/users/lookup?email=` MUST return the recipient’s id, email, and public key when the user exists, without password or private-key material.

#### Scenario: Known email
- **WHEN** the owner looks up a registered email
- **THEN** publicKey is returned for wrapping

### Requirement: Create share
`POST /api/shares` MUST record `itemId`, recipient, and `wrappedKey` for an item the caller owns. Duplicate recipient on the same item MUST be rejected.

#### Scenario: Share owned item
- **WHEN** the owner posts a wrapped key for another user
- **THEN** a share row is stored

### Requirement: List received
`GET /api/shares/received` MUST return shares for the current user, including ciphertext needed to decrypt after unwrap.

#### Scenario: Recipient list
- **WHEN** the recipient lists received shares
- **THEN** wrappedKey and item ciphertext are included

### Requirement: Revoke
`DELETE /api/shares/:id` MUST succeed only for the share’s sender (`fromUserId`) and MUST return 204.

#### Scenario: Revoke
- **WHEN** the owner deletes a share id they created
- **THEN** the share is gone
