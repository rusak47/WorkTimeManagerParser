# Phase 2: Fix new-format bucket allocation

## Objective

New-format sessions (`bucket: "work"`, `tags: ["work","paylar","n8n","4203"]`) dump all time to `#custom`. Replace the bucket branch in `resolveSessionAllocationLegacy` with the same priority structure as the legacy notes path, adapted for bare tags.

## Priority rules (new format only, `session.bucket` is set)

Tags in `session.tags` are bare (no `#` prefix). `session.tags` may include `work` and/or `rest`.

1. **`rest` bucket** → `{ type: 'single', tag: 'rest' }` (preserve `rest` allocation when `excludeBreaks=false`)
2. **specialTag** — if any tag matches a specialTag (case-insensitive) → single `"specialTag support"`
3. **redmine tags** (`^\d+$`) — ALL matching tags split
4. **revision tags** (`^r\d+$`) — ALL matching tags split (starts with `r`, then one or more digits, end of string)
5. **custom tags** — first match wins (single tag)
6. **fallback** → `#custom` gets 100%

`work` is excluded from matching (always fallback to `#custom`). `rest` is excluded when `bucket` is not `"rest"`.

### tagInSelected helper

Since `selectedTags` may contain bare or `#`-prefixed entries, check both:
```
tagInSelected(tag) → selectedTags.includes(tag) || selectedTags.includes('#' + tag)
```

## Examples verified

| Tags | Redmine | Revision | Custom | Support | Result |
|------|---------|----------|--------|--------|--------|
| `work,paylar,n8n,4203` | `4203` ✓ | — | — | — | `#4203` 100% |
| `work,4202,paylar,n8n,4203` | `4202,4203` ✓ | — | — | — | `#4202` 50%, `#4203` 50% |
| `work,r1202,paylar,n8n,r1203` | — | `r1202,r1203` ✓ | — | —  | `#r1202` 50%, `#r1203` 50% |
| `work,paylar` | — | — | — | `paylar` ✓ | `#paylar support` 100% |
| `work,paylar,support` | — | — | — | `support last tag exact matches, take previous as support` ✓ | `#paylar support` 100% |
| `work,n8n,test` | — | — | `n8n` (first in DEFAULT_NOTSUPPORT_TAGS) ✓ | — | `#n8n` 100%, test 0% |

## Changes

### `resolveSessionAllocationLegacy` in `core.js`

Replace the current bucket branch (lines 111-123):

```javascript
if (session.bucket) {
    if (session.bucket === 'rest') {
        return { type: 'single', tag: 'rest' };
    }

    const tags = session.tags.filter(t => t !== 'work' && t !== 'rest');

    // 1) specialTag
    if (specialTags.length > 0) {
        for (const specialTag of specialTags) {
            if (tags.some(t => t.toLowerCase() === specialTag.toLowerCase())) {
                return { type: 'single', tag: `${specialTag} support` };
            }
        }
    }

    const isTagged = (t) => selectedTags.includes(t) || selectedTags.includes('#' + t);

    // 2) redmine — ALL matching split
    const redmineMatches = tags.filter(t => /^\d+$/.test(t) && isTagged(t));
    if (redmineMatches.length > 0) {
        const resolved = redmineMatches.map(t => '#' + t);
        return resolved.length === 1
            ? { type: 'single', tag: resolved[0] }
            : { type: 'split', tags: resolved };
    }

    // 3) revision — ALL matching split
    const revisionMatches = tags.filter(t => /^r\d+$/.test(t) && isTagged(t));
    if (revisionMatches.length > 0) {
        const resolved = revisionMatches.map(t => '#' + t);
        return resolved.length === 1
            ? { type: 'single', tag: resolved[0] }
            : { type: 'split', tags: resolved };
    }

    // 4) custom — first match
    for (const tag of tags) {
        if (isTagged(tag)) {
            return { type: 'single', tag: '#' + tag };
        }
    }

    // 5) fallback
    return { type: 'single', tag: '#custom' };
}
```

### Update import alias in `core.js`

`DEFAULT_EXCLUDED_TAGS as DEFAULT_NOSUPPORT_TAGS` → `DEFAULT_NOTSUPPORT_TAGS` (already renamed in `data.js`)

### Update test: `bucket tag allocation`

Current test (line 1221-1249) expects `#custom=3.0` and `projectA/B/C=0`. After fix:
- `projectA/B/C` are custom tags → first match (`projectA`) gets 100% of the 2h work time
- rest spread: `projectA` gets +1.0h → total 3.0h
- `#custom=0`, `projectA=3.0`, `projectB=0`, `projectC=0`

Add test for redmine split scenario.

## Files modified

- `src/js/core.js` — bucket branch replacement, import alias
- `src/js/core.test.js` — update bucket test expectations, add split tests

## Verification

```bash
npx vitest run
```

All legacy and mid-mix tests must still pass. New-format tests reflect split behavior.
