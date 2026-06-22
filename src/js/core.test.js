import { describe, it, expect } from 'vitest';
import { computeTimeData, filterSessions, extractTags, checkIsCorrectRecord } from './core.js';
import { roundToHalf } from './utils.js';
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
        expect(result.uniqueTags).toContain('meeting');
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

    it('maps work tag to #custom', () => {
        const result = computeTimeData(sampleData, {
            startDate: '2025-06-16',
            endDate: '2025-06-18',
            roundToHalvesEnabled: false,
        });

        const jun16 = result.timeData['2025-06-16'];
        expect(jun16['#custom']).toBeGreaterThan(0);
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

        // --- EXACT VALUE ASSERTIONS ---
        // Mode: no per-session rounding, only final rounding

        // May 5:
        // 1777980612303: #4182 gets 0.7075 (single day, is_correct_record=true)
        // 1777982373309: #meet gets 0.4869 (single day)
        // 1778090331558 day5: #4182 gets 17929177/82624832*3.5661 = 0.7739
        // 1778045624278 day5: rest gets 14619488/34643766*9.6231 = 4.0609
        // 1777980515192: rest gets 3.0986 (single day)
        // Pre-rest totals: #4182=1.4814, #meet=0.4869, rest=7.1595
        // restCount=3, spread=0.3333 each
        // Post-rest: #4182=1.8147, #meet=0.8202, rest=7.4928
        // Final roundToHalf: #4182=2.0, #meet=0.8203, rest=7.5
        const d5_nr = resultNoRound.timeData['2026-05-05'];
        expect(d5_nr['#4182']).toBe(2);
        expect(d5_nr['#meet']).toBeCloseTo(0.8203, 4);
        expect(d5_nr['rest']).toBe(7.5);

        // May 6:
        // 1778090331558 day6: #4182 gets 64695655/82624832*3.5661 = 2.7923
        // 1778183198451 day6: #4182 gets 16436164/87607229*4.0836 = 0.7661
        // 1778045624278 day6: rest gets 20024278/34643766*9.6231 = 5.5622
        // 1778143709466 day6: rest gets 14646926/46356392*12.8767 = 4.0686
        // 1778060528263: rest gets 3.3008
        // 1778080482528: rest gets 5.3339
        // 1778086848070: rest gets 1.1272
        // Pre-rest totals: #4182=3.5584, rest=19.3927
        // restCount=2, spread=0.5 each
        // Post-rest: #4182=4.0584, rest=19.8927
        // Final roundToHalf: #4182=4.5, rest=20.0
        const d6_nr = resultNoRound.timeData['2026-05-06'];
        expect(d6_nr['#4182']).toBe(4.5);
        expect(d6_nr['rest']).toBe(20);

        // May 7:
        // 1778183198451 day7: #4182 gets 71171065/87607229*4.0836 = 3.3175
        // 1778143709466 day7: rest gets 31709466/46356392*12.8767 = 8.8081
        // 1778160974610: rest gets 4.6967
        // 1778175262016: rest gets 2.6783
        // Pre-rest totals: #4182=3.3175, rest=16.1831
        // restCount=2, spread=0.5 each
        // Post-rest: #4182=3.8175, rest=16.6831
        // Final roundToHalf: #4182=4.0, rest=17.0
        const d7_nr = resultNoRound.timeData['2026-05-07'];
        expect(d7_nr['#4182']).toBe(4);
        expect(d7_nr['rest']).toBe(17);

        // tagTotals
        const tt_nr = resultNoRound.tagTotals;
        expect(tt_nr['#4182']).toBeCloseTo(10.5, 4);
        expect(tt_nr['#meet']).toBeCloseTo(0.8203, 4);
        expect(tt_nr['rest']).toBeCloseTo(44.5, 4);

        // --- Mode: per-session rounding enabled ---
        const d5_r = resultRound.timeData['2026-05-05'];
        const d6_r = resultRound.timeData['2026-05-06'];
        const d7_r = resultRound.timeData['2026-05-07'];

        // May 5 with per-session rounding:
        // Per-session roundToHalf changes:
        //   1777982373309: 0.4869 -> 0.5 (dec<0.57)
        //   1777980515192: 3.0986 -> 3.5 (dec<0.57)
        //   1778045624278 day5: 4.0609 -> 4.5 (dec<0.57)
        // Pre-rest: #4182=1.4814 (unchanged: 0.7739 stays, 0.7075 stays),
        //           #meet=0.5, rest=8.0 (3.5+4.5)
        // restCount=3, spread=0.3333 each
        // Post-rest: #4182=1.8147, #meet=0.8333, rest=8.3333
        // Final roundToHalf: #4182=2.0, #meet=0.8333 (<1 dec>0.57), rest=8.5
        expect(d5_r['#4182']).toBe(2);
        expect(d5_r['rest']).toBe(8.5);

        // May 6 with per-session rounding:
        // 1778090331558 day6: 2.7923 -> 3.0 (dec>0.57 -> Math.round=1)
        // 1778183198451 day6: 0.7661 unchanged (<1 dec>0.57)
        // 1778045624278 day6: 5.5622 -> 5.5 (dec<0.57)
        // 1778143709466 day6: 4.0686 -> 4.5 (dec<0.57)
        // 1778060528263: 3.3008 -> 3.5
        // 1778080482528: 5.3339 -> 5.5
        // 1778086848070: 1.1272 -> 1.5
        // Pre-rest: #4182=3.7661, rest=20.5
        // restCount=2, spread=0.5 each
        // Post-rest: #4182=4.2661, rest=21.0
        // Final roundToHalf: #4182=4.5 (dec<0.57->0.5), rest=21.0 (dec=0)
        expect(d6_r['#4182']).toBe(4.5);
        expect(d6_r['rest']).toBe(21);

        // May 7 with per-session rounding:
        // 1778183198451 day7: 3.3175 -> 3.5 (dec<0.57)
        // 1778143709466 day7: 8.8081 -> 9.0 (dec>0.57 -> Math.round=1)
        // 1778160974610: 4.6967 -> 5.0 (dec>0.57 -> Math.round=1)
        // 1778175262016: 2.6783 -> 3.0 (dec>0.57 -> Math.round=1)
        // Pre-rest: #4182=3.5, rest=17.0
        // restCount=2, spread=0.5 each
        // Post-rest: #4182=4.0, rest=17.5
        // Final roundToHalf: #4182=4.0 (dec=0), rest=17.5 (dec=0.5<0.57)
        expect(d7_r['#4182']).toBe(4);
        expect(d7_r['rest']).toBe(17.5);

        const tt_r = resultRound.tagTotals;
        // tagTotals: sum of final rounded values across dates
        expect(tt_r['#4182']).toBeCloseTo(10.5, 4);
        expect(tt_r['rest']).toBeCloseTo(47, 4);

        // --- UI display check ---
        // toFixed(1) for each final value
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

        expect(d5_nr['#meet'].toFixed(1)).toBe('0.8');
        expect(d6_nr['#4182'].toFixed(1)).toBe('4.5');
        expect(d6_r['#4182'].toFixed(1)).toBe('4.5');
        expect(d6_r['rest'].toFixed(1)).toBe('21.0');
        expect(d7_nr['#4182'].toFixed(1)).toBe('4.0');
        expect(d7_nr['rest'].toFixed(1)).toBe('17.0');
    });
});
