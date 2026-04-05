# Import Wizard Frontend/Backend Sync Plan

## Purpose
Keep FLOW_WIZARD as the single source of truth while frontend delivery leads and backend implementation catches up.

## Scope
- API contracts (`docs/api/openapi/import-wizard-api.v1.yaml`)
- Canonical schemas (`docs/api/schemas/*.json`)
- Mock bridge fixtures (`docs/api/mocks/**`)
- Sync governance and drift checks

## Working agreement
1. **Contract-first:** frontend must only ship integration against versioned contracts in this repo.
2. **Mock parity:** every new endpoint/field needs a matching mock request/response fixture.
3. **Backend lag is allowed, drift is not:** backend can return stubbed values but shape and semantics must match contract.
4. **Step rules are non-negotiable:**
   - Step 4 updates CPM via patch operations at `/v1/import-wizard/sessions/{sessionId}/cpm/patch`.
   - Step 5 is human-moderated preview planning (development mode) and must not run primary extraction.
   - Step 6 is human-moderated pre-export review and compile planning until production hardening is complete.
   - Model/provider options are backend-driven; frontend must not guess available providers or model families.
   - `file:///...` references are uploaded and resolved to `fileId` before comparison.
5. **Spend transparency is required:** no AI provider call may execute unless:
   - the initiating actor (user or admin-configured policy) explicitly approved the call scope,
   - estimated token and cost ranges are displayed pre-call,
   - call-level usage metadata is stored and retrievable.

## Contract ownership matrix
| Area | Primary owner | Secondary owner | Review required |
|---|---|---|---|
| OpenAPI endpoint shape | Backend | Frontend | Yes |
| Request/response payload fields | Frontend | Backend | Yes |
| JSON schema constraints | Backend | Frontend | Yes |
| Mock fixture realism | Frontend | QA | Yes |
| Step transition semantics | Product | Frontend + Backend | Yes |

## Required pull request checklist
- [ ] Updated OpenAPI for any API change
- [ ] Updated JSON Schema for any artifact change
- [ ] Updated mock fixture set for changed endpoint
- [ ] Added/updated changelog note in PR description
- [ ] Validated six-step flow consistency

## Drift prevention gates
1. **Static validation gate**
   - Validate OpenAPI document syntax.
   - Validate mock responses against JSON schemas.
   - Validate `x-requires-user-consent` on all endpoints that can consume paid tokens.
2. **Workflow gate**
   - Block merge when mocks and contracts are out of sync.
3. **Runtime gate**
   - Backend response contract tests run against v1 schemas.
   - Backend rejects any AI-invoking request without valid consent context.

## Integration timeline by capability
### Phase A: Frontend unblock (mock-backed)
- Session creation, file upload mapping, page map generation.
- Settings persistence with `providerPolicy`.
- CPM patch editing and optimistic UI operation log.

### Phase B: Backend parity
- Replace mock adapters with API adapters endpoint-by-endpoint.
- Keep payload shape unchanged.
- Enable preview job execution and visual QA scoring.

### Phase C: Production hardening
- Compile/export stability and artifact checksums.
- Contract monitoring and drift alerting.
- Backward-compatible contract evolution plan (`v1` -> `v2`).

## Compatibility policy
- Additive changes: allowed in `v1` (new optional fields/endpoints).
- Breaking changes: require `v2`.
- Deprecated fields: mark in OpenAPI and keep behavior for one full release cycle.

## Escalation rules
- If frontend proposes behavior not represented in contract: pause implementation and update contract first.
- If backend cannot honor required field/step behavior: open a sync issue and ship behind feature flag until compliant.

## Definition of done
- Frontend and backend teams can run the same six-step flow using either mocks or live API without payload-shape changes.
- Every AI token-spend action is preceded by explicit user or policy consent and emits cost/usage telemetry.
