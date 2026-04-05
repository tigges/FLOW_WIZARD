# Import Intelligence Integration Plan (ProcessMap V1 -> FLOW_WIZARD)

## Goal
Bring all import intelligence capabilities into FLOW_WIZARD long term while preserving contract stability and explicit spend controls.

## Current external reference
- Existing live project: `https://tigges.github.io/process-map-V1/`
- Observed capability: text-driven project/map import and AI-assisted flow generation.

## Migration principle
1. FLOW_WIZARD is the primary source of truth.
2. Reuse proven parsing/intelligence patterns from ProcessMap V1.
3. Do not copy opaque behavior without matching contracts, tests, and fixtures.

## Capability map

### Capability A: Text import parsing
- Intake freeform text and infer sections, entities, and hierarchy.
- Target FLOW_WIZARD steps:
  - Step 2 (Page map draft generation)
  - Step 4 (CPM scaffolding suggestions as patch recommendations)

### Capability B: AI-assisted structure inference
- Use policy-driven provider selection to produce:
  - page role proposals
  - section/component candidates
  - quality hints for preview stage
- Must route through `providerPolicy`; no client model IDs in payloads.

### Capability C: File + text hybrid import
- Blend uploaded files and imported text snippets for better map/CPM bootstrap.
- Local references remain upload-first and compared by `fileId`.

## Provider strategy (cost-conscious default)
- Primary initial provider family: Gemini-compatible adapters.
- Secondary optional adapter: GitHub Copilot-compatible workflows where available.
- All AI calls must pass a consent gate and a budget envelope.

## Mandatory consent + budget controls
1. **Preflight estimate**
   - Show estimated token range and max budget before any external model call.
2. **Explicit confirmation**
   - Require explicit user confirmation in UI and API payload before execution.
3. **Session budget**
   - Enforce per-session and per-org hard ceilings.
4. **Audit log**
   - Persist who approved spend, estimate shown, and actual usage.
5. **Fail-safe mode**
   - If cost services are unavailable, disable paid calls and continue with deterministic/local logic.

## Migration phases

### Phase 1: Contract and adapter baseline
- Add AI consent and budget fields to settings and job requests.
- Add a policy endpoint for provider capabilities and estimated cost metadata.
- Add mocks for consent-required and over-budget rejection flows.

### Phase 2: Feature parity lift
- Implement text import parser pipeline from ProcessMap learnings.
- Emit suggestions as non-destructive patch operations.
- Keep deterministic fallback path for zero-cost operation.

### Phase 3: Full consolidation
- Move all import intelligence into FLOW_WIZARD backend services.
- Decommission dependency on external ProcessMap runtime for production paths.

## Risk checklist
- Hidden model-specific assumptions from ProcessMap V1.
- Prompt drift causing non-deterministic structure output.
- Missing cost telemetry causing surprise spend.
- Frontend bypass of consent gate.

## Definition of done
- Import intelligence features function inside FLOW_WIZARD contracts.
- No paid token call can execute without explicit user confirmation.
- Costs are bounded, visible, and auditable per session.
