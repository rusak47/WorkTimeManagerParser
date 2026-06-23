
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

    // Truncate to 2 decimal places; if the remainder is negligible (.00xxx),
    // use the truncated decimal for the rounding decision
    const truncated = Math.floor(num * 100) / 100;
    const checkDecimal = num - truncated < 0.01 ? truncated % 1 : decimal_part;

    let adjustment;
    if (checkDecimal > 0 && checkDecimal < 0.57) {
        adjustment = 0.5;
    } else {
        adjustment = Math.round(checkDecimal);
    }
    return Math.floor(num) + adjustment;
}



export async function copyAndEmailTimeTable2() {
    const timeTable = document.getElementById('timeTable');
    if (!timeTable) {
        alert('Time table not found.');
        return;
    }

    // Collect all style rules from the page (includes Tailwind CDN generated styles)
    const styleText = Array.from(document.styleSheets)
        .map(sheet => {
            try {
                return Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
            } catch {
                return '';
            }
        })
        .filter(Boolean)
        .join('\n');

    // Clone table and inline computed styles on every element so pasting preserves them
    const clone = timeTable.cloneNode(true);
    const elements = clone.querySelectorAll('*');
    for (const el of elements) {
        const computed = getComputedStyle(el);
        for (let i = 0; i < computed.length; i++) {
            const prop = computed[i];
            el.style[prop] = computed.getPropertyValue(prop);
        }
    }

    const html = `<!DOCTYPE html><html><head><style>${styleText}</style></head><body>${clone.outerHTML}</body></html>`;

    try {
        await navigator.clipboard.write([
            new ClipboardItem({
                'text/html': new Blob([html], { type: 'text/html' }),
                'text/plain': new Blob([timeTable.innerText], { type: 'text/plain' }),
            }),
        ]);
        alert('Time table copied to clipboard with styles!');
    } catch (err) {
        console.error('Failed to copy with Clipboard API:', err);
        alert('Failed to copy time table.');
    }
}

