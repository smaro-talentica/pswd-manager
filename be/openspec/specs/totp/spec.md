# TOTP

Authenticator second factor. The server stores a Base32 secret and never logs it.

## Requirements

### Requirement: Login challenge when 2FA is on
If `totpEnabled` is true, `POST /api/auth/login` MUST NOT set a session. It MUST set a short-lived `pm_2fa` cookie and return `{ twoFactorRequired: true }`.

#### Scenario: Password ok, 2FA on
- **WHEN** email and password match and 2FA is enabled
- **THEN** the body is `{ twoFactorRequired: true }` and session cookies are not set

### Requirement: Verify login TOTP
`POST /api/auth/2fa/verify-login` MUST verify `pm_2fa` and a 6-digit code (30s step, SHA1, ±1 window). On success it MUST set the session cookie pair.

#### Scenario: Valid code
- **WHEN** the pending 2FA cookie is valid and the code matches
- **THEN** access and refresh cookies are set

### Requirement: Setup, enable, disable
Authenticated `POST /api/auth/2fa/setup` MUST return `{ secret, otpauthUrl }` with issuer Password Manager, algorithm SHA1, digits 6, period 30, and MUST keep `totpEnabled` false until enable. Enable and disable MUST require a valid current code. Disable MUST clear `totpSecret`.

#### Scenario: Enable
- **WHEN** setup has stored a secret and the user posts a valid code to enable
- **THEN** `totpEnabled` is true

#### Scenario: Already on
- **WHEN** 2FA is already enabled and setup is called
- **THEN** the request is forbidden
