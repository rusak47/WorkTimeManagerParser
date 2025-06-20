
document.addEventListener('DOMContentLoaded', function() {
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
            syncSpecialTags();
        },
        onItemRemove: function(value) {
            syncSpecialTags();
        }
    });

    // Sync special tags with filter tags
    function syncSpecialTags() {
        const specialTagsInput = document.getElementById('specialTags');
        const specialTags = specialTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const currentFilterTags = tagFilter.items;
        
        // Get all special tags that end with " support"
        const specialSupportTags = currentFilterTags.filter(tag => tag.endsWith(' support'));
        
        // Extract base special tags (without " support")
        const baseSpecialTags = specialSupportTags.map(tag => tag.replace(' support', ''));
        
        // Add base tags to filter if their support tags are present
        baseSpecialTags.forEach(baseTag => {
            if (!currentFilterTags.includes(baseTag)) {
                tagFilter.addItem(baseTag);
            }
        });
        
        // Update special tags input
        specialTagsInput.value = baseSpecialTags.join(', ');
    }

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
    useSampleBtn.addEventListener('click', function() {
        const sampleData = {
            "sessions": [
                {
                    "id": 1750080769209,
                    "date": "2025-06-16",
                    "startTime": "2025-06-16T12:15:00.000Z",
                    "endTime": "2025-06-16T13:32:00.000Z",
                    "duration": "01:17:00",
                    "durationSec": 4620,
                    "accumulatedPauseTimeSec": 1920,
                    "notes": "Project meeting",
                    "dayType": "Workday",
                    "tags": ["work", "meeting"],
                    "mood": 5,
                    "isBreak": false
                },
                {
                    "id": 1750080766941,
                    "date": "2025-06-16",
                    "startTime": "2025-06-16T13:00:00.000Z",
                    "endTime": "2025-06-16T13:32:00.000Z",
                    "duration": "00:32:00",
                    "durationSec": 1920,
                    "notes": "Break session",
                    "dayType": "Workday",
                    "tags": ["rest", "home tasks"],
                    "mood": 5,
                    "isBreak": true
                },
                {
                    "id": 1750080766942,
                    "date": "2025-06-16",
                    "startTime": "2025-06-16T14:00:00.000Z",
                    "endTime": "2025-06-16T16:45:00.000Z",
                    "duration": "02:45:00",
                    "durationSec": 9900,
                    "notes": "Coding session",
                    "dayType": "Workday",
                    "tags": ["work", "coding"],
                    "mood": 4,
                    "isBreak": false
                },
                {
                    "id": 1750080766943,
                    "date": "2025-06-17",
                    "startTime": "2025-06-17T09:30:00.000Z",
                    "endTime": "2025-06-17T12:15:00.000Z",
                    "duration": "02:45:00",
                    "durationSec": 9900,
                    "notes": "Morning work session",
                    "dayType": "Workday",
                    "tags": ["work"],
                    "mood": 3,
                    "isBreak": false
                },
                {
                    "id": 1750080766944,
                    "date": "2025-06-17",
                    "startTime": "2025-06-17T13:30:00.000Z",
                    "endTime": "2025-06-17T15:00:00.000Z",
                    "duration": "01:30:00",
                    "durationSec": 5400,
                    "notes": "Documentation",
                    "dayType": "Workday",
                    "tags": ["work", "documentation"],
                    "mood": 4,
                    "isBreak": false
                },
                {
                    "id": 1750080766945,
                    "date": "2025-06-18",
                    "startTime": "2025-06-18T10:00:00.000Z",
                    "endTime": "2025-06-18T12:00:00.000Z",
                    "duration": "02:00:00",
                    "durationSec": 7200,
                    "notes": "Gym session",
                    "dayType": "Weekend",
                    "tags": ["fitness"],
                    "mood": 5,
                    "isBreak": false
                },
                {
                    "id": 1750080766946,
                    "date": "2025-06-18",
                    "startTime": "2025-06-18T14:00:00.000Z",
                    "endTime": "2025-06-18T16:30:00.000Z",
                    "duration": "02:30:00",
                    "durationSec": 9000,
                    "notes": "Reading",
                    "dayType": "Weekend",
                    "tags": ["learning"],
                    "mood": 4,
                    "isBreak": false
                }
            ]
        };

        processData(sampleData);
        fileName.textContent = "Using sample data";
    });

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

    // Utility function to round to nearest 0.5, with special handling:
    // - >= 0.3 rounds up to 0.5
    // - < 0.3 rounds down to 0.0
    function roundToHalf(num) {
        const decimal = num - Math.floor(num);
        if (decimal >= 0.3 && decimal < 0.8) {
            return Math.floor(num) + 0.5;
        } else if (decimal >= 0.8) {
            return Math.ceil(num);
        } else if (decimal >= 0 && decimal < 0.3) {
            return Math.floor(num);
        }
        return num; // should never reach here for valid numbers
    }

    // Process the data and generate the table
    function processData(data) {
        if (!data || !data.sessions || !Array.isArray(data.sessions)) {
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
        
        // Extract all unique tags from both tags array and notes
        const allTags = new Set();
        filteredSessions.forEach(session => {
            // Add regular tags
            if (session.tags && Array.isArray(session.tags)) {
                session.tags.forEach(tag => allTags.add(tag));
            }
            
            // Extract special tags from notes
            if (session.notes) {
                // Check for special tags
                specialTags.forEach(specialTag => {
                    if (session.notes.includes(specialTag)) {
                        allTags.add(`${specialTag} support`);
                    }
                });
                
                // Also keep hashtags for backward compatibility
                const hashtags = session.notes.match(/#\d+/g) || [];
                hashtags.forEach(tag => allTags.add(tag));
            }
        });

        // Update tag filter options
        tagFilter.clearOptions();
        const allTagsArray = Array.from(allTags);
        tagFilter.addOptions(allTagsArray.map(tag => ({value: tag, text: tag})));
        
        // Add special tags to filter if they exist in the data
        if (specialTags.length > 0) {
            specialTags.forEach(specialTag => {
                const supportTag = `${specialTag} support`;
                if (allTagsArray.includes(supportTag) && !tagFilter.items.includes(supportTag)) {
                    tagFilter.addItem(supportTag);
                }
            });
        }

        // Get selected tags or use all if none selected
        const selectedTags = tagFilter.items.length > 0 
            ? tagFilter.items 
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
            uniqueTags.forEach(tag => {
                timeData[date][tag] = 0;
            });

            sessionsByDate[date].forEach(session => {
                const durationHours = session.durationSec / 3600;
                
                // First check for special tags in notes (only if special tags are provided)
                let foundSpecialTag = null;
                if (specialTags.length > 0 && session.notes) {
                    for (const specialTag of specialTags) {
                        if (session.notes.includes(specialTag)) {
                            foundSpecialTag = `${specialTag} support`;
                            break;
                        }
                    }
                }
                
                if (foundSpecialTag) {
                    // Allocate time only to special tag
                    timeData[date][foundSpecialTag] += durationHours;
                }
                // Then try to use hashtags from notes
                else if (session.notes && !foundSpecialTag) {
                    const hashtags = session.notes.match(/#\d+/g) || [];
                    if (hashtags.length > 0) {
                        // Use first hashtag if available
                        timeData[date][hashtags[0]] += durationHours;
                    }
                }
                // Fall back to regular tags if no special tags or hashtags
                else if (session.tags && Array.isArray(session.tags) && session.tags.length > 0) {
                    // Count time for all selected tags (or all tags if none selected)
                    session.tags.forEach(tag => {
                        if (selectedTags.includes(tag)) {
                            timeData[date][tag] += durationHours;
                        }
                    });
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
            uniqueTags.forEach(tag => {
                tagTotals[tag] += timeData[date][tag];
                dayTotal += timeData[date][tag];
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

        // Generate table header
        const thead = timeTable.querySelector('thead tr');
        thead.innerHTML = `
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Notes</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Total</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Date</th>
        `;

        uniqueTags.forEach((tag, index) => {
            const th = document.createElement('th');
            th.scope = 'col';
            th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
            th.textContent = tag;
            thead.appendChild(th);
        });


        // Generate table body
        const tbody = timeTable.querySelector('tbody');
        tbody.innerHTML = '';

        const sortedDates = Object.keys(timeData).sort((a, b) => new Date(a) - new Date(b));

        sortedDates.forEach(date => {
            const tr = document.createElement('tr');
            const isWeekend = sessionsByDate[date].some(session => session.dayType === 'Weekend');
            tr.className = isWeekend ? 'weekend-row hover:bg-amber-100' : 'hover:bg-gray-50';

            // Notes cell
            const notesTd = document.createElement('td');
            notesTd.className = 'px-6 py-4 text-sm text-gray-500 sticky left-0 bg-white max-w-xs break-words whitespace-normal';
            
            // Collect notes that match selected tags (or all if no tags selected)
            const dayNotes = [];
            sessionsByDate[date].forEach(session => {
                if (session.notes) {
                    // If tags are selected, check if session has any matching tags or special tags
                    const shouldInclude = tagFilter.items.length === 0 || 
                        (session.tags && session.tags.some(tag => tagFilter.items.includes(tag))) ||
                        (specialTags.some(specialTag => 
                            session.notes.includes(specialTag) && 
                            tagFilter.items.includes(`${specialTag} support`)
                        ));
                    
                    if (shouldInclude) {
                        let noteText = session.notes.replace(/#\d+/g, '').trim();
                        if (session.tags && session.tags.length > 1) {
                            noteText += ` (tags: ${session.tags.join(', ')})`;
                        }
                        if (noteText) {  // Only add if there's text left after removing hashtags
                            dayNotes.push(noteText);
                        }
                    }
                }
            });
            
            notesTd.textContent = dayNotes.join(', ');
            tr.appendChild(notesTd);

            // Calculate day total first
            let dayTotal = 0;
            uniqueTags.forEach(tag => {
                dayTotal += timeData[date][tag] || 0;
            });

            // Total cell
            const totalTd = document.createElement('td');
            totalTd.className = 'px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 sticky left-0 bg-white';
            const roundedDayTotal = roundToHalf(dayTotal).toFixed(1);
            totalTd.textContent = roundToHalvesCheckbox.checked 
                ? `${roundedDayTotal}h (${dayTotal.toFixed(1)})` 
                : `${dayTotal.toFixed(1)}h`;
            tr.appendChild(totalTd);

            // Date cell
            const dateTd = document.createElement('td');
            dateTd.className = 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white';
            
            const dateObj = new Date(date);
            dateTd.textContent = dateObj.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            
            tr.appendChild(dateTd);

            // Tag cells
            uniqueTags.forEach((tag, index) => {
                const hours = timeData[date][tag] || 0;
                const td = document.createElement('td');
                td.className = `px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${hours > 0 ? 'font-semibold' : ''}`;
                
                if (hours > 0) {
                    const hoursFormatted = hours.toFixed(1);
                    const colorClass = `tag-color-${index % 8}`;
                    
                    td.innerHTML = `
                        <div class="flex items-center">
                            <div class="w-3 h-3 rounded-full ${colorClass} mr-2"></div>
                            ${roundToHalvesCheckbox.checked ? `${roundToHalf(hours).toFixed(1)}h (${hoursFormatted})` : `${hoursFormatted}h`}
                        </div>
                    `;
                } else {
                    td.textContent = '-';
                }
                
                tr.appendChild(td);
            });


            tbody.appendChild(tr);
        });

        // Add totals row
        const totalsRow = document.createElement('tr');
        totalsRow.className = 'bg-gray-50 font-semibold';

        // Totals label cell
        const notesTotalTd = document.createElement('td');
        notesTotalTd.className = 'px-6 py-4 text-sm text-gray-900 sticky left-0 bg-gray-50';
        notesTotalTd.textContent = 'Totals';
        totalsRow.appendChild(notesTotalTd);

        // Grand total cell (sum of all daily totals)
        let grandTotal = 0;
        sortedDates.forEach(date => {
            let dayTotal = 0;
            uniqueTags.forEach(tag => {
                dayTotal += timeData[date][tag] || 0;
            });
            grandTotal += dayTotal;
        });

        const grandTotalTd = document.createElement('td');
        grandTotalTd.className = 'px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50';
        const roundedGrandTotal = roundToHalf(grandTotal).toFixed(1);
        grandTotalTd.textContent = roundToHalvesCheckbox.checked 
            ? `${roundedGrandTotal}h (${grandTotal.toFixed(1)})` 
            : `${grandTotal.toFixed(1)}h`;
        totalsRow.appendChild(grandTotalTd);

        // Empty cell for Date (spacer)
        const dateTotalTd = document.createElement('td');
        dateTotalTd.className = 'px-6 py-4 sticky left-0 bg-gray-50';
        totalsRow.appendChild(dateTotalTd);

        // Calculate and add tag totals
        const tagTotalsDisplay = {};
        uniqueTags.forEach(tag => {
            tagTotalsDisplay[tag] = 0;
        });

        sortedDates.forEach(date => {
            uniqueTags.forEach(tag => {
                tagTotalsDisplay[tag] += timeData[date][tag] || 0;
            });
        });

        uniqueTags.forEach((tag, index) => {
            const totalHours = tagTotalsDisplay[tag];
            const td = document.createElement('td');
            td.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            
            if (totalHours > 0) {
                const colorClass = `tag-color-${index % 8}`;
                td.innerHTML = `
                    <div class="flex items-center">
                        <div class="w-3 h-3 rounded-full ${colorClass} mr-2"></div>
                        ${roundToHalvesCheckbox.checked ? `${roundToHalf(totalHours).toFixed(1)}h (${totalHours.toFixed(1)})` : `${totalHours.toFixed(1)}h`}
                    </div>
                `;
            } else {
                td.textContent = '-';
            }
            
            totalsRow.appendChild(td);
        });


        tbody.appendChild(totalsRow);

        // Generate tag legend
        tagLegend.innerHTML = '';
        uniqueTags.forEach((tag, index) => {
            const colorClass = `tag-color-${index % 8}`;
            
            const tagEl = document.createElement('div');
            tagEl.className = `flex items-center px-3 py-1 rounded-full text-sm ${colorClass}`;
            tagEl.innerHTML = `
                <div class="w-3 h-3 rounded-full ${colorClass} mr-2 border border-gray-300"></div>
                ${tag}
            `;
            
            tagLegend.appendChild(tagEl);
        });

        // Show the containers
        tableContainer.classList.remove('hidden');
        statsContainer.classList.remove('hidden');
        legendContainer.classList.remove('hidden');
    }
});