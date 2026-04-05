# FLOW_WIZARD
FLOW_WIZARD

## Current status
- Contract-first project baseline (docs, OpenAPI, schemas, mocks) is present.
- No runnable frontend/backend app scaffold exists in this repository yet.
- Because of that, direct Cloudways deployment is not available yet from this repo state.

## Intended application stack
- Frontend: TypeScript + React (or Next.js)
- Backend API: TypeScript (Node.js)
- Optional AI/document processing workers: Python (only where libraries justify it)

## Cost-aware AI policy
- All external token-based AI calls require explicit user confirmation before execution.
- The app must display provider, estimated token use, and estimated cost before running.
- Consent should be scoped (single-run or session budget) and revocable.
