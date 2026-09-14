# Vault screen

Unlocked vault at `/password-manager`: private and shared lists, search, add/delete/share, templates, and 2FA.

## Requirements

### Requirement: Unlock before secrets
After a reload, keys MUST NOT be restored from storage. The page MUST ask for the login password, call `GET /api/auth/crypto`, and unwrap keys in the browser. Template and 2FA controls MUST be hidden until unlock. Email and Log out MUST remain visible. Appearance toggle MAY remain visible.

#### Scenario: Re-enter password
- **WHEN** a signed-in user has no in-memory keys
- **THEN** they see “Enter your password to view secrets” without Template or 2FA

#### Scenario: Unlock succeeds
- **WHEN** the password unwraps the private key and vault DEK
- **THEN** private and shared vault lists are shown

### Requirement: Private and shared tabs
The unlocked vault MUST have Private vault and Shared vault tabs. Owned items with no shares belong in Private. Owned items with shares and received shares belong in Shared.

#### Scenario: New owned secret
- **WHEN** the user adds a secret and has not shared it
- **THEN** it appears under Private vault

#### Scenario: Shared item
- **WHEN** an owned secret has at least one share, or the item was received
- **THEN** it appears under Shared vault

### Requirement: Search filters the current tab
Search MUST filter the active tab. On a medium-or-wider viewport, the search field MUST be one secret-card column wide.

#### Scenario: No match
- **WHEN** the query matches no secrets in the current tab
- **THEN** the empty-match copy is shown

### Requirement: Add secret is a dialog
Private vault MUST offer Add secret. The form MUST open in a centered dialog, require a template first, and send only ciphertext to the API.

#### Scenario: Add from template
- **WHEN** the user picks a template, fills its fields, and saves
- **THEN** a new owned item is stored as ciphertext and listed in Private vault

### Requirement: Secret card controls
Each owned secret MUST show a type tag, name, a control to reveal all fields, a share control, and a delete control aligned with the field text. Received shares MUST NOT show delete or share-out.

#### Scenario: Reveal
- **WHEN** the user activates the card eye
- **THEN** all field values on that card are shown

#### Scenario: Delete owned
- **WHEN** the owner deletes a secret
- **THEN** the item is removed and shares cascade

### Requirement: Layout
On a phone-width viewport the secret list MUST be one column. On `md` and up it MUST be two columns. Page chrome MUST use the shared shell (`max-w-lg` on small, wider on `md`/`lg`).

#### Scenario: Two columns on desktop
- **WHEN** the viewport is `md` or larger
- **THEN** secret cards layout in two columns
