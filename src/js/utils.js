
/**
 * Calculate the difference between two dates/timestamps
 * @param {string|Date} startTime - Start time (ISO string or Date object)
 * @param {string|Date} endTime - End time (ISO string or Date object)
 * @returns {Object} Object containing difference in various units
 */
export function datediff(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Calculate difference in milliseconds
    const diffMs = end - start;

    // Convert to various units
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = diffSec / 3600;
    const diffDays = diffHours / 24;

    // Calculate hours, minutes, seconds breakdown
    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    return {
        milliseconds: diffMs,
        seconds: diffSec,
        minutes: diffMin,
        hours: diffHours,
        days: diffDays,
        breakdown: {
            hours,
            minutes,
            seconds
        },
        formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    };
}

/**
 * Transform duration string (HH:MM:SS) to seconds
 * @param {string} duration - Duration string in format "HH:MM:SS" or "MM:SS"
 * @returns {number} Duration in seconds
 */
export function durationToSeconds(duration) {
    if (!duration || typeof duration !== 'string') {
        return 0;
    }

    const parts = duration.split(':').map(part => parseInt(part, 10));

    if (parts.length === 3) {
        // HH:MM:SS format
        const [hours, minutes, seconds] = parts;
        return (hours * 3600) + (minutes * 60) + seconds;
    } else if (parts.length === 2) {
        // MM:SS format
        const [minutes, seconds] = parts;
        return (minutes * 60) + seconds;
    } else {
        console.warn(`Invalid duration format: ${duration}`);
        return 0;
    }
}

    // Utility function to round to nearest 0.5, with special handling:
    // - > 0 rounds up to 0.5
    // - 0.5 stays as is
    // - everything else rounds clasically
export function roundToHalf(num) {
        const decimal_part = num % 1;
        if (decimal_part === num && decimal_part > 0.57) { return num; }

        //console.debug(`(roundToHalf) handling: ${num}`);
        //console.debug(`\tdecimal part: ${decimal_part}`);
        //console.debug(`\tfloor; ${Math.floor(num)}`);
        //console.debug(`\tround: ${Math.round(decimal_part,2)}`);

        let adjustment;
        if (decimal_part > 0 && decimal_part < 0.57) {
            adjustment = 0.5;
        } else {
            adjustment = Math.round(decimal_part, 1);
        }
        return Math.floor(num) + adjustment;
    }

export function copyAndEmailTimeTable() {
    const timeTable = document.getElementById('timeTable');
    if (!timeTable) {
        alert('Time table not found.');
        return;
    }

    // Step 1: Copy the table to the clipboard
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(timeTable.cloneNode(true));
    document.body.appendChild(tempDiv);

    const range = document.createRange();
    range.selectNode(tempDiv);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    try {
        document.execCommand('copy');
        alert('Time table copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy time table:', err);
        alert('Failed to copy time table.');
    }

    window.getSelection().removeAllRanges();
    document.body.removeChild(tempDiv);

    // Step 2: Email the table
    const tableHTML = timeTable.outerHTML;
    const emailBody = encodeURIComponent(tableHTML);
    const mailtoLink = `mailto:?subject=Time Table&body=${emailBody}`;
    window.location.href = mailtoLink;
}


export async function copyAndEmailTimeTable2() {
    const timeTable = document.getElementById('timeTable');
    if (!timeTable) {
        alert('Time table not found.');
        return;
    }

    // Step 1: Fetch external styles (e.g., style.css)
    let externalStyles = '';
    try {
        const response = await fetch('style.css'); // Adjust the path if necessary
        if (response.ok) {
            externalStyles = await response.text();
        } else {
            console.warn('Failed to fetch external styles:', response.statusText);
        }
    } catch (err) {
        console.error('Error fetching external styles:', err);
    }

    // Step 2: Get the table's HTML with styles
    const tableHTML = `
        <html>
            <head>
                <style>
                    ${externalStyles}
                    ${Array.from(document.styleSheets)
                        .map(styleSheet => {
                            try {
                                return Array.from(styleSheet.cssRules)
                                    .map(rule => rule.cssText)
                                    .join('\n');
                            } catch (e) {
                                console.warn('Could not access stylesheet:', styleSheet.href);
                                return '';
                            }
                        })
                        .join('\n')}
                </style>
            </head>
            <body>
                ${timeTable.outerHTML}
            </body>
        </html>
    `;

    // Step 3: Copy the table with styles to the clipboard
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tableHTML;
    document.body.appendChild(tempDiv);

    const range = document.createRange();
    range.selectNode(tempDiv);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    try {
        document.execCommand('copy');
        alert('Time table copied to clipboard with styles!');
    } catch (err) {
        console.error('Failed to copy time table:', err);
        alert('Failed to copy time table.');
    }

    window.getSelection().removeAllRanges();
    document.body.removeChild(tempDiv);

    // Step 4: Email the table
    const emailBody = encodeURIComponent(tableHTML);
    const mailtoLink = `mailto:?subject=Time Table&body=${emailBody}`;
    window.location.href = mailtoLink;
}

