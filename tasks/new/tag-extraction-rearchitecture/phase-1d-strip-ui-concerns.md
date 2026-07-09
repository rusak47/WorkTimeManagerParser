# Phase 1d: Strip UI concerns from `computeTimeData`

Part of tag-extraction-rearchitecture. Follows Phase 1c (pure computation core).

## Objective

`computeTimeData` still does work that belongs in the UI layer:
- Computing stats (`totalHours`, `avgDailyHours`, `topTag`, `tagTotals`) — only used by `all.js` for rendering
- Removing zero-total tags from `uniqueTags` — also a UI concern (hide empty columns)

Move these out of the computation core. `computeTimeData` returns raw results;
`all.js` post-processes them for display.

## Changes

### 1. Fix `core.test.js` import

Currently imports `processTimeData` which doesn't exist — the export is
`processTimeDataLegacy`. Fix the import.

### 2. Remove `computeStats` call from `computeTimeData` (core.js)

Remove lines 434-436:
```js
const stats = computeStats(timeData, uniqueTags);
uniqueTags = uniqueTags.filter(tag => stats.tagTotals[tag] > 0);
```

`uniqueTags` is now returned as-is, including zero-total tags. Filtering for
display is `all.js`'s responsibility.

### 3. Remove `allTagsArray` dead code (core.js)

Line 374: `const allTagsArray = ...` — computed but never used anywhere.

### 4. Remove `computeStats` export

Nothing imports it after the internal call is removed. Delete the export (keep
the function body — should be used in all.js).

### 5. Fix test assertions in `core.test.js`

Tests reference `result.totalHours`, `result.topTag`, `result.topTagHours`,
`result.avgDailyHours`, `result.tagTotals`, `result.filteredSessions` — none
returned by `computeTimeData`. Replace inline:

- `result.totalHours` → compute from `timeData`
- `result.topTag` / `result.topTagHours` → compute from `timeData`
- `result.avgDailyHours` → compute from `timeData`
- `result.tagTotals` → compute from `timeData`
- `result.filteredSessions` → compute or remove assertion

### 6. Add `uniqueTags` zero-total filter in `all.js`

Before rendering, filter out tags with zero total hours (otherwise empty columns
appear in the table). Add in `recomputeAndRender` between line 60 (destructure)
and line 62 (excludeBreaks cleanup). Use  `computeStats` method.

## Files modified

- `src/js/core.test.js` — import fix, assertion rewrites
- `src/js/core.js` — remove `computeStats` call, `allTagsArray`, `computeStats` export
- `src/js/all.js` — add zero-total tag filter

## Verification

```bash
npx vitest run
```

All 70 tests pass. No behavioral change in rendered output.
