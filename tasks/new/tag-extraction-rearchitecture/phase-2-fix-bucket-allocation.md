# Phase 2: Fix new-format bucket allocation

## Objective

New-format sessions (`bucket: "work"`, tags: `["work","paylar","n8n","4203", ...]`) currently route all time to `#custom` via the bucket branch in `allocateTime`. This discards the project tags. The fix: remove the bucket branch so these sessions fall through to priority 4 (session.tags split), distributing time across all project tags.

## Behavioral change

Before:
```
bucket: "work", tags: ["work","paylar","n8n","4203"]
  → #custom gets 100% of time
  → paylar, n8n, 4203 get 0
```

After:
```
bucket: "work", tags: ["work","paylar","n8n","4203"]
  → #custom gets 25% (work maps to #custom)
  → paylar gets 25%
  → n8n gets 25%
  → 4203 gets 25%
```

The `bucket` field is preserved for break detection (`session.isBreak = session.bucket === 'rest'`) at core.js:90. Only the allocation override at allocateTime priority 2 is removed.

## Why this is safe

- **True legacy** sessions (`["work"]` single tag, no bucket) — unaffected, they hit priority 3 (notes hashtag) or priority 4 (single `work` tag → all to `#custom`), same as before.
- **Mid mix** sessions — already normalized to legacy shape before reaching `allocateTime`, so they hit priority 3 (notes hashtag). Unaffected.
- **True new** sessions — the only format affected. This is the intended fix.

## Code changes

### 1. Remove bucket branch from `allocateTime` (core.js:167-177)

Delete lines 167–177:

```js
// DELETE: entire bucket branch
} else if (session.bucket) {
    const bucketTag = session.bucket;
    if (bucketTag === "work") {
        if ("#custom" in entry) {
            entry["#custom"] += durationHours;
            foundHashtag = true;
        }
    } else if (bucketTag in entry) {
        entry[bucketTag] += durationHours;
        foundHashtag = true;
    }
```

The flow after removal: `specialTag match (priority 1)` → `notes hashtag (priority 3)` → `session.tags split (priority 4)`.

### 2. Rest sessions still work via `isBreak`

`core.js:90` remains: `session.isBreak = session.bucket === 'rest' || session.isBreak;`

Rest sessions (`bucket: "rest"`) are filtered out by `excludeBreaks` and never reach the table. If `excludeBreaks` is off, they have `tags: ["rest"]` and `allocateTime` priority 4 will allocate to `rest` column. This matches existing behavior.

### 3. Verify all format paths

After the change, the three formats resolve as:

| Format | Normalization | allocateTime hit | Result |
|--------|--------------|-----------------|--------|
| True legacy (`["work"]`) | none | priority 3 (notes `#hashtag`) or priority 4 (single `work`→`#custom`) | ✅ unchanged |
| Mid mix (normalized → `["work"]` + notes `#project`) | lines 81-88 | priority 3 (notes `#project`) | ✅ unchanged |
| True new (`["work","paylar","n8n"]` + `bucket:"work"`) | none | priority 4 (split: `work→#custom`, paylar, n8n) | ✅ **fixed** |

## Tests

### New test block: bucket session tag distribution

Add after the existing `bucket tag allocation` test (line 1167):

```js
describe('bucket sessions distribute across project tags', () => {
    it('splits duration across project tags instead of dumping to #custom', () => {
        const sessions = [{
            id: 5001,
            date: '2026-07-07',
            startTime: '2026-07-07T10:00:00.000Z',
            endTime: '2026-07-07T12:00:00.000Z',
            duration: '02:00:00',
            durationSec: 7200,
            notes: 'work on multiple projects',
            dayType: 'Workday',
            tags: ['work', 'paylar', 'n8n', '4203'],
            bucket: 'work',
            isBreak: false,
        }];
        const result = computeTimeData(
            { sessions },
            { startDate: '2026-07-07', endDate: '2026-07-07' }
        );
        // 2h split across 4 tags → 0.5h each, +0.25h rest spread each → 0.75h
        // work→#custom = 0.75h, paylar = 0.75h, n8n = 0.75h, 4203 = 0.75h
        // roundToHalf: 0.75 → 1.0 each
        expect(result.tagTotals['#custom']).toBe(1.0);
        expect(result.tagTotals['paylar']).toBe(1.0);
        expect(result.tagTotals['n8n']).toBe(1.0);
        expect(result.tagTotals['4203']).toBe(1.0);
        expect(result.totalHours).toBe(4.0);
    });

    it('preserves existing bucket tag allocation test behavior — bucket=work routes to #custom', () => {
        // This test from the existing suite should still pass:
        // bucket=work with tags ["work","projectA","projectB","projectC"]
        // Now splits across 4 tags instead of dumping to #custom
        const sessions = [{
            id: 1000,
            date: '2026-07-06',
            startTime: '2026-07-06T10:00:00.000Z',
            endTime: '2026-07-06T12:00:00.000Z',
            duration: '02:00:00',
            durationSec: 7200,
            notes: 'no hashtag here',
            dayType: 'Workday',
            tags: ['work', 'projectA', 'projectB', 'projectC'],
            bucket: 'work',
            isBreak: false,
        }];
        const result = computeTimeData(
            { sessions },
            { startDate: '2026-07-06', endDate: '2026-07-06' }
        );
        // 2h split across 4 tags → 0.5h each, +0.25h rest → 0.75h each
        // roundToHalf: 0.75 → 1.0 each → total 4.0
        expect(result.tagTotals['#custom']).toBe(1.0);
        expect(result.tagTotals['projectA']).toBe(1.0);
        expect(result.tagTotals['projectB']).toBe(1.0);
        expect(result.tagTotals['projectC']).toBe(1.0);
        expect(result.totalHours).toBe(4.0);
        expect(result.uniqueTags).toContain('projectA');
        expect(result.uniqueTags).toContain('projectB');
        expect(result.uniqueTags).toContain('projectC');
    });
});
```

### Update existing `bucket tag allocation` test

The test at line 1139-1167 currently expects `#custom=3.0` and `projectA/B/C=0`. After Phase 2, the expected values change to the split described above. Replace its expectations.

## Verification

```bash
npx vitest run
```

All tests must pass. Pay special attention to:
- True legacy session tests still pass (notes hashtag path unchanged)
- Mid mix normalization tests still pass (converted to legacy before allocateTime)
- New bucket test expectations match split distribution

## Files modified

- `src/js/core.js`
- `src/js/core.test.js`
