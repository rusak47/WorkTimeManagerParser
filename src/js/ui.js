
/**
 * Generates the table header for the time tracking table.
 * @param {HTMLElement} timeTable - The table element where the header will be added.
 * @param {Set} allSupportTags - A set of tags that are considered support tags.
 * @param {Array} uniqueTags - An array of unique tags to be displayed in the header.
 */
export function generateTableHeader(timeTable, allSupportTags, uniqueTags) {
    const thead = timeTable.querySelector('thead tr');
    thead.innerHTML = `
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Notes</th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Total</th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Date</th>
    `;

    uniqueTags.forEach((tag) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        th.textContent = allSupportTags.has(tag) ? `${tag} support` : tag;
        thead.appendChild(th);
    });
}

/**
 * Generates the tag legend.
 * @param {HTMLElement} tagLegend - The container element for the tag legend.
 * @param {Array} uniqueTags - An array of unique tags to display in the legend.
 */
export function generateTagLegend(tagLegend, uniqueTags) {
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
}

/**
 * Generates the table body for the time tracking table.
 * @param {HTMLElement} tbody - The table body element where rows will be added.
 * @param {Object} timeData - The time data grouped by date and tag.
 * @param {Object} sessionsByDate - The sessions grouped by date.
 * @param {Array} uniqueTags - An array of unique tags to display in the table.
 * @param {Array} sortedDates - An array of sorted dates.
 * @param {Set} specialTags - A set of special tags.
 * @param {Object} tagFilter - The tag filter object.
 */
export function generateTableBody(tbody, timeData, sessionsByDate, uniqueTags, specialTags, tagFilter) {
    tbody.innerHTML = '';
    const sortedDates = Object.keys(timeData).sort((a, b) => new Date(a) - new Date(b));

        
    sortedDates.forEach(date => {
        const tr = document.createElement('tr');
        const isWeekend = sessionsByDate[date].some(session => session.dayType === 'Weekend');
        tr.className = isWeekend ? 'weekend-row hover:bg-amber-100' : 'hover:bg-gray-50';

        addNotesCell(tr, date, sessionsByDate, specialTags, tagFilter);

        // Calculate day total
        let dayTotal = 0;
        uniqueTags.forEach(tag => {
            dayTotal += timeData[date][tag] || 0;
        });

        // Total cell
        const totalTd = document.createElement('td');
        totalTd.className = 'px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 sticky left-0 bg-white';
        totalTd.textContent = `${dayTotal.toFixed(1)}h`;
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
                        ${hoursFormatted}h
                    </div>
                `;
                if("work" === tag) {
                    console.error(`tag work should be empty (swapped by #custom), but was instead: ${hoursFormatted}h`);
                }
            } else 
                if("work" !== tag) {
                    td.textContent = '-';
                }
            

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
    //-------------
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
    grandTotalTd.textContent = `${grandTotal.toFixed(1)}h`;
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
                    ${totalHours.toFixed(1)}h
                </div>
            `;
        } else 
            if("work" !== tag) {
                td.textContent = '-';
            }
        
        
        totalsRow.appendChild(td);
    });


    tbody.appendChild(totalsRow);
}

// Sync special tags with filter tags
export function syncSpecialTags(tagFilter) {
        console.debug("syncing special tags");
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

/**
 * Adds a notes cell to the given table row.
 * @param {HTMLElement} tr - The table row element.
 * @param {string} date - The date for the row.
 * @param {Object} sessionsByDate - The sessions grouped by date.
 * @param {Set} specialTags - A set of special tags.
 * @param {Object} tagFilter - The tag filter object.
 */
export function addNotesCell(tr, date, sessionsByDate, specialTags, tagFilter) {
    const notesTd = document.createElement('td');
    notesTd.className = 'px-6 py-4 text-sm text-gray-500 sticky left-0 bg-white max-w-xs break-words whitespace-normal';

    // Collect notes that match selected tags (or all if no tags selected)
    const dayNotes = [];
    sessionsByDate[date].forEach(session => {
        if (session.notes) {
            const shouldInclude = tagFilter.items.length === 0 || 
                (session.tags && session.tags.some(tag => tagFilter.items.includes(tag))) ||
                (specialTags.some(specialTag => 
                    session.notes.includes(specialTag) && 
                    tagFilter.items.includes(`${specialTag} support`)
                ));

            if (shouldInclude) {
                let noteText = session.notes.trim(); //session.notes.replace(/#\d+/g, '').trim();
                if (session.tags && session.tags.length > 1) {
                    noteText += ` (tags: ${session.tags.join(', ')})`;
                }
                if (noteText) {
                    dayNotes.push(noteText);
                }
            }
        }
    });

    notesTd.textContent = dayNotes.join(', ');
    tr.appendChild(notesTd);
}
