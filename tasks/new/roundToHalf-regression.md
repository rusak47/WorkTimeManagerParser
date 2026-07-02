# roundToHalf negligible-remainder heuristic produces off-by-0.5 for natural session-split values

## Symptom

Toggling "Round to 0.5h" in the GUI changes per-day totals by ±0.5h for dates that contain multi-day split sessions, even though the toggle should only affect display precision. The bug is in `roundToHalf` itself — not in the toggle wiring.

## Example (June 4–5, 2026)

| Date | #n8n (roundToHalves=OFF) | #n8n (roundToHalves=ON) | Δ |
|------|--------------------------|-------------------------|---|
| Jun 4 | 7.0h | 7.5h | +0.5 |
| Jun 5 | 5.5h | 6.0h | +0.5 |
| Jun 6 | 10.0h | 10.0h | 0 |

Total discrepancy: **1.0h** across two days.

## Root cause

`src/js/utils.js:71-87` — `roundToHalf` has a "negligible remainder" heuristic at line 78:

```js
const checkDecimal = num - truncated < 0.01 ? truncated % 1 : decimal_part;
```

If the remainder beyond 2 decimal places is `< 0.01`, the 2-digit truncated decimal drives the rounding decision instead of the full value. This was designed to handle clean doubled values (e.g., `13.01667`) but misfires on naturally imprecise per-session, per-day split values like `1.0208`, `2.2542`, `4.6647`.

### How the misfire works

```
roundToHalf(1.0208):
  decimal_part = 0.0208
  truncated = 1.02
  num - truncated = 0.0008 < 0.01  → negligible path
  checkDecimal = 1.02 % 1 = 0.02  → 0.02 < 0.57 → adjustment = 0.5
  return 1 + 0.5 = 1.5
  CORRECT nearest-half: Math.round(1.0208 × 2) / 2 = 1.0
  ERROR: +0.5

roundToHalf(4.6647):
  decimal_part = 0.6647
  truncated = 4.66
  num - truncated = 0.0047 < 0.01  → negligible path
  checkDecimal = 4.66 % 1 = 0.66  → 0.66 > 0.57 → adjustment = Math.round(0.66) = 1
  return 4 + 1 = 5.0
  CORRECT nearest-half: Math.round(4.6647 × 2) / 2 = 4.5
  ERROR: +0.5
```

### Why the toggle matters

The pipeline fires `roundToHalf` at different stages depending on the setting:

```
OFF:  accumulate raw → rest spread → final roundToHalf   (1 pass)
ON:   round per-day split → accumulate → rest spread → final roundToHalf   (2 passes)
```

The two paths don't accumulate errors the same way, producing a visible 1h swing.

## Impact

- Affects any date where a session's per-day split proportion falls in the 1–5h range with a small fractional remainder (< 0.01 beyond 2 decimal places)
- Multi-day sessions are the most common trigger since their per-day portions are naturally imprecise
- The bug exists even with roundToHalves=OFF: the FINAL cleanup `roundToHalf` (always applied, line 277 of core.js) also misfires on values like 6.6855, returning 7.0 instead of correct 6.5

## Suggested fix

The negligible-remainder heuristic at line 78 should be replaced with standard arithmetic rounding to the nearest 0.5:

```js
return Math.round(num * 2) / 2;
```

Or if the heuristic must be preserved for doubled-value edge cases, the threshold and path should be tightened to prevent false positives on natural non-doubled values.

## History

- `roundToHalf` was introduced to handle rounding to 0.5 with a special path for "clean" doubled values (see AGENTS.md multiplier-ordering trap)
- The negligible-remainder heuristic at `utils.js:78` is the specific regression point
- First noticed when toggling "Round to 0.5h" on the June 4–6 test data produced unexpected 0.5h shifts on Jun 4 and Jun 5

## Data to reproduce

Sample sessions: `sampleData` from `src/js/data.js`, IDs 1780573610045 through 1780778338837 (Jun 4–6, 2026).

Test: `src/js/core.test.js` > `restExcludedTags > traces June 4-6 calculation in detail`.

Expected: toggling `roundToHalvesEnabled` should not produce a 1.0h swing in total.
Actual: Jun 4 #n8n=7.0 (OFF) vs 7.5 (ON), Jun 5 #n8n=5.5 (OFF) vs 6.0 (ON).
