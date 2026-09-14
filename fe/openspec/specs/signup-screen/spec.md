# Signup screen

Create-account form at `/signup` with live password strength.

## Requirements

### Requirement: Email, password, and confirm
The signup screen MUST show Email, Password, Confirm password, and Create account. Password and confirm MUST use `type="password"` and length 8–128.

#### Scenario: Fields visible
- **WHEN** the signup screen is visible
- **THEN** Email, Password, Confirm password, and Create account are present

### Requirement: Password policy
The client MUST reject a password that is not at least 8 characters or that lacks uppercase, lowercase, a digit, or a special character. The same rule is enforced by the API.

#### Scenario: Weak password
- **WHEN** the user submits a password that misses a policy rule
- **THEN** the account is not created and the policy hint is shown

### Requirement: Passwords must match
Confirm password MUST match Password.

#### Scenario: Mismatch
- **WHEN** Password and Confirm password differ
- **THEN** the account is not created

### Requirement: Live strength while typing
While the password field is non-empty, the screen MUST show Weak, Fair, or Strong, a three-segment bar, and which policy rules are met or still needed. When the field is empty, the static policy hint MUST be shown instead of the meter.

#### Scenario: Weak while typing
- **WHEN** the user types a password that meets two or fewer policy checks
- **THEN** the meter shows Weak and lists unmet rules

#### Scenario: Strong while typing
- **WHEN** the password meets all five policy checks
- **THEN** the meter shows Strong

### Requirement: Successful signup unlocks the vault
Create account MUST call `POST /api/auth/register` with client-generated crypto material (KDF salt/params, public key, wrapped private key, wrapped vault DEK) and then navigate to `/password-manager`.

#### Scenario: Valid signup
- **WHEN** the user submits a unique email and a strong matching password
- **THEN** they land on `/password-manager` with the vault unlocked

### Requirement: Theme control on signup
The signup screen MUST show the appearance toggle next to the page title.

#### Scenario: Toggle visible
- **WHEN** the signup screen is visible
- **THEN** a control to switch light and dark mode is present
