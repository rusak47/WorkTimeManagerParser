import { syncSpecialTags, generateTableHeader, generateTableBody, generateTagLegend } from './ui.js';
import { roundToHalf, copyAndEmailTimeTable2, datediff, durationToSeconds } from './utils.js';
import { processTimeDataLegacy, deriveUniqueTags, filterSessions } from './core.js';
import { DEFAULT_EXCLUDED_TAGS, sampleData } from './data.js';
import holidaysRaw from '../holidays.json' with { type: 'json' };

const HOLIDAY_LOCALE = Object.keys(holidaysRaw)[0];
const CALENDAR_LOOKUP = holidaysRaw[HOLIDAY_LOCALE];

export { DEFAULT_EXCLUDED_TAGS };

let currentData = null;
let isProcessingData = false;

function recomputeAndRender(state) {
    const startDate = state?.startDate ?? document.getElementById('startDate').value;
    const endDate = state?.endDate ?? document.getElementById('endDate').value;
    const excludeBreaks = state !== undefined ? state.excludeBreaks : document.getElementById('excludeBreaks').checked;
    const specialTagsInput = state?.specialTagsInput ?? document.getElementById('specialTags').value;
    const specialTags = specialTagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    const roundToHalvesEnabled = state !== undefined ? state.roundToHalvesEnabled : document.getElementById('roundToHalves').checked;
    const debugMode = state !== undefined ? state.debugMode : document.getElementById('debugMode')?.checked || false;
    const holidayMultiplier = state !== undefined ? state.holidayMultiplier : parseFloat(document.getElementById('holidayMultiplier').value) || 1;
    const weekendMultiplier = state !== undefined ? state.weekendMultiplier : parseFloat(document.getElementById('weekendMultiplier').value) || 1;
    const tagFilter = document.getElementById('tagFilter')?.tomselect;
    const tableContainer = document.getElementById('tableContainer');
    const statsContainer = document.getElementById('statsContainer');
    const legendContainer = document.getElementById('legendContainer');
    const timeTable = document.getElementById('timeTable');
    const tagLegend = document.getElementById('tagLegend');
    const totalTimeEl = document.getElementById('totalTime');
    const topTagEl = document.getElementById('topTag');
    const avgDailyEl = document.getElementById('avgDaily');

    const selectedTags = tagFilter?.items.length > 0 ? tagFilter.items : null;
    if (document.getElementById('debugMode')?.checked) {
        console.debug('[recomputeAndRender] tagFilter.items:', JSON.stringify(tagFilter?.items), 'selectedTags:', JSON.stringify(selectedTags));
        if (tagFilter) {
            console.debug('[recomputeAndRender] options:', tagFilter.options);
        }
    }

    const result = processTimeDataLegacy(currentData, {
        startDate,
        endDate,
        excludeBreaks,
        specialTags,
        selectedTags,
        roundToHalvesEnabled,
        debugMode,
        holidayMultiplier,
        weekendMultiplier,
        calendarLookup: CALENDAR_LOOKUP,
    });

    if (!result || Object.keys(result.timeData).length === 0) {
        return;
    }

    let { uniqueTags, timeData, sessionsByDate } = result;

    if (excludeBreaks) {
        const restIdx = uniqueTags.indexOf('rest');
        if (restIdx !== -1) {
            uniqueTags.splice(restIdx, 1);
        }
        Object.keys(timeData).forEach(date => {
            delete timeData[date]['rest'];
        });
        Object.keys(timeData).forEach(date => {
            const hasData = Object.values(timeData[date]).some(v => v > 0);
            if (!hasData) {
                delete timeData[date];
                delete sessionsByDate[date];
            }
        });
    }

    if (Object.keys(timeData).length === 0) {
        return;
    }

    const displayTotalHours = Object.values(timeData).reduce((sum, tags) => {
        return sum + Object.values(tags).reduce((a, b) => a + b, 0);
    }, 0);
    const uniqueDates = Object.keys(timeData).length;
    const displayAvgDaily = uniqueDates > 0 ? displayTotalHours / uniqueDates : 0;

    let displayTopTag = '-';
    let displayTopHours = 0;
    const tagTotals = {};
    uniqueTags.forEach(tag => tagTotals[tag] = 0);
    Object.keys(timeData).forEach(date => {
        uniqueTags.forEach(tag => {
            if (timeData[date][tag] !== undefined) {
                tagTotals[tag] += timeData[date][tag];
            }
        });
    });
    uniqueTags.forEach(tag => {
        if (tagTotals[tag] > displayTopHours) {
            displayTopHours = tagTotals[tag];
            displayTopTag = tag;
        }
    });

    totalTimeEl.textContent = `${displayTotalHours.toFixed(1)} hours`;
    topTagEl.textContent = `${displayTopTag} (${displayTopHours.toFixed(1)}h)`;
    avgDailyEl.textContent = `${displayAvgDaily.toFixed(1)} hours`;

    generateTableHeader(timeTable, new Set(), uniqueTags);
    generateTableBody(timeTable.querySelector('tbody'), timeData, sessionsByDate, uniqueTags, specialTags, tagFilter || { items: [] }, CALENDAR_LOOKUP, HOLIDAY_LOCALE);
    generateTagLegend(tagLegend, uniqueTags);

    tableContainer.classList.remove('hidden');
    statsContainer.classList.remove('hidden');
    legendContainer.classList.remove('hidden');
}

export function processData(data, options = {}) {
    const {
        startDate: startDateOverride,
        endDate: endDateOverride,
        excludeBreaks: excludeBreaksOverride,
        specialTags: specialTagsOverride,
        roundToHalves: roundToHalvesOverride,
        selectedTags: selectedTagsOverride,
        debugMode: debugModeOverride,
        holidayMultiplier: holidayMultiplierOverride,
        weekendMultiplier: weekendMultiplierOverride,
    } = options;

    if (!data?.sessions || !Array.isArray(data.sessions)) {
        alert('Invalid data format. Expected an object with a "sessions" array.');
        return;
    }

    currentData = data;
    isProcessingData = true;

    const startDate = startDateOverride || document.getElementById('startDate').value;
    const endDate = endDateOverride || document.getElementById('endDate').value;
    const excludeBreaks = excludeBreaksOverride !== undefined ? excludeBreaksOverride : document.getElementById('excludeBreaks').checked;
    const specialTagsInput = specialTagsOverride !== undefined ? specialTagsOverride : document.getElementById('specialTags').value;
    const specialTags = specialTagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    const roundToHalvesEnabled = roundToHalvesOverride !== undefined ? roundToHalvesOverride : document.getElementById('roundToHalves').checked;
    const debugMode = debugModeOverride !== undefined ? debugModeOverride : document.getElementById('debugMode')?.checked || false;
    const holidayMultiplier = holidayMultiplierOverride !== undefined ? holidayMultiplierOverride : parseFloat(document.getElementById('holidayMultiplier').value) || 1;
    const weekendMultiplier = weekendMultiplierOverride !== undefined ? weekendMultiplierOverride : parseFloat(document.getElementById('weekendMultiplier').value) || 1;

    const tagFilter = document.getElementById('tagFilter')?.tomselect;
    const periodSessions = filterSessions(data.sessions, { startDate, endDate, excludeBreaks });

    if (tagFilter) {
        const tagInfo = deriveUniqueTags(periodSessions, specialTags, selectedTagsOverride ?? []);
        const { allTags, allSupportTags } = tagInfo;
        const allTagsArray = Array.from(allTags).concat(Array.from(allSupportTags));

        const previousItems = tagFilter.items.slice();

        tagFilter.clear();
        tagFilter.clearOptions();
        tagFilter.addOptions(allTagsArray.map(tag => {
            if (allSupportTags.has(tag)) {
                return { value: tag, text: `${tag.slice(1)} support` };
            }
            return { value: tag, text: tag };
        }));

        if (selectedTagsOverride) {
            tagFilter.addItems(selectedTagsOverride);
        } else if (previousItems.length > 0) {
            const preserved = previousItems.filter(item => allTagsArray.includes(item));
            tagFilter.addItems(preserved);
        } else {
            const autoSelected = [];
            periodSessions.forEach(session => {
                if (session.notes) {
                    specialTags.forEach(specialTag => {
                        if (session.notes.toLowerCase().includes(specialTag.toLowerCase())) {
                            if (session.tags?.[0] && !autoSelected.includes(session.tags[0])) {
                                autoSelected.push(session.tags[0]);
                            }
                        }
                    });
                }
            });
            tagFilter.addItems(autoSelected);
        }

        if (specialTags.length > 0) {
            specialTags.forEach(specialTag => {
                const supportTag = `${specialTag} support`;
                if (allTagsArray.includes(supportTag) && !tagFilter.items.includes(supportTag)) {
                    tagFilter.addItem(supportTag);
                }
            });
        }
    }

    isProcessingData = false;

    recomputeAndRender({
        startDate,
        endDate,
        excludeBreaks,
        specialTagsInput,
        roundToHalvesEnabled,
        debugMode,
        holidayMultiplier,
        weekendMultiplier,
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('debugMode')?.checked) {
        console.debug("loaded");
    }

    const jsonFileInput = document.getElementById('jsonFile');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileName = document.getElementById('fileName');
    const generateBtn = document.getElementById('generateBtn');
    const useSampleBtn = document.getElementById('useSampleBtn');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    document.getElementById('copyAndEmailBtn').addEventListener('click', copyAndEmailTimeTable2);

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    startDateInput.valueAsDate = sevenDaysAgo;
    endDateInput.valueAsDate = today;

    const tagFilter = new TomSelect('#tagFilter', {
        plugins: ['remove_button'],
        render: {
            option: function(data, escape) {
                return `<div>${escape(data.text)}</div>`;
            },
            item: function(data, escape) {
                return `<div>${escape(data.text)}</div>`;
            }
        },
        onItemAdd: function(value) {
            syncSpecialTags(this);
            if (!isProcessingData) recomputeAndRender();
        },
        onItemRemove: function(value) {
            syncSpecialTags(this);
            if (!isProcessingData) recomputeAndRender();
        }
    });

    uploadBtn.addEventListener('click', () => jsonFileInput.click());

    jsonFileInput.addEventListener('change', function() {
        fileName.textContent = this.files.length > 0 ? this.files[0].name : 'No file selected';
    });

    useSampleBtn.addEventListener('click', function() {
        fileName.textContent = "Using sample data";
        processData(sampleData);
    });

    generateBtn.addEventListener('click', function() {
        if (jsonFileInput.files.length === 0) {
            alert('Please select a JSON file first or use sample data.');
            return;
        }

        const file = jsonFileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                processData(JSON.parse(e.target.result));
            } catch (error) {
                alert('Error parsing JSON file. Please check the file format.');
                console.error(error);
            }
        };
        reader.readAsText(file);
    });
});
