# Import Wizard Schemas (v1)

This directory defines contract schemas used by `import-wizard-api.v1.yaml`.

## Files
- `session.schema.json`: session lifecycle and wizard state.
- `page-map.schema.json`: page-level metadata and step-2 mapping.
- `cpm.schema.json`: canonical project model used for review edits.
- `preview-graph.schema.json`: preview structure generated in step 5.
- `artifact-manifest.schema.json`: compile/export outputs for step 6.
- `settings.schema.json`: import settings and `providerPolicy`.
- `visual-qa-report.schema.json`: visual QA outputs from step 5.
- `ai-usage-consent.schema.json`: explicit user/app cost consent before any token-spend calls.

## Contract rules
1. Step 4 edits are patch-based operations over CPM (`/v1/import-wizard/sessions/{id}/cpm/patch`).
2. Step 5 is preview-only and must not perform primary extraction.
3. Client sends `providerPolicy`, never direct model keys.
4. Local references (`file:///...`) are uploaded first and compared by `fileId`.
5. No external/internal paid token API call occurs without explicit user/app consent.

## Versioning
- Breaking schema changes require a new OpenAPI and schema major version (for example, `v2`).
- Additive fields must preserve compatibility for existing frontend clients.
