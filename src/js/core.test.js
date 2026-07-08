import { describe, it, expect } from 'vitest';
import { computeTimeData, filterSessions, extractTags, checkIsCorrectRecord, deriveUniqueTags, resolveSessionAllocation } from './core.js';
import { sampleData } from './data.js';
import { roundToHalf, datediff, durationToSeconds } from './utils.js';

describe('roundToHalf', () => {
    it('rounds values below 0.57 up to 0.5', () => {
        expect(roundToHalf(0.3)).toBe(0.5);
        expect(roundToHalf(0.4)).toBe(0.5);
        expect(roundToHalf(0.5)).toBe(0.5);
    });

    it('passes values > 0.57 below 1 unchanged', () => {
        expect(roundToHalf(0.75)).toBe(0.75);
        expect(roundToHalf(0.6)).toBe(0.6);
    });

    it('rounds larger values to nearest half', () => {
        expect(roundToHalf(2.95)).toBe(3);
        expect(roundToHalf(2.3)).toBe(2.5);
        expect(roundToHalf(1.1)).toBe(1.5);
    });

    it('handles integers', () => {
        expect(roundToHalf(0)).toBe(0);
        expect(roundToHalf(3)).toBe(3);
    });
});

describe('datediff', () => {
    it('calculates difference in hours', () => {
        const result = datediff('2025-06-16T14:00:00.000Z', '2025-06-16T16:45:00.000Z');
        expect(result.hours).toBeCloseTo(2.75, 2);
    });

    it('returns formatted string', () => {
        const result = datediff('2025-06-16T12:15:00.000Z', '2025-06-16T13:32:00.000Z');
        expect(result.formatted).toBe('01:17:00');
    });
});

describe('durationToSeconds', () => {
    it('parses HH:MM:SS format', () => {
        expect(durationToSeconds('01:17:00')).toBe(4620);
        expect(durationToSeconds('02:45:00')).toBe(9900);
    });

    it('parses MM:SS format', () => {
        expect(durationToSeconds('32:00')).toBe(1920);
    });

    it('returns 0 for invalid input', () => {
        expect(durationToSeconds(null)).toBe(0);
        expect(durationToSeconds('')).toBe(0);
    });
});

describe('filterSessions', () => {
    const sessions = sampleData.sessions;

    it('filters by date range', () => {
        const result = filterSessions(sessions, {
            startDate: '2025-06-16',
            endDate: '2025-06-17',
            excludeBreaks: false,
        });
        expect(result).toHaveLength(5);
    });

    it('excludes break sessions when requested', () => {
        const result = filterSessions(sessions, {
            startDate: '2025-06-16',
            endDate: '2025-06-18',
            excludeBreaks: true,
        });
        result.forEach(s => expect(s.isBreak).toBe(false));
    });

    it('returns empty array for out-of-range date', () => {
        const result = filterSessions(sessions, {
            startDate: '2025-01-01',
            endDate: '2025-01-02',
            excludeBreaks: false,
        });
        expect(result).toHaveLength(0);
    });
});

describe('checkIsCorrectRecord', () => {
    it('matches manually-set is_correct_record for non-break sessions in sampleData', () => {
        sampleData.sessions.forEach(session => {
            if (!('is_correct_record' in session)) return;
            const { is_correct_record: expected, id, notes } = session;
            const msg = `session id=${id} (${notes})`;
            expect(checkIsCorrectRecord(session), msg).toBe(expected);
        });
    });
});

describe('extractTags', () => {
    it('extracts all unique tags from sessions', () => {
        const { allTags, allSupportTags } = extractTags(sampleData.sessions, []);
        expect(allTags.has('work')).toBe(true);
        expect(allTags.has('meeting')).toBe(true);
        expect(allTags.has('coding')).toBe(true);
        expect(allTags.has('#custom')).toBe(true);
    });

    it('extracts support tags with special tags enabled', () => {
        const { allTags } = extractTags(sampleData.sessions, ['PLR']);
        expect(allTags.has('PLR support')).toBe(true);
    });

    it('only extracts tags from the given set of sessions', () => {
        const singleDay = sampleData.sessions.filter(s => s.date === '2025-06-18');
        const { allTags } = extractTags(singleDay, []);
        expect(allTags.has('fitness')).toBe(true);
        expect(allTags.has('learning')).toBe(true);
        expect(allTags.has('work')).toBe(false);
        expect(allTags.has('meeting')).toBe(false);
    });
});

describe('deriveUniqueTags', () => {
    it('produces same output as manual extractTags + array build', () => {
        const sessions = filterSessions(sampleData.sessions, {
            startDate: '2026-07-01', endDate: '2026-07-03', excludeBreaks: false
        });
        const result = deriveUniqueTags(sessions, [], []);
        const { allTags, allSupportTags } = extractTags(sessions, []);
        const expected = Array.from(allTags).concat(Array.from(allSupportTags)).sort();
        expect(result.uniqueTags).toEqual(expected);
    });

    it('respects selectedTags filter', () => {
        const sessions = filterSessions(sampleData.sessions, {
            startDate: '2026-07-01', endDate: '2026-07-03', excludeBreaks: false
        });
        const result = deriveUniqueTags(sessions, [], ['#4203']);
        expect(result.uniqueTags).toEqual(['#4203']);
    });

    it('accepts precomputedUniqueTags on computeTimeData', () => {
        const sessions = filterSessions(sampleData.sessions, {
            startDate: '2026-07-01', endDate: '2026-07-03', excludeBreaks: false
        });
        const tagInfo = deriveUniqueTags(sessions, [], []);
        const result = computeTimeData(sampleData, {
            startDate: '2026-07-01', endDate: '2026-07-03',
            precomputedUniqueTags: tagInfo,
        });
        expect(result).not.toBeNull();
        expect(Array.isArray(result.uniqueTags)).toBe(true);
        expect(result.uniqueTags.length).toBeGreaterThan(0);
    });
});

