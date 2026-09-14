# Login screen

Email and password sign-in at `/`. When the account has 2FA on, a second step asks for the authenticator code.

## Requirements

### Requirement: Email and password fields
The login screen MUST show Email and Password fields and a Log in control. Password MUST use `type="password"` and the shared min/max length (8–128).

#### Scenario: Fields visible
- **WHEN** the login screen is visible
- **THEN** Email, Password, and Log in are present

### Requirement: Successful login without 2FA
When the account does not have 2FA enabled, Log in MUST call `POST /api/auth/login` with `credentials: 'include'`, unlock vault keys in the browser, and navigate to `/password-manager`.

#### Scenario: Password-only account
- **WHEN** the user submits a valid email and password for an account without 2FA
- **THEN** they land on `/password-manager` with the vault unlocked

### Requirement: 2FA login step
When the API returns `twoFactorRequired`, the login screen MUST show the authenticator-code step instead of setting a full session. Submitting a valid 6-digit code MUST call `POST /api/auth/2fa/verify-login` and then open the vault.

#### Scenario: 2FA required
- **WHEN** login succeeds on password but the account has 2FA on
- **THEN** the user is asked for a 6-digit authenticator code

#### Scenario: Back from 2FA
- **WHEN** the user activates Back on the authenticator step
- **THEN** they return to email/password login

### Requirement: Signed-in visitors skip login
If the session is already signed in, `/` MUST redirect to `/password-manager`.

#### Scenario: Existing session
- **WHEN** a signed-in user opens `/`
- **THEN** they are redirected to `/password-manager`

### Requirement: Theme control on login
The login screen MUST show the appearance toggle next to the page title.

#### Scenario: Toggle visible
- **WHEN** the login screen is visible
- **THEN** a control to switch light and dark mode is present

### Requirement: Link to signup
The login screen MUST link to `/signup`.

#### Scenario: Create an account
- **WHEN** the user activates Create an account
- **THEN** the route is `/signup`
