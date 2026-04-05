# "Seat number" explanation (simple)

## What "seat" means
"Seat" means position in a list.

Example list:
- seat 0 = cluster A
- seat 1 = cluster B
- seat 2 = cluster C

If frontend edits `"/clusters/2/name"`, it means:
"change the name of the item currently in seat 2."

## Why this is risky
If backend inserts/reorders items at the same time, seat 2 may now be a different cluster.
Then the edit lands on the wrong cluster.

## Consequence
- Wrong cluster renamed/updated
- Human moderation decisions applied to wrong target
- Step 5/6 results become confusing and untrusted

## Safer pattern
Edit by stable ID, not seat number.

Instead of:
- `"/clusters/2/name"`

Use:
- `"/clusters/byId/clu_123/name"`
or send operation with:
- `clusterId: "clu_123"`

## Practical rule
Use seat/array index only for temporary display order changes.
Use IDs for semantic edits (name, selection, priority, allocation).
