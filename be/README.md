# password-manager-be

NestJS API for the personal password manager. Stores ciphertext only — vault secrets are encrypted in the browser before they reach this server.

## Prerequisites
- Node.js `>=24.17.0` (see `.nvmrc`)
- PostgreSQL 16 (use the repo-root `docker-compose.yml`)

## Setup
```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

API prefix: `/api`. Health: `GET /api/health`.

The Vite app in `../fe` proxies `/api` to `http://localhost:3000` during `npm run dev`.

## Scripts
| Command | Description |
| --- | --- |
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled app |
| `npm run lint` | oxlint |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Vitest e2e tests |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev` | Create/apply migrations |

## Structure
```
src/
├── main.ts              Bootstrap (CORS, ValidationPipe, /api prefix)
├── configure-app.ts     Shared Nest setup used by e2e tests
├── app.module.ts        Root module + ConfigModule
├── health/              GET /api/health
└── prisma/              PrismaService (wire PrismaModule after first migrate)
prisma/
└── schema.prisma        Users, vaults, items, shares, templates
```

Do not persist plaintext secrets. See `../AGENTS.md` for the encryption and sharing model.
