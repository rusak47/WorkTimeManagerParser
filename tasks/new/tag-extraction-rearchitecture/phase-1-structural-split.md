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

Add `uniqueTags` to the options destructuring. If provided, skip the `deriveUniqueTags` call. If not provided, call it internally (backward compatibility).

```js
export function computeTimeData(data, options = {}) {
    const {
        startDate = '2000-01-01',
        // ... existing options ...
        precomputedUniqueTags = null,  // NEW
    } = options;

    // ... normalization, filtering ...

    if (precomputedUniqueTags) {
        var { uniqueTags, allTags, allSupportTags } = precomputedUniqueTags;
    } else {
        var { uniqueTags, allTags, allSupportTags } = deriveUniqueTags(filteredSessions, specialTags, selectedTags);
    }
    // ... rest of computeTimeData ...
}
```

### 3. Have `processData` call `deriveUniqueTags` once

In `src/js/all.js`, replace the inline `extractTags` call at line 156:

```js
const tagInfo = deriveUniqueTags(periodSessions, specialTags, selectedTags ?? []);
const { allTags, allSupportTags, uniqueTags } = tagInfo;
```

Pass `tagInfo` as `precomputedUniqueTags` to `computeTimeData`:

```js
const result = computeTimeData(currentData, {
    startDate, endDate,
    ...
    precomputedUniqueTags: tagInfo,
});
```

### 4. Remove stats from `computeTimeData` return

Remove the recalculation of `totalHours`, `avgDailyHours`, `topTag`, `topTagHours` from the return of `computeTimeData` (lines 353-380). Keep `tagTotals` and `uniqueTags` as they are. Comment: `all.js` already recalculates these from `timeData` (lines 84-106), and the AGENTS.md confirms `processData discards computeTimeData's totalHours/avgDailyHours/topTag/topTagHours`.

Update return object to only include:
- `filteredSessions`
- `sessionsByDate`
- `allTagsArray`
- `allSupportTags`
- `uniqueTags`
- `timeData`
- `tagTotals`

## Tests

### New `deriveUniqueTags` test block

Add after the existing `extractTags` describe block:

```js
describe('deriveUniqueTags', () => {
    it('returns same uniqueTags as the inline path in computeTimeData', () => {
        const sessions = filterSessions(sampleData.sessions, {
            startDate: '2026-07-01', endDate: '2026-07-07', excludeBreaks: false
        });
        const result = deriveUniqueTags(sessions, [], []);
        const ctResult = computeTimeData(sampleData, {
            startDate: '2026-07-01', endDate: '2026-07-07', excludeBreaks: false
        });
        expect(result.uniqueTags.sort()).toEqual(ctResult.uniqueTags.sort());
    });

    it('respects selectedTags filter', () => {
        const sessions = filterSessions(sampleData.sessions, {
            startDate: '2026-07-01', endDate: '2026-07-07', excludeBreaks: false
        });
        const result = deriveUniqueTags(sessions, [], ['#4203']);
        expect(result.uniqueTags).toEqual(['#4203']);
    });

    it('computes same uniqueTags when precomputedUniqueTags is passed', () => {
        const sessions = filterSessions(sampleData.sessions, {
            startDate: '2026-07-01', endDate: '2026-07-07', excludeBreaks: false
        });
        const tagInfo = deriveUniqueTags(sessions, [], []);
        const result = computeTimeData(sampleData, {
            startDate: '2026-07-01', endDate: '2026-07-07',
            precomputedUniqueTags: tagInfo,
        });
        expect(result.uniqueTags.sort()).toEqual(tagInfo.uniqueTags.sort());
    });
});
```

### Existing test changes

- The `computeTimeData` tests that check `totalHours`, `avgDailyHours`, `topTag`, `topTagHours` should now read those from a separate helper in the test file or from the recomputation in `all.js`. However — since the existing tests import `computeTimeData` directly and those fields are already in the return value, we must keep them or update all consumers. **Decision**: keep the fields in the return but recalculate them from `timeData`/`tagTotals` internally instead of the inline computation, to match the all.js pattern. Or simply keep them as-is and only mark for removal in Phase 3 if no consumer relies on them.

  Actually, the simplest approach: keep them computed, but move the computation to after `tagTotals` is complete and derive them from `tagTotals`. That's a minor structure change but preserves all tests.

## Verification

```bash
npx vitest run
```

All existing tests must pass unchanged. No snapshot or fixture changes.

## Files modified

- `src/js/core.js`
- `src/js/core.test.js`
- `src/js/all.js`
