import { processData } from './all.js';
import { sampleData } from './data.js';

export { sampleData };

export function useSampleData() {
    const fileName = document.getElementById('fileName');
    if (fileName) {
        fileName.textContent = "Using sample data";
    }
    processData(sampleData);
}
