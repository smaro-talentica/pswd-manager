# AGENTS.md

Instructions for AI agents and humans continuing this repo. Read this before writing code.

## Product

Personal password manager with:

- **Secure storage** — zero-knowledge vault. The server stores ciphertext only.
- **Sharing** — wrap an item’s data key with the recipient’s public key.
- **Custom data templates** — user-defined field schemas (labels/types only on the server).
- **PWA** — installable, mobile-friendly UI in `fe/`.

Clients:

| Folder | Stack | Audience |
| --- | --- | --- |
| `fe/` | Vite 8 + React 19 + TypeScript + Tailwind + shadcn/ui + PWA | Web / installed PWA |
| `be/` | NestJS 12 (ESM) + Prisma 7 + PostgreSQL 16 | API |

Same backend for every client. Do not invent a second API or auth contract.

## Current scaffold (already done)

- `fe/` — Vite React TS PWA, React Router, TanStack Query, Tailwind, shadcn `Button`, HTTPS dev, `/api` proxy, Workbox `NetworkOnly` for `/api/*`.
- `be/` — NestJS ESM, `ConfigModule` + Zod env schema, global `/api` prefix, CORS + credentials, `ValidationPipe`, `GET /api/health`.
- `be/prisma/schema.prisma` — `User`, `Vault`, `Folder`, `Item`, `Template`, `Share`.
- `be/src/prisma/` — `PrismaService` / `PrismaModule` ready; **do not import `PrismaModule` into `AppModule` until the first migration has run**. `npx prisma generate` already works. Pin the Prisma CLI to **7.9.x** (`prisma@7.9.1`); 7.10’s CLI currently fails to install (`effect@^4.0.0-rc.114` missing).
- `docker-compose.yml` — local Postgres 16.

Frontend package name: `password-manager` @ `0.1.0`. Backend package name should stay `password-manager-be` @ `0.1.0`.

## How to run

```bash
# First time: install deps + migrate (see README), then from repo root:
npm run dev
```

`npm run dev` runs `docker compose up` (Postgres), waits for a healthy DB, then starts `be` (`start:dev`) and `fe` (`dev`) together. You can still run `fe/` and `be/` separately.

- FE: `https://localhost:5173` (trust the basic-ssl cert).
- BE: `http://localhost:3000/api/health`.
- Node `>=24.17.0`, npm `>=11.13.0`.

## Non-negotiable security

1. **Zero-knowledge.** Encrypt/decrypt in the browser with Web Crypto. The API stores `Bytes` ciphertext, nonces, wrapped keys, and KDF parameters. Never persist plaintext passwords, notes, TOTP secrets, or template *values*.
2. **httpOnly cookies for session.** Do not put access/refresh tokens in `localStorage` or `sessionStorage`. Login sets cookies (`httpOnly`, `secure`, `sameSite`). Every `fetch` uses `credentials: 'include'`. Never send `Authorization: Bearer`.
3. **Logout is a server round-trip** that expires the cookie. Clearing React state is not logout.
4. **Short-lived access + longer refresh** cookies. Revoke on the server.
5. **Never cache `/api/*`** in the service worker (`NetworkOnly` is already configured). Especially never cache `/api/auth/*`.
6. **No hardcoded secrets** in source. Use `fe` `VITE_*` env and `be` `.env` (gitignored). `.env.example` only.
7. **Sanitize any HTML** from the API or users with DOMPurify before `dangerouslySetInnerHTML`.
8. **Login password ≠ vault key.** `User.passwordHash` is only for authentication (Argon2id). Vault DEKs are derived client-side (Argon2id/PBKDF2 via Web Crypto) and wrap item keys. Sharing uses the recipient `publicKey`.

### Crypto sketch (implement in `fe`, not `be`)

1. Signup: generate user key pair; derive KEK from master password + `kdfSalt`; wrap private key → `encryptedPrivateKey`; send verifier hash for login.
2. Unlock: derive KEK locally; unwrap private key; unwrap vault `encryptedDek`.
3. Item write: AES-GCM encrypt payload in the client; send `encryptedPayload` + `nonce`.
4. Share: wrap item DEK with recipient public key → `Share.wrappedKey`.

Do not roll a custom TLS replacement. Do not log ciphertext, keys, or cookies.

## Frontend conventions (`fe/src`)

