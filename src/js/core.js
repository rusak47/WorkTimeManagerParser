import { roundToHalf, datediff, durationToSeconds } from './utils.js';
import { REST_TIME_MIN, DEFAULT_NOTSUPPORT_TAGS, REST_EXCLUDED_TAGS } from './data.js';

/**
 * Assume session correct when calculated duration is same as derived
 * @param {*} session 
 * @returns 
 */
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

/**
 * Extract all tags from
 *  - session tags list,
 *  - session notes:
 *    - special tags if any,
 *    - custom hash tags: split into support and not support
 *    - redmine hash tags 
 * @param {*} sessions 
 * @param {*} specialTags 
 * @returns 
 */
export function extractTagsLegacy(sessions, specialTags) {
    const allTags = new Set(['#custom']);
    const allSupportTags = new Set();

    sessions.forEach(session => {
        if (session.tags && Array.isArray(session.tags)) {
            session.tags.forEach(tag => allTags.add(tag));
        }

        //legacy extracting from notes
        //todo: should be applied to session.tags too;
        if (session.notes) { 
            specialTags.forEach(specialTag => {
                if (session.notes.toLowerCase().includes(specialTag.toLowerCase())) {
                    allTags.add(`${specialTag} support`);
                }
            });

            const hashtagsCustom = session.notes.match(/#[a-zA-Z]+[a-zA-Z0-9]{0,}/) || [];
            hashtagsCustom.forEach(tag => {
                if (DEFAULT_NOTSUPPORT_TAGS.includes(tag.toLowerCase())) {
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

export function deriveSelectedTags(sessions, specialTags, selectedTags) {
    const { allTags, allSupportTags } = extractTagsLegacy(sessions, specialTags);
    const allTagsArray = Array.from(allTags).concat(Array.from(allSupportTags));
    const uniqueTags = selectedTags && selectedTags.length > 0
        ? [...selectedTags].sort()
        : [...allTagsArray].sort();
    return { allTags, allSupportTags, uniqueTags };
}

export function normalizeSessionsLegacy(sessions) {
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

export function resolveSessionAllocationLegacy(session, specialTags, selectedTags) {
    if (session.bucket) {
        // New-format session: tags are bare (no # prefix), already in session.tags.
        // Priority: rest → specialTag → redmine split → revision split → custom (first match) → #custom
        if (session.bucket === 'rest') {
            return { type: 'single', tag: 'rest' };
        }

        const tags = session.tags.filter(t => t !== 'work' && t !== 'rest');

        // 1) specialTag match
        if (specialTags.length > 0) {
            for (const specialTag of specialTags) {
                if (tags.some(t => t.toLowerCase() === specialTag.toLowerCase())) {
                    return { type: 'single', tag: `${specialTag} support` };
                }
            }
        }

        const isTagged = (t) => selectedTags.includes(t) || selectedTags.includes('#' + t);

        // 2) redmine tags (all digits) — ALL matching split (bare tags)
        const redmineMatches = tags.filter(t => /^\d+$/.test(t) && isTagged(t));
        if (redmineMatches.length > 0) {
            return redmineMatches.length === 1
                ? { type: 'single', tag: redmineMatches[0] }
                : { type: 'split', tags: redmineMatches };
        }

        // 3) revision tags (r + digits) — ALL matching split (bare tags)
        const revisionMatches = tags.filter(t => /^r\d+$/.test(t) && isTagged(t));
        if (revisionMatches.length > 0) {
            return revisionMatches.length === 1
                ? { type: 'single', tag: revisionMatches[0] }
                : { type: 'split', tags: revisionMatches };
        }

        // 4) custom tags — first match wins (bare tag)
        for (const tag of tags) {
            if (isTagged(tag)) {
                return { type: 'single', tag };
            }
        }

        // 5) fallback to #custom
        return { type: 'single', tag: '#custom' };
    }
    
    if (session.notes) {//legacy
        if (specialTags.length > 0) {//todo: why this have priority over others - are this tags given by user from inputs?
            for (const specialTag of specialTags) {
                if (session.notes.toLowerCase().includes(specialTag)) {
                    return { type: 'single', tag: `${specialTag} support` };
                }
            }
        }
        const redmineTags = session.notes.match(/#\d+/g);
        if (redmineTags?.length > 0) {
            const tag = redmineTags[0].toLowerCase();
            if (selectedTags.includes(tag)) {
                return { type: 'single', tag };
            }
        }

        // Matches hashtags: '#' followed by at least one letter, then optional letters or digits, eg revision version: #r1234
        const customTags = session.notes.match(/#[a-zA-Z]+[a-zA-Z0-9]{0,}/); 
        if (customTags?.length > 0) {
            const tag = customTags[0].toLowerCase();
            if (selectedTags.includes(tag)) {
                return { type: 'single', tag };
            }
        }
    }

    if (session.tags?.length > 0) { //the rest unmatched is allocated to #custom
        const matchingTags = session.tags.filter(t => selectedTags.includes(t));
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

/**
 * Based on allocation time add or split dayDuration to entry tags
 * @param {*} entry 
 * @param {*} allocation type: single or split
 * @param {*} dayDuration 
 * @returns 
 */
export function applyDurationAllocation(entry, allocation, dayDuration) {
    if (!allocation) return;
    if (allocation.type === 'single') {
        entry[allocation.tag] += dayDuration;
    } else if (allocation.type === 'split') {
        const share = dayDuration / allocation.tags.length;
        allocation.tags.forEach(tag => { entry[tag] += share; });
    }
}

/**
 * 
 * @param {*} timeData 
 * @param {*} dateStr 
 * @param {*} uniqueTags 
 * 
 * @returns allocated tag-hours for date from timeData
 */
export function getDateEntryTags(timeData, dateStr, uniqueTags) {
    if (!timeData[dateStr]) {
        timeData[dateStr] = {};
        uniqueTags.forEach(tag => { timeData[dateStr][tag] = 0; });
    }
    return timeData[dateStr];
}

/**
 * Remove tags with no time share 
 * @param {*} timeData 
 */
export function cleanupRound(timeData) {
    Object.keys(timeData).forEach(date => {
        Object.keys(timeData[date]).forEach(tag => {
            if (timeData[date][tag] === 0 || isNaN(timeData[date][tag])) {
                delete timeData[date][tag];
            }
        });
    });
}

/**
 * Spread official rest time to work, but skip REST_EXCLUDED_TAGS.
 * If no candidates found, then allocate all rest to #custom
 * @param {*} timeData 
 * @param {*} restTimeMin 
 * @param {*} debugMode 
 */
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

/**
 * Apply holiday/weekend multipliers to respective day types. 
 *  Only one of them is applied at a time - holiday has priority.
 * @param {*} timeData 
 * @param {*} holidayMultiplier 
 * @param {*} weekendMultiplier 
 * @param {*} calendarLookup 
 */
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

/**
 * Compute useful statistics from prepared data
 * @param {*} timeData 
 * @param {*} uniqueTags 
 * @returns 
 */
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

/**
 * If some sessions duration spans across multiple days, then distribute time accordingly
 * 
 * @param {*} filteredSessions 
 * @param {*} effectiveAllocationMap 
 * @param {*} uniqueTags 
 * @param {*} timeData 
 * @param {*} roundToHalvesEnabled 
 * @param {*} debugMode 
 */
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
                applyDurationAllocation(getDateEntryTags(timeData, dateStr, uniqueTags), alloc, dayDuration);
            }

            dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
        }
    });
}

/**
 * Entry point for getting timetable ready for rendering
 * @param {*} data 
 * @param {*} options 
 * @returns 
 */
export function processTimeDataLegacy(data, options = {}) {
    const {
        startDate = '2000-01-01',
        endDate = '2099-12-31',
        excludeBreaks = false,
        specialTags: additionalSpecialTags = [],
        selectedTags: selectedTagsFilter = null,
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

    const sessions = normalizeSessionsLegacy(data.sessions);
    const computeSessions = filterSessions(sessions, { startDate, endDate, excludeBreaks: false });
    const { uniqueTags, allTags, allSupportTags } = deriveSelectedTags(computeSessions, additionalSpecialTags, selectedTagsFilter ?? []);

    const allocationMap = new Map();
    computeSessions.forEach(s => allocationMap.set(s, resolveSessionAllocationLegacy(s, additionalSpecialTags, uniqueTags)));

    return computeTimeData({
        sessions: computeSessions,
        precomputedUniqueTags: { uniqueTags, allTags, allSupportTags },
        allocationMap,
        excludeBreaks, startDate, endDate,
        roundToHalvesEnabled, restTimeMin, debugMode,
        holidayMultiplier, weekendMultiplier, calendarLookup,
    });
}

export function computeTimeData({ sessions: rawSessionsForPeriod, precomputedUniqueTags, allocationMap, startDate = '2000-01-01', endDate = '2099-12-31', excludeBreaks = false, roundToHalvesEnabled = false, restTimeMin = REST_TIME_MIN, debugMode = false, holidayMultiplier = 1, weekendMultiplier = 1, calendarLookup = null }) {
    if (!precomputedUniqueTags) throw new Error('precomputedUniqueTags is required');
    if (!allocationMap) throw new Error('allocationMap is required');

    const { uniqueTags } = precomputedUniqueTags;

    const displaySessions = excludeBreaks
        ? rawSessionsForPeriod.filter(s => !s.isBreak)
        : rawSessionsForPeriod;

    if (debugMode) {
        console.debug(`[computeTimeData] sessions=${rawSessionsForPeriod.length} (compute) display=${displaySessions.length} range=${startDate}..${endDate} excludeBreaks=${excludeBreaks} roundToHalves=${roundToHalvesEnabled} restTimeMin=${restTimeMin}`);
    }

    const sessionsByDate = buildSessionsByDate(displaySessions);

    const timeData = {};

    handleOverlap(rawSessionsForPeriod, allocationMap, uniqueTags, timeData, roundToHalvesEnabled, debugMode);

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
