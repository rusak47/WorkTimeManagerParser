import { describe, it, expect } from 'vitest';
import { computeTimeData, filterSessions, extractTags, checkIsCorrectRecord } from './core.js';
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
    it('matches manually-set is_correct_record for every session in sampleData', () => {
        sampleData.sessions.forEach(session => {
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
        expect(result.uniqueTags).toContain('work');
        expect(result.uniqueTags).toContain('meeting');
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
});
