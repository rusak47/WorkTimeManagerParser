# Phase 1c: Extract pure computation from `computeTimeData`

Part of tag-extraction-rearchitecture. Follows Phase 1b (extract allocation).
Completes the structural split of Phase 1.

## Objective

Extract every inline helper from `computeTimeData` into module-level pure
functions. Build `processTimeData` as the new public entry point that owns
preparation (normalize, derive tags, build allocation map) and calls the
computation-only `computeTimeData` with already-prepared data.

No behavioral change. All tests pass as before.

## Changes

### 1. Module-level pure functions (core.js)

All extracted as exported functions with pure parameterized signatures:

| Function | Notes |
|----------|-------|
| `deriveMaxDaysTimeSplit(durationHours)` | Renamed from orphaned `computeMaxDays` |
| `computeEffectiveEnd(startDate, endDate, durationHours)` | Orphaned closure → pure |
| `applyAllocation(entry, allocation, dayDuration)` | Orphaned closure → pure |
| `dateEntry(timeData, dateStr, uniqueTags)` | Orphaned closure → pure |
| `cleanupRound(timeData)` | Zero removal + roundToHalf. Single pass after multipliers (see item 3) |
| `applyRestSpread(timeData, restTimeMin, debugMode)` | Extracted from lines 307-350 |
| `applyTimeMultipliers(timeData, holidayMultiplier, weekendMultiplier, calendarLookup)` | Extracted from lines 364-392 |
| `computeStats(timeData, uniqueTags)` | Returns `{totalHours, tagTotals, avgDailyHours, topTag, topTagHours}` |
| `computeSessionOverlap(session, allocationMap, timeData, uniqueTags, roundToHalvesEnabled, debugMode)` | The overlap loop (lines 257-303). Marked `@legacy` |

### 2. Move accumBreak subtraction into `normalizeSessions`

Currently in the overlap loop inside `computeTimeData`:

```js
if (!is_correct_record && !session.isBreak
    && Math.abs(durationToSeconds(session.duration) - session.durationSec) < 60
    && accumBreak <= durationHours_session) {
    totalDurationHours -= accumBreak;
}
```

This adjusts the session's effective duration — it belongs in normalization.
After the move, `normalizeSessions`:

1. Copy session, collapse multi-tag with `accumulatedPauseTimeSec`
2. Set `isBreak` from `bucket`
3. **NEW**: If `!is_correct_record && !isBreak && durationMatches && accumBreak <= duration`
   → subtract `accumBreak` from `durationSec` (with `>= 0` guard)
4. Return session

This removes the `checkIsCorrectRecord` call and `totalDurationHours -= accumBreak`
from the overlap loop entirely.

### 3. Merge duplicate cleanup/round into single post-multiplier pass

Currently cleanup/round runs twice:
1. After rest spread (lines 353-361)
2. After multipliers (lines 383-391)

Per AGENTS.md multiplier ordering rule: cleanup → multiply → cleanup.

The overlap loop already rounds each `dayDuration` via `roundToHalf` before adding
to tag entries. After rest spread, values like `4.5 + 0.333 = 4.833` temporarily
have arbitrary precision — that's fine because multipliers will scale them, and the
single post-multiplier `cleanupRound` applies the final half-hour rounding.

**Change**: remove the first cleanup pass (after rest spread). Only one
`cleanupRound` call after `applyTimeMultipliers`.

### 4. `computeTimeData` → computation-only core

Signature stays `(data, options)`, but `options.allocationMap` and
`options.precomputedUniqueTags` are now required (no fallback).

Body:
```js
export function computeTimeData(data, options = {}) {
    const {
        startDate, endDate, excludeBreaks,
        allocationMap,
        precomputedUniqueTags: { uniqueTags, allTags, allSupportTags },
        roundToHalvesEnabled, restTimeMin = 60, debugMode,
        holidayMultiplier = 1, weekendMultiplier = 1, calendarLookup,
    } = options;

    if (!data?.sessions) return null;

    const filteredSessions = filterSessions(data.sessions, { startDate, endDate, excludeBreaks: false });
    const displaySessions = filterSessions(data.sessions, { startDate, endDate });
    const sessionsByDate = buildSessionsByDate(displaySessions);
    const timeData = {};
    const allTagsArray = Array.from(allTags).concat(Array.from(allSupportTags));
    uniqueTags.forEach(t => { timeData[t] = {}; });

    filteredSessions.forEach(s =>
        computeSessionOverlap(s, allocationMap, timeData, uniqueTags, roundToHalvesEnabled, debugMode));

    applyRestSpread(timeData, restTimeMin, debugMode);
    applyTimeMultipliers(timeData, holidayMultiplier, weekendMultiplier, calendarLookup);
    cleanupRound(timeData);
    const { totalHours, tagTotals, avgDailyHours, topTag, topTagHours } =
        computeStats(timeData, uniqueTags);

    // sync display tags back
    Object.keys(timeData).forEach(tag => {
        Object.keys(timeData[tag]).forEach(dateStr => {
            if (sessionsByDate[dateStr]) sessionsByDate[dateStr][tag] = timeData[tag][dateStr];
        });
    });

    return {
        filteredSessions, sessionsByDate, allTagsArray, allSupportTags,
        uniqueTags, timeData, tagTotals,
        totalHours, avgDailyHours, topTag, topTagHours,
    };
}
```

### 5. `processTimeData` → new public entry point

```js
export function processTimeData(data, options = {}) {
    if (!data?.sessions) return null;

    const sessions = normalizeSessions(data.sessions);
    const filteredForTags = filterSessions(sessions, {
        startDate: options.startDate, endDate: options.endDate, excludeBreaks: false
    });
    const { uniqueTags, allTags, allSupportTags } =
        deriveUniqueTags(filteredForTags, options.specialTags ?? [], options.selectedTags ?? []);
    const allTagsArray = Array.from(allTags).concat(Array.from(allSupportTags));
    const allocationMap = new Map();
    filteredForTags.forEach(s =>
        allocationMap.set(s, resolveSessionAllocation(s, options.specialTags ?? [], uniqueTags)));

    return computeTimeData({ sessions }, {
        ...options,
        precomputedUniqueTags: { uniqueTags, allTags, allSupportTags },
        allocationMap,
    });
}
```

### 6. `checkIsCorrectRecord` removal from overlap loop

After `accumBreak` moves into `normalizeSessions`, `checkIsCorrectRecord` is no
longer called by `computeTimeData`. Keep it exported (still used by tests and
possibly other modules) but remove the call from the overlap loop.

### 7. Update callers

**`all.js`**: `recomputeAndRender` calls `processTimeData(currentData, ...)` instead
of `computeTimeData(currentData, ...)`. The `deriveUniqueTags` import stays for
tagFilter population in `processData`.

**`core.test.js`**: ~45 calls switch from `computeTimeData(data, opts)` to
`processTimeData(data, opts)`. Import `processTimeData`.

### 8. Remove orphaned closure helpers

Delete lines 156-197 (the broken orphaned functions currently floating between
`processTimeData` and `computeTimeData`). They are replaced by the module-level
pure functions from item 1.

## Files modified

- `src/js/core.js` — major restructure
- `src/js/core.test.js` — ~45 callers switch to `processTimeData`
- `src/js/all.js` — switch to `processTimeData`

## Verification

```bash
npx vitest run
```

All tests pass with no behavioral change.

## Branch

`phase-1c-pure-computation`
