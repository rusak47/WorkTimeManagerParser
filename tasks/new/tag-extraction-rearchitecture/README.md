# Tag extraction rearchitecture — master plan

## Context

There are three session formats coexisting in the data, each requiring different handling for tag extraction and time allocation:

| Format | ID range | Tags field | bucket | accumulatedPauseTimeSec | Allocation path | Example ID |
|--------|----------|-----------|--------|------------------------|----------------|------------|
| **True legacy** | ~Jun 16-18, 2025 | `["work"]` or single category | absent | present or absent | notes hashtag extraction (priority 3) | 1750080766946 |
| **Mid mix** | Jun 26 - Jul 3 | `["work","paylar","4203"]` — project tags in array | absent | present (0 or non-zero) | needs normalization → legacy shape → notes hashtag | 1783022254204 |
| **True new** | Jul 6+ | `["work","paylar","n8n","4203"]` — full project list | `"work"` or `"rest"` | absent | ✗ broken — bucket dumps everything to `#custom` | 1783447807670 |

The mid-mix normalization (core.js:81-88) converts mid-mix sessions back to true-legacy shape (`["work"]` with project tags appended to notes as `#tag`), so they route correctly through notes hashtag extraction. True legacy already works. True new format has a separate bug — the `bucket` branch in `allocateTime` overrides tag distribution.

### Problem

Tag extraction (`extractTags`), tag allocation (`allocateTime`), and tag rendering are interleaved across `core.js`, `all.js`, and `ui.js`:
- `extractTags` is called twice per recompute (once in `processData`, once inside `computeTimeData`)
- `uniqueTags` derivation is inline in `computeTimeData`
- Stats recalculation is duplicated between `core.js` and `all.js`
- `ui.js:addNotesCell` has its own hashtag-parsing logic that partially duplicates `extractTags`

### Goal

Clean separation:
- **Tag extraction** — pure function: given sessions + options, return `{ allTags, allSupportTags, uniqueTags }`. No time computation, no DOM.
- **Tag allocation** — `computeTimeData` receives `uniqueTags` as input, produces `timeData`.
- **Table rendering** — pure DOM work, consumes `timeData` + `sessionsByDate`.

## Phases

| Phase | Scope | Changes |
|-------|-------|---------|
| **1** | Structural split | Extract `deriveUniqueTags`, unify calls, move stats to all.js |
| **2** | Fix new-format allocation | Remove bucket branch, let project tags split time |
| **3** | Consolidation | Unify notes-cell filter logic, clean remaining duplication |

## Dependencies

```
Phase 1 ──→ Phase 2 ──→ Phase 3
```

Phase 1 must merge first — it establishes the shared `deriveUniqueTags` interface that Phase 2 and 3 build on.

## Files affected

- `src/js/core.js`
- `src/js/core.test.js`
- `src/js/all.js`
- `src/js/ui.js`
- `src/js/data.js` (if test data changes)

## Current working tree

Three files have unstaged changes from the mid-mix normalization work:
- `src/js/core.js` — normalization logic (lines 79-93) + `#` prefix fix on line 86
- `src/js/core.test.js` — normalize tests + bucket tag allocation test
- `src/js/data.js` — Jul 1-7 sample data added

The phases assume these changes are staged/committed before Phase 1 begins.
