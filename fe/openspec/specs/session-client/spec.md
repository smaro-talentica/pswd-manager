# Session client

httpOnly cookie session. Fetch always includes credentials. Expired access cookies refresh without a full page reload.

## Requirements

### Requirement: No token storage in web storage
The client MUST NOT write access or refresh tokens to `localStorage` or `sessionStorage`. Session cookies are set by the API (`httpOnly`). Every API `fetch` MUST use `credentials: 'include'`. The client MUST NOT send `Authorization: Bearer`.

#### Scenario: Login
- **WHEN** login succeeds
- **THEN** the client does not store a JWT in web storage

### Requirement: Logout is a server round-trip
Logout MUST `POST /api/auth/logout` so the server expires cookies. Clearing React state alone is not logout.

#### Scenario: Log out
- **WHEN** the user activates Log out
- **THEN** the client calls logout and returns to `/`

### Requirement: Restore session from `/api/auth/me`
On boot the client MUST call `GET /api/auth/me`. On 401 it MUST try `POST /api/auth/refresh` (via the shared fetch helper) and retry. Keys MUST still require the vault password.

#### Scenario: Refresh the tab
- **WHEN** a user with a valid refresh cookie reloads
- **THEN** they remain signed in and must re-enter the password to view secrets

### Requirement: Automatic access refresh
Authenticated API calls other than login, register, refresh, logout, and 2FA login-verify MUST, on 401, refresh the session once and retry. Concurrent 401s MUST share one refresh. If refresh fails, the client MUST drop the in-memory session so the user returns to login.

#### Scenario: Expired access on Continue
- **WHEN** the access cookie is expired and the refresh cookie is valid
- **THEN** unlocking retries after refresh and does not require a manual page reload

#### Scenario: Refresh cookie gone
- **WHEN** refresh also fails
- **THEN** the user is treated as signed out