describe('resolveSessionAllocation', () => {
    it('priority 1: special tag match → support tag', () => {
        const s = { notes: 'work on #4182 bonfire task' };
        expect(resolveSessionAllocation(s, ['bonfire'], ['bonfire support']))
            .toEqual({ type: 'single', tag: 'bonfire support' });
    });

    it('priority 2: bucket:work → #custom', () => {
        const s = { bucket: 'work', tags: ['work', 'paylar', 'n8n'], notes: '' };
        expect(resolveSessionAllocation(s, [], ['#custom', 'work', 'paylar', 'n8n']))
            .toEqual({ type: 'single', tag: '#custom' });
    });

    it('priority 3a: #\\d+ in notes', () => {
        const s = { notes: 'fixed #4203 and #4204', tags: ['work'] };
        expect(resolveSessionAllocation(s, [], ['#custom', '#4203', '#4204']))
            .toEqual({ type: 'single', tag: '#4203' });
    });

    it('priority 3b: #[a-zA-Z]+ in notes (no redmine match)', () => {
        const s = { notes: 'meeting with team #meet', tags: ['work'] };
        expect(resolveSessionAllocation(s, [], ['#custom', '#meet']))
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

describe('computeTimeData', () => {
    it('returns null for invalid data', () => {
        expect(computeTimeData(null)).toBeNull();
        expect(computeTimeData({})).toBeNull();
    });

    it('returns correct structure with sample data', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-18',
        });

        expect(result).not.toBeNull();
        expect(result.filteredSessions).toHaveLength(7);
        // 'meeting' is stripped by normalization (session has accumulatedPauseTimeSec + >1 tags)
        expect(result.uniqueTags).not.toContain('meeting');
        expect(result.uniqueTags).not.toContain('work');
        expect(result.totalHours).toBeGreaterThan(0);
        expect(result.avgDailyHours).toBeGreaterThan(0);
    });

    it('groups sessions by date', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-18',
        });

        expect(Object.keys(result.sessionsByDate)).toContain('2025-06-16');
        expect(Object.keys(result.sessionsByDate)).toContain('2025-06-17');
        expect(Object.keys(result.sessionsByDate)).toContain('2025-06-18');
    });

    it('reports the most active tag', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-18',
        });

        expect(result.topTag).toBe('#1234');
        expect(result.topTagHours).toBeGreaterThan(0);
    });

    it('excludes breaks when requested', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-18',
            excludeBreaks: true,
        });

        const days = Object.keys(result.sessionsByDate);
        const jun16 = result.sessionsByDate[days.find(d => d.includes('2025-06-16'))];
        jun16.forEach(s => expect(s.isBreak).toBe(false));
    });

    it('rounds to halves when enabled', () => {
        const normal = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-18',
            roundToHalvesEnabled: false,
        });

        const rounded = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-18',
            roundToHalvesEnabled: true,
        });

        Object.keys(rounded.timeData).forEach(date => {
            Object.keys(rounded.timeData[date]).forEach(tag => {
                const val = rounded.timeData[date][tag];
                const doubled = val * 2;
                const nearestInt = Math.round(doubled);
                if (val < 1 && val > 0.57) {
                    return;
                }
                expect(Math.abs(doubled - nearestInt)).toBeLessThan(0.001);
            });
        });
    });

    it('allocates via notes hashtag for normalized sessions', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-18',
            roundToHalvesEnabled: false,
        });

        const jun16 = result.timeData['2025-06-16'];
        expect(jun16['#meeting']).toBeGreaterThan(0);
    });

    it('spreads rest time across active tags', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-16',
            roundToHalvesEnabled: false,
        });

        const jun16 = result.timeData['2025-06-16'];
        const nonZeroTags = Object.entries(jun16).filter(([_, h]) => h > 0);
        expect(nonZeroTags.length).toBeGreaterThanOrEqual(2);
    });

    it('extracts #hashtags from notes as tag columns', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-18',
        });

        expect(result.uniqueTags).toContain('#1234');
    });

    it('only includes tags present in the selected date range', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-18',
            endDate: '2025-06-18',
        });
        expect(result.uniqueTags).toContain('fitness');
        expect(result.uniqueTags).toContain('learning');
        expect(result.uniqueTags).not.toContain('work');
        expect(result.uniqueTags).not.toContain('meeting');
    });

    it('handles empty sessions array', () => {
        const result = computeTimeData({ sessions: [] }, {
            startDate: '2025-06-16',
            endDate: '2025-06-18',
        });

        expect(result).not.toBeNull();
        expect(result.totalHours).toBe(0);
    });

    it('handles a single-day date range', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-18',
            endDate: '2025-06-18',
        });

        expect(Object.keys(result.sessionsByDate)).toHaveLength(1);
        expect(result.avgDailyHours).toBe(result.totalHours);
    });

    it('excludes tags with zero time from timeData', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-18',
            endDate: '2025-06-18',
        });

        Object.values(result.timeData).forEach(day => {
            Object.entries(day).forEach(([_, hours]) => {
                expect(hours).toBeGreaterThan(0);
            });
        });
    });

    it('correctly computes duration for session with break adjustment', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-16',
            roundToHalvesEnabled: false,
        });

        const jun16 = result.timeData['2025-06-16'];
        const totalDay = Object.values(jun16).reduce((a, b) => a + b, 0);
        expect(totalDay).toBeGreaterThan(0);
    });

    it('does not subtract accumulatedPauseTimeSec when it exceeds durationSec', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2026-04-06',
            endDate: '2026-04-06',
            roundToHalvesEnabled: false,
        });

        const allValues = Object.values(result.timeData['2026-04-06']);
        allValues.forEach(v => expect(v).toBeGreaterThanOrEqual(0));
    });

    it('produces positive total for day with record where accumBreak > durationSec', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2026-04-06',
            endDate: '2026-04-06',
            roundToHalvesEnabled: false,
        });

        const day = result.timeData['2026-04-06'];
        const total = Object.values(day).reduce((a, b) => a + b, 0);
        expect(total).toBeCloseTo(2, 0);
    });

    it('correctly adjusts duration when accumBreak is valid and smaller than duration', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-16',
            roundToHalvesEnabled: false,
        });

        const jun16 = result.timeData['2025-06-16'];
        const tags = Object.keys(jun16);
        const total = Object.values(jun16).reduce((a, b) => a + b, 0);
        expect(total).toBeGreaterThan(0);
        expect(tags.length).toBeGreaterThanOrEqual(4);
    });

    it('places multi-day sessions in sessionsByDate for all calendar days spanned', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2026-02-11',
            endDate: '2026-02-12',
            roundToHalvesEnabled: false,
        });

        expect(result.sessionsByDate['2026-02-11']).toBeDefined();
        expect(result.sessionsByDate['2026-02-12']).toBeDefined();

        const multiDay = result.sessionsByDate['2026-02-11']
            .find(s => s.id === 1770888349742);
        expect(multiDay).toBeDefined();

        const alsoOn12 = result.sessionsByDate['2026-02-12']
            .find(s => s.id === 1770888349742);
        expect(alsoOn12).toBeDefined();
    });

    it('includes multi-day span dates in timeData', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2026-02-11',
            endDate: '2026-02-12',
            roundToHalvesEnabled: false,
        });

        expect(result.timeData['2026-02-11']).toBeDefined();
        expect(result.timeData['2026-02-12']).toBeDefined();
    });

    it('does not place multi-month sessions in next month dates for sessionsByDate', () => {
        const data = { sessions: sampleData.sessions.filter(s =>
            s.id === 1772519253319 || s.id === 1772519243214
        ) };
        const result = computeTimeData(data, {
            startDate: '2026-02-27',
            endDate: '2026-03-03',
            roundToHalvesEnabled: false,
        });

        const onFeb27 = result.sessionsByDate['2026-02-27']
            ?.find(s => s.id === 1772519253319);
        expect(onFeb27).toBeDefined();

        const onMar = [1, 2, 3].some(d =>
            result.sessionsByDate[`2026-03-0${d}`]
                ?.some(s => s.id === 1772519253319)
        );

        expect(onMar).toBe(false);
    });

    it('does not place multi-month session time in next month dates', () => {
        const data = { sessions: sampleData.sessions.filter(s =>
            s.id === 1772519253319 || s.id === 1772519243214
        ) };
        const result = computeTimeData(data, {
            startDate: '2026-02-27',
            endDate: '2026-03-03',
            roundToHalvesEnabled: false,
        });

        expect(result.timeData['2026-02-27']).toBeDefined();
        expect(result.timeData['2026-02-28']).toBeDefined();

        const ondatoMar = [1, 2, 3].some(d =>
            (result.timeData[`2026-03-0${d}`]?.['#ondato'] || 0) > 0
        );

        expect(ondatoMar).toBe(false);
    });

    it('splits same-month multi-day session proportionally across days', () => {
        const data = { sessions: sampleData.sessions.filter(s =>
            s.id === 1772741779880
        ) };
        const result = computeTimeData(data, {
            startDate: '2026-03-03',
            endDate: '2026-03-05',
            roundToHalvesEnabled: false,
        });

        expect(result.sessionsByDate['2026-03-03']
            ?.some(s => s.id === 1772741779880)).toBe(true);
        expect(result.sessionsByDate['2026-03-04']
            ?.some(s => s.id === 1772741779880)).toBe(true);
        expect(result.sessionsByDate['2026-03-05']
            ?.some(s => s.id === 1772741779880)).toBe(true);

        expect(result.timeData['2026-03-03']?.['#bonfire'] || 0).toBeGreaterThan(0);
        expect(result.timeData['2026-03-04']?.['#bonfire'] || 0).toBeGreaterThan(0);
        expect(result.timeData['2026-03-05']?.['#bonfire'] || 0).toBeGreaterThan(0);
    });

    it('caps short sessions spanning many days to 2 split days in sessionsByDate', () => {
        const data = { sessions: sampleData.sessions.filter(s =>
            s.id === 1768808982081 || s.id === 1768808975201
        ) };
        const result = computeTimeData(data, {
            startDate: '2026-01-14',
            endDate: '2026-01-19',
            roundToHalvesEnabled: false,
        });

        const on14 = result.sessionsByDate['2026-01-14']
            ?.find(s => s.id === 1768808982081);
        const on15 = result.sessionsByDate['2026-01-15']
            ?.find(s => s.id === 1768808982081);

        expect(on14).toBeDefined();
        expect(on15).toBeUndefined();
    });

    it('does not split sessions under 3h to any other day in timeData', () => {
        const data = { sessions: sampleData.sessions.filter(s =>
            s.id === 1768808982081 || s.id === 1768808975201
        ) };
        const result = computeTimeData(data, {
            startDate: '2026-01-14',
            endDate: '2026-01-19',
            roundToHalvesEnabled: false,
        });

        const daysWithCustom = Object.keys(result.timeData)
            .filter(d => (result.timeData[d]['#custom'] || 0) > 0);

        expect(daysWithCustom).toHaveLength(1);
        expect(daysWithCustom).toContain('2026-01-14');
    });

    it('handles May 5-7 sessions with correct tags, hours and rest spread', () => {
        const ids = [
            1777980515192, 1777980612303, 1777982373309,
            1778045624278, 1778060528263, 1778080482528,
            1778086848070, 1778090331558, 1778143709466,
            1778160974610, 1778175262016, 1778183198451,
        ];
        const data = {
            sessions: sampleData.sessions.filter(s => ids.includes(s.id)),
        };

        console.debug('=== Sessions under test ===');
        data.sessions.forEach(s => console.debug(
            `id=${s.id} date=${s.date} tags=[${s.tags}] notes="${s.notes}" ` +
            `start=${s.startTime} end=${s.endTime} durSec=${s.durationSec} ` +
            `accumBreak=${s.accumulatedPauseTimeSec ?? 0}`
        ));

        const result = computeTimeData(data, {
            startDate: '2026-05-05',
            endDate: '2026-05-07',
            roundToHalvesEnabled: false,
        });

        console.debug('\n=== sessionsByDate ===');
        Object.entries(result.sessionsByDate).forEach(([date, sessions]) => {
            console.debug(date, sessions.map(s => `id=${s.id}`));
        });

        console.debug('\n=== uniqueTags ===');
        console.debug(result.uniqueTags);

        console.debug('\n=== timeData ===');
        Object.entries(result.timeData).sort().forEach(([date, tags]) => {
            const entries = Object.entries(tags)
                .filter(([_, h]) => h > 0)
                .map(([t, h]) => `${t}:${h.toFixed(4)}h`);
            const total = Object.values(tags).reduce((a, b) => a + b, 0);
            console.debug(`${date}: [${entries.join(', ')}] total=${total.toFixed(4)}h`);
        });

        console.debug('\n=== tagTotals ===');
        Object.entries(result.tagTotals).sort().forEach(([tag, h]) => {
            if (h > 0) console.debug(`${tag}: ${h.toFixed(4)}h`);
        });

        console.debug(`\ntotalHours=${result.totalHours.toFixed(4)}h`);

        expect(result).not.toBeNull();
        expect(result.sessionsByDate['2026-05-05']).toBeDefined();
        expect(result.sessionsByDate['2026-05-06']).toBeDefined();
        expect(result.sessionsByDate['2026-05-07']).toBeDefined();

        expect(result.uniqueTags).toContain('#4182');
        expect(result.uniqueTags).toContain('#meet');
        expect(result.uniqueTags).toContain('rest');

        const d5 = result.timeData['2026-05-05'];
        const d6 = result.timeData['2026-05-06'];
        const d7 = result.timeData['2026-05-07'];

        expect(d5['#4182']).toBeGreaterThan(0);
        expect(d5['#meet']).toBeGreaterThan(0);
        expect(d5['rest']).toBeGreaterThan(0);

        expect(d6['#4182']).toBeGreaterThan(0);
        expect(d6['rest']).toBeGreaterThan(0);

        expect(d7['#4182']).toBeGreaterThan(0);
        expect(d7['rest']).toBeGreaterThan(0);

        expect(d5['#custom']).toBeUndefined();
        expect(d6['#custom']).toBeUndefined();
        expect(d7['#custom']).toBeUndefined();

        const totalDay5 = Object.values(d5).reduce((a, b) => a + b, 0);
        const totalDay6 = Object.values(d6).reduce((a, b) => a + b, 0);
        const totalDay7 = Object.values(d7).reduce((a, b) => a + b, 0);

        console.debug(`\nDay totals: May5=${totalDay5.toFixed(4)}h, May6=${totalDay6.toFixed(4)}h, May7=${totalDay7.toFixed(4)}h`);

        expect(totalDay5).toBeGreaterThan(0);
        expect(totalDay6).toBeGreaterThan(0);
        expect(totalDay7).toBeGreaterThan(0);
    });

    it('traces every step of May 5-7 calculation in both rounding modes', () => {
        const ids = [
            1777980515192, 1777980612303, 1777982373309,
            1778045624278, 1778060528263, 1778080482528,
            1778086848070, 1778090331558, 1778143709466,
            1778160974610, 1778175262016, 1778183198451,
        ];
        const data = {
            sessions: sampleData.sessions.filter(s => ids.includes(s.id)),
        };

        const dump = (label, timeData) => {
            console.debug(`\n--- ${label} ---`);
            Object.entries(timeData).sort().forEach(([date, tags]) => {
                const entries = Object.entries(tags)
                    .filter(([_, h]) => h > 0)
                    .map(([t, h]) => `${t}:${h.toFixed(4)}h`);
                const total = Object.values(tags).reduce((a, b) => a + b, 0);
                console.debug(`  ${date}: [${entries.join(', ')}] total=${total.toFixed(4)}h`);
                const uiDisplay = entries.map(e => {
                    const [t, rest] = e.split(':');
                    return `${t}:${parseFloat(rest).toFixed(1)}h`;
                });
                console.debug(`  ${date} (UI): [${uiDisplay.join(', ')}] total=${total.toFixed(1)}h`);
            });
        };

        // Naive: just sum durationSec per day, no splitting, no rest, no rounding
        console.debug('\n=== RAW SESSION DATA (no splitting, no rest spread, no rounding) ===');
        data.sessions.forEach(s => {
            const onDay = s.date;
            console.debug(`  id=${s.id} date=${onDay} durH=${(s.durationSec/3600).toFixed(4)} tags=[${s.tags}] notes="${s.notes}" isBreak=${s.isBreak}`);
        });
        const rawTotals = {};
        data.sessions.forEach(s => {
            if (!rawTotals[s.date]) rawTotals[s.date] = {};
            const h = s.durationSec / 3600;
            if (!rawTotals[s.date][s.date]) rawTotals[s.date][s.date] = 0;
            // naive: just raw allocation by date, no tag categorization
        });

        // --- MODE 1: roundToHalvesEnabled = false ---
        console.debug('\n========================================');
        console.debug('MODE: roundToHalvesEnabled = false');
        console.debug('========================================');

        const resultNoRound = computeTimeData(data, {
            startDate: '2026-05-05',
            endDate: '2026-05-07',
            roundToHalvesEnabled: false,
        });

        dump('timeData (final, always rounded by cleanup)', resultNoRound.timeData);

        // --- MODE 2: roundToHalvesEnabled = true ---
        console.debug('\n========================================');
        console.debug('MODE: roundToHalvesEnabled = true');
        console.debug('========================================');

        const resultRound = computeTimeData(data, {
            startDate: '2026-05-05',
            endDate: '2026-05-07',
            roundToHalvesEnabled: true,
        });

        dump('timeData (final)', resultRound.timeData);

        // --- EXPLICIT TRACE ---
        // Verify the custom roundToHalf behavior
        console.debug('\n=== CUSTOM roundToHalf BEHAVIOR ===');
        [0.7075, 0.4869, 0.7739, 2.7923, 0.7661, 3.3175, 3.0986, 9.6231,
         4.0609, 5.5622, 4.0686, 8.8081, 4.6967, 2.6783, 3.5661, 4.0836].forEach(v => {
            console.debug(`  roundToHalf(${v.toFixed(4)}) = ${roundToHalf(v).toFixed(4)}`);
        });
        console.debug('  ---');
        [1.8147, 0.8203, 7.4928, 4.0584, 19.8927, 3.8175, 16.6831].forEach(v => {
            console.debug(`  roundToHalf(${v.toFixed(4)}) = ${roundToHalf(v).toFixed(4)}  (post-rest values)`);
        });

        // --- PRINT ACTUAL VALUES ---
        console.debug('\n=== ACTUAL VALUES ===');
        const d5_nr = resultNoRound.timeData['2026-05-05'];
        const d6_nr = resultNoRound.timeData['2026-05-06'];
        const d7_nr = resultNoRound.timeData['2026-05-07'];
        console.debug('No round mode:');
        ['2026-05-05','2026-05-06','2026-05-07'].forEach(d => {
            const tags = resultNoRound.timeData[d];
            Object.entries(tags).filter(([_,v])=>v>0).forEach(([t,v]) => {
                console.debug(`  ${d} ${t}: ${v}`);
            });
        });
        console.debug('tagTotals no round:');
        Object.entries(resultNoRound.tagTotals).sort().forEach(([t, v]) => console.debug(`  ${t}: ${v}`));

        const d5_r = resultRound.timeData['2026-05-05'];
        const d6_r = resultRound.timeData['2026-05-06'];
        const d7_r = resultRound.timeData['2026-05-07'];
        console.debug('Round mode:');
        ['2026-05-05','2026-05-06','2026-05-07'].forEach(d => {
            const tags = resultRound.timeData[d];
            Object.entries(tags).filter(([_,v])=>v>0).forEach(([t,v]) => {
                console.debug(`  ${d} ${t}: ${v}`);
            });
        });
        console.debug('tagTotals round:');
        Object.entries(resultRound.tagTotals).sort().forEach(([t, v]) => console.debug(`  ${t}: ${v}`));

        expect(d5_nr['#4182']).toBe(2.5);
        expect(d5_nr['#meet']).toBe(0.5);
        expect(d5_nr['rest']).toBe(7.5);

        expect(d6_nr['#4182']).toBe(4.5);
        expect(d6_nr['rest']).toBe(19.5);

        expect(d7_nr['#4182']).toBe(4.5);
        expect(d7_nr['rest']).toBe(16.5);

        const tt_nr = resultNoRound.tagTotals;
        expect(tt_nr['#4182']).toBeCloseTo(11.5, 4);
        expect(tt_nr['#meet']).toBe(0.5);
        expect(tt_nr['rest']).toBeCloseTo(43.5, 4);

        // --- Mode: per-session rounding enabled ---

        expect(d5_r['#4182']).toBe(2.5);
        expect(d5_r['rest']).toBe(8);

        expect(d6_r['#4182']).toBe(5);
        expect(d6_r['rest']).toBe(20.5);

        expect(d7_r['#4182']).toBe(4.5);
        expect(d7_r['rest']).toBe(17);

        const tt_r = resultRound.tagTotals;
        expect(tt_r['#4182']).toBeCloseTo(12.0, 4);
        expect(tt_r['rest']).toBeCloseTo(45.5, 4);

        console.debug('\n=== UI display (toFixed(1)) ===');
        console.debug('  Mode: no per-session rounding');
        [d5_nr, d6_nr, d7_nr].forEach((d, i) => {
            const date = ['May5','May6','May7'][i];
            Object.entries(d).filter(([_,v])=>v>0).forEach(([t,v]) => {
                console.debug(`  ${date} ${t}: raw=${v.toFixed(4)} -> UI=${v.toFixed(1)}h`);
            });
        });
        console.debug('  Mode: per-session rounding');
        [d5_r, d6_r, d7_r].forEach((d, i) => {
            const date = ['May5','May6','May7'][i];
            Object.entries(d).filter(([_,v])=>v>0).forEach(([t,v]) => {
                console.debug(`  ${date} ${t}: raw=${v.toFixed(4)} -> UI=${v.toFixed(1)}h`);
            });
        });

        expect(d5_nr['#meet'].toFixed(1)).toBe('0.5');
        expect(d6_nr['#4182'].toFixed(1)).toBe('4.5');
        expect(d6_r['#4182'].toFixed(1)).toBe('5.0');
        expect(d6_r['rest'].toFixed(1)).toBe('20.5');
        expect(d7_nr['#4182'].toFixed(1)).toBe('4.5');
        expect(d7_nr['rest'].toFixed(1)).toBe('16.5');
    });

    it('traces May 2 sessions 1777753879976 etc', () => {
        const ids = [1777753879976, 1777751449914, 1777731213918];
        const data = {
            sessions: sampleData.sessions.filter(s => ids.includes(s.id)),
        };

        data.sessions.forEach(s => console.debug(
            `id=${s.id} date=${s.date} durH=${(s.durationSec/3600).toFixed(4)} tags=[${s.tags}] notes="${s.notes}" isBreak=${s.isBreak} isCorrect=${s.is_correct_record}`
        ));

        const result = computeTimeData(data, {
            startDate: '2026-05-02',
            endDate: '2026-05-02',
            roundToHalvesEnabled: false,
            debugMode: true,
        });

        console.debug('\n=== timeData ===');
        Object.entries(result.timeData).forEach(([date, tags]) => {
            console.debug(date, JSON.stringify(tags));
            const total = Object.values(tags).reduce((a, b) => a + b, 0);
            console.debug('  total:', total.toFixed(4));
        });

        console.debug('\n=== uniqueTags ===');
        console.debug(result.uniqueTags);

        console.debug('\n=== tagTotals ===');
        Object.entries(result.tagTotals).forEach(([t, v]) => console.debug(`  ${t}: ${v.toFixed(4)}`));

        // Work session is ~5.5h, plus rest spread of 1h = ~6.5h
        console.debug(`\ntotalHours=${result.totalHours.toFixed(4)}h`);

        expect(result).not.toBeNull();
    });
});

