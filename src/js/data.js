export const DEFAULT_EXCLUDED_TAGS = [
    '#docs', '#custom', '#translations', '#codereview', '#work', '#support', '#maintenance', '#bug', '#auth', '#review',
    '#rest', '#security', '#interactivity', '#vop', '#gw', '#payment', '#api', '#centrolinkvop', '#centrolink', '#soap',
    '#n8n', '#meet', '#spotbugs', '#lttax'
];

export const sampleData = {
    "sessions": [

        {
            "id": 1775546932683,
            "date": "2026-04-06",
            "startTime": "2026-04-06T19:12:00.000Z",
            "endTime": "2026-04-06T20:12:00.000Z",
            "duration": "01:00:00",
            "durationSec": 3600,
            "accumulatedPauseTimeSec": 9882,
            "notes": "#n8n #bonfire create personal",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": false
        },

        {
            "id": 1770893706532,
            "date": "2026-02-12",
            "startTime": "2026-02-12T09:20:00.000Z",
            "endTime": "2026-02-12T10:54:00.000Z",
            "duration": "01:34:00",
            "durationSec": 5640,
            "accumulatedPauseTimeSec": 0,
            "notes": "#meet",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1770888349742,
            "date": "2026-02-11",
            "startTime": "2026-02-11T17:19:10.450Z",
            "endTime": "2026-02-12T09:25:42.526Z",
            "duration": "14:14:44",
            "durationSec": 51284,
            "accumulatedPauseTimeSec": 6708,
            "notes": "#n8n experiments",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1770839483870,
            "date": "2026-02-11",
            "startTime": "2026-02-11T17:59:35.525Z",
            "endTime": "2026-02-11T19:51:23.870Z",
            "duration": "01:51:48",
            "durationSec": 6708,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1770829761016,
            "date": "2026-02-11",
            "startTime": "2026-02-11T10:00:00.000Z",
            "endTime": "2026-02-11T11:40:00.000Z",
            "duration": "01:40:00",
            "durationSec": 6000,
            "accumulatedPauseTimeSec": 0,
            "notes": "#n8n experiments",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1770829740970,
            "date": "2026-02-11",
            "startTime": "2026-02-11T06:53:24.140Z",
            "endTime": "2026-02-11T17:08:50.714Z",
            "duration": "01:52:47",
            "durationSec": 6767,
            "accumulatedPauseTimeSec": 30159,
            "notes": "#n8n experiments",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1770829730708,
            "date": "2026-02-11",
            "startTime": "2026-02-11T08:46:11.554Z",
            "endTime": "2026-02-11T17:08:50.708Z",
            "duration": "08:22:39",
            "durationSec": 30159,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },

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
            "isBreak": false,
            "is_correct_record": false
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
            "isBreak": false,
            "is_correct_record": true
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
            "isBreak": false,
            "is_correct_record": true
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
            "isBreak": false,
            "is_correct_record": true
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
            "isBreak": false,
            "is_correct_record": true
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
            "isBreak": false,
            "is_correct_record": true
        }
    ]
};
