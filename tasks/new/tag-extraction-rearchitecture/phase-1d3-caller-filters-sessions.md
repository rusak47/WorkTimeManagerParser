# Phase 1d3: Caller pre-filters sessions for computeTimeData

Part of tag-extraction-rearchitecture. Follows Phase 1d2.

## Objective

`computeTimeData` no longer receives raw `data.sessions` and re-filters it.
Instead, the caller (`processTimeDataLegacy`) pre-filters sessions and passes
them as `sessions` in the options object. `displaySessions` is derived
internally by stripping breaks from `sessions` when `excludeBreaks=true`.

This eliminates the latent bug where `excludeBreaks` (user setting) was used
for the computation session list instead of `excludeBreaks: false`.

## Changes

### `core.js`

#### `computeTimeData`
- Signature: `computeTimeData(data, options)` → `computeTimeData(options)`
- `options` now includes `sessions` (pre-filtered compute list, always includes breaks)
- Remove null guard (`if (!data || !data.sessions)`)
- Remove two `filterSessions` calls
- Add: `const displaySessions = excludeBreaks ? sessions.filter(s => !s.isBreak) : sessions`
- Remove `specialTags`, `selectedTags` from destructure (only used by removed fallback)
- Keep everything else unchanged

#### `processTimeDataLegacy`
- Rename `filteredForTags` → `computeSessions`
- Pass `computeSessions` instead of `{ sessions: sessions }`
- Move options inline instead of via second argument

### `core.test.js`
- Update `accepts precomputedUniqueTags on computeTimeData` test to new signature
- Remove `returns null for invalid data` test (caller handles nullity)

## Verification
```bash
npx vitest run
```
