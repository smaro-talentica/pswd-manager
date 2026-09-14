# Routing

Browser routes for the PWA. Auth session wraps every page.

## Requirements

### Requirement: One createBrowserRouter registry
The application MUST register routes in `src/AppRoute/index.tsx` with `createBrowserRouter`. There MUST be a root layout that provides `AuthSessionProvider` and a `bg-background text-foreground` surface.

#### Scenario: Open the app
- **WHEN** the user loads the PWA
- **THEN** routing is owned by the AppRoute registry

### Requirement: Login is `/`
The application MUST render the login screen at `/`. Path `/login` MUST redirect to `/`.

#### Scenario: Open `/`
- **WHEN** the user opens `/`
- **THEN** the login screen is shown

#### Scenario: Open `/login`
- **WHEN** the user opens `/login`
- **THEN** they are redirected to `/`

### Requirement: Signup is `/signup`
The application MUST render the create-account screen at `/signup`.

#### Scenario: Open `/signup`
- **WHEN** the user opens `/signup`
- **THEN** the create-account screen is shown

### Requirement: Vault is `/password-manager`
The application MUST render the vault at `/password-manager`. An anonymous visitor MUST be sent to `/`.

#### Scenario: Signed-in user
- **WHEN** a signed-in user opens `/password-manager`
- **THEN** the vault (or vault unlock) is shown

#### Scenario: Anonymous user
- **WHEN** an anonymous user opens `/password-manager`
- **THEN** they are redirected to `/`
