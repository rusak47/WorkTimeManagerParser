# src/js — Module-level details

## core.js

- `computeTimeData` signature: `(data, { startDate, endDate, excludeBreaks, specialTags, selectedTags, roundToHalvesEnabled, debugMode, holidayMultiplier, weekendMultiplier, calendarLookup })`
- Multiplier ordering: cleanup (roundToHalf) → multiply → cleanup. Never multiply before rounding — `roundToHalf`'s negligible-remainder heuristic produces off-by-0.5 on doubled values.
- `uniqueTags` from `computeTimeData` never contains `work` — it's always mapped to `#custom` in `allocateTime()`.
- `allocateTime` priority: specialTag support > `#\d+` hashtag > `#[a-zA-Z]+` hashtag > session.tags > `#custom`. Only first matching hashtag per session gets time.
- `filteredSessions` (computation) always includes breaks; `displaySessions` (table/notes) respects `excludeBreaks`.
- `computeEffectiveEnd` clamps sessions to: real end, end-of-month, or start+maxDays — whichever is earliest.
- `computeMaxDays(0)` returns 2. Sessions ≤3h return 1 day. Formula: `⌊duration/6⌋ + 2`.
- `rest` is always computed into `timeData` in core.js. Cleanup when `excludeBreaks=true` happens in `all.js:processData` post-hoc.
- `swapped_workday` blocks weekendMultiplier. `swapped_day_off` triggers holidayMultiplier (even when it lands on a raw weekend).
- `checkIsCorrectRecord` is never called for break sessions (`!session.isBreak` guard).

## ui.js

- `generateTableBody` signature: `(tbody, timeData, sessionsByDate, uniqueTags, specialTags, tagFilter, calendarLookup, locale)`
- `addNotesCell` takes `stickyBg` string instead of `isWeekend` boolean.
- `syncSpecialTags()` is a side-effect function: when a "support" tag is added to TomSelect, it adds the base tag and updates the `specialTags` input value. Fires on `onItemAdd`/`onItemRemove`.
- Tag totals and grand total are recalculated again in `generateTableBody` — duplicate of core.js logic.
- `work` tag cells are intentionally left blank (not `-`). `console.error` if `work` has accumulated time (should never happen).

## all.js

- `processData` recalculates stats (totalHours, avgDaily, topTag) from `timeData` directly, ignoring `computeTimeData`'s return values for these.
- Holiday JSON is loaded with `with { type: 'json' }` import attribute. Only the first locale key in the file is used (`Object.keys(holidaysRaw)[0]`).
