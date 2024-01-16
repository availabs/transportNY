import moment from "moment"

export const RelativeDateOptions = [
  { value: "weekof",
    display: "Week of"
  },
  { value: "monthof",
    display: "Month of"
  },
  { value: "yearof",
    display: "Year of"
  },
  { value: "day",
    display: "Day"
  },
  { value: "week",
    display: "Week"
  },
  { value: "month",
    display: "Month"
  },
  { value: "year",
    display: "Year"
  }
];

export const StartOptions = [
  { value: "-",
    display: "Before Start Date"
  },
  { value: "+",
    display: "After End Date"
  }
]

export const SpecialOptions = ["weekof", "monthof", "yearof"];

export const RELATIVE_DATE_REGEX = /^(startDate|endDate)=>(?<span>(?:day|week|month|year)(?:of)?)(?:([+-])(\d+)\k<span>->(\d+)\k<span>)?$/;

const calculateTimespanOf = (startDate, endDate, timespan, format = "YYYYMMDD") => {
  const start = moment(startDate, "YYYYMMDD").startOf(timespan);
  const end = moment(endDate, "YYYYMMDD").endOf(timespan);
  return [start.format(format), end.format(format)];
}

export const calculateRelativeDates = (relativeDate, startDate, endDate, format = "YYYYMMDD") => {
  const match = RELATIVE_DATE_REGEX.exec(relativeDate);

  if (!match) return [];

  const [, inputdate, timespan, operation = "", amount = "", duration = ""] = match;

  if (SpecialOptions.includes(timespan)) {
    switch (timespan) {
      case "weekof":
        return calculateTimespanOf(startDate, endDate, "week", format);
      case "monthof":
        return calculateTimespanOf(startDate, endDate, "month", format);
      case "yearof":
        return calculateTimespanOf(startDate, endDate, "year", format);
    }
  }

  if (inputdate === "startDate") {
    const start = moment(startDate, "YYYYMMDD").startOf(timespan).subtract(amount, timespan);
    const end = moment(start).add(duration, timespan).subtract(1, "day");
    return [start.format(format), end.format(format)];
  }

  const start = moment(endDate, "YYYYMMDD").startOf(timespan).add(amount, timespan);
  const end = moment(start).add(duration, timespan).subtract(1, "day");
  return [start.format(format), end.format(format)];
}