describe('holidayMultiplier', () => {
    const calendarLookup = {
        '2026-04-06': { type: 'holiday', name: 'Otrās Lieldienas' },
    };

    it('doubles non-rest hours on holiday dates when multiplier=2', () => {
        const data = { sessions: sampleData.sessions.filter(s =>
            s.id === 1775546932683 || s.id === 1750080766942 || s.id === 1750080766941
        ) };
        const normal = computeTimeData(data, {
            startDate: '2026-04-06',
            endDate: '2026-04-06',
            holidayMultiplier: 1,
            calendarLookup,
        });
        const doubled = computeTimeData(data, {
            startDate: '2026-04-06',
            endDate: '2026-04-06',
            holidayMultiplier: 2,
            calendarLookup,
        });

        const d = '2026-04-06';
        Object.keys(normal.timeData[d]).forEach(tag => {
            if (tag === 'rest') {
                expect(doubled.timeData[d][tag]).toBe(normal.timeData[d][tag]);
            } else {
                expect(doubled.timeData[d][tag]).toBeCloseTo(normal.timeData[d][tag] * 2, 2);
            }
        });
    });

    it('leaves rest hours unchanged on holiday', () => {
        const data = { sessions: sampleData.sessions.filter(s =>
            s.id === 1775546932683
        ) };
        const result = computeTimeData(data, {
            startDate: '2026-04-06',
            endDate: '2026-04-06',
            holidayMultiplier: 5,
            calendarLookup,
        });

        expect(result.timeData['2026-04-06']?.rest || 0).toBe(0);
    });

    it('does not multiply non-holiday workdays', () => {
        const data = { sessions: sampleData.sessions.filter(s =>
            s.id === 1772524320233
        ) };
        const normal = computeTimeData(data, {
            startDate: '2026-03-03',
            endDate: '2026-03-03',
            holidayMultiplier: 1,
            calendarLookup,
        });
        const multiplied = computeTimeData(data, {
            startDate: '2026-03-03',
            endDate: '2026-03-03',
            holidayMultiplier: 3,
            calendarLookup,
        });

        Object.keys(normal.timeData['2026-03-03']).forEach(tag => {
            expect(multiplied.timeData['2026-03-03'][tag]).toBe(normal.timeData['2026-03-03'][tag]);
        });
    });

    it('applies holiday but not weekend multiplier when holiday falls on weekend', () => {
        const data = { sessions: sampleData.sessions.filter(s =>
            s.id === 1775546932683
        ) };
        const holiday2 = computeTimeData(data, {
            startDate: '2026-04-06',
            endDate: '2026-04-06',
            holidayMultiplier: 2,
            weekendMultiplier: 5,
            calendarLookup,
        });
        const holidayOnly = computeTimeData(data, {
            startDate: '2026-04-06',
            endDate: '2026-04-06',
            holidayMultiplier: 2,
            weekendMultiplier: 1,
            calendarLookup,
        });

        expect(holiday2.timeData['2026-04-06']['#n8n']).toBeCloseTo(
            holidayOnly.timeData['2026-04-06']['#n8n'], 2
        );
    });
});

describe('weekendMultiplier', () => {
    it('multiplies non-rest hours on weekend by getDay()', () => {
        const data = { sessions: sampleData.sessions.filter(s =>
            s.id === 1777753879976
        ) };
        const normal = computeTimeData(data, {
            startDate: '2026-05-02',
            endDate: '2026-05-02',
            weekendMultiplier: 1,
        });
        const doubled = computeTimeData(data, {
            startDate: '2026-05-02',
            endDate: '2026-05-02',
            weekendMultiplier: 2,
        });

        const d = '2026-05-02';
        Object.keys(normal.timeData[d]).forEach(tag => {
            if (tag === 'rest') {
                expect(doubled.timeData[d][tag]).toBe(normal.timeData[d][tag]);
            } else {
                expect(doubled.timeData[d][tag]).toBeCloseTo(normal.timeData[d][tag] * 2, 2);
            }
        });
    });

    it('does not multiply swapped_workday dates with weekendMultiplier', () => {
        const calendarLookup = {
            '2026-01-17': { type: 'swapped_workday', swap_source: '2026-01-02' },
        };
        const data = { sessions: sampleData.sessions.filter(s =>
            s.id === 1768808982081
        ) };
        const normal = computeTimeData(data, {
            startDate: '2026-01-17',
            endDate: '2026-01-17',
            weekendMultiplier: 1,
            calendarLookup,
        });
        const multiplied = computeTimeData(data, {
            startDate: '2026-01-17',
            endDate: '2026-01-17',
            weekendMultiplier: 3,
            calendarLookup,
        });

        expect(multiplied.timeData['2026-01-17']?.['#custom'] || 0).toBeCloseTo(
            normal.timeData['2026-01-17']?.['#custom'] || 0, 2
        );
    });
});

