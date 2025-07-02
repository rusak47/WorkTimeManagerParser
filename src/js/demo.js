

export function sampleData(){
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
                    "notes": "uMint Project meeting",
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
                    "notes": "#1234 Coding session",
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
                    "notes": "#1234 Morning work session",
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
                    "notes": "#PLR Documentation",
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

        //processData(sampleData);
        fileName.textContent = "Using sample data";
    
}