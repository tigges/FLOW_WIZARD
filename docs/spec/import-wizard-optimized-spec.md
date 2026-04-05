# Import Wizard Optimized Spec

## Document status
- Owner: FLOW_WIZARD team
- Audience: Frontend, backend, design, QA
- Last updated: 2026-04-05
- Source of truth: This repository

## 1. Goal
Provide a deterministic, frontend-first import wizard that turns source files into validated outputs through a six-step flow:

1. Upload
2. Page map
3. Settings
4. Review (CPM patch)
5. Preview + Visual QA + Moderation
6. Pre-Export Gate (development) / Complete (production)

The frontend can move faster than backend implementation, but all integration behavior must map to stable API contracts in `docs/api/openapi` and `docs/api/schemas`.

## 2. Product principles
1. **Contract-first integration:** UI behavior is driven by OpenAPI + JSON Schema contracts.
2. **Step boundaries are strict:** each step has explicit exit criteria.
3. **Deterministic editing:** Step 4 uses patch operations over CPM, never ad-hoc full-document overwrite from the UI.
4. **Preview is validation + moderation:** Step 5 validates output quality and supports human moderation controls.
5. **Provider abstraction:** UI sends provider policy hints, not direct model identifiers.
6. **File identity over path identity:** all local references are uploaded and compared via `fileId`.

## 3. Core artifacts
- **Session**: lifecycle object that tracks wizard progress and state.
- **Page Map**: source pages and mapping metadata generated/refined before extraction.
- **CPM (Canonical Project Model)**: normalized editable project structure.
- **Preview Graph**: preview topology and render dependencies produced after review.
- **Visual QA Report**: quality and alignment findings generated from preview outputs.
- **Artifact Manifest**: compile/export outputs and downloadable artifact inventory.
- **Settings**: import behavior knobs, including backend `providerPolicy`.

## 4. End-to-end step contract

### Step 1: Upload
- Inputs:
  - source files (`pdf`, `pptx`, `docx`, image bundles)
  - optional local references (`file:///...`)
- Required behavior:
  - local references are uploaded first-class and receive a backend `fileId`
  - client compares references by `fileId`, never local URI string
  - current phase assumption: each source file is uploaded once per session
- Near-term extension behavior:
  - if a previously processed file appears inside a larger upload, backend returns `overlapCandidates`
  - user must choose an override strategy (`keep-existing`, `replace-with-new`, `merge-with-priority`)
- Exit criteria:
  - session exists
  - every selected file has `fileId`, checksum, and upload status `ready`

### Step 2: Page map
- Inputs:
  - session `fileId`s
  - optional page include/exclude and type hints
- Required behavior:
  - backend may auto-generate initial page map
  - UI can refine page map metadata
- Exit criteria:
  - persisted `page-map` document with per-page status and role tags

### Step 3: Settings
- Inputs:
  - import parameters
  - `providerPolicy` object
- Required behavior:
  - UI does not send direct model keys (for example `gpt-4.1`, `claude-sonnet-*`)
  - frontend does not guess model/provider options; backend provides option catalog per session
  - settings changes are versioned per session
- Exit criteria:
  - persisted settings revision with backend acceptance

### Step 4: Review
- Inputs:
  - generated or existing CPM
  - structured patch operations
- Required behavior:
  - edits are sent as ordered patch operations (`add`, `remove`, `replace`, `move`, `copy`, `test`)
  - backend validates each operation against CPM schema before apply
- Exit criteria:
  - latest CPM revision applied with operation log and conflict status

### Step 5: Preview + Visual QA + Moderation
- Inputs:
  - frozen CPM revision from Step 4
  - settings revision from Step 3
- Required behavior:
  - no primary extraction is performed in this step
  - backend generates preview graph and visual QA report
  - human-in-the-loop moderation is enabled in development mode:
    - adjust cluster priority
    - rename clusters
    - include/exclude cluster selections
  - if quality fails, user returns to Step 4 (or Step 3 for policy changes)
- Exit criteria:
  - preview job reaches terminal state (`succeeded` or `failed`)
  - moderation snapshot revision persisted
  - preview artifacts + QA report persisted

### Step 6: Pre-Export Gate (development) / Complete (production)
- Inputs:
  - approved preview outputs + moderation revision
  - locked CPM + settings revisions
- Required behavior:
  - development phase default: step is pre-export review (human sign-off), not auto-export
  - production phase: compile/export job produces artifact manifest after explicit human approval
  - output package can be downloaded and audited
- Exit criteria:
  - development phase: pre-export approval stored
  - production phase: compile job terminal state and artifact manifest with signed checksums

## 5. Error handling expectations
- Every asynchronous job has:
  - `jobId`
  - finite state machine (`queued`, `running`, `succeeded`, `failed`, `canceled`)
  - structured error payload (`code`, `message`, `retryable`, `details`)
- UI must remain recoverable from any step:
  - refetch by session
  - replay pending operations
  - continue from last valid checkpoint

## 5.1 AI cost and consent guardrails (required)
- Any AI-backed action (for example page classification, text import enrichment, preview scoring assistance) must be **explicitly consented** before token usage.
- Consent must be captured per session and per provider (`gemini`, `copilot`, other) with:
  - estimated max tokens,
  - estimated max cost ceiling (if known),
  - selected provider policy mode,
  - timestamp and actor.
- Default behavior when consent is missing:
  - API returns `412 PRECONDITION_REQUIRED` with `code=consent_required`.
  - UI must block action and show confirmation UI.
- UI must show a preflight confirmation for any request that may trigger paid usage:
  - "This action may consume external AI tokens. Continue?"
- UI must show post-call usage telemetry:
  - provider used,
  - tokens consumed (prompt/completion/total when available),
  - estimated or final billed amount.

## 5.2 Backend-driven provider options (required)
- Backend is the source of truth for provider/model option catalog.
- Frontend must fetch provider capabilities and render only returned options.
- Frontend must not hardcode, infer, or guess provider-specific injection/model settings.
- Provider option payload must include:
  - option id and label,
  - availability status,
  - policy constraints (latency/cost/quality bands),
  - consent requirements.

## 6. Auditability and drift prevention
- All frontend integration changes must:
  1. update OpenAPI or schema docs first,
  2. update mocks,
  3. update frontend adapter types.
- Backend implementation may lag but must preserve contract compatibility.
- Contract-breaking changes require explicit version bump (`v2`).

## 7. Non-goals for current phase
- direct real-time collaborative editing in Step 4
- cross-session merge tooling
- dynamic model key exposure in client payloads
- preview-time extraction rewrites

## 8. Acceptance checklist
- [ ] Six steps fully represented in OpenAPI
- [ ] JSON Schemas exist for all core artifacts
- [ ] Mock requests/responses cover happy-path and async jobs
- [ ] Step 4 patch semantics enforced
- [ ] Step 5 preview-only semantics enforced
- [ ] `providerPolicy` abstraction used end-to-end
- [ ] file reference behavior uses uploaded `fileId`
- [ ] AI token spend requires explicit user consent prior to request execution
- [ ] Usage/cost telemetry visible to both operator and end user after each AI action
