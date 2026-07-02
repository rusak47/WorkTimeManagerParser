# Tag filter (TomSelect) does not recompute table — and is always cleared on processData

## Symptom

The "Filter tags" dropdown (TomSelect) cannot actually filter the displayed table. When the user changes the selection — or when `processData` runs without `selectedTagsOverride` — the filter is cleared to zero items, `effectiveSelectedTags` becomes `null`, and all tags are shown unconditionally.

## Reproduction

1. Add two sessions for 2026-06-26:
   - Session A: tags `["study", "write"]`, notes `"#opencode timer"`, 20 min
   - Session B: tags `["work"]`, notes `"#paylar #4203 #plais docs"`, 3 h
2. Set the date range to include Jun 26, click "Use Sample Data".
3. Both sessions appear in the table: `#4203` = 3.0h (work session, correct) and `#opencode` = 0.3h (study/write session, unexpected).
4. Try to select only `#4203` (or `"work"`) in "Filter tags" → nothing happens. The table does not update.
5. Click "Use Sample Data" again → the filter selection is gone, all tags shown again.

## Root cause 1: filter never triggers recomputation

`processData` captures the filter state once during its initial run (`effectiveSelectedTags = tagFilter?.items.length > 0 ? tagFilter.items : null`, `all.js:93`) and passes it as `selectedTags` to `computeTimeData`. After that, there is no event handler that re-runs `processData` when the TomSelect selection changes.

The TomSelect `onItemAdd` / `onItemRemove` callbacks only invoke `syncSpecialTags` (which manages support-tag → base-tag syncing), never `processData`.

## Root cause 2: processData unconditionally clears the filter

Every call to `processData` runs (`all.js:56-58`):

```js
tagFilter.clear();
tagFilter.clearOptions();
tagFilter.addOptions(allTagsArray.map(...));
```

This destroys any user-made selection. Since the auto-selection loop depends on `specialTags` (which defaults to `[]`), `autoSelected` is always empty and `tagFilter.addItems([])` is a no-op. The filter ends up with zero selected items, `effectiveSelectedTags = null`, and every tag in the date range becomes a column.

## Root cause 3: selectedTags does not behave as a display filter

Even if `selectedTags` were correctly populated, it does not filter **sessions** — it filters which **tag columns** appear in `timeData`. Tags not in `selectedTags` are absent from `timeData`, so any session time that would have been allocated to an absent tag is silently lost rather than reallocated. This is not what a user expects from a "filter tags" control.

## Impact

- The "Filter tags" UI control is effectively decorative — it cannot narrow the displayed columns or sessions.
- Any user attempt to restrict the view (e.g., "show only work-related sessions") fails.
- The control resets every time sample data is loaded, inviting confusion when the user tries again and loses their selection.

## Suggested fix

Add a change event listener on the tagFilter (TomSelect) that re-runs `processData` (or a lightweight re-render) with the current filter selection preserved as `selectedTagsOverride`.

Alternatively, separate the concern: keep the filter for the notes display (as it currently works via `addNotesCell`) and remove it from the `computeTimeData` computation entirely (i.e., always pass `selectedTags: null`). Then wire it to filter session notes only.
