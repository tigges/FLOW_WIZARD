# Import Wizard Mock Fixture Pack (v1)

This mock pack is the backend-lag bridge for frontend development.
All fixtures align to:
- `docs/api/openapi/import-wizard-api.v1.yaml`
- `docs/api/schemas/*.json`

## Directory structure
- `requests/`: representative request payloads by wizard step.
- `responses/`: endpoint responses and object snapshots.
- `responses/pages/`: paged/list responses when useful for UI state hydration.
- `responses/jobs/`: job status snapshots across lifecycle transitions.
- `responses/events/`: simulated SSE/log event lines for async jobs.

## Step coverage
1. Upload
2. Page map
3. Settings
4. Review (CPM patch ops only)
5. Preview + Visual QA (preview-only, no extraction)
6. Complete (compile/export)

## Rules encoded in mocks
1. Step 5 never performs primary extraction.
2. Step 4 edits use ordered patch operations over CPM.
3. Model selection is represented by `providerPolicy`, not direct model keys.
4. Local references are uploaded and compared by `fileId`.
