# Phase 1b: Extract `resolveSessionAllocation` from `computeTimeData`

Part of tag-extraction-rearchitecture. Follows Phase 1a (structural split, deriveUniqueTags).

## Objective

Split `computeTimeData`'s interleaved responsibilities into two layers:

1. **Tag processing** (tag-format-aware) — normalize sessions, resolve which tag(s) a session allocates to
2. **Computation** (tag-format-agnostic) — day-splitting, duration correction, tag accumulation, rest spread, rounding, multipliers, stats

The computation layer receives pre-resolved allocation targets so it never needs to understand `bucket`, `session.tags`, notes-hashtag patterns, or session format variants.

## Why this is still Phase 1

Phase 1a established the `deriveUniqueTags` boundary. This step completes the structural split by extruding the remaining tag-format-aware logic (`allocateTime`'s priority chain) into a pure function. **No behavioral change** — all existing tests pass unchanged. The bucket bug (new-format sessions dumping to `#custom`) is still present; it gets removed in Phase 2.

## Changes

### 1. Extract `normalizeSessions(sessions)` (core.js)

Move lines 89–102 into a standalone exported function:

```js
export function normalizeSessions(sessions) {
    return sessions.map(s => {
        const session = { ...s };
        if (session.accumulatedPauseTimeSec !== undefined && session.tags && session.tags.length > 1) {
            const restTags = session.tags.slice(1);
            session.tags = [session.tags[0]];
            if (restTags.length > 0) {
                session.notes = session.notes
                    ? `${session.notes}; ${restTags.map(tag => `#${tag}`).join(' ')}`
                    : restTags.map(tag => `#${tag}`).join(' ');
            }
        }
        session.isBreak = session.bucket === 'rest' || session.isBreak;
        return session;
    });
}
```

`computeTimeData` calls it as the first step: `const sessions = normalizeSessions(data.sessions);`

### 2. Extract `resolveSessionAllocation(session, specialTags, uniqueTags)` (core.js)

Encodes the first-match-wins priority chain from the current `allocateTime` (lines 163–223) as a pure function. Returns a static description so the computation loop needs zero tag-format knowledge:

```js
export function resolveSessionAllocation(session, specialTags, uniqueTags) {
    // Priority 1: special tag support
    if (specialTags.length > 0 && session.notes) {
        for (const specialTag of specialTags) {
            if (session.notes.toLowerCase().includes(specialTag)) {
                return { type: 'single', tag: `${specialTag} support` };
            }
        }
    }

    // Priority 2: bucket (target for Phase 2 removal)
    if (session.bucket) {
        if (session.bucket === "work") {
            return { type: 'single', tag: '#custom' };
        }
        if (uniqueTags.includes(session.bucket)) {
            return { type: 'single', tag: session.bucket };
        }
    }

    // Priority 3: notes hashtags
    if (session.notes) {
        // 3a: redmine task #\d+ (first match)
        const redmineTags = session.notes.match(/#\d+/g);
        if (redmineTags?.length > 0) {
            const tag = redmineTags[0].toLowerCase();
            if (uniqueTags.includes(tag)) {
                return { type: 'single', tag };
            }
        }

        // 3b: custom #[a-zA-Z]+ (first match)
        const customTags = session.notes.match(/#[a-zA-Z]+[a-zA-Z0-9]{0,}/);
        if (customTags?.length > 0) {
            const tag = customTags[0].toLowerCase();
            if (uniqueTags.includes(tag)) {
                return { type: 'single', tag };
            }
        }
    }

    // Priority 4: session.tags split (fallback)
    if (session.tags?.length > 0) {
        const matchingTags = session.tags.filter(t => uniqueTags.includes(t));
        if (matchingTags.length > 0) {
            const resolved = matchingTags.map(t => t === 'work' ? '#custom' : t);
            return { type: 'split', tags: resolved };
        }
    }

    return null;
}
```

The runtime `"#custom" in entry` checks in the current `allocateTime` are dead — `#custom` is always seeded by `dateEntry()`. The pure function skips them.

### 3. Pre-compute allocation map in `computeTimeData`

Before the computation loop (after `deriveUniqueTags`):

```js
const allocationMap = new Map();
filteredSessions.forEach(s => allocationMap.set(s, resolveSessionAllocation(s, specialTags, uniqueTags)));
```

### 4. Replace `allocateTime` call with simple dispatcher

In the day-splitting loop (line 266: `allocateTime(dateEntry(dateStr), session, dayDuration)`):

```js
const alloc = allocationMap.get(session);
if (alloc?.type === 'single') {
    entry[alloc.tag] += dayDuration;
} else if (alloc?.type === 'split') {
    const share = dayDuration / alloc.tags.length;
    alloc.tags.forEach(tag => { entry[tag] += share; });
}
```

Tag-format-agnostic.

### 5. Remove `allocateTime` (dead code)

Delete lines 163–223 entirely.

### 6. Keep `computeTimeData` public API unchanged

Signature `(data, options)` stays the same. All 64 existing tests pass with no changes.

### 7. Add direct tests for `resolveSessionAllocation`

```js
describe('resolveSessionAllocation', () => {
    it('priority 1: special tag match → support tag', () => {
        const s = { notes: 'work on #4182 bonfire task' };
        expect(resolveSessionAllocation(s, ['bonfire'], ['bonfire support']))
            .toEqual({ type: 'single', tag: 'bonfire support' });
    });

    it('priority 2: bucket:work → #custom', () => {
        const s = { bucket: 'work', tags: ['work','paylar','n8n'], notes: '' };
        expect(resolveSessionAllocation(s, [], ['#custom','work','paylar','n8n']))
            .toEqual({ type: 'single', tag: '#custom' });
    });

    it('priority 3a: #\\d+ in notes', () => {
        const s = { notes: 'fixed #4203 and #4204', tags: ['work'] };
        expect(resolveSessionAllocation(s, [], ['#custom','#4203','#4204']))
            .toEqual({ type: 'single', tag: '#4203' });
    });

    it('priority 3b: #[a-zA-Z]+ in notes (no redmine match)', () => {
        const s = { notes: 'meeting with team #meet', tags: ['work'] };
        expect(resolveSessionAllocation(s, [], ['#custom','#meet']))
            .toEqual({ type: 'single', tag: '#meet' });
    });

    it('priority 4: session.tags split (no notes match, no bucket)', () => {
        const s = { notes: 'general work', tags: ['work', 'paylar', 'n8n'] };
        expect(resolveSessionAllocation(s, [], ['#custom', 'paylar', 'n8n', 'work']))
            .toEqual({ type: 'split', tags: ['#custom', 'paylar', 'n8n'] });
    });

    it('no match → null', () => {
        const s = { notes: '', tags: [] };
        expect(resolveSessionAllocation(s, [], [])).toBeNull();
    });
});
```

## Files modified

- `src/js/core.js`
- `src/js/core.test.js`

## Verification

```bash
npx vitest run
```

64 existing tests + 6+ new tests pass. No behavioral change in the UI or computation output.

## Branch

Create and work on a new branch: `phase-1b-extract-allocation`
