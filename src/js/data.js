export const DEFAULT_EXCLUDED_TAGS = [
    '#docs', '#custom', '#translations', '#codereview', '#work', '#support', '#maintenance', '#bug', '#auth', '#review',
    '#rest', '#security', '#interactivity', '#vop', '#gw', '#payment', '#api', '#centrolinkvop', '#centrolink', '#soap',
    '#n8n', '#meet', '#spotbugs', '#lttax'
];
export const REST_TIME_MIN = 60;
export const REST_EXCLUDED_TAGS = ['#meet']; //keep this value const (rounding is ok); but dont split or add rest time 

export const sampleData = {
    "sessions": [


        {
            "id": 1783447807670,
            "notes": "in: Block D - parse kart xml; xades - verify; cardsta - implementation & tests & verification",
            "tags": [
                "work",
                "paylar",
                "n8n",
                "4203",
                "4198",
                "plais",
                "4202"
            ],
            "mood": 5,
            "date": "2026-07-07",
            "startTime": "2026-07-07T14:46:26.658Z",
            "endTime": "2026-07-07T18:10:07.669Z",
            "duration": "03:23:41",
            "durationSec": 12221,
            "dayType": "Workday",
            "workBlockId": "mram6267-szonf8i5y",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783435586658,
            "notes": "",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-07",
            "startTime": "2026-07-07T12:47:45.911Z",
            "endTime": "2026-07-07T14:46:26.658Z",
            "duration": "01:58:40",
            "durationSec": 7120,
            "dayType": "Workday",
            "workBlockId": "mram6267-szonf8i5y",
            "isBreak": true
        },
        {
            "id": 1783428465912,
            "notes": "in: Block D - parse kart xml; xades - verify; cardsta - implementation",
            "tags": [
                "work",
                "paylar",
                "n8n",
                "4203",
                "4198",
                "4202"
            ],
            "mood": 5,
            "date": "2026-07-07",
            "startTime": "2026-07-07T12:17:09.247Z",
            "endTime": "2026-07-07T12:47:45.911Z",
            "duration": "00:30:36",
            "durationSec": 1836,
            "dayType": "Workday",
            "workBlockId": "mram6267-szonf8i5y",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783424720648,
            "notes": "Unexpected error SIA293 r7148",
            "tags": [
                "work",
                "paylar",
                "support"
            ],
            "mood": 5,
            "date": "2026-07-07",
            "startTime": "2026-07-07T11:40:53.042Z",
            "endTime": "2026-07-07T11:45:20.648Z",
            "duration": "00:04:27",
            "durationSec": 267,
            "dayType": "Workday",
            "workBlockId": "mra4l21l-209sx4km9",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783424450798,
            "notes": "Unexpected error SIA293 r7148",
            "tags": [
                "work",
                "paylar",
                "support"
            ],
            "mood": 5,
            "date": "2026-07-07",
            "startTime": "2026-07-07T11:27:57.773Z",
            "endTime": "2026-07-07T11:40:50.790Z",
            "duration": "00:12:53",
            "durationSec": 773,
            "dayType": "Workday",
            "workBlockId": "mra4l21l-209sx4km9",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783423676548,
            "notes": "Unexpected error SIA293",
            "tags": [
                "work",
                "paylar",
                "support"
            ],
            "mood": 5,
            "date": "2026-07-07",
            "startTime": "2026-07-07T11:16:00.000Z",
            "endTime": "2026-07-07T11:27:00.000Z",
            "duration": "00:11:00",
            "durationSec": 660,
            "dayType": "Workday",
            "workBlockId": "mra4l21l-209sx4km9",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783422981683,
            "notes": "Break session",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-07",
            "startTime": "2026-07-07T11:01:00.803Z",
            "endTime": "2026-07-07T11:16:21.683Z",
            "duration": "00:15:20",
            "durationSec": 920,
            "dayType": "Workday",
            "workBlockId": "mra4l21l-209sx4km9",
            "isBreak": true
        },
        {
            "id": 1783422060829,
            "notes": "in: Block B (Decode EDoc); out: implementation",
            "tags": [
                "work",
                "paylar",
                "n8n",
                "4203",
                "4198",
                "plais",
                "4200"
            ],
            "mood": 5,
            "date": "2026-07-07",
            "startTime": "2026-07-07T09:40:00.000Z",
            "endTime": "2026-07-07T11:01:00.000Z",
            "duration": "01:21:00",
            "durationSec": 4860,
            "dayType": "Workday",
            "workBlockId": "mra4l21l-209sx4km9",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783417226058,
            "notes": "Break session",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-07",
            "startTime": "2026-07-07T08:06:47.530Z",
            "endTime": "2026-07-07T09:40:26.058Z",
            "duration": "01:33:38",
            "durationSec": 5618,
            "dayType": "Workday",
            "workBlockId": "mra4l21l-209sx4km9",
            "isBreak": true
        },
        {
            "id": 1783411607532,
            "notes": "verify WIP -in WIP cardsta analyze task",
            "tags": [
                "work",
                "paylar",
                "n8n",
                "4203",
                "4198",
                "plais",
                "4202"
            ],
            "mood": 5,
            "date": "2026-07-07",
            "startTime": "2026-07-07T05:59:56.215Z",
            "endTime": "2026-07-07T08:06:47.530Z",
            "duration": "02:06:51",
            "durationSec": 7611,
            "dayType": "Workday",
            "workBlockId": "mra4l21l-209sx4km9",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783403995424,
            "notes": "WIP -in WIP -out finalize & test",
            "tags": [
                "work",
                "paylar",
                "n8n",
                "4203",
                "4198",
                "plais",
                "4200"
            ],
            "mood": 5,
            "date": "2026-07-07",
            "startTime": "2026-07-07T04:04:55.833Z",
            "endTime": "2026-07-07T05:59:55.412Z",
            "duration": "01:54:59",
            "durationSec": 6899,
            "dayType": "Workday",
            "workBlockId": "mra4l21l-209sx4km9",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783370654702,
            "notes": "investigate Sanctuario and plais example - generate own signer -in -out Implement WWW Sender workflow ZGJujlbEZltgrGi4",
            "tags": [
                "work",
                "paylar",
                "n8n",
                "4203",
                "4198",
                "plais",
                "4200"
            ],
            "mood": 5,
            "date": "2026-07-06",
            "startTime": "2026-07-06T19:22:38.751Z",
            "endTime": "2026-07-06T20:44:14.701Z",
            "duration": "01:21:35",
            "durationSec": 4895,
            "dayType": "Workday",
            "workBlockId": "mr96wq7u-zq4l8j5ul",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783365757994,
            "notes": "investigate xades v1.1.1 fallback; -in -out kSZhM9fmZGqot45l get/create plais_messages; My8pCkLOwkmgvRsf - populate test messaes",
            "tags": [
                "work",
                "paylar",
                "n8n",
                "4203",
                "4198",
                "plais",
                "4200"
            ],
            "mood": 5,
            "date": "2026-07-06",
            "startTime": "2026-07-06T17:23:19.952Z",
            "endTime": "2026-07-06T19:22:37.953Z",
            "duration": "01:59:18",
            "durationSec": 7158,
            "dayType": "Workday",
            "workBlockId": "mr96wq7u-zq4l8j5ul",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783358599950,
            "notes": "Break session",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-06",
            "startTime": "2026-07-06T16:58:40.620Z",
            "endTime": "2026-07-06T17:23:19.950Z",
            "duration": "00:24:39",
            "durationSec": 1479,
            "dayType": "Workday",
            "workBlockId": "mr96wq7u-zq4l8j5ul",
            "isBreak": true
        },
        {
            "id": 1783357120622,
            "notes": "add xades v1.1.1 fallback; -in -out analyze tasks, propose plans",
            "tags": [
                "work",
                "paylar",
                "n8n",
                "4203",
                "4198",
                "plais",
                "4200"
            ],
            "mood": 5,
            "date": "2026-07-06",
            "startTime": "2026-07-06T16:32:10.432Z",
            "endTime": "2026-07-06T16:58:40.620Z",
            "duration": "00:26:30",
            "durationSec": 1590,
            "dayType": "Workday",
            "workBlockId": "mr96wq7u-zq4l8j5ul",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783355530432,
            "notes": "Break session",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-06",
            "startTime": "2026-07-06T15:53:57.977Z",
            "endTime": "2026-07-06T16:32:10.432Z",
            "duration": "00:38:12",
            "durationSec": 2292,
            "dayType": "Workday",
            "workBlockId": "mr96wq7u-zq4l8j5ul",
            "isBreak": true
        },
        {
            "id": 1783353237979,
            "notes": "add xades v1.1.1 fallback; -in -out analyze tasks, propose plans",
            "tags": [
                "work",
                "paylar",
                "n8n",
                "4203",
                "4198",
                "plais",
                "4200"
            ],
            "mood": 5,
            "date": "2026-07-06",
            "startTime": "2026-07-06T14:08:55.241Z",
            "endTime": "2026-07-06T15:53:57.977Z",
            "duration": "01:45:02",
            "durationSec": 6302,
            "dayType": "Workday",
            "workBlockId": "mr96wq7u-zq4l8j5ul",
            "isBreak": false,
            "bucket": "work"
        },
        {
            "id": 1783346933795,
            "notes": "",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-06",
            "startTime": "2026-07-06T13:00:01.513Z",
            "endTime": "2026-07-06T14:08:53.794Z",
            "duration": "01:08:52",
            "durationSec": 4132,
            "dayType": "Workday",
            "workBlockId": "mr96wq7u-zq4l8j5ul",
            "isBreak": false,
            "bucket": "rest"
        },
        {
            "id": 1783342798498,
            "notes": "",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-06",
            "startTime": "2026-07-06T12:22:13.434Z",
            "endTime": "2026-07-06T12:59:58.498Z",
            "duration": "00:37:45",
            "durationSec": 2265,
            "dayType": "Workday",
            "workBlockId": "mr96wq7u-zq4l8j5ul",
            "isBreak": false,
            "bucket": "rest"
        },
        {
            "id": 1783110479453,
            "notes": "test against provided example -> outdated version -> incompatible lib support",
            "tags": [
                "work",
                "4203",
                "paylar",
                "plais"
            ],
            "mood": 5,
            "date": "2026-07-03",
            "startTime": "2026-07-03T16:27:57.903Z",
            "endTime": "2026-07-03T20:26:36.129Z",
            "duration": "03:58:38",
            "durationSec": 14318,
            "accumulatedPauseTimeSec": 0,
            "dayType": "Workday"
        },
        {
            "id": 1783079801864,
            "notes": "plais dps config",
            "tags": [
                "work",
                "meet",
                "paylar"
            ],
            "mood": 5,
            "date": "2026-07-03",
            "startTime": "2026-07-03T10:42:21.674Z",
            "endTime": "2026-07-03T11:56:14.529Z",
            "duration": "01:13:52",
            "durationSec": 4432,
            "accumulatedPauseTimeSec": 0,
            "dayType": "Workday"
        },
        {
            "id": 1783075339448,
            "notes": "sign methods",
            "tags": [
                "work",
                "4203",
                "paylar",
                "plais",
                "n8n"
            ],
            "mood": 5,
            "date": "2026-07-02",
            "startTime": "2026-07-02T19:57:00.000Z",
            "endTime": "2026-07-03T10:41:00.000Z",
            "duration": "02:05:49",
            "durationSec": 7549,
            "accumulatedPauseTimeSec": 45491,
            "dayType": "Workday",
            "isBreak": false
        },
        {
            "id": 1783070879215,
            "notes": "Break session",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-03",
            "startTime": "2026-07-03T08:14:03.627Z",
            "endTime": "2026-07-03T09:27:59.215Z",
            "duration": "01:13:55",
            "durationSec": 4435,
            "dayType": "Workday",
            "isBreak": true
        },
        {
            "id": 1783066010219,
            "notes": "Break session",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-02",
            "startTime": "2026-07-02T20:42:34.035Z",
            "endTime": "2026-07-03T08:06:50.219Z",
            "duration": "11:24:16",
            "durationSec": 41056,
            "dayType": "Workday",
            "isBreak": true
        },
        {
            "id": 1783022254204,
            "notes": "deprecate gateway; add dedicated /helper service",
            "tags": [
                "work",
                "paylar",
                "4203",
                "review"
            ],
            "mood": 5,
            "date": "2026-07-01",
            "startTime": "2026-07-01T18:23:00.000Z",
            "endTime": "2026-07-02T19:55:00.000Z",
            "duration": "08:37:06",
            "durationSec": 31026,
            "accumulatedPauseTimeSec": 60894,
            "dayType": "Workday",
            "isBreak": false
        },
        {
            "id": 1783008066603,
            "notes": "Break session",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-02",
            "startTime": "2026-07-02T14:38:33.375Z",
            "endTime": "2026-07-02T16:01:06.604Z",
            "duration": "01:22:33",
            "durationSec": 4953,
            "dayType": "Workday",
            "isBreak": true
        },
        {
            "id": 1782992624779,
            "notes": "Break session",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-02",
            "startTime": "2026-07-02T10:08:50.569Z",
            "endTime": "2026-07-02T11:43:44.779Z",
            "duration": "01:34:54",
            "durationSec": 5694,
            "dayType": "Workday",
            "isBreak": true
        },
        {
            "id": 1782981334081,
            "notes": "Break session",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-02",
            "startTime": "2026-07-02T03:53:27.756Z",
            "endTime": "2026-07-02T08:35:34.081Z",
            "duration": "04:42:06",
            "durationSec": 16926,
            "dayType": "Workday",
            "isBreak": true
        },
        {
            "id": 1782963559112,
            "notes": "Break session",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "date": "2026-07-01",
            "startTime": "2026-07-01T18:23:58.367Z",
            "endTime": "2026-07-02T03:39:19.112Z",
            "duration": "09:15:20",
            "durationSec": 33320,
            "dayType": "Workday",
            "isBreak": true
        },
        {
            "id": 1782930223264,
            "notes": "force scheme validation",
            "tags": [
                "work",
                "4064",
                "paylar",
                "support"
            ],
            "mood": 5,
            "date": "2026-07-01",
            "startTime": "2026-07-01T17:17:35.514Z",
            "endTime": "2026-07-01T18:23:01.176Z",
            "duration": "01:05:25",
            "durationSec": 3925,
            "accumulatedPauseTimeSec": 0,
            "dayType": "Workday"
        },

        {
            "id": 1782504531201,
            "notes": "#opencode timer",
            "tags": [
                "study",
                "write"
            ],
            "mood": 5,
            "date": "2026-06-26",
            "startTime": "2026-06-26T19:48:00.000Z",
            "endTime": "2026-06-26T20:08:00.000Z",
            "duration": "00:20:00",
            "durationSec": 1200,
            "accumulatedPauseTimeSec": 0,
            "dayType": "Workday",
            "isBreak": false
        },
        {
            "id": 1782489378834,
            "notes": "#paylar #4203 #plais docs",
            "tags": [
                "work"
            ],
            "mood": 5,
            "date": "2026-06-26",
            "startTime": "2026-06-26T06:30:00.000Z",
            "endTime": "2026-06-26T09:30:00.000Z",
            "duration": "03:00:00",
            "durationSec": 10800,
            "dayType": "Workday",
            "isBreak": false
        },
        {
            "id": 1780778338837,
            "date": "2026-06-06",
            "startTime": "2026-06-06T08:13:47.589Z",
            "endTime": "2026-06-06T20:38:48.170Z",
            "duration": "07:24:40",
            "durationSec": 26680,
            "accumulatedPauseTimeSec": 18020,
            "notes": "#n8n file upload",
            "dayType": "Weekend",
            "tags": [
                "work"
            ],
            "mood": 5
        },
        {
            "id": 1780772995190,
            "date": "2026-06-06",
            "startTime": "2026-06-06T14:09:34.977Z",
            "endTime": "2026-06-06T19:09:55.190Z",
            "duration": "05:00:20",
            "durationSec": 18020,
            "notes": "Break session",
            "dayType": "Weekend",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1780725392621,
            "date": "2026-06-05",
            "startTime": "2026-06-05T13:00:25.823Z",
            "endTime": "2026-06-06T05:55:55.565Z",
            "duration": "03:29:41",
            "durationSec": 12581,
            "accumulatedPauseTimeSec": 48348,
            "notes": "#n8n #bonfire #review add ubos documents (undocked)",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5
        },
        {
            "id": 1780719125558,
            "date": "2026-06-05",
            "startTime": "2026-06-05T19:22:36.729Z",
            "endTime": "2026-06-06T04:12:05.552Z",
            "duration": "08:49:28",
            "durationSec": 31768,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1780682629225,
            "date": "2026-06-05",
            "startTime": "2026-06-05T13:27:29.099Z",
            "endTime": "2026-06-05T18:03:49.225Z",
            "duration": "04:36:20",
            "durationSec": 16580,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1780664424000,
            "date": "2026-06-04",
            "startTime": "2026-06-04T18:06:44.976Z",
            "endTime": "2026-06-05T13:00:02.988Z",
            "duration": "03:16:30",
            "durationSec": 11790,
            "accumulatedPauseTimeSec": 56208,
            "notes": "#n8n #bonfire #review add ubos documents (undocked)",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5
        },
        {
            "id": 1780664295715,
            "date": "2026-06-05",
            "startTime": "2026-06-05T09:58:40.252Z",
            "endTime": "2026-06-05T12:58:15.715Z",
            "duration": "02:59:35",
            "durationSec": 10775,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1780651163925,
            "date": "2026-06-05",
            "startTime": "2026-06-05T06:53:33.314Z",
            "endTime": "2026-06-05T09:19:23.925Z",
            "duration": "02:25:50",
            "durationSec": 8750,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1780633089575,
            "date": "2026-06-04",
            "startTime": "2026-06-04T18:06:45.888Z",
            "endTime": "2026-06-05T04:18:09.575Z",
            "duration": "10:11:23",
            "durationSec": 36683,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1780596401313,
            "date": "2026-06-04",
            "startTime": "2026-06-04T08:20:36.769Z",
            "endTime": "2026-06-04T18:05:52.248Z",
            "duration": "04:39:53",
            "durationSec": 16793,
            "accumulatedPauseTimeSec": 18322,
            "notes": "#n8n #bonfire #review add manager document linked as stakeholder (undocked)",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5
        },
        {
            "id": 1780590811656,
            "date": "2026-06-04",
            "startTime": "2026-06-04T14:51:26.416Z",
            "endTime": "2026-06-04T16:33:31.656Z",
            "duration": "01:42:05",
            "durationSec": 6125,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1780580443511,
            "date": "2026-06-04",
            "startTime": "2026-06-04T12:24:04.121Z",
            "endTime": "2026-06-04T13:40:43.511Z",
            "duration": "01:16:39",
            "durationSec": 4599,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1780573610045,
            "date": "2026-06-04",
            "startTime": "2026-06-04T09:40:12.044Z",
            "endTime": "2026-06-04T11:46:50.045Z",
            "duration": "02:06:38",
            "durationSec": 7598,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1780403380114,
            "date": "2026-06-02",
            "startTime": "2026-06-02T10:23:46.818Z",
            "endTime": "2026-06-02T12:29:25.929Z",
            "duration": "02:05:39",
            "durationSec": 7539,
            "accumulatedPauseTimeSec": 0,
            "notes": "#meet #bonfire",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5
        },
        {
            "id": 1780395825419,
            "date": "2026-06-02",
            "startTime": "2026-06-02T04:36:08.445Z",
            "endTime": "2026-06-02T10:23:30.830Z",
            "duration": "02:33:05",
            "durationSec": 9185,
            "accumulatedPauseTimeSec": 11657,
            "notes": "#n8n #review #bonfire",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5
        },
        {
            "id": 1780395276475,
            "date": "2026-06-02",
            "startTime": "2026-06-02T09:38:36.622Z",
            "endTime": "2026-06-02T10:14:36.475Z",
            "duration": "00:35:59",
            "durationSec": 2159,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1780390062433,
            "date": "2026-06-02",
            "startTime": "2026-06-02T08:27:13.982Z",
            "endTime": "2026-06-02T08:47:42.433Z",
            "duration": "00:20:28",
            "durationSec": 1228,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1780386216552,
            "date": "2026-06-02",
            "startTime": "2026-06-02T05:25:45.656Z",
            "endTime": "2026-06-02T07:43:36.552Z",
            "duration": "02:17:50",
            "durationSec": 8270,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1778183198451,
            "date": "2026-05-06",
            "startTime": "2026-05-06T19:26:03.836Z",
            "endTime": "2026-05-07T19:46:11.065Z",
            "duration": "04:05:01",
            "durationSec": 14701,
            "accumulatedPauseTimeSec": 72906,
            "notes": "#PLR #4182 lttax",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1778175262016,
            "date": "2026-05-07",
            "startTime": "2026-05-07T14:53:39.321Z",
            "endTime": "2026-05-07T17:34:22.016Z",
            "duration": "02:40:42",
            "durationSec": 9642,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1778160974610,
            "date": "2026-05-07",
            "startTime": "2026-05-07T08:54:26.097Z",
            "endTime": "2026-05-07T13:36:14.610Z",
            "duration": "04:41:48",
            "durationSec": 16908,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1778143709466,
            "date": "2026-05-06",
            "startTime": "2026-05-06T19:55:53.074Z",
            "endTime": "2026-05-07T08:48:29.466Z",
            "duration": "12:52:36",
            "durationSec": 46356,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1778090331558,
            "date": "2026-05-05",
            "startTime": "2026-05-05T19:01:10.823Z",
            "endTime": "2026-05-06T17:58:15.655Z",
            "duration": "03:33:58",
            "durationSec": 12838,
            "accumulatedPauseTimeSec": 69786,
            "notes": "#4182 lttax account data misconfig",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1778086848070,
            "date": "2026-05-06",
            "startTime": "2026-05-06T15:53:09.663Z",
            "endTime": "2026-05-06T17:00:48.060Z",
            "duration": "01:07:38",
            "durationSec": 4058,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1778080482528,
            "date": "2026-05-06",
            "startTime": "2026-05-06T09:54:40.504Z",
            "endTime": "2026-05-06T15:14:42.528Z",
            "duration": "05:20:02",
            "durationSec": 19202,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1778060528263,
            "date": "2026-05-06",
            "startTime": "2026-05-06T06:24:04.981Z",
            "endTime": "2026-05-06T09:42:08.263Z",
            "duration": "03:18:03",
            "durationSec": 11883,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1778045624278,
            "date": "2026-05-05",
            "startTime": "2026-05-05T19:56:20.512Z",
            "endTime": "2026-05-06T05:33:44.278Z",
            "duration": "09:37:23",
            "durationSec": 34643,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1777982373309,
            "date": "2026-05-05",
            "startTime": "2026-05-05T11:30:14.146Z",
            "endTime": "2026-05-05T11:59:27.962Z",
            "duration": "00:29:13",
            "durationSec": 1753,
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
            "id": 1777980612303,
            "date": "2026-05-05",
            "startTime": "2026-05-05T07:40:12.850Z",
            "endTime": "2026-05-05T11:28:35.211Z",
            "duration": "00:42:27",
            "durationSec": 2547,
            "accumulatedPauseTimeSec": 11155,
            "notes": "#4182 #plr lttax dates",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1777980515192,
            "date": "2026-05-05",
            "startTime": "2026-05-05T08:22:39.437Z",
            "endTime": "2026-05-05T11:28:35.188Z",
            "duration": "03:05:55",
            "durationSec": 11155,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },

        {
            "id": 1777753879976,
            "date": "2026-05-02",
            "startTime": "2026-05-02T09:52:53.712Z",
            "endTime": "2026-05-02T20:31:07.120Z",
            "duration": "05:30:30",
            "durationSec": 19830,
            "accumulatedPauseTimeSec": 18463,
            "notes": "#n8n #bonfire tests",
            "dayType": "Weekend",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1777751449914,
            "date": "2026-05-02",
            "startTime": "2026-05-02T15:33:47.884Z",
            "endTime": "2026-05-02T19:50:49.914Z",
            "duration": "04:17:02",
            "durationSec": 15422,
            "notes": "Break session",
            "dayType": "Weekend",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1777731213918,
            "date": "2026-05-02",
            "startTime": "2026-05-02T13:22:52.759Z",
            "endTime": "2026-05-02T14:13:33.878Z",
            "duration": "00:50:41",
            "durationSec": 3041,
            "notes": "Break session",
            "dayType": "Weekend",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },

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
            "id": 1772741779880,
            "date": "2026-03-03",
            "startTime": "2026-03-03T15:00:15.498Z",
            "endTime": "2026-03-05T20:15:35.128Z",
            "duration": "06:46:27",
            "durationSec": 24387,
            "accumulatedPauseTimeSec": 167332,
            "notes": "#BONFIRE phase1/2",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1772736017891,
            "date": "2026-03-05",
            "startTime": "2026-03-05T11:15:00.826Z",
            "endTime": "2026-03-05T18:40:17.891Z",
            "duration": "07:25:17",
            "durationSec": 26717,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1772706845920,
            "date": "2026-03-05",
            "startTime": "2026-03-05T08:21:06.628Z",
            "endTime": "2026-03-05T10:34:05.920Z",
            "duration": "02:12:59",
            "durationSec": 7979,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1772693489493,
            "date": "2026-03-04",
            "startTime": "2026-03-04T11:11:43.155Z",
            "endTime": "2026-03-05T06:51:29.493Z",
            "duration": "19:39:46",
            "durationSec": 70786,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1772621633678,
            "date": "2026-03-03",
            "startTime": "2026-03-03T17:43:03.226Z",
            "endTime": "2026-03-04T10:53:53.678Z",
            "duration": "17:10:50",
            "durationSec": 61850,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1772524320233,
            "date": "2026-03-03",
            "startTime": "2026-03-03T06:29:25.468Z",
            "endTime": "2026-03-03T07:51:54.182Z",
            "duration": "01:22:28",
            "durationSec": 4948,
            "accumulatedPauseTimeSec": 0,
            "notes": "#4174",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },

        {
            "id": 1772519253319,
            "date": "2026-02-27",
            "startTime": "2026-02-27T07:57:00.466Z",
            "endTime": "2026-03-03T06:27:23.225Z",
            "duration": "01:56:07",
            "durationSec": 6967,
            "accumulatedPauseTimeSec": 333255,
            "notes": "#ondato review",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1772519243214,
            "date": "2026-02-27",
            "startTime": "2026-02-27T13:16:01.932Z",
            "endTime": "2026-03-03T06:27:23.214Z",
            "duration": "89:11:21",
            "durationSec": 321081,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1772194526942,
            "date": "2026-02-27",
            "startTime": "2026-02-27T08:52:32.196Z",
            "endTime": "2026-02-27T12:15:26.937Z",
            "duration": "03:22:54",
            "durationSec": 12174,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1772179018027,
            "date": "2026-02-26",
            "startTime": "2026-02-26T20:43:38.515Z",
            "endTime": "2026-02-27T07:55:58.426Z",
            "duration": "00:55:32",
            "durationSec": 3332,
            "accumulatedPauseTimeSec": 37007,
            "notes": "#4170 review #OPTIKG ondato review",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1772176698396,
            "date": "2026-02-26",
            "startTime": "2026-02-26T21:01:31.326Z",
            "endTime": "2026-02-27T07:18:18.383Z",
            "duration": "10:16:47",
            "durationSec": 37007,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1772120951860,
            "date": "2026-02-26",
            "startTime": "2026-02-26T09:55:56.575Z",
            "endTime": "2026-02-26T15:48:58.548Z",
            "duration": "01:28:40",
            "durationSec": 5320,
            "accumulatedPauseTimeSec": 15861,
            "notes": "#4174 iban view",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5
        },
        {
            "id": 1772115900806,
            "date": "2026-02-26",
            "startTime": "2026-02-26T10:00:38.830Z",
            "endTime": "2026-02-26T14:25:00.806Z",
            "duration": "04:24:21",
            "durationSec": 15861,
            "notes": "Break session",
            "dayType": "Workday",
            "tags": [
                "rest"
            ],
            "mood": 5,
            "isBreak": true
        },
        {
            "id": 1772099742811,
            "date": "2026-02-26",
            "startTime": "2026-02-26T08:00:00.000Z",
            "endTime": "2026-02-26T09:55:00.000Z",
            "duration": "01:55:00",
            "durationSec": 6900,
            "accumulatedPauseTimeSec": 0,
            "notes": "#OPTIKG meet",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
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
            "id": 1768808982081,
            "date": "2026-01-14",
            "startTime": "2026-01-14T09:34:13.814Z",
            "endTime": "2026-01-19T07:49:35.220Z",
            "duration": "00:05:28",
            "durationSec": 328,
            "accumulatedPauseTimeSec": 425393,
            "notes": "",
            "dayType": "Workday",
            "tags": [
                "work"
            ],
            "mood": 5,
            "isBreak": false,
            "is_correct_record": true
        },
        {
            "id": 1768808975201,
            "date": "2026-01-14",
            "startTime": "2026-01-14T09:39:41.497Z",
            "endTime": "2026-01-19T07:49:35.201Z",
            "duration": "118:09:53",
            "durationSec": 425393,
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
