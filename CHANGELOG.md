# Changelog

## Unreleased

### Changed
- **Tags moved from note text to tooltip** — `addNotesCell` no longer appends tags to note text (which made notes too long). Tags are now shown as a native browser tooltip on hover via the `title` attribute. `work` tag excluded from tooltip. (bd122e0)

### Cancelled
- **Phase 3: Consolidate notes-cell filter and cleanup** — rejected: Items 2-4 already done by Phases 1-2; last item (getNotesHashtags) was pure refactor not worth the risk

### Added
- **Phase 2: Fix new-format bucket allocation** — replaced legacy bucket shortcut with priority-based allocation (rest → specialTag → redmine split → revision split → custom first-match → `#custom`). New-format sessions (`session.bucket`) now distribute time across matching project tags instead of dumping everything to `#custom`. Redmine (`^\d+$`) and revision (`^r\d+$`) tags split time evenly; custom tags use first-match-wins. Tags returned bare (no `#` prefix) matching `uniqueTags` format. Import alias `DEFAULT_NOTSUPPORT_TAGS` renamed from `DEFAULT_EXCLUDED_TAGS`. 4 new bucket allocation tests (72 total).
- **Phase 1c: Pure computation core** — fully separated data preparation (`processTimeData`) from pure computation (`computeTimeData`). Extracted all helpers to module-level (`deriveMaxDaysTimeSplit`, `computeEffectiveEnd`, `applyAllocation`, `dateEntry`, `cleanupRound`, `applyRestSpread`, `applyTimeMultipliers`, `computeStats`, `computeSessionOverlap`). `processTimeData` normalizes, derives tags, builds allocation map, then delegates to `computeTimeData` for the pure computation pass. accumBreak subtraction moved into `normalizeSessions`. Single `cleanupRound` restored after rest spread (before multipliers). Tests converted from `computeTimeData` to `processTimeData`
- **Phase 1b: Extract allocation** — extracted `normalizeSessions()` and `resolveSessionAllocation()`; replaced inline normalization and `allocateTime` with pre-computed allocation map; old `allocateTime` deleted
- **Phase 1a: Structural split** — extracted `deriveUniqueTags()` from `computeTimeData`; replaced inline tag extraction with `deriveUniqueTags` call in backward-compat path; `processData` now uses `deriveUniqueTags` for TomSelect population instead of inline `extractTags`; added `precomputedUniqueTags` option parameter
- **REST_EXCLUDED_TAGS** — `['#meet']` excluded from rest spread distribution so printed time matches original session duration. Orphaned rest routes to `#custom` when all non-rest tags are excluded (3f3b138)

### Fixed
- **Tag filter (TomSelect)** — filter selection now persists across data re-generations and triggers table recomputation on add/remove. Previously `processData` unconditionally cleared the filter and nothing wired `recomputeAndRender` to TomSelect events
- **NaN corruption in allocateTime** — when filtering by a session tag (e.g. `study`), sessions with hashtagged notes (e.g. `#opencode timer`) wrote to entry keys outside the filtered `uniqueTags`, producing NaN that zeroed out the entire row. Fixed by guarding hashtag and `#custom` writes with `tag in entry` checks
- **Notes column respects selected hashtags** — `addNotesCell` now matches both session tags AND notes hashtags against the filter, so selecting `#4203` shows notes mentioning `#4203`


