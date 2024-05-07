export const DEFAULT_COLUMNS = [
  { key: "name",
    header: "Name",
    comp: "input:text",
    type: "route-data"
  },
  { key: "tmcs",
    header: "TMC(s)",
    comp: "tmcs",
    type: "tmcs"
  },
  { key: "startTime",
    header: "Start Time",
    comp: "input:time",
    type: "time:start"
  },
  { key: "endTime",
    header: "End Time",
    comp: "input:time",
    type: "time:end"
  },
  { key: "startDate",
    header: "Start Date",
    comp: "input:date",
    type: "date:start"
  },
  { key: "endDate",
    header: "End Date",
    comp: "input:date",
    type: "date:end"
  }
]
export const DATA_COLUMNS = [
  { key: "speed",
    header: "Speed",
    comp: "data:speed",
    type: "data"
  },
  { key: "traveltime",
    header: "Travel Time",
    comp: "data:traveltime",
    type: "data"
  },
  { key: "delay",
    header: "Hours of Delay",
    comp: "data:delay",
    type: "data"
  }
]
export const PERCENT_CHANGE_COLUMNS = [
  { key: "speed-pc",
    header: "Speed Percent Change",
    comp: "data:speed-pc",
    type: "data"
  },
  { key: "traveltime-pc",
    header: "Travel Time Percent Change",
    comp: "data:traveltime-pc",
    type: "data"
  },
  { key: "delay-pc",
    header: "Hours of Delay Percent Change",
    comp: "data:delay-pc",
    type: "data"
  }
]
