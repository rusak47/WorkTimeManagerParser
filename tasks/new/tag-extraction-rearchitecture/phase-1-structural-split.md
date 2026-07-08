# Phase 1: Structural split — extract `deriveUniqueTags`, unify calls, move stats

## Objective

Establish clean contracts between tag discovery, time allocation, and display so they are no longer coupled to the underlying data format. Create a pure function `deriveUniqueTags` that replaces the inline extraction inside `computeTimeData`, and have `processData` call it once instead of duplicating the call. Move stats computation out of `computeTimeData` so it only returns raw data.

## Behavioral invariant

No behavioral change for any session format. True legacy, mid-mix, and true new sessions produce the same `timeData`, `tagTotals`, and `uniqueTags` as before. Only the internal wiring changes for cleaner separation of responsibilities. This change should provide a clean contract for what calculation and display methods receive, to remove tight coupling with data format.

## Code changes

### 1. Extract `deriveUniqueTags(sessions, specialTags, selectedTags)`

Add after `extractTags` in `src/js/core.js`:

```js
export function deriveUniqueTags(sessions, specialTags, selectedTags) {
    const { allTags, allSupportTags } = extractTags(sessions, specialTags);
    const allTagsArray = Array.from(allTags).concat(Array.from(allSupportTags));
    const uniqueTags = selectedTags && selectedTags.length > 0
        ? [...selectedTags].sort()
        : [...allTagsArray].sort();
    return { allTags, allSupportTags, uniqueTags };
}
```

Replace the inline block at `core.js:135-140` with a call to `deriveUniqueTags`.

### 2. Accept `uniqueTags` as a parameter in `computeTimeData`

Add `precomputedUniqueTags` to the options destructuring. If provided, skip the `deriveUniqueTags` call. If not provided, call it internally (backward compatibility).

Use `let` with destructuring assignment — parenthesized so `{}` is not parsed as a block:

```js
export function computeTimeData(data, options = {}) {
    const {
        startDate = '2000-01-01',
        // ... existing options ...
        precomputedUniqueTags = null,  // NEW
    } = options;

    // ... normalization, filtering ...

    let uniqueTags, allTags, allSupportTags;
    if (precomputedUniqueTags) {
        ({ uniqueTags, allTags, allSupportTags } = precomputedUniqueTags);
    } else {
        ({ uniqueTags, allTags, allSupportTags } = deriveUniqueTags(filteredSessions, specialTags, selectedTags));
    }
    const allTagsArray = Array.from(allTags).concat(Array.from(allSupportTags));
    // ... rest of computeTimeData (allTagsArray already defined above) ...
}
```

Note: `allTagsArray` moves after the if/else block since it needs `allTags`/`allSupportTags` from either branch.

### 3. Have `processData` call `deriveUniqueTags` once

In `src/js/all.js`, replace the inline `extractTags` call at line 156.

Note: `selectedTags` in `processData` comes from `selectedTagsOverride` (the `options.selectedTags` override) or is empty. The TomSelect population below uses the full tag set — `selectedTags` here is only for the `deriveUniqueTags` internal filtering, defaulting to `[]`:

```js
const tagInfo = deriveUniqueTags(periodSessions, specialTags, selectedTagsOverride ?? []);
const { allTags, allSupportTags, uniqueTags } = tagInfo;
const allTagsArray = Array.from(allTags).concat(Array.from(allSupportTags));
```

Then thread `tagInfo` through the `recomputeAndRender` state object so it reaches `computeTimeData`:

```js
recomputeAndRender({
    startDate,
    endDate,
    excludeBreaks,
    specialTagsInput,
    roundToHalvesEnabled,
    debugMode,
    holidayMultiplier,
    weekendMultiplier,
    precomputedUniqueTags: tagInfo,  // NEW
});
```

In `recomputeAndRender`, accept and pass `precomputedUniqueTags` to `computeTimeData`:

```js
const result = computeTimeData(currentData, {
    startDate,
    endDate,
    excludeBreaks,
    specialTags,
    selectedTags,
    roundToHalvesEnabled,
    debugMode,
    holidayMultiplier,
    weekendMultiplier,
    calendarLookup: CALENDAR_LOOKUP,
    precomputedUniqueTags: state?.precomputedUniqueTags ?? null,  // NEW
});
```

### 4. Keep stats in `computeTimeData` return (no change)

The stats (`totalHours`, `avgDailyHours`, `topTag`, `topTagHours`) are computed at lines 353-380 and referenced by **36 test assertions**. Remove only what's dead weight; these fields are alive in tests.

**Decision**: leave the stats computation and return **exactly as they are** in Phase 1. Removal is reserved for Phase 3 (`phase-3-consolidate-and-cleanup.md` §3) which will introduce a `computeStats` test helper and migrate all test consumers at once.

The return object remains unchanged:
- `filteredSessions`
- `sessionsByDate`
- `allTagsArray`
- `allSupportTags`
- `uniqueTags`
- `timeData`
- `tagTotals`
- `totalHours`
- `avgDailyHours`
- `topTag`
- `topTagHours: maxHours`

## Phase 1 scope constraint

Tests must use `endDate: '2026-07-03'` or earlier. Sessions after `2026-07-03` use the new bucket-format (`bucket: "work"` with project tags) and will produce incorrect time allocation in Phase 1. The bucket-format fix is Phase 2.

"Mid-mix" sessions (those with `accumulatedPauseTimeSec` and multiple tags) are in the `2026-07-01` to `2026-07-03` range and normalize to match true-legacy. They are fair game for Phase 1 tests.

## Tests

### New `deriveUniqueTags` test block

Add after the existing `extractTags` describe block:

```js
describe('deriveUniqueTags', () => {
    it('produces same output as manual extractTags + array build', () => {
        const sessions = filterSessions(sampleData.sessions, {
            startDate: '2026-07-01', endDate: '2026-07-03', excludeBreaks: false
        });
        const result = deriveUniqueTags(sessions, [], []);
        const { allTags, allSupportTags } = extractTags(sessions, []);
        const expected = Array.from(allTags).concat(Array.from(allSupportTags)).sort();
        expect(result.uniqueTags).toEqual(expected);
    });

    it('respects selectedTags filter', () => {
        const sessions = filterSessions(sampleData.sessions, {
            startDate: '2026-07-01', endDate: '2026-07-03', excludeBreaks: false
        });
        const result = deriveUniqueTags(sessions, [], ['#4203']);
        expect(result.uniqueTags).toEqual(['#4203']);
    });

    it('accepts precomputedUniqueTags on computeTimeData', () => {
        const sessions = filterSessions(sampleData.sessions, {
            startDate: '2026-07-01', endDate: '2026-07-03', excludeBreaks: false
        });
        const tagInfo = deriveUniqueTags(sessions, [], []);
        const result = computeTimeData(sampleData, {
            startDate: '2026-07-01', endDate: '2026-07-03',
            precomputedUniqueTags: tagInfo,
        });
        expect(result).not.toBeNull();
        expect(Array.isArray(result.uniqueTags)).toBe(true);
        expect(result.uniqueTags.length).toBeGreaterThan(0);
    });
});
```

Note: `deriveUniqueTags` is tested against its own composition (`extractTags` + array build), not against `computeTimeData`'s normalized internal path. The backward-compat threading of `precomputedUniqueTags` through `processData` is deferred until Phase 2 when normalization order aligns.

### Existing test changes

None. All existing tests pass without modification. The stats fields remain in the return unchanged.

## Verification

```bash
npx vitest run
```

All existing tests must pass unchanged. No snapshot or fixture changes.

## Files modified

- `src/js/core.js`
- `src/js/core.test.js`
- `src/js/all.js`
