# Sharing

Share an owned secret with another user by email. The item DEK is wrapped with the recipient’s public key in the browser.

## Requirements

### Requirement: Share from an owned card
An owned secret MUST offer share. Share MUST look up the recipient by email, wrap the item DEK with their public key, and POST the wrapped key. The item MUST then appear on Shared vault.

#### Scenario: Share by email
- **WHEN** the owner shares with a registered user’s email
- **THEN** a share record is created and the item moves to Shared vault

### Requirement: Recipient sees the secret
The recipient MUST load received shares, unwrap with their private key, and list them on Shared vault without owner delete/share-out controls.

#### Scenario: Received item
- **WHEN** another user shared an item to this account
- **THEN** it appears under Shared vault after unlock

### Requirement: Owner can revoke
The owner MUST be able to revoke a share. When no shares remain, an owned item MUST return to Private vault.

#### Scenario: Revoke last share
- **WHEN** the owner revokes every share on an item
- **THEN** the item is listed under Private vault
