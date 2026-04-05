# AGENTS.md

## Cursor Cloud specific instructions

### Overview

FLOW_WIZARD is a **contract-first import wizard** application with a TypeScript monorepo (`packages/backend`, `packages/frontend`) built on the OpenAPI/JSON Schema contracts in `docs/api/`.

### Monorepo structure

- `packages/backend/` — Express/TypeScript API server (port 3001)
- `packages/frontend/` — React/Vite wizard UI
- `docs/api/` — OpenAPI spec, JSON schemas, mock fixtures (source of truth)
- `scripts/` — Root-level contract validation scripts

### Dev environment

- **Node.js ≥ 22** (available via nvm)
- Each package has its own `package.json`; install separately with `npm install` in each directory
- Root `package.json` has spec validation tooling

### Key commands

| Task | Command | Directory |
|---|---|---|
| Start backend (dev) | `SESSION_SIGNING_SECRET=dev-secret npx tsx src/index.ts` | `packages/backend` |
| Start frontend (dev) | `npm run dev` | `packages/frontend` |
| Type-check backend | `npx tsc --noEmit` | `packages/backend` |
| Type-check frontend | `npx tsc --noEmit` | `packages/frontend` |
| Build frontend | `npm run build` | `packages/frontend` |
| Lint OpenAPI spec | `npm run lint:openapi` | root |
| Validate JSON schemas | `npm run validate:schemas` | root |
| Validate mocks vs schemas | `npm run validate:mocks` | root |
| Run all spec checks | `npm test` | root |
| Build Redoc HTML docs | `npm run docs:build` | root |
| Serve docs + wireframe | `npm run docs:serve` (port 8080) | root |

### Non-negotiable product rules

1. CPM patch endpoint is `/v1/import-wizard/sessions/{sessionId}/cpm/patch` (not `cpm:patch`)
2. Step 5 = preview + visual QA + human moderation (no primary extraction)
3. Step 6 = pre-view human gate in development; export/complete in production
4. Frontend must NOT hardcode providers/models — backend drives options via `/capabilities/providers`
5. No paid AI token call without explicit user confirmation + preflight estimate
6. File identity uses `fileId`, not filesystem paths

### Non-obvious notes

- Schemas use **JSON Schema 2020-12**; validation requires `Ajv2020` (from `ajv/dist/2020`), not base `Ajv`
- Redocly config is `redocly.yaml` (no dot prefix); `security-defined` rule is `warn`
- Two mock fixtures (`04-settings.response.json`, `10-ai-consent.state.response.json`) have pre-existing schema mismatches
- Frontend uses `verbatimModuleSyntax`; TypeScript interfaces must be imported with `import type`
- Backend serves built frontend static files from `public/` dir in production mode
- The Vite dev server proxies `/v1` and `/health` routes to the backend at port 3001
- Cloudways hosting is WordPress-only; Node.js deployment requires separate hosting or Cloudways Node.js stack
