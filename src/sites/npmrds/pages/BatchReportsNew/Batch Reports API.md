# Batch Reports API Documentation

This document describes the API routes used by the BatchReportsNew feature.

## Overview

The Batch Reports page uses two types of APIs:
1. **Falcor Graph API** - For fetching routes, folders, and managing batch report persistence
2. **REST API** - For generating batch report data

---

## Falcor Graph API

### Routes

#### Get User Routes Count
```
["routes2", "user", "length"]
```
Returns the total number of routes belonging to the current user.

#### Get User Routes by Index
```
["routes2", "user", "index", { from: 0, to: N-1 }, ["id", "name", "metadata", "tmc_array"]]
```
Fetches route details for routes at the specified indices.

**Response fields:**
- `id` - Route identifier
- `name` - Route display name
- `metadata` - Route metadata object containing `dates` array
- `tmc_array` - Array of TMC (Traffic Message Channel) codes for the route

#### Get Routes by ID
```
["routes2", "id", <routeIds>, ["id", "name", "metadata", "tmc_array"]]
```
Fetches route details by route ID(s).

---

### Folders

#### Get User Folders Count
```
["folders2", "user", "length"]
```
Returns the total number of folders accessible to the current user.

#### Get User Folder Tree
```
["folders2", "user", "tree"]
```
Returns the hierarchical folder structure for the current user.

**Response structure:**
```js
{
  value: [
    {
      id: number,
      name: string,
      type: "user" | "group" | "AVAIL",
      owner: string,
      editable: number,  // auth level required to edit
      icon: string,
      color: string,
      children: [...]    // nested folders
    }
  ]
}
```

#### Get Folders by Index
```
["folders2", "user", "index", { from: 0, to: N-1 }, ["id", "name", "type"]]
```
Fetches folder details for folders at the specified indices.

#### Get Folders by ID
```
["folders2", "id", <folderIds>, ["id", "name", "type"]]
```
Fetches folder details by folder ID(s).

#### Get Folder Contents
```
["folders2", "stuff", <folderIds>]
```
Returns the contents of specified folders.

**Response structure:**
```js
{
  value: [
    {
      stuff_type: "route" | "folder",
      stuff_id: number
    }
  ]
}
```

---

### Batch Reports

#### Get Batch Report by ID
```
["batch", "report", "id", <batchreportId>, ["name", "batchreport", "description"]]
```
Fetches a saved batch report.

**Response fields:**
- `name` - Batch report name/filename
- `description` - User-provided description
- `batchreport` - Saved state object containing:
  - `selectedRoutes` - Array of selected route objects
  - `columns` - Array of column configurations
  - `timeSource` - Time source setting
  - `startTime` / `endTime` - Default time range
  - `useBaseAsReference` - Boolean for percent change calculation

#### Save Batch Report (Falcor Call)
```
["batch", "report", "save"]
```
Saves a batch report to a folder.

**Arguments:**
```js
{
  batchreport: {
    selectedRoutes: [...],
    columns: [...],
    timeSource: string,
    startTime: string,
    endTime: string,
    useBaseAsReference: boolean
  },
  name: string,           // filename
  description: string,    // user description
  batchreportId: null,    // null for new, ID for update
  folder: number          // folder ID to save to
}
```

---

## REST API

### Generate Batch Report Data

**Endpoint:**
```
POST ${API_HOST}/batchreports/npmrds2/982
```

**Request Body:**
```js
{
  id: string,              // UUID for this request batch
  routes: [
    {
      uuid: string,        // unique identifier for this route instance
      rid: number,         // route ID
      name: string,        // route name
      tmcs: string[],      // array of TMC codes
      startTime: string,   // "HH:mm:ss" format
      endTime: string,     // "HH:mm:ss" format
      startDate: string,   // optional, "YYYY-MM-DD" format
      endDate: string,     // optional, "YYYY-MM-DD" format
      [columnName]: {      // dates for each column
        startDate: string,
        endDate: string
      }
    }
  ],
  columns: [
    {
      uuid: string,
      name: string,
      dateSelection: "from-route" | "user-defined" | "relative",
      relativeDate: string,       // if dateSelection is "relative"
      descriptor: string,
      startDate: string,          // "YYYY-MM-DD"
      endDate: string,            // "YYYY-MM-DD"
      dataColumns: [
        {
          key: "speed" | "speed-pc" | "traveltime" | "traveltime-pc" | "delay" | "delay-pc",
          header: string,
          base: string
        }
      ],
      dataSource: "travel_time_all_vehicles" | "travel_time_freight_trucks" | "travel_time_passenger_vehicles",
      isBase: boolean,
      overrides: {
        aadt: number | null,
        threshold: number | null,
        speed: number | null
      }
    }
  ],
  useBaseAsReference: boolean  // use first column as reference for percent change
}
```

