# Phase 3: Consolidate notes-cell filter logic and clean remaining duplication

## Objective

Clean the loose ends exposed by Phase 1 and Phase 2. The main target is `addNotesCell` in `ui.js` which has its own hashtag-parsing logic (`getNotesHashtags`) that partially reimplements `extractTags` logic. Also clean up any remaining duplicated tag processing between modules.

## Behavioral invariant

No behavioral changes. Pure refactor of internal wiring.

## Code changes

### 1. Replace `getNotesHashtags` with the shared tag set

Currently `ui.js:251-255`:

```js
function getNotesHashtags(notes) {
    const numeric = notes.match(/#\d+/g) || [];
    const word = notes.match(/#[a-zA-Z]+[a-zA-Z0-9]{0,}/g) || [];
    return [...numeric, ...word].map(h => h.toLowerCase());
}
```

This is a partial reimplementation of `extractTags`'s notes-hashtag logic. Replace the filter-matching call site in `addNotesCell` (line 267) with:

```js
// Instead of: getNotesHashtags(session.notes).some(ht => tagFilter.items.includes(ht))
// Use: tagFilter.items.some(item => session.notes.toLowerCase().includes(item))
```

This avoids re-parsing notes and instead checks if any filter item is mentioned in notes. This cheaper string-includes check works because `tagFilter.items` already contains the `#tag` strings (both numeric and alpha) from `deriveUniqueTags`.

**Edge case**: `tagFilter.items` may contain bare tags like `work` (no `#` prefix) from `session.tags` entries. `notes.includes("work")` would match "work" inside "framework" or "homework". Mitigation: only match `#`-prefixed items from the filter:

```js
const filterTags = tagFilter.items.filter(t => t.startsWith('#'));
const shouldInclude = tagFilter.items.length === 0 ||
    (session.tags && session.tags.some(tag => tagFilter.items.includes(tag))) ||
    (session.notes && filterTags.some(ht => session.notes.toLowerCase().includes(ht))) ||
    (specialTags.some(specialTag =>
        session.notes.includes(specialTag) &&
        tagFilter.items.includes(`${specialTag} support`)
    ));
```

### 2. Remove `deriveUniqueTags` backward-compatibility path in `computeTimeData`

After Phase 1, `processData` always passes `precomputedUniqueTags`. Remove the fallback path that calls `deriveUniqueTags` internally in `computeTimeData`. `computeTimeData` now requires `precomputedUniqueTags` to be set.

Impact: any test that calls `computeTimeData` directly without `precomputedUniqueTags` must be updated. This is the majority of tests. **Decision**: keep the fallback for now — only remove it if the backward-compat burden is low after Phase 2. Mark with a `@deprecated` comment.

### 3. Remove inline stats computation from `computeTimeData`

After Phase 1 moved stats to `all.js`, the inline `totalHours`/`avgDailyHours`/`topTag`/`topTagHours` in `computeTimeData` are dead code kept only for test compatibility. Remove them from the return object. Update tests that reference them to compute from `tagTotals` directly.

List of tests that need updating (from `src/js/core.test.js`):
- Tests checking `result.totalHours` — replace with `Object.values(result.tagTotals).reduce((a, b) => a + b, 0)`
- Tests checking `result.avgDailyHours` — compute from totalHours / unique date count
- Tests checking `result.topTag` / `result.topTagHours` — derive from `tagTotals`

These can use a test helper:

```js
function computeStats(result) {
    const totalHours = Object.values(result.tagTotals).reduce((a, b) => a + b, 0);
    const uniqueDates = Object.keys(result.timeData).length;
    const avgDailyHours = uniqueDates > 0 ? totalHours / uniqueDates : 0;
    let topTag = '-', topTagHours = 0;
    Object.entries(result.tagTotals).forEach(([tag, hours]) => {
        if (hours > topTagHours) { topTagHours = hours; topTag = tag; }
    });
    return { totalHours, avgDailyHours, topTag, topTagHours };
}
```

### 4. Remove `DEFAULT_EXCLUDED_TAGS` re-export from `all.js`

`all.js:10` re-exports `DEFAULT_EXCLUDED_TAGS` from `data.js`. Check if any consumer depends on `import { DEFAULT_EXCLUDED_TAGS } from './all.js'`. If not, remove it.

## Tests

### Updated `getNotesHashtags` behavior

```js
describe('addNotesCell filter logic', () => {
    it('matches filter items against notes via string includes', () => {
        // This is an integration-level behavior; best tested via
        // processData + DOM inspection if possible, or kept as a
        // ui.js unit test if ui.js exports are testable.
    });
});
```

### Stats-independent tests

Update all `computeTimeData` tests that check `result.totalHours`, `result.avgDailyHours`, `result.topTag`, `result.topTagHours` to use the `computeStats` helper instead.

## Verification

```bash
npx vitest run
```

100% of tests must pass after the refactor. Stats values must be identical before and after (verified by the helper deriving from the same `tagTotals`).

## Files modified

- `src/js/ui.js`
- `src/js/core.js`
- `src/js/core.test.js`
- `src/js/all.js`
