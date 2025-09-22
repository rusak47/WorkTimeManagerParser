import { syncSpecialTags, generateTableHeader, generateTableBody, generateTagLegend } from './ui.js';
import { sampleData } from './demo.js';
import { roundToHalf, copyAndEmailTimeTable2, datediff, durationToSeconds } from './utils.js';

export const DEFAULT_EXCLUDED_TAGS = [
    '#docs', '#custom', '#translations', '#codereview', '#work', '#support', '#bug', '#auth', '#review',
    '#rest'
];

const REST_TIME_MIN = 60;//1h
                
document.addEventListener('DOMContentLoaded', function() {
    console.debug("loaded");
    
    // DOM elements
    const jsonFileInput = document.getElementById('jsonFile');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileName = document.getElementById('fileName');
    const generateBtn = document.getElementById('generateBtn');
    const useSampleBtn = document.getElementById('useSampleBtn');
    const tableContainer = document.getElementById('tableContainer');
    const statsContainer = document.getElementById('statsContainer');
    const legendContainer = document.getElementById('legendContainer');
    const timeTable = document.getElementById('timeTable');
    const tagLegend = document.getElementById('tagLegend');
    const totalTimeEl = document.getElementById('totalTime');
    const topTagEl = document.getElementById('topTag');
    const avgDailyEl = document.getElementById('avgDaily');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const excludeBreaksCheckbox = document.getElementById('excludeBreaks');
    const roundToHalvesCheckbox = document.getElementById('roundToHalves');

    document.getElementById('copyAndEmailBtn').addEventListener('click', copyAndEmailTimeTable2);
    // Set default date range (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    startDateInput.valueAsDate = sevenDaysAgo;
    endDateInput.valueAsDate = today;

    // Initialize tag filter
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

    // File upload handling
    uploadBtn.addEventListener('click', () => jsonFileInput.click());
    
    jsonFileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            fileName.textContent = this.files[0].name;
        } else {
            fileName.textContent = 'No file selected';
        }
    });

    // Use sample data
    useSampleBtn.addEventListener('click', sampleData);

    // Generate table from uploaded file
    generateBtn.addEventListener('click', function() {
        if (jsonFileInput.files.length === 0) {
            alert('Please select a JSON file first or use sample data.');
            return;
        }

        const file = jsonFileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                processData(data);
            } catch (error) {
                alert('Error parsing JSON file. Please check the file format.');
                console.error(error);
            }
        };

        reader.readAsText(file);
    });

    // Process the data and generate the table
    function processData(data) {
        console.debug("Processing data")
        if (!data?.sessions || !Array.isArray(data.sessions)) {
            alert('Invalid data format. Expected an object with a "sessions" array.');
            return;
        }

        // Filter sessions by date range
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date

        const filteredSessions = data.sessions.filter(session => {
            const sessionDate = new Date(session.date);
            const dateInRange = sessionDate >= startDate && sessionDate <= endDate;
            const includeSession = !excludeBreaksCheckbox.checked || !session.isBreak;
            return dateInRange && includeSession;
        });

        if (filteredSessions.length === 0) {
            alert('No sessions found in the selected date range.');
            return;
        }

        // Get special tags from input
        const specialTagsInput = document.getElementById('specialTags').value;
        const specialTags = specialTagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        tagFilter.clearOptions();
        let selectedTags = [];

        // Extract all unique tags from both tags array and notes
        const allTags = new Set();
            //add default tags
            allTags.add(`#custom`);
        const allSupportTags = new Set();
        filteredSessions.forEach(session => {
            // Add regular tags
            if (session.tags && Array.isArray(session.tags)) {
                session.tags.forEach(tag => allTags.add(tag));
            }
            
            // Extract special tags from notes
            if (session.notes) {
                // Check for special support tags
                specialTags.forEach(specialTag => {
                    if (session.notes.toLowerCase().includes(specialTag.toLowerCase())) {
                        allTags.add(`${specialTag} support`);

                        if(!selectedTags.includes(session.tags[0])) {
                            console.debug(`core tag to tagfilter: ${session.tags[0]}`);
                            selectedTags.push(session.tags[0]);
                        }
                    }
                });
                
                // and hashtags
                const hashtags_redmine = session.notes.match(/#\d+/g) || [];
                hashtags_redmine.forEach(tag => {
                    console.debug(`!!! redmine hash tag: ${tag}`);
                    allTags.add(tag);
                    if(specialTags.length > 0 && !selectedTags.includes(tag.toLowerCase())) {
                        selectedTags.push(tag);
                    }
                });

                const hashtags_custom = session.notes.match(/#[a-zA-Z]+/) || [];
                hashtags_custom.forEach(tag => {
                    console.debug(`!!! custom hash tag: ${tag}`);
                    if (DEFAULT_EXCLUDED_TAGS.includes(tag.toLowerCase())) {
                        allTags.add(tag);
                    } else {
                        allSupportTags.add(`${tag.toLowerCase()}`);
                        if(specialTags.length > 0 && !selectedTags.includes(tag.toLowerCase())) {
                            selectedTags.push(tag);
                        }
                    }
                });
            }
        });
        
        const allTagsArray = Array.from(allTags).concat(Array.from(allSupportTags));
        tagFilter.addOptions(allTagsArray.map(tag => {
            if(allSupportTags.has(tag)) {
                return {value: tag, text: `${tag.slice(1)} support`};
            }
            
            return {value: tag, text: tag}
        }));
        tagFilter.addItems(selectedTags);
        
        // Add special tags to filter if they exist in the data
        if (specialTags.length > 0) {
            specialTags.forEach(specialTag => {
                const supportTag = `${specialTag} support`;
                if (allTagsArray.includes(supportTag) && !tagFilter.items.includes(supportTag)) {
                    tagFilter.addItem(supportTag);
                }
            });
        }

        console.debug(`Selected tags: ${selectedTags}`);
        // Get selected tags or use all if none selected
        selectedTags = tagFilter.items.length > 0 
            ? tagFilter.items //selectedTags.concat(tagFilter.items)
            : Array.from(allTags);
        const uniqueTags = selectedTags.sort();

        // Group sessions by date
        const sessionsByDate = {};
        filteredSessions.forEach(session => {
            if (!sessionsByDate[session.date]) {
                sessionsByDate[session.date] = [];
            }
            sessionsByDate[session.date].push(session);
        });

        // Calculate time spent per tag per day
        const timeData = {};
        Object.keys(sessionsByDate).forEach(date => {
            timeData[date] = {};
            let restTime = {};
            uniqueTags.forEach(tag => {
                timeData[date][tag] = 0;
            });

            //edge cases for correctness checks:
            //  id=1751376002892 <- faulty duration with one break
            //  1754945234965, 1755557508145, 1755782808075, 1756132074529 <- durationSec not updated with break
            //
            console.debug(`>>> Processing sessions for ${date}`);
            sessionsByDate[date].forEach(session => {
                console.debug(`   > Processing session: ${session.startTime}; tags: ${session.tags}; notes: ${session.notes}`);
                const accumBreak = session.accumulatedPauseTimeSec ? session.accumulatedPauseTimeSec / 3600 : 0;
                const durationHours_session = session.durationSec / 3600; 
                const duration_real = datediff(session.startTime, session.endTime).hours;
                const is_correct_record = Math.abs(duration_real - (accumBreak + durationHours_session)) < 0.05;

                let durationHours = durationHours_session;
                if(!is_correct_record) {
                    //TODO known bug: when editing session durationSec is not updated with accumulatedPauseTimeSec
                    // in that case session.duration is the same as session.durationSec, but should be subtracted, i.e.
                    // duration = session.durationSec - session.accumulatedPauseTimeSec
                    console.debug(`   real Duration(calculated): ${duration_real} !==  ${accumBreak + durationHours_session}`);
                    console.error(`   !!! Incorrect record: ${session.id} - ${session.notes}`);
                    console.debug(`   > Adjusting duration... ${session.durationSec} === ${durationToSeconds(session.duration)}`);
                    if(!session.isBreak){
                        if(Math.abs(durationToSeconds(session.duration) - session.durationSec) < 60) {
                            durationHours -= accumBreak
                        }
                    }
                }
                durationHours = (roundToHalvesCheckbox.checked ? roundToHalf(durationHours) : durationHours);
                console.debug(`   initial Duration: ${durationHours_session}`);
                console.debug(`   accumBreak: ${accumBreak}`);
                console.debug(`   final Duration: ${durationHours}`);

                // First check for special tags in notes (only if special tags are provided)
                let foundSpecialTag = false;
                let foundHashtag = false;
                if (specialTags.length > 0 && session.notes) {
                    for (const specialTag of specialTags) {
                        console.debug(`\t > Checking for ${specialTag} in ${session.notes}`);
                        if (session.notes.toLowerCase().includes(specialTag)) {
                                foundSpecialTag = `${specialTag} support`;
                            break;
                        }
                    }
                }
                
                if (foundSpecialTag) { // Allocate time only to special tag
                    timeData[date][foundSpecialTag] += durationHours;       

                } else if (session.notes) { // try to use hashtags from notes
                    const hashtags = session.notes.match(/#\d+/g) || [];
                    if (hashtags.length > 0) {
                        console.debug(`\t > Checking for "${hashtags[0]}" in ${session.notes}`);
                        // Use first hashtag if available
                        timeData[date][hashtags[0].toLowerCase()] += durationHours;

                        foundHashtag = true;
                    }

                    const customHashtags = session.notes.match(/#[a-zA-Z]+/) || [];
                    if (!foundHashtag && customHashtags.length > 0) {
                        console.debug(`\t > Checking for "${customHashtags[0]}" in ${session.notes}`);
                        // Use first custom hashtag if available
                        timeData[date][`${customHashtags[0].toLowerCase()}`] += durationHours;

                        foundHashtag = true;
                    }
                }

                // Fall back to regular tags if no special tags or hashtags
                if (!foundHashtag && session.tags && Array.isArray(session.tags) && session.tags.length > 0) {
                    console.debug(`\t > Counting time for ${session.tags}`);
                    // Count time for all selected tags (or all tags if none selected)
                    session.tags.forEach(tag => {
                        console.debug(`\t > Checking for ${tag} in ${session.tags}`);
                        if (selectedTags.includes(tag)) {
                            if("work" === tag) {
                                timeData[date]["#custom"] += durationHours;
                            } else {
                                timeData[date][tag] += durationHours;
                            }
                        }
                    });
                }
            });
            console.debug(`<<< <<<< end of ${date}`);

            //count tags and equally spread Rest_time_min accross them
            //{
                Object.keys(timeData[date]).forEach(tag => { 
                    if(!timeData[date] || !(timeData[date][tag] > 0)) { return; }
                    console.debug(`\t > timedata ${tag}: ${timeData[date][tag]}h`);
                    restTime[tag] = 1;
                    console.debug(`\t > resttimedata ${tag}: ${restTime[tag]} marked<<<<`);
                });

                let rest_spread = REST_TIME_MIN/Object.keys(restTime).length/60;
                Object.keys(restTime).forEach(tag => {
                    console.debug(`\t >>>> readmarked resttimedata ${tag} ${rest_spread}h}`);
                    
                    timeData[date][tag] += rest_spread;
                    console.debug(`\t > Adding rest time ${rest_spread}h to ${tag} ${timeData[date][tag]}h}`);
                    
                });
            //}
        });

        //remove empty time tags and round incomplete
        Object.keys(timeData).forEach(date => {
            Object.keys(timeData[date]).forEach(tag => {             
                if(timeData[date][tag] === 0 || isNaN(timeData[date][tag])) {
                    delete timeData[date][tag];
                } else {
                    console.debug(`\t > Rounding ${timeData[date][tag]}h for ${tag}`);
                    timeData[date][tag] = roundToHalf(timeData[date][tag]);
                }
            });
        });

        // Calculate statistics
        let totalHours = 0;
        const tagTotals = {};
        uniqueTags.forEach(tag => {
            tagTotals[tag] = 0;
        });

        Object.keys(timeData).forEach(date => {
            let dayTotal = 0;
            console.debug(`>>> Calculating totals for ${date}`);
            uniqueTags.forEach(tag => {
                if(timeData[date][tag] !== undefined) {
                    console.debug(`\t > Adding ${timeData[date][tag]}h to ${tag}`);
                    tagTotals[tag] += timeData[date][tag];
                    dayTotal += timeData[date][tag];
                }
            });
            totalHours += dayTotal;
        });

        const avgDailyHours = totalHours / Object.keys(timeData).length;
        
        // Find top tag
        let topTag = '-';
        let maxHours = 0;
        uniqueTags.forEach(tag => {
            if (tagTotals[tag] > maxHours) {
                maxHours = tagTotals[tag];
                topTag = tag;
            }
        });

        // Update stats
        totalTimeEl.textContent = `${totalHours.toFixed(1)} hours`;
        topTagEl.textContent = `${topTag} (${maxHours.toFixed(1)}h)`;
        avgDailyEl.textContent = `${avgDailyHours.toFixed(1)} hours`;

        generateTableHeader(timeTable, allSupportTags, uniqueTags);

        generateTableBody(timeTable.querySelector('tbody'), timeData, sessionsByDate, uniqueTags, specialTags, tagFilter);

        generateTagLegend(tagLegend, uniqueTags);

        // Show the containers
        tableContainer.classList.remove('hidden');
        statsContainer.classList.remove('hidden');
        legendContainer.classList.remove('hidden');
    }
});