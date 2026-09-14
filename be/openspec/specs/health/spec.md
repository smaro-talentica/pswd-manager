# Health

Liveness for local and later hosting checks.

## Requirements

### Requirement: Health is unauthenticated
`GET /api/health` MUST return `{ status: 'ok', service: 'password-manager-be' }` without a session cookie.

#### Scenario: Probe
- **WHEN** a client GET `/api/health`
- **THEN** the status is ok
