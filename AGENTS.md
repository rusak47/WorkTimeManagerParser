# Time Tracker Dashboard

Single-page HTML/JS app (no framework). Visualizes time-tracking sessions from JSON data.

## Commands

- `npm test` — run all vitest tests
- `npm run test:watch` — watch mode
- `npx serve src/` — serve the app locally (static file server)

## Architecture

App entry: `src/index.html` loads `src/js/all.js` as ES module.

Pipeline: `data.js` (samples) → `core.js` (computation) → `all.js` (orchestrator + DOM reads) → `ui.js` (render).

Key modules:
- **`core.js`** — `computeTimeData()`, `filterSessions()`, `extractTags()`, `checkIsCorrectRecord()`. Pure computation, no DOM.
- **`all.js`** — `processData()` reads DOM checkboxes/inputs, calls `computeTimeData()`, then calls UI renders. Also binds `DOMContentLoaded` event listeners.
- **`ui.js`** — `generateTableBody()`, `generateTableHeader()`, `addNotesCell()`, `syncSpecialTags()`. `addNotesCell` now takes `stickyBg` string instead of `isWeekend` boolean.
- **`utils.js`** — `roundToHalf()`, `datediff()`, `durationToSeconds()`, `copyAndEmailTimeTable2()`.
- **`data.js`** — `sampleData` (session array), `DEFAULT_EXCLUDED_TAGS`.

## Key behaviors

- `roundToHalf()`: if the fractional part beyond 2 decimal places is negligible (< 0.01), the 2-digit decimal drives the rounding; otherwise the full decimal is used. For values < 1, decimals > 0.57 are left unchanged. **Trap**: when applied to doubled values (e.g. 13.01667 = 6.5083 × 2), the negligible-remainder path triggers: `13.01667 % 1 = 0.01667`, truncated to `13.01`, remainder `0.00667 < 0.01` → checkDecimal = `13.01 % 1 = 0.01` → `0.01 < 0.57` → adjustment = 0.5 → `13 + 0.5 = 13.5`. Expected was 13.0. Fix: always round before multiplier, then round again after.
- Rest spread (`REST_TIME_MIN = 60`) distributes 60 min across all non-`rest` tags on a date, proportionally by tag count.
- Sessions spanning multiple days are split proportionally by real clock overlap, capped by `durationHours / 6 + 2` days and clamped to the start month. `+2` guarantees at least 2 days (even short sessions straddling midnight); each additional 6 hours adds one more day. Examples: 2h → 2 days, 7h → 3 days, 14h → 4 days, 30h → 7 days.
- `excludeBreaks` uses separate session lists: `displaySessions` (for table/notes) and `filteredSessions` (for time computation, always includes breaks). Empty dates after stripping `rest` are removed from both.
- Weekend detection in `generateTableBody` uses `date.getDay()`, not session `dayType`, so it works regardless of `excludeBreaks`.
- Sticky cells (Notes, Total, Date) have explicit `bg-white` that overrides `tr` background — each must be updated individually for row-level styling like weekend highlighting.
- **Multiplier ordering**: cleanup (roundToHalf) → multiply → cleanup. Never multiply before rounding — `roundToHalf`'s negligible-remainder heuristic produces off-by-0.5 on doubled values.
- **Multiplier precedence**: holiday > weekend. If a date is both a holiday and a weekend, only holidayMultiplier applies. `swapped_workday` dates get no weekend multiplier. `rest` tag is never multiplied.
- **Weekend detection**: uses `dt.getUTCDay()` in `core.js`, not calendar entry type. Works independently of `calendarLookup`.
- **Holiday JSON format**: `{ "LV": { "2026-01-01": { type, name, is_memoriam?, note?, ... } } }`. Top-level key is Unicode locale code. Calendar entry `type` values: `holiday`, `observed_holiday`, `swapped_day_off`, `swapped_workday`, `pre_holiday_short`, `workday`, `weekend`. Memoriam is NOT a type — it's an `is_memoriam: true` boolean flag on any entry type.
- **Copy table**: `copyAndEmailTimeTable2()` copies the table using the Clipboard API (`navigator.clipboard.write`). It collects all page styles (including Tailwind CDN generated rules), inlines computed styles on every element in a clone, and writes `text/html` + `text/plain` to the clipboard — preserving formatting when pasting into rich editors or email.

## Settings (all in DOM, no persistence)

| Setting | DOM id | Type |
|---|---|---|
| Start/end date | `startDate`, `endDate` | `<input type="date">` |
| Tag filter | `tagFilter` | TomSelect `<select multiple>` |
| Exclude breaks | `excludeBreaks` | checkbox |
| Round to 0.5h | `roundToHalves` | checkbox |
| Debug mode | `debugMode` | checkbox |
| Special tags | `specialTags` | text input |
| Holiday multiplier | `holidayMultiplier` | number (default 1.0) |
| Weekend multiplier | `weekendMultiplier` | number (default 1.0) |

## Testing

- Tests live in `src/js/*.test.js`, run via vitest.
- Single test: `npx vitest run -t "test name"`.
- Sample data is in `src/js/data.js` (exported as `sampleData`).

## Conventions

- No lint, typecheck, or build step. Pure ESM modules, served directly.
- CSS via Tailwind CDN (play build) — classes set dynamically in JS are detected by the CDN at runtime.
- All times in hours internally, displayed with `.toFixed(1)`.

