# AGENTS.md

## Cursor Cloud specific instructions

### Overview

FLOW_WIZARD is a **contract-first specification repository** (OpenAPI, JSON Schemas, mock fixtures, product specs, and wireframes). There is no runnable frontend/backend application yet. Development work centers on validating and evolving the API contracts, schemas, and mock data.

### Dev environment

- **Node.js ≥ 22** (available via nvm)
- Dev dependencies are declared in `package.json` and installed with `npm install`

### Key commands

| Task | Command |
|---|---|
| Lint OpenAPI spec | `npm run lint:openapi` |
| Validate JSON schemas | `npm run validate:schemas` |
| Validate mocks vs schemas | `npm run validate:mocks` |
| Run all checks | `npm test` |
| Build Redoc HTML docs | `npm run docs:build` |
| Serve docs + wireframe | `npm run docs:serve` (port 8080) |

### Non-obvious notes

- The OpenAPI spec uses `$ref` to JSON Schema files in `docs/api/schemas/`. Redocly resolves these refs during lint; `swagger-parser` can also validate/bundle them.
- All JSON schemas use **JSON Schema 2020-12** (`$schema: "https://json-schema.org/draft/2020-12/schema"`). Validation requires `Ajv2020` (from `ajv/dist/2020`), not the base `Ajv` class.
- Redocly config lives at `redocly.yaml` (no dot prefix). The `security-defined` rule is set to `warn` because the API contract doesn't define security schemes yet.
- Two mock fixtures (`04-settings.response.json`, `10-ai-consent.state.response.json`) have pre-existing schema mismatches. The `validate:mocks` script will report these as failures — they are known issues in the repository, not environment problems.
- `redocly preview-docs` was removed in recent Redocly CLI versions; use `redocly build-docs` then serve with `http-server`.
