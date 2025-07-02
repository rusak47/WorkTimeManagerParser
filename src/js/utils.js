
    // Utility function to round to nearest 0.5, with special handling:
    // - > 0 rounds up to 0.5
    // - 0.5 stays as is
    // - everything else rounds clasically
export function roundToHalf(num) {
        const decimal_part = num % 1;
        if (decimal_part === num && decimal_part > 0.57) { return num; }

        console.debug(`handling: ${num}`);
        console.debug(`decimal part: ${decimal_part}`);
        console.debug(`floor; ${Math.floor(num)}`);
        console.debug(`round: ${Math.round(decimal_part,2)}`);

        let adjustment;
        if (decimal_part > 0 && decimal_part < 0.57) {
            adjustment = 0.5;
        } else {
            adjustment = Math.round(decimal_part, 1);
        }
        return Math.floor(num) + adjustment;
    }