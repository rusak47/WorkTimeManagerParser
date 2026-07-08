# Changelog

## Unreleased

### Planned
- **Tag extraction rearchitecture** — split tag discovery from time allocation; fix new-format bucket sessions to distribute time across project tags instead of dumping to `#custom` (3-phase plan in `tasks/new/tag-extraction-rearchitecture/`)

### Added

### Added
- **REST_EXCLUDED_TAGS** — `['#meet']` excluded from rest spread distribution so printed time matches original session duration. Orphaned rest routes to `#custom` when all non-rest tags are excluded (3f3b138)

### Fixed
- **Tag filter (TomSelect)** — filter selection now persists across data re-generations and triggers table recomputation on add/remove. Previously `processData` unconditionally cleared the filter and nothing wired `recomputeAndRender` to TomSelect events
- **NaN corruption in allocateTime** — when filtering by a session tag (e.g. `study`), sessions with hashtagged notes (e.g. `#opencode timer`) wrote to entry keys outside the filtered `uniqueTags`, producing NaN that zeroed out the entire row. Fixed by guarding hashtag and `#custom` writes with `tag in entry` checks
- **Notes column respects selected hashtags** — `addNotesCell` now matches both session tags AND notes hashtags against the filter, so selecting `#4203` shows notes mentioning `#4203`