**Response:**
```js
{
  id: string,     // same UUID as request
  data: [
    {
      uuid: string,           // route UUID
      [columnName]: {
        speed: number | null,
        "speed-pc": number | null,
        traveltime: number | null,
        "traveltime-pc": number | null,
        delay: number | null,
        "delay-pc": number | null
      }
    }
  ]
}
```

### Example Calls

#### Example 1: Single Route with Speed Data

Get speed data for a single route during morning peak hours.

**Request:**
```bash
curl -X POST "${API_HOST}/batchreports/npmrds2/982" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "routes": [
      {
        "uuid": "route-uuid-001",
        "rid": 12345,
        "name": "I-87 Northbound - Albany to Saratoga",
        "tmcs": ["120+04567", "120+04568", "120+04569"],
        "startTime": "06:00:00",
        "endTime": "09:00:00",
        "Base": {
          "startDate": "2024-01-01",
          "endDate": "2024-03-31"
        }
      }
    ],
    "columns": [
      {
        "uuid": "col-uuid-001",
        "name": "Base",
        "dateSelection": "from-route",
        "startDate": "2024-01-01",
        "endDate": "2024-03-31",
        "dataColumns": [
          { "key": "speed", "header": "Speed", "base": "speed" }
        ],
        "dataSource": "travel_time_all_vehicles",
        "isBase": true,
        "overrides": { "aadt": null, "threshold": null, "speed": null }
      }
    ],
    "useBaseAsReference": true
  }'
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "data": [
    {
      "uuid": "route-uuid-001",
      "Base": {
        "speed": 58.42
      }
    }
  ]
}
```

#### Example 2: Year-over-Year Comparison

Compare speed and travel time for multiple routes between 2023 and 2024.

**Request:**
```bash
curl -X POST "${API_HOST}/batchreports/npmrds2/982" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "routes": [
      {
        "uuid": "route-uuid-001",
        "rid": 12345,
        "name": "I-87 Northbound",
        "tmcs": ["120+04567", "120+04568"],
        "startTime": "07:00:00",
        "endTime": "19:00:00",
        "2023 Data": { "startDate": "2023-01-01", "endDate": "2023-12-31" },
        "2024 Data": { "startDate": "2024-01-01", "endDate": "2024-12-31" }
      },
      {
        "uuid": "route-uuid-002",
        "rid": 12346,
        "name": "I-90 Eastbound",
        "tmcs": ["120+05001", "120+05002", "120+05003"],
        "startTime": "07:00:00",
        "endTime": "19:00:00",
        "2023 Data": { "startDate": "2023-01-01", "endDate": "2023-12-31" },
        "2024 Data": { "startDate": "2024-01-01", "endDate": "2024-12-31" }
      }
    ],
    "columns": [
      {
        "uuid": "col-uuid-001",
        "name": "2023 Data",
        "dateSelection": "user-defined",
        "startDate": "2023-01-01",
        "endDate": "2023-12-31",
        "dataColumns": [
          { "key": "speed", "header": "Speed", "base": "speed" },
          { "key": "traveltime", "header": "Travel Time", "base": "traveltime" }
        ],
        "dataSource": "travel_time_all_vehicles",
        "isBase": true,
        "overrides": { "aadt": null, "threshold": null, "speed": null }
      },
      {
        "uuid": "col-uuid-002",
        "name": "2024 Data",
        "dateSelection": "user-defined",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31",
        "dataColumns": [
          { "key": "speed", "header": "Speed", "base": "speed" },
          { "key": "speed-pc", "header": "Speed Percent Change", "base": "speed" },
          { "key": "traveltime", "header": "Travel Time", "base": "traveltime" },
          { "key": "traveltime-pc", "header": "Travel Time Percent Change", "base": "traveltime" }
        ],
        "dataSource": "travel_time_all_vehicles",
        "isBase": false,
        "overrides": { "aadt": null, "threshold": null, "speed": null }
      }
    ],
    "useBaseAsReference": true
  }'
```

