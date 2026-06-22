import { syncSpecialTags, generateTableHeader, generateTableBody, generateTagLegend } from './ui.js';
import { roundToHalf, copyAndEmailTimeTable2, datediff, durationToSeconds } from './utils.js';
import { computeTimeData, extractTags, filterSessions } from './core.js';
import { DEFAULT_EXCLUDED_TAGS, sampleData } from './data.js';

export { DEFAULT_EXCLUDED_TAGS };

export function processData(data, options = {}) {
    const {
        startDate: startDateOverride,
        endDate: endDateOverride,
        excludeBreaks: excludeBreaksOverride,
        specialTags: specialTagsOverride,
        roundToHalves: roundToHalvesOverride,
        selectedTags: selectedTagsOverride,
    } = options;

    const startDate = startDateOverride || document.getElementById('startDate').value;
    const endDate = endDateOverride || document.getElementById('endDate').value;
    const excludeBreaks = excludeBreaksOverride !== undefined ? excludeBreaksOverride : document.getElementById('excludeBreaks').checked;
    const specialTagsInput = specialTagsOverride !== undefined ? specialTagsOverride : document.getElementById('specialTags').value;
    const specialTags = specialTagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    const roundToHalvesEnabled = roundToHalvesOverride !== undefined ? roundToHalvesOverride : document.getElementById('roundToHalves').checked;

    const tagFilter = document.getElementById('tagFilter')?.tomselect;
    const tableContainer = document.getElementById('tableContainer');
    const statsContainer = document.getElementById('statsContainer');
    const legendContainer = document.getElementById('legendContainer');
    const timeTable = document.getElementById('timeTable');
    const tagLegend = document.getElementById('tagLegend');
    const totalTimeEl = document.getElementById('totalTime');
    const topTagEl = document.getElementById('topTag');
    const avgDailyEl = document.getElementById('avgDaily');

    if (!data?.sessions || !Array.isArray(data.sessions)) {
        alert('Invalid data format. Expected an object with a "sessions" array.');
        return;
    }

    const periodSessions = filterSessions(data.sessions, { startDate, endDate, excludeBreaks });

    if (tagFilter) {
        const { allTags, allSupportTags } = extractTags(periodSessions, specialTags);
        const allTagsArray = Array.from(allTags).concat(Array.from(allSupportTags));

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

    const effectiveSelectedTags = selectedTagsOverride || (tagFilter?.items.length > 0 ? tagFilter.items : null);

    const result = computeTimeData(data, {
        startDate,
        endDate,
        excludeBreaks,
        specialTags,
        selectedTags: effectiveSelectedTags,
        roundToHalvesEnabled,
    });

    if (!result || Object.keys(result.timeData).length === 0) {
        alert('No sessions found in the selected date range.');
        return;
    }

    const { uniqueTags, timeData, sessionsByDate, totalHours, avgDailyHours, topTag, topTagHours } = result;

    totalTimeEl.textContent = `${totalHours.toFixed(1)} hours`;
    topTagEl.textContent = `${topTag} (${topTagHours.toFixed(1)}h)`;
    avgDailyEl.textContent = `${avgDailyHours.toFixed(1)} hours`;

    generateTableHeader(timeTable, new Set(), uniqueTags);
    generateTableBody(timeTable.querySelector('tbody'), timeData, sessionsByDate, uniqueTags, specialTags, tagFilter || { items: [] });
    generateTagLegend(tagLegend, uniqueTags);

    tableContainer.classList.remove('hidden');
    statsContainer.classList.remove('hidden');
    legendContainer.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', function() {
    console.debug("loaded");

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
        },
        onItemRemove: function(value) {
            syncSpecialTags(this);
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