describe('restExcludedTags', () => {
    it('excludes #meet from rest spread on 2026-06-02, routes rest to #n8n', () => {
        const ids = [1780403380114, 1780395825419, 1780395276475, 1780390062433, 1780386216552];
        const data = {
            sessions: sampleData.sessions.filter(s => ids.includes(s.id)),
        };

        const result = computeTimeData(data, {
            startDate: '2026-06-02',
            endDate: '2026-06-02',
            debugMode: true,
        });

        const td = result.timeData['2026-06-02'];

        expect(td['#meet']).toBe(2.5);
        expect(td['#n8n']).toBe(3.5);
        expect(td['rest']).toBe(3.5);
    });

    it('traces June 4-6 calculation in detail (carry-overs, spread, final)', () => {
        const ids = [
            1780573610045, 1780580443511, 1780590811656, 1780596401313,
            1780633089575, 1780651163925, 1780664295715, 1780664424000,
            1780682629225, 1780719125558, 1780725392621, 1780772995190,
            1780778338837,
        ];
        const data = {
            sessions: sampleData.sessions.filter(s => ids.includes(s.id)),
        };

        console.debug('\n========== STEP 1: RAW SESSION DATA ==========');
        console.debug('id            date       durH      multi?  tag     notes');
        data.sessions.forEach(s => {
            const start = new Date(s.startTime);
            const end = new Date(s.endTime);
            const multi = start.toISOString().split('T')[0] !== end.toISOString().split('T')[0];
            const allocatedTag = s.isBreak ? 'rest' : '#n8n';
            console.debug(`${s.id}  ${s.date}  ${(s.durationSec/3600).toFixed(4)}h  ${multi ? 'SPAN' : '     '}  ${allocatedTag}  "${s.notes}"`);
        });

        console.debug('\n========== STEP 2: PER-SESSION DAY SPLITS (carry-overs) ==========');
        console.debug('The [computeTimeData] lines below show each session per day.');
        console.debug('For SPAN sessions, prop < 1.0 means the remainder carries to the next day:');
        console.debug('  carry-over = totalDurationHours × (1 - prop)');
        console.debug('');

        const result = computeTimeData(data, {
            startDate: '2026-06-04',
            endDate: '2026-06-06',
            debugMode: true,
        });

        console.debug('\n========== STEP 3: PER-DAY PRE-SPREAD TOTALS ==========');
        console.debug('Shown above in each "[computeTimeData] YYYY-MM-DD: pre-rest={...}" line.');
        console.debug('These are raw accumulated hours per tag BEFORE rest spread.');

        console.debug('\n========== STEP 4: REST SPREAD ==========');
        console.debug('Shown above in each "[computeTimeData] ... spread=1.0000h  post-rest={...}" line.');
        console.debug('Non-meet tags each get 1h / restCount. #meet is excluded.');

        console.debug('\n========== STEP 5: FINAL (after roundToHalf) ==========');
        ['2026-06-04','2026-06-05','2026-06-06'].forEach(date => {
            const tags = result.timeData[date];
            const entries = Object.entries(tags).filter(([_, v]) => v > 0);
            const total = entries.reduce((a, [_, v]) => a + v, 0);
            console.debug(`  ${date}:`);
            entries.forEach(([t, v]) => {
                console.debug(`    ${t}: tracked=${v.toFixed(4)}h -> UI=${v.toFixed(1)}h`);
            });
            console.debug(`    total: ${total.toFixed(1)}h`);
        });

        console.debug('\n========== STEP 6: GRAND TOTALS ==========');
        Object.entries(result.tagTotals).sort().forEach(([t, v]) => {
            if (v > 0) console.debug(`  ${t}: ${v.toFixed(4)}h`);
        });

        const d4 = result.timeData['2026-06-04'];
        const d5 = result.timeData['2026-06-05'];
        const d6 = result.timeData['2026-06-06'];

        expect(d4['#n8n']).toBe(7.0);
        expect(d4['rest']).toBe(11.0);

        expect(d5['#n8n']).toBe(5.5);
        expect(d5['rest']).toBe(19.0);

        expect(d6['#n8n']).toBe(10.0);
        expect(d6['rest']).toBe(9.5);
    });
});