**Response:**
```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "data": [
    {
      "uuid": "route-uuid-001",
      "2023 Data": {
        "speed": 62.15,
        "traveltime": 12.45
      },
      "2024 Data": {
        "speed": 59.83,
        "speed-pc": -3.73,
        "traveltime": 13.02,
        "traveltime-pc": 4.58
      }
    },
    {
      "uuid": "route-uuid-002",
      "2023 Data": {
        "speed": 55.20,
        "traveltime": 18.72
      },
      "2024 Data": {
        "speed": 57.45,
        "speed-pc": 4.08,
        "traveltime": 17.98,
        "traveltime-pc": -3.95
      }
    }
  ]
}
```

#### Example 3: Hours of Delay with Overrides

Calculate hours of delay using custom AADT and threshold speed values.

**Request:**
```bash
curl -X POST "${API_HOST}/batchreports/npmrds2/982" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "routes": [
      {
        "uuid": "route-uuid-001",
        "rid": 12345,
        "name": "US-9 Corridor",
        "tmcs": ["120+06001", "120+06002"],
        "startTime": "06:00:00",
        "endTime": "21:00:00",
        "Base": { "startDate": "2024-06-01", "endDate": "2024-08-31" }
      }
    ],
    "columns": [
      {
        "uuid": "col-uuid-001",
        "name": "Base",
        "dateSelection": "from-route",
        "startDate": "2024-06-01",
        "endDate": "2024-08-31",
        "dataColumns": [
          { "key": "speed", "header": "Speed", "base": "speed" },
          { "key": "delay", "header": "Hours of Delay", "base": "delay" }
        ],
        "dataSource": "travel_time_all_vehicles",
        "isBase": true,
        "overrides": {
          "aadt": 25000,
          "threshold": 45,
          "speed": null
        }
      }
    ],
    "useBaseAsReference": true
  }'
```

**Response:**
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "data": [
    {
      "uuid": "route-uuid-001",
      "Base": {
        "speed": 42.18,
        "delay": 1523.67
      }
    }
  ]
}
```

#### Example 4: Freight Trucks Only Analysis

Analyze freight truck performance separately from passenger vehicles.

**Request:**
```bash
curl -X POST "${API_HOST}/batchreports/npmrds2/982" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "d4e5f6a7-b8c9-0123-def0-456789012345",
    "routes": [
      {
        "uuid": "route-uuid-001",
        "rid": 12345,
        "name": "I-81 Freight Corridor",
        "tmcs": ["120+07001", "120+07002", "120+07003"],
        "startTime": "00:00:00",
        "endTime": "23:59:59",
        "Q1 2024": { "startDate": "2024-01-01", "endDate": "2024-03-31" }
      }
    ],
    "columns": [
      {
        "uuid": "col-uuid-001",
        "name": "Q1 2024",
        "dateSelection": "user-defined",
        "startDate": "2024-01-01",
        "endDate": "2024-03-31",
        "dataColumns": [
          { "key": "speed", "header": "Speed", "base": "speed" },
          { "key": "traveltime", "header": "Travel Time", "base": "traveltime" }
        ],
        "dataSource": "travel_time_freight_trucks",
        "isBase": true,
        "overrides": { "aadt": null, "threshold": null, "speed": null }
      }
    ],
    "useBaseAsReference": true
  }'
```

**Response:**
```json
{
  "id": "d4e5f6a7-b8c9-0123-def0-456789012345",
  "data": [
    {
      "uuid": "route-uuid-001",
      "Q1 2024": {
        "speed": 54.32,
        "traveltime": 22.15
      }
    }
  ]
}
```

---

## Data Columns Reference

| Key | Header | Description |
|-----|--------|-------------|
| `speed` | Speed | Average speed in mph |
| `speed-pc` | Speed Percent Change | Percent change from reference |
| `traveltime` | Travel Time | Total travel time |
| `traveltime-pc` | Travel Time Percent Change | Percent change from reference |
| `delay` | Hours of Delay | Total hours of delay |
| `delay-pc` | Hours of Delay Percent Change | Percent change from reference |

## Data Sources Reference

| Value | Description |
|-------|-------------|
| `travel_time_all_vehicles` | Freight Trucks and Passenger Vehicles |
| `travel_time_freight_trucks` | Freight Trucks only |
| `travel_time_passenger_vehicles` | Passenger Vehicles only |

---

## Page Routes

The Batch Reports feature is accessible at:

| Path | Description |
|------|-------------|
| `/batchreportsnew` | Main batch reports page |
| `/batchreportsnew/report/:batchreportId` | Load a saved batch report |

Both routes require authentication (`auth: true`).
