# Phase 1d2: Clean up remaining todos in core.js

Part of tag-extraction-rearchitecture. Follows Phase 1d.

## Objective

Four `//todo:` comments remain in `core.js` after Phase 1d. Resolve all of them.

## Changes

### 1. Extract `buildSessionsByDate` (was `//todo: extract as method`)

Loop that builds `sessionsByDate` from `displaySessions` — extract into named
function `buildSessionsByDate(displaySessions)`.

### 2. Make `precomputedUniqueTags` required (was `//todo: only precomputedUniqueTags - if null -> throw error`)

Remove the `else` branch that falls back to `deriveUniqueTags`. Remove unused
`allTags`/`allSupportTags` destructuring (no longer needed in return).

### 3. Make `allocationMap` required (was `//todo: only allocationMap - if null -> throw error`)

Remove the fallback `new Map()` branch.

### 4. Extract `handleOverlap` (was `//todo: extract into separate method handleOverlap`)

Session overlap-splitting loop — extract into
`handleOverlap(filteredSessions, effectiveAllocationMap, uniqueTags, timeData, roundToHalvesEnabled, debugMode)`.

### 5. Delete commented-out return fields

Remove leftover `//filteredSessions,`, `//allTagsArray,`, `//allSupportTags,`,
`//tagTotals:`, etc. from return statement.

## Files modified

- `src/js/core.js` — all changes
- `src/js/core.test.js` — update direct `computeTimeData` test to pass `allocationMap`

## Verification

```bash
npx vitest run
```