describe('computeTimeData with selectedTags', () => {
    it('returns only selected tag columns when selectedTags is set', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2026-06-26',
            endDate: '2026-06-26',
            excludeBreaks: false,
            selectedTags: ['#4203'],
        });
        expect(result).not.toBeNull();
        expect(result.uniqueTags).toEqual(['#4203']);
        expect(Object.keys(result.timeData['2026-06-26'])).toEqual(['#4203']);
        expect(result.timeData['2026-06-26']['#4203']).toBeCloseTo(4.0, 1);
    });

    it('returns all tag columns when selectedTags is empty', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2026-06-26',
            endDate: '2026-06-26',
            excludeBreaks: false,
            selectedTags: [],
        });
        expect(result).not.toBeNull();
        expect(result.uniqueTags).toContain('#4203');
        expect(result.uniqueTags).toContain('#opencode');
        expect(result.timeData['2026-06-26']['#4203']).toBeDefined();
        expect(result.timeData['2026-06-26']['#opencode']).toBeDefined();
    });

describe('multi-tag sessions without hashtag', () => {
    it('splits duration across tags instead of double-counting', () => {
        const sessions = [{
            id: 999,
            date: '2026-07-01',
            startTime: '2026-07-01T10:00:00.000Z',
            endTime: '2026-07-01T12:00:00.000Z',
            duration: '02:00:00',
            durationSec: 7200,
            notes: 'no hashtag here',
            dayType: 'Workday',
            tags: ['work', 'projectA', 'projectB'],
            isBreak: false,
        }];
        const result = computeTimeData(
            { sessions },
            { startDate: '2026-07-01', endDate: '2026-07-01' }
        );
        // 2h split across 3 tags → 0.667h each, +0.333h rest spread → 1.0h each
        // Without fix: each tag gets 2h + 0.333h rest spread → 2.5h each → totalHours=7.5h
        const workTags = result.uniqueTags.filter(t => t !== 'rest');
        expect(workTags.length).toBe(3);
        workTags.forEach(tag => {
            expect(result.tagTotals[tag]).toBe(1.0);
        });
        // totalHours = 3 + rest spread total (rest was distributed, no explicit rest tag here)
        expect(result.totalHours).toBe(3.0);
    });
});

