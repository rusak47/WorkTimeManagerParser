# src/js — Module-level details

## core.js

- `computeTimeData` signature: `(data, { startDate, endDate, excludeBreaks, specialTags, selectedTags, roundToHalvesEnabled, debugMode, holidayMultiplier, weekendMultiplier, calendarLookup })`
- Multiplier ordering: cleanup (roundToHalf) → multiply → cleanup. Never multiply before rounding — `roundToHalf`'s negligible-remainder heuristic produces off-by-0.5 on doubled values.

## ui.js

- `generateTableBody` signature: `(tbody, timeData, sessionsByDate, uniqueTags, specialTags, tagFilter, calendarLookup, locale)`
- `addNotesCell` takes `stickyBg` string instead of `isWeekend` boolean.
