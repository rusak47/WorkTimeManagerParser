import { roundToHalf, datediff, durationToSeconds } from './utils.js';
import { DEFAULT_EXCLUDED_TAGS } from './data.js';

const REST_TIME_MIN = 60;

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

export function computeTimeData(data, options = {}) {
    const {
        startDate = '2000-01-01',
        endDate = '2099-12-31',
        excludeBreaks = false,
        specialTags = [],
        selectedTags = null,
        roundToHalvesEnabled = false,
        restTimeMin = REST_TIME_MIN,
    } = options;

    if (!data || !data.sessions || !Array.isArray(data.sessions)) {
        return null;
    }

    const { sessions } = data;

    const filteredSessions = filterSessions(sessions, { startDate, endDate, excludeBreaks });

    const sessionsByDate = {};
    filteredSessions.forEach(session => {
        if (!sessionsByDate[session.date]) {
            sessionsByDate[session.date] = [];
        }
        sessionsByDate[session.date].push(session);
    });

    const { allTags, allSupportTags } = extractTags(filteredSessions, specialTags);
    const allTagsArray = Array.from(allTags).concat(Array.from(allSupportTags));

    const uniqueTags = selectedTags && selectedTags.length > 0
        ? [...selectedTags].sort()
        : [...allTagsArray].sort();

    const timeData = {};
    Object.keys(sessionsByDate).forEach(date => {
        timeData[date] = {};
        uniqueTags.forEach(tag => {
            timeData[date][tag] = 0;
        });

        sessionsByDate[date].forEach(session => {
            const accumBreak = session.accumulatedPauseTimeSec ? session.accumulatedPauseTimeSec / 3600 : 0;
            const durationHours_session = session.durationSec / 3600;
            const is_correct_record = checkIsCorrectRecord(session);

            let durationHours = durationHours_session;
            if (!is_correct_record) {
                if (!session.isBreak) {
                    if (Math.abs(durationToSeconds(session.duration) - session.durationSec) < 60) {
                        if (accumBreak <= durationHours_session) {
                            durationHours -= accumBreak;
                        }
                    }
                }
            }

            durationHours = roundToHalvesEnabled ? roundToHalf(durationHours) : durationHours;

            let foundSpecialTag = false;
            let foundHashtag = false;

            if (specialTags.length > 0 && session.notes) {
                for (const specialTag of specialTags) {
                    if (session.notes.toLowerCase().includes(specialTag)) {
                        foundSpecialTag = `${specialTag} support`;
                        break;
                    }
                }
            }

            if (foundSpecialTag) {
                timeData[date][foundSpecialTag] += durationHours;
            } else if (session.notes) {
                const hashtags = session.notes.match(/#\d+/g) || [];
                if (hashtags.length > 0) {
                    timeData[date][hashtags[0].toLowerCase()] += durationHours;
                    foundHashtag = true;
                }

                const customHashtags = session.notes.match(/#[a-zA-Z]+[a-zA-Z0-9]{0,}/) || [];
                if (!foundHashtag && customHashtags.length > 0) {
                    timeData[date][customHashtags[0].toLowerCase()] += durationHours;
                    foundHashtag = true;
                }
            }

            if (!foundHashtag && session.tags && Array.isArray(session.tags) && session.tags.length > 0) {
                session.tags.forEach(tag => {
                    if (uniqueTags.includes(tag)) {
                        if (tag === "work") {
                            timeData[date]["#custom"] += durationHours;
                        } else {
                            timeData[date][tag] += durationHours;
                        }
                    }
                });
            }
        });

        const restTime = {};
        Object.keys(timeData[date]).forEach(tag => {
            if (timeData[date][tag] > 0) {
                restTime[tag] = 1;
            }
        });

        const restCount = Object.keys(restTime).length;
        if (restCount > 0) {
            const restSpread = restTimeMin / restCount / 60;
            Object.keys(restTime).forEach(tag => {
                timeData[date][tag] += restSpread;
            });
        }
    });

    Object.keys(timeData).forEach(date => {
        Object.keys(timeData[date]).forEach(tag => {
            if (timeData[date][tag] === 0 || isNaN(timeData[date][tag])) {
                delete timeData[date][tag];
            } else {
                timeData[date][tag] = roundToHalf(timeData[date][tag]);
            }
        });
    });

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

    let topTag = '-';
    let maxHours = 0;
    uniqueTags.forEach(tag => {
        if (tagTotals[tag] > maxHours) {
            maxHours = tagTotals[tag];
            topTag = tag;
        }
    });

    return {
        filteredSessions,
        sessionsByDate,
        allTagsArray,
        allSupportTags,
        uniqueTags,
        timeData,
        tagTotals,
        totalHours,
        avgDailyHours,
        topTag,
        topTagHours: maxHours,
    };
}
