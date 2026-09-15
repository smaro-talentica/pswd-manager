# Password Manager

Personal password manager: encrypted vaults, sharing, and custom data templates.

| Path | Role |
| --- | --- |
| `fe/` | Vite + React + TypeScript PWA |
| `be/` | NestJS API |
| `fe/openspec/specs/` | PWA OpenSpec (screens, session, crypto, PWA) |
| `be/openspec/specs/` | API OpenSpec (auth, items, templates, shares) |
| `docker-compose.yml` | Local PostgreSQL 16 |
| `AGENTS.md` | Architecture, security model, and next steps for AI/human work |

## Quick start

**One command (after first-time setup below):** from the repo root, with Docker Desktop running:

```bash
npm run dev
```

That starts Postgres (`docker compose`), waits until the database is healthy, then runs the API and PWA in one terminal. Press **Ctrl+C** to stop the Node dev servers (Postgres keeps running in Docker until you `docker compose down`).

**Production-like PWA (install prompt, service worker):**

```bash
npm run preview
```

Same stack as `dev`, but builds the frontend first and serves it with `vite preview` on `https://localhost:5173`. Use this to test PWA install on the login page. The first run takes longer because of the production build.

**First time on this machine:**

```bash
docker compose up -d
cd be
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
cd ../fe
npm install
cd ..
npm run dev
```

You can still run `fe/` and `be/` separately if you prefer (`npm run start:dev` in `be/`, `npm run dev` in `fe/`).

The frontend runs on HTTPS (`https://localhost:5173`). Accept the self-signed certificate. `/api` is proxied to the NestJS server (`http://localhost:3000`). Do not open the API itself over HTTPS.

Auth in this first slice:

- Create an account at `/signup` (email + password). The password must be at least 8 characters and include uppercase, lowercase, a number, and a special character. While you type, signup shows Weak / Fair / Strong plus which rules are still missing.
- Use the theme control (sun/moon) on login, signup, and the vault to switch light and dark. The choice is stored as appearance only — not a vault key or session token.
- Log in at `/` with that email and password
- After login, the app opens at `/password-manager`. The vault is a single column on a phone and a wider two-column list on desktop.
- After a refresh, re-enter the vault password to view secrets. That screen shows only the account email and **Log out** — Template and 2FA stay hidden until the vault is unlocked. If the short-lived session cookie has expired, the app refreshes it automatically so Continue does not get stuck on Unauthorized.
- After unlock, any signed-in account can turn 2FA on or off from the **2FA** button (Google Authenticator or any TOTP app). The button stays outlined; it is green when 2FA is on and black when it is off. Scan the QR, or type the key if the camera cannot lock. After 2FA is on, login asks for the app code after the password.
- Private secrets can be shared with another user on the platform (by email). Shared items move to the Shared vault tab until every share is revoked. Each owned secret has a delete control before its type tag (Website, Credit card, and so on), then the name, then view and share icons. The delete icon lines up with the left edge of the field text. Search at the top of each vault filters that list; on desktop the search field is one secret card wide. type tags are the organiser, with no folders.
- Built-in templates (Website, Credit card, PAN card, Secure note) show edit and delete icons on the title row; those stay disabled, and hover explains they are not allowed. The **Template** button shows the total count (built-in plus custom) inside the button. Add a custom template from the top of the Template panel; custom templates can be edited or deleted. When adding a secret, **Add secret** opens a dialog; pick a template first; fields come from that template only. Secret values stay hidden until you tap the eye icon on that card.
- Log out returns you to `/`
- Session cookies are httpOnly. Vault keys never go in `localStorage`. The access cookie is short-lived; the refresh cookie rotates it without a page reload.

Read **AGENTS.md** before implementing features. The server must never see plaintext vault secrets. Product contracts live in `fe/openspec/specs/` and `be/openspec/specs/` (backfilled from the shipped app). Start a new change with OpenSpec in `fe/` or `be/` rather than copying screens across apps.

## Deploy (free tier)

Stack: **[Neon](https://neon.tech)** Postgres + **[Render](https://render.com)** (Node API + static PWA). The repo includes `render.yaml` for a one-shot Blueprint.

**Limits:** Render free web services spin down after idle (~15 min); the first request after sleep can take 30–60 seconds. Use this for demos and personal trials, not production-grade uptime.

### 1. Database (Neon)

1. Create a Neon project and database.
2. Copy the **pooled** connection string (PostgreSQL). Append `?sslmode=require` if it is not already present.
3. Keep it for the API service env var `DATABASE_URL`.

### 2. Apply the Blueprint (Render)

1. In Render: **New → Blueprint**, connect `https://github.com/smaro-talentica/pswd-manager` (this repo).
2. When prompted for env vars:
   - **API `DATABASE_URL`:** Neon connection string.
   - **API `FRONTEND_ORIGIN`:** leave blank for now (set after step 4).
   - **Static `VITE_API_BASE_URL`:** leave blank for now (set after step 3).
   - JWT secrets can stay **auto-generated** by the blueprint.
3. Deploy. Open the **API** service URL and confirm `GET /api/health` returns JSON (`status: ok`).
4. On the **static** service, set **`VITE_API_BASE_URL`** to the API origin only (example: `https://pswd-manager-api.onrender.com` — no trailing slash, no `/api`). Trigger a **manual redeploy** so the PWA build picks it up.
5. On the **API** service, set **`FRONTEND_ORIGIN`** to the static site origin (example: `https://pswd-manager-fe.onrender.com` — no trailing slash). **Redeploy** the API so CORS matches.

### 3. Smoke test

1. Open the static site URL, sign up, log in, unlock the vault.
2. If login fails with CORS or cookie errors, re-check that `FRONTEND_ORIGIN` and `VITE_API_BASE_URL` are exact origins (scheme + host, no path).

### Manual deploy (without Blueprint)

| Service | Root directory | Build | Start / publish |
| --- | --- | --- | --- |
| API | `be` | `npm ci && npx prisma generate && npm run build` | Pre-deploy: `npx prisma migrate deploy` · Start: `npm run start:prod` |
| PWA | `fe` | `npm ci && npm run build` (set `VITE_API_BASE_URL` in Render env) | Publish `dist` · SPA rewrite `/*` → `/index.html` |

Node **24.17** (see `be/.nvmrc` and `fe/.nvmrc`). Auth uses httpOnly cookies on the API host; the browser calls the API with `credentials: 'include'`.
