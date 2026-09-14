# PWA runtime

Installable PWA. API traffic is never cached.

## Requirements

### Requirement: NetworkOnly for `/api/*`
Workbox MUST use `NetworkOnly` for URLs matching `/api/`. Auth routes MUST NOT be cached.

#### Scenario: Auth request
- **WHEN** the service worker handles `/api/auth/me`
- **THEN** the request goes to the network and is not served from cache

### Requirement: Dev does not keep a stale service worker
In development, the app MUST unregister existing service workers before boot and reload once if one was removed, so a leftover worker cannot intercept `/api`.

#### Scenario: Dev boot with an old worker
- **WHEN** the dev app finds a registered service worker
- **THEN** it unregisters it and reloads once

### Requirement: HTTPS in development
`npm run dev` MUST serve the app over HTTPS (basic-ssl). `/api` MUST be proxied to the Nest server on HTTP.

#### Scenario: Local PWA
- **WHEN** the user runs the frontend dev server
- **THEN** the origin is `https://localhost:5173` and API calls use the `/api` proxy