describe('normalize migrated-no-bucket sessions', () => {
    it('collapses tags to first tag when accumulatedPauseTimeSec present and >1 tags', () => {
        const sessions = [{
            id: 2001,
            date: '2026-07-01',
            startTime: '2026-07-01T10:00:00.000Z',
            endTime: '2026-07-01T12:00:00.000Z',
            duration: '02:00:00',
            durationSec: 7200,
            notes: 'original note',
            dayType: 'Workday',
            tags: ['work', 'paylar', '4203', 'review'],
            accumulatedPauseTimeSec: 60894,
            isBreak: false,
        }];
        const result = computeTimeData(
            { sessions },
            { startDate: '2026-07-01', endDate: '2026-07-01' }
        );
        // Normalized: #4203 in notes numeric hashtag gets 2h + 1h rest spread = 3.0
        expect(result.tagTotals['#4203']).toBe(3.0);
        // #custom stays 0 — never allocated (time routed via notes hashtag)
        expect(result.tagTotals['#custom']).toBe(0);
        expect(result.totalHours).toBe(3.0);
    });

    it('does not normalize sessions with single tag', () => {
        const sessions = [{
            id: 2002,
            date: '2026-07-01',
            startTime: '2026-07-01T10:00:00.000Z',
            endTime: '2026-07-01T12:00:00.000Z',
            duration: '02:00:00',
            durationSec: 7200,
            notes: 'original note',
            dayType: 'Workday',
            tags: ['work'],
            accumulatedPauseTimeSec: 100,
            isBreak: false,
        }];
        const result = computeTimeData(
            { sessions },
            { startDate: '2026-07-01', endDate: '2026-07-01' }
        );
        // Single tag 'work' → #custom gets full time = 2h + 1h rest = 3.0
        expect(result.tagTotals['#custom']).toBe(3.0);
        expect(result.totalHours).toBe(3.0);
    });

    it('does not normalize sessions without accumulatedPauseTimeSec', () => {
        const sessions = [{
            id: 2003,
            date: '2026-07-01',
            startTime: '2026-07-01T10:00:00.000Z',
            endTime: '2026-07-01T12:00:00.000Z',
            duration: '02:00:00',
            durationSec: 7200,
            notes: 'original note',
            dayType: 'Workday',
            tags: ['work', 'paylar', '4203'],  // >1 tags but NO accumulatedPauseTimeSec
            isBreak: false,
        }];
        const result = computeTimeData(
            { sessions },
            { startDate: '2026-07-01', endDate: '2026-07-01' }
        );
        // Without normalization: 3 tags (work→#custom, paylar, 4203) split 2h/3 each ≈ 0.67h
        // Each gets ~0.67 + 0.33 rest = ~1.0 (after roundToHalf)
        expect(result.tagTotals['#custom']).toBe(1.0);
        expect(result.tagTotals['paylar']).toBe(1.0);
        expect(result.tagTotals['4203']).toBe(1.0);
        expect(result.totalHours).toBe(3.0);
    });

    it('normalizes sessions with accumulatedPauseTimeSec: 0 and >1 tags', () => {
        const sessions = [{
            id: 2004,
            date: '2026-07-01',
            startTime: '2026-07-01T10:00:00.000Z',
            endTime: '2026-07-01T12:00:00.000Z',
            duration: '02:00:00',
            durationSec: 7200,
            notes: 'original note',
            dayType: 'Workday',
            tags: ['work', 'paylar', 'n8n'],
            accumulatedPauseTimeSec: 0,
            isBreak: false,
        }];
        const result = computeTimeData(
            { sessions },
            { startDate: '2026-07-01', endDate: '2026-07-01' }
        );
        // Normalized: #paylar gets 2h via notes hashtag + 1h rest = 3.0
        expect(result.tagTotals['#paylar']).toBe(3.0);
        expect(result.totalHours).toBe(3.0);
    });
});

