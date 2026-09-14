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
