# HTTP setup

Shared NestJS HTTP configuration for every API module.

## Requirements

### Requirement: Global `/api` prefix
The application MUST register routes under `/api` via `configureApp`. Tests MUST call `configureApp(app)`.

#### Scenario: Health
- **WHEN** a client GET `/api/health`
- **THEN** the health controller handles the request

### Requirement: CORS with credentials
CORS MUST allow the configured `FRONTEND_ORIGIN` (default `https://localhost:5173`) and MUST allow credentials.

#### Scenario: Credentialed browser call
- **WHEN** the PWA calls the API with `credentials: 'include'`
- **THEN** CORS allows the frontend origin

### Requirement: Cookie parser and validation pipe
The app MUST parse cookies and MUST apply a global `ValidationPipe` with whitelist, transform, and forbidNonWhitelisted.

#### Scenario: Unknown DTO field
- **WHEN** a request body includes a field not on the DTO
- **THEN** the request is rejected
