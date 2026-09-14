# Two-factor

Authenticator (TOTP) setup after unlock, and a 2FA step at login.

## Requirements

### Requirement: 2FA after unlock
The unlocked vault header MUST show a 2FA control. Any signed-in account MUST be able to turn 2FA on or off from that control. The control MUST NOT appear on the vault password re-entry screen.

#### Scenario: Turn on
- **WHEN** 2FA is off and the user completes setup with a valid app code
- **THEN** 2FA is on for that account

#### Scenario: Turn off
- **WHEN** 2FA is on and the user submits a valid app code to turn it off
- **THEN** 2FA is off and the TOTP secret is cleared on the server

### Requirement: Outlined button color
The 2FA header control MUST stay outlined. It MUST be green (`success`) when 2FA is on and black (`foreground`) when 2FA is off.

#### Scenario: On
- **WHEN** `twoFactorEnabled` is true
- **THEN** the 2FA button uses the success outline color

#### Scenario: Off
- **WHEN** `twoFactorEnabled` is false
- **THEN** the 2FA button uses the foreground outline color

### Requirement: Setup QR is scannable
Setup MUST POST `/api/auth/2fa/setup` and show a QR of the `otpauth` URL using a spec-compliant encoder (`qrcode.react`), black on white, with a quiet zone. The grouped Base32 secret and an “Open in authenticator app” link MUST also be shown.

#### Scenario: Scan or type
- **WHEN** the user starts authenticator setup
- **THEN** a QR and a grouped secret are shown

### Requirement: Login asks for a code when 2FA is on
After password login, if the API returns `twoFactorRequired`, the client MUST collect a 6-digit code before the vault session is set.

#### Scenario: Login with 2FA
- **WHEN** an account with 2FA on signs in with email and password
- **THEN** the next step is the authenticator code
