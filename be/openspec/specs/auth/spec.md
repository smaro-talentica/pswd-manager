# Auth

Register, login, logout, session cookies, and crypto material for unlock. The server never decrypts the vault.

## Requirements

### Requirement: httpOnly cookie pair
Successful register, login (without pending 2FA), 2FA login verify, and refresh MUST set `pm_access` (about 15 minutes) and `pm_refresh` (about 7 days) as httpOnly, Secure (except test), SameSite Lax cookies. JSON MUST NOT include access or refresh tokens. The API MUST NOT accept `Authorization: Bearer` as the session mechanism.

#### Scenario: Register sets cookies
- **WHEN** register succeeds
- **THEN** the response sets `pm_access` and `pm_refresh` and does not return those tokens in JSON

### Requirement: Password policy on register
Register password MUST be 8–128 characters and MUST include uppercase, lowercase, a digit, and a special character. Login MUST verify Argon2id against `passwordHash` only.

#### Scenario: Weak register password
- **WHEN** register is sent a password without a required class
- **THEN** the request is rejected

### Requirement: User DTO omits secrets
`GET /api/auth/me` and auth result `user` objects MUST include `id`, `email`, and `twoFactorEnabled` only. They MUST NOT include `passwordHash`, `kdfSalt`, `encryptedPrivateKey`, `totpSecret`, or vault DEKs.

#### Scenario: Me
- **WHEN** an authenticated client GET `/api/auth/me`
- **THEN** the body has id, email, and twoFactorEnabled

### Requirement: Crypto payload for unlock
`GET /api/auth/crypto` MUST return KDF salt/params, wrapped private key, and wrapped vault DEKs as opaque blobs. The server MUST NOT unwrap them.

#### Scenario: Crypto
- **WHEN** an authenticated client GET `/api/auth/crypto`
- **THEN** ciphertext and KDF parameters are returned and no plaintext private key is returned

### Requirement: Logout expires cookies
`POST /api/auth/logout` MUST clear access, refresh, and 2FA pending cookies and MUST return 204.

#### Scenario: Logout
- **WHEN** the client posts logout
- **THEN** session cookies are expired

### Requirement: Refresh rotates the access cookie
`POST /api/auth/refresh` MUST verify `pm_refresh` and set a new cookie pair. Missing or invalid refresh MUST clear cookies and return 401.

#### Scenario: Valid refresh
- **WHEN** `pm_refresh` is valid
- **THEN** new access and refresh cookies are set

### Requirement: Guarded routes use the access cookie
Protected routes MUST read `pm_access` via `AuthGuard`. Missing or invalid access MUST return 401.

#### Scenario: No cookie
- **WHEN** a client calls a guarded route without `pm_access`
- **THEN** the response status is 401
