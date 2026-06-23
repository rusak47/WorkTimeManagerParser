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
- **`ui.js`** — `generateTableBody()`, `generateTableHeader()`, `addNotesCell()`, `syncSpecialTags()`.
- **`utils.js`** — `roundToHalf()`, `datediff()`, `durationToSeconds()`, `copyAndEmailTimeTable2()`.
- **`data.js`** — `sampleData` (session array), `DEFAULT_EXCLUDED_TAGS`.

## Key behaviors

- `roundToHalf()`: if the fractional part beyond 2 decimal places is negligible (< 0.01), the 2-digit decimal drives the rounding; otherwise the full decimal is used. For values < 1, decimals > 0.57 are left unchanged.
- Rest spread (`REST_TIME_MIN = 60`) distributes 60 min across all non-`rest` tags on a date, proportionally by tag count.
- Sessions spanning multiple days are split proportionally by real clock overlap, capped by `durationHours / 6 + 2` days and clamped to the start month.
- `excludeBreaks` uses separate session lists: `displaySessions` (for table/notes) and `filteredSessions` (for time computation, always includes breaks). Empty dates after stripping `rest` are removed from both.
- Weekend detection in `generateTableBody` uses `date.getDay()`, not session `dayType`, so it works regardless of `excludeBreaks`.
- Sticky cells (Notes, Total, Date) have explicit `bg-white` that overrides `tr` background — each must be updated individually for row-level styling like weekend highlighting.

## Settings (all in DOM, no persistence)

| Setting | DOM id | Type |
|---|---|---|
| Start/end date | `startDate`, `endDate` | `<input type="date">` |
| Tag filter | `tagFilter` | TomSelect `<select multiple>` |
| Exclude breaks | `excludeBreaks` | checkbox |
| Round to 0.5h | `roundToHalves` | checkbox |
| Debug mode | `debugMode` | checkbox |
| Special tags | `specialTags` | text input |

## Testing

- Tests live in `src/js/*.test.js`, run via vitest.
- Single test: `npx vitest run -t "test name"`.
- Sample data is in `src/js/data.js` (exported as `sampleData`).

## Conventions

- No lint, typecheck, or build step. Pure ESM modules, served directly.
- CSS via Tailwind CDN (play build) — classes set dynamically in JS are detected by the CDN at runtime.
- All times in hours internally, displayed with `.toFixed(1)`.