describe('bucket tag allocation', () => {
    it('uses bucket as sole tag instead of splitting across all tags', () => {
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
        // bucket=work → maps to #custom, full 2h. Only #custom has time, so
        // restCount=1 → +1.0h rest → roundToHalf(3.0) = 3.0
        expect(result.tagTotals['#custom']).toBe(3.0);
        // other tags get 0 time (not eligible for rest spread since they have no time)
        expect(result.tagTotals['projectA']).toBe(0);
        expect(result.tagTotals['projectB']).toBe(0);
        expect(result.tagTotals['projectC']).toBe(0);
        expect(result.totalHours).toBe(3.0);
    });
});

    it('allocates time to session tag when notes hashtag is outside selectedTags', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2026-06-26',
            endDate: '2026-06-26',
            excludeBreaks: false,
            selectedTags: ['study'],
        });
        expect(result).not.toBeNull();
        expect(result.uniqueTags).toEqual(['study']);
        expect(result.timeData['2026-06-26']['study']).toBeCloseTo(1.5, 1);
    });

    it('returns all tag columns when selectedTags is null', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2026-06-26',
            endDate: '2026-06-26',
            excludeBreaks: false,
            selectedTags: null,
        });
        expect(result).not.toBeNull();
        expect(result.uniqueTags).toContain('#4203');
        expect(result.uniqueTags).toContain('#opencode');
    });
});
