import { roundToHalf, datediff, durationToSeconds } from './utils.js';
import { DEFAULT_EXCLUDED_TAGS } from './data.js';

const REST_TIME_MIN = 60;
const REST_EXCLUDED_TAGS = ['#meet']; //keep this value const (rounding is ok); but dont split or add rest time 

export function checkIsCorrectRecord(session) {
    const accumBreak = session.accumulatedPauseTimeSec ? session.accumulatedPauseTimeSec / 3600 : 0;
    const durationHoursSession = session.durationSec / 3600;
    const durationReal = datediff(session.startTime, session.endTime).hours;
    return Math.abs(durationReal - (accumBreak + durationHoursSession)) < 0.05;
}

export function filterSessions(sessions, { startDate, endDate, excludeBreaks }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return sessions.filter(session => {
        const sessionDate = new Date(session.date);
        const dateInRange = sessionDate >= start && sessionDate <= end;
        const includeSession = !excludeBreaks || !session.isBreak;
        return dateInRange && includeSession;
    });
}

export function extractTags(sessions, specialTags) {
    const allTags = new Set(['#custom']);
    const allSupportTags = new Set();

    sessions.forEach(session => {
        if (session.tags && Array.isArray(session.tags)) {
            session.tags.forEach(tag => allTags.add(tag));
        }

        if (session.notes) {
            specialTags.forEach(specialTag => {
                if (session.notes.toLowerCase().includes(specialTag.toLowerCase())) {
                    allTags.add(`${specialTag} support`);
                }
            });

            const hashtagsCustom = session.notes.match(/#[a-zA-Z]+[a-zA-Z0-9]{0,}/) || [];
            hashtagsCustom.forEach(tag => {
                if (DEFAULT_EXCLUDED_TAGS.includes(tag.toLowerCase())) {
                    allTags.add(tag);
                } else {
                    allSupportTags.add(tag.toLowerCase());
                }
            });

            const hashtagsRedmine = session.notes.match(/#\d+/g) || [];
            hashtagsRedmine.forEach(tag => allTags.add(tag));
        }
    });

    return { allTags, allSupportTags };
}

export function deriveUniqueTags(sessions, specialTags, selectedTags) {
    const { allTags, allSupportTags } = extractTags(sessions, specialTags);
    const allTagsArray = Array.from(allTags).concat(Array.from(allSupportTags));
    const uniqueTags = selectedTags && selectedTags.length > 0
        ? [...selectedTags].sort()
        : [...allTagsArray].sort();
    return { allTags, allSupportTags, uniqueTags };
}

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

        if (!checkIsCorrectRecord(session) && !session.isBreak) {
            const accumBreak = session.accumulatedPauseTimeSec ? session.accumulatedPauseTimeSec / 3600 : 0;
            const durationH = session.durationSec / 3600;
            if (Math.abs(durationToSeconds(session.duration) - session.durationSec) < 60 && accumBreak > 0 && accumBreak <= durationH) {
                session.durationSec = session.durationSec - session.accumulatedPauseTimeSec;
            }
        }

        return session;
    });
}

export function resolveSessionAllocation(session, specialTags, uniqueTags) {
    if (specialTags.length > 0 && session.notes) {
        for (const specialTag of specialTags) {
            if (session.notes.toLowerCase().includes(specialTag)) {
                return { type: 'single', tag: `${specialTag} support` };
            }
        }
    }

    if (session.bucket) {
        if (session.bucket === "work") {
            return { type: 'single', tag: '#custom' };
        }
        if (uniqueTags.includes(session.bucket)) {
            return { type: 'single', tag: session.bucket };
        }
    }

    if (session.notes) {
        const redmineTags = session.notes.match(/#\d+/g);
        if (redmineTags?.length > 0) {
            const tag = redmineTags[0].toLowerCase();
            if (uniqueTags.includes(tag)) {
                return { type: 'single', tag };
            }
        }

        const customTags = session.notes.match(/#[a-zA-Z]+[a-zA-Z0-9]{0,}/);
        if (customTags?.length > 0) {
            const tag = customTags[0].toLowerCase();
            if (uniqueTags.includes(tag)) {
                return { type: 'single', tag };
            }
        }
    }

    if (session.tags?.length > 0) {
        const matchingTags = session.tags.filter(t => uniqueTags.includes(t));
        if (matchingTags.length > 0) {
            const resolved = matchingTags.map(t => t === 'work' ? '#custom' : t);
            return { type: 'split', tags: resolved };
        }
    }

    return null;
}

export function deriveMaxDaysTimeSplit(durationHours) {
    if (durationHours <= 3) return 1;
    return Math.floor(durationHours / 6) + 2;
}

export function computeEffectiveEnd(startDate, endDate, durationHours) {
    const endOfMonth = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 1));
    let effective = endDate < endOfMonth ? endDate : endOfMonth;
    const maxDays = deriveMaxDaysTimeSplit(durationHours);
    const dayStart = new Date(startDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const cappedByDays = new Date(dayStart);
    cappedByDays.setUTCDate(cappedByDays.getUTCDate() + maxDays);
    return effective < cappedByDays ? effective : cappedByDays;
}

export function applyAllocation(entry, allocation, dayDuration) {
    if (!allocation) return;
    if (allocation.type === 'single') {
        entry[allocation.tag] += dayDuration;
    } else if (allocation.type === 'split') {
        const share = dayDuration / allocation.tags.length;
        allocation.tags.forEach(tag => { entry[tag] += share; });
    }
}

export function dateEntry(timeData, dateStr, uniqueTags) {
    if (!timeData[dateStr]) {
        timeData[dateStr] = {};
        uniqueTags.forEach(tag => { timeData[dateStr][tag] = 0; });
    }
    return timeData[dateStr];
}

export function cleanupRound(timeData) {
    Object.keys(timeData).forEach(date => {
        Object.keys(timeData[date]).forEach(tag => {
            if (timeData[date][tag] === 0 || isNaN(timeData[date][tag])) {
                delete timeData[date][tag];
            }
        });
    });
}

export function applyRestSpread(timeData, restTimeMin, debugMode) {
    Object.keys(timeData).forEach(date => {
        const restEligible = {};
        const excludedNonRest = {};
        Object.keys(timeData[date]).forEach(tag => {
            if (timeData[date][tag] > 0 && tag !== 'rest') {
                if (REST_EXCLUDED_TAGS.includes(tag)) {
                    excludedNonRest[tag] = 1;
                } else {
                    restEligible[tag] = 1;
                }
            }
        });

        const restCount = Object.keys(restEligible).length;
        const preRest = Object.fromEntries(
            Object.entries(timeData[date]).filter(([_, v]) => v > 0)
        );
        if (restCount > 0) {
            const restSpread = restTimeMin / restCount / 60;
            Object.keys(restEligible).forEach(tag => {
                timeData[date][tag] += restSpread;
            });
            const postRest = Object.fromEntries(
                Object.entries(timeData[date]).filter(([_, v]) => v > 0)
            );
            if (debugMode) {
                console.debug(`[computeTimeData] ${date}: restCount=${restCount} spread=${restSpread.toFixed(4)}h  pre-rest=${JSON.stringify(preRest)}  post-rest=${JSON.stringify(postRest)}`);
            }
        } else if (Object.keys(excludedNonRest).length > 0) {
            const restHrs = restTimeMin / 60;
            if (timeData[date]['#custom'] === undefined) {
                timeData[date]['#custom'] = 0;
            }
            timeData[date]['#custom'] += restHrs;
            if (debugMode) {
                console.debug(`[computeTimeData] ${date}: all-non-rest-excluded routed to #custom (+${restHrs.toFixed(4)}h)  pre-rest=${JSON.stringify(preRest)}`);
            }
        } else {
            if (debugMode) {
                console.debug(`[computeTimeData] ${date}: restCount=0 (no spread)  values=${JSON.stringify(preRest)}`);
            }
        }

        //normalize small values
        Object.keys(timeData[date]).forEach(tag => {
            timeData[date][tag] = roundToHalf(timeData[date][tag]);
        });
    });
}

export function applyTimeMultipliers(timeData, holidayMultiplier, weekendMultiplier, calendarLookup) {
    if (holidayMultiplier !== 1 || weekendMultiplier !== 1) {
        Object.keys(timeData).forEach(date => {
            const entry = calendarLookup?.[date];
            const dt = new Date(date + 'T00:00:00Z');
            const isWeekend = dt.getUTCDay() === 0 || dt.getUTCDay() === 6;
            const isHoliday = entry && ['holiday', 'observed_holiday', 'swapped_day_off'].includes(entry.type);

            Object.keys(timeData[date]).forEach(tag => {
                if (tag === 'rest') return;
                if (isHoliday && holidayMultiplier !== 1) {
                    timeData[date][tag] *= holidayMultiplier;
                } else if (isWeekend && entry?.type !== 'swapped_workday' && weekendMultiplier !== 1) {
                    timeData[date][tag] *= weekendMultiplier;
                }
            });
        });

        //normalize small values
        Object.keys(timeData).forEach(date => {
            Object.keys(timeData[date]).forEach(tag => {
                timeData[date][tag] = roundToHalf(timeData[date][tag]);
            });
        });
    }
}

export function computeStats(timeData, uniqueTags) {
    let totalHours = 0;
    const tagTotals = {};
    uniqueTags.forEach(tag => {
        tagTotals[tag] = 0;
    });

    Object.keys(timeData).forEach(date => {
        uniqueTags.forEach(tag => {
            if (timeData[date][tag] !== undefined) {
                tagTotals[tag] += timeData[date][tag];
                totalHours += timeData[date][tag];
            }
        });
    });

    const uniqueDates = Object.keys(timeData).length;
    const avgDailyHours = uniqueDates > 0 ? totalHours / uniqueDates : 0;

    const filteredTags = uniqueTags.filter(tag => tagTotals[tag] > 0);

    let topTag = '-';
    let maxHours = 0;
    filteredTags.forEach(tag => {
        if (tagTotals[tag] > maxHours) {
            maxHours = tagTotals[tag];
            topTag = tag;
        }
    });

    return { totalHours, tagTotals, avgDailyHours, topTag, topTagHours: maxHours };
}

export function processTimeDataLegacy(data, options = {}) {
    const {
        startDate = '2000-01-01',
        endDate = '2099-12-31',
        excludeBreaks = false,
        specialTags = [],
        selectedTags = null,
        roundToHalvesEnabled = false,
        restTimeMin = REST_TIME_MIN,
        debugMode = false,
        holidayMultiplier = 1,
        weekendMultiplier = 1,
        calendarLookup = null,
    } = options;

    if (!data || !data.sessions || !Array.isArray(data.sessions)) {
        return null;
    }

    const sessions = normalizeSessions(data.sessions);
    const filteredForTags = filterSessions(sessions, { startDate, endDate, excludeBreaks: false });
    const { uniqueTags, allTags, allSupportTags } = deriveUniqueTags(filteredForTags, specialTags, selectedTags ?? []);

    const allocationMap = new Map();
    filteredForTags.forEach(s => allocationMap.set(s, resolveSessionAllocation(s, specialTags, uniqueTags)));

    return computeTimeData({ sessions }, {
        startDate, endDate, excludeBreaks, specialTags, selectedTags,
        roundToHalvesEnabled, restTimeMin, debugMode,
        holidayMultiplier, weekendMultiplier, calendarLookup,
        precomputedUniqueTags: { uniqueTags, allTags, allSupportTags },
        allocationMap,
    });
}

function buildSessionsByDate(sessions) {
    const sessionsByDate = {};
    sessions.forEach(session => {
        const start = new Date(session.startTime);
        const end = computeEffectiveEnd(start, new Date(session.endTime), session.durationSec / 3600);
        const cursor = new Date(start);
        cursor.setUTCHours(0, 0, 0, 0);
        while (cursor < end) {
            const dateStr = cursor.toISOString().split('T')[0];
            if (!sessionsByDate[dateStr]) {
                sessionsByDate[dateStr] = [];
            }
            sessionsByDate[dateStr].push(session);
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
    });
    return sessionsByDate;
}

function handleOverlap(filteredSessions, effectiveAllocationMap, uniqueTags, timeData, roundToHalvesEnabled, debugMode) {
    filteredSessions.forEach(session => {
        const durationHours_session = session.durationSec / 3600;

        if (durationHours_session <= 0) return;

        const start = new Date(session.startTime);
        const end = computeEffectiveEnd(start, new Date(session.endTime), durationHours_session);
        const totalMs = end - start;
        const dayCursor = new Date(start);
        dayCursor.setUTCHours(0, 0, 0, 0);

        while (dayCursor < end) {
            const dayEnd = new Date(dayCursor);
            dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

            const overlapStart = start > dayCursor ? start : dayCursor;
            const overlapEnd = end < dayEnd ? end : dayEnd;
            const dayMs = overlapEnd - overlapStart;

            if (dayMs > 0) {
                const dateStr = dayCursor.toISOString().split('T')[0];
                const proportion = dayMs / totalMs;
                let dayDuration = durationHours_session * proportion;
                dayDuration = roundToHalvesEnabled ? roundToHalf(dayDuration) : dayDuration;

                if (debugMode) {
                    console.debug(`[computeTimeData]   date=${dateStr} id=${session.id} dayMs=${dayMs} totalMs=${totalMs} prop=${proportion.toFixed(4)} dur=${dayDuration.toFixed(4)}h${roundToHalvesEnabled ? ' (rounded)' : ''}`);
                }

                const alloc = effectiveAllocationMap.get(session);
                applyAllocation(dateEntry(timeData, dateStr, uniqueTags), alloc, dayDuration);
            }

            dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
        }
    });
}

export function computeTimeData(data, options = {}) {
    const {
        startDate = '2000-01-01',
        endDate = '2099-12-31',
        excludeBreaks = false,
        specialTags = [],
        selectedTags = null,
        roundToHalvesEnabled = false,
        restTimeMin = REST_TIME_MIN,
        debugMode = false,
        holidayMultiplier = 1,
        weekendMultiplier = 1,
        calendarLookup = null,
        precomputedUniqueTags,
        allocationMap,
    } = options;

    if (!data || !data.sessions || !Array.isArray(data.sessions)) {
        return null;
    }

    const sessions = data.sessions;
    const filteredSessions = filterSessions(sessions, { startDate, endDate, excludeBreaks: false });
    const displaySessions = filterSessions(sessions, { startDate, endDate, excludeBreaks });

    if (debugMode) {
        console.debug(`[computeTimeData] sessions=${filteredSessions.length} (compute) display=${displaySessions.length} range=${startDate}..${endDate} excludeBreaks=${excludeBreaks} specialTags=${JSON.stringify(specialTags)} selectedTags=${JSON.stringify(selectedTags)} roundToHalves=${roundToHalvesEnabled} restTimeMin=${restTimeMin}`);
    }

    if (!precomputedUniqueTags) throw new Error('precomputedUniqueTags is required');
    if (!allocationMap) throw new Error('allocationMap is required');

    const sessionsByDate = buildSessionsByDate(displaySessions);

    const { uniqueTags } = precomputedUniqueTags;
    const effectiveAllocationMap = allocationMap;

    const timeData = {};

    handleOverlap(filteredSessions, effectiveAllocationMap, uniqueTags, timeData, roundToHalvesEnabled, debugMode);

    applyRestSpread(timeData, restTimeMin, debugMode);
    applyTimeMultipliers(timeData, holidayMultiplier, weekendMultiplier, calendarLookup);
    cleanupRound(timeData);

    if (debugMode) {
        Object.keys(timeData).forEach(date => {
            const final = Object.fromEntries(
                Object.entries(timeData[date]).filter(([_, v]) => v > 0)
            );
            console.debug(`[computeTimeData] ${date} FINAL: ${JSON.stringify(final)}`);
        });
    }

    Object.keys(timeData).forEach(date => {
        if (!sessionsByDate[date]) {
            sessionsByDate[date] = [];
        }
    });

    return { sessionsByDate, uniqueTags, timeData };
}