```
AppRoute/          createBrowserRouter registry
assets/
components/ui/     presentational only (shadcn)
components/feature/  styling + logic, one component per folder
pages/<Page>/index.tsx
utils/             cn.ts, env.ts, later api.ts / crypto.ts
```

- One React component per folder. Page-only children live under `pages/<Page>/<Child>/`.
- Import alias `@/` → `src/`. Typed env only via `@/utils/env` (never `import.meta.env` in features).
- No `console.log` / `warn` / `error` in production-bound code.
- Phone-friendly first: content column `w-full max-w-sm mx-auto`, named Tailwind tokens (no hex in `src/`).
- PWA icons in `public/` are placeholders — replace before shipping.

When adding shadcn components: `npx shadcn@latest add <name> -y` (registry may need network). `Button` is already vendored in `src/components/ui/button.tsx`.

## Backend conventions (`be/src`)

- NestJS **ESM**: import local files with `.js` specifiers (`./health.module.js`).
- Shared HTTP setup lives in `configure-app.ts` (prefix, CORS, pipes). Tests must call `configureApp(app)`.
- Feature modules: `auth`, `vaults`, `items`, `folders`, `templates`, `shares`. One module per concern. DTOs with `class-validator`.
- Prisma Client is generated to `src/generated/prisma` (gitignored). After schema changes: `npx prisma migrate dev`.
- Do not return encryption keys, `passwordHash`, or `encryptedPrivateKey` on user DTOs.

### First backend wiring (next implementation)

1. Copy `.env.example` → `.env`, start Docker Postgres.
2. `npx prisma generate && npx prisma migrate dev --name init`.
3. Import `PrismaModule` in `AppModule`.
4. Implement `auth` (register / login / logout / `GET /api/auth/me`) with httpOnly cookies.
5. Implement vault/item CRUD that accepts ciphertext only.
6. Implement templates (schema JSON) and shares (`wrappedKey`).

## Folder layout (repo)

```
password-manager/
├── AGENTS.md
├── README.md
├── docker-compose.yml
├── .cursor/               Workspace hooks + shared always-apply rules
├── fe/                    Vite PWA  (+ fe/.cursor)
└── be/                    NestJS API (+ be/.cursor)
```

Cursor loads `.cursor` from the **workspace root**. This repo’s root `.cursor/hooks.json` is what fires in this window. `fe/.cursor` and `be/.cursor` are the full per-app trees (rules, OpenSpec skills, `/opsx` commands, hooks) for when that folder is opened as its own project.

OpenSpec is initialized in both apps (`fe/openspec/` and `be/openspec/`, schema `spec-driven`). Start a change with `/opsx:propose` from that app (or `openspec new change` in `fe/` or `be/`). Specs stay per app — do not copy PWA screens into the API, or the reverse.

Do not add a monorepo workspace unless asked. Do not publish a shared npm package unless asked.

## Implementation roadmap

Work in this order. Do not skip encryption to “get CRUD working with plaintext.”

1. **Auth session** — register, login, logout, `/api/auth/me`, httpOnly cookie pair, CORS already set.
2. **Client crypto module** — KDF, AES-GCM, key wrap, unlock lock-screen.
3. **Vault + items** — encrypted blob CRUD, folders.
4. **Templates** — schema editor; values stay inside item ciphertext.
5. **Sharing** — user directory by email, wrap DEK, accept/revoke share.
6. **PWA polish** — install prompt, lock on resume, biometric later (optional).
7. **Hardening** — rate limits, argon2 params, CSP, audit log of share/auth events (no secret payloads).

## Out of scope until confirmed

- Role matrix / admin vs worker apps (this is a personal vault).
- Hosting, cookie domain, and CORS origins beyond local `FRONTEND_ORIGIN`.
- Third-party SSO.
- Storing secrets in browser storage.

## Commands cheat sheet

| Where | Command | Why |
| --- | --- | --- |
| `fe` | `npm run dev` | HTTPS Vite + API proxy |
| `fe` | `npm run build` | `tsc -b` + PWA Workbox |
| `fe` | `npm run lint` | ESLint |
| `be` | `npm run start:dev` | Nest watch |
| `be` | `npm run build` | Nest compile |
| `be` | `npm test` / `npm run test:e2e` | Vitest |
| repo | `npm run dev` | Postgres + API watch + PWA (one terminal) |
| repo | `docker compose up -d` | Postgres only |

Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, …).
