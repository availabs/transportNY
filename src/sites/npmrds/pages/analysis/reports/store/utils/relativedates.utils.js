import moment from "moment"

export const RelativeDateOptions = [
  { value: "dayof",
    display: "Day of"
  },
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

export const SpecialOptions = ["dayof", "weekof", "monthof", "yearof"];

export const RELATIVE_DATE_REGEX = /^(startDate|endDate)=>(?<span>(?:day|week|month|year)(?:of)?)(?:([+-])(\d+)\k<span>->(\d+)\k<span>)?$/;

const calculateTimespanOf = (startDate, endDate, timespan, format = "YYYYMMDD") => {
  const start = moment(startDate, "YYYYMMDD").startOf(timespan);
  const end = moment(endDate, "YYYYMMDD").endOf(timespan);
  return [start.format(format), end.format(format)];
}

export const calculateRelativeDates = (relativeDate, startDate, endDate, outputFormat = "YYYYMMDD", inputFormat = "YYYYMMDD") => {

// console.log("calculateRelativeDates::args", relativeDate, startDate, endDate, outputFormat)

  const match = RELATIVE_DATE_REGEX.exec(relativeDate);
  if (!match) return [null, null];
  // if (!startDate || !endDate) return [null, null];

  const [, inputdate, timespan, operation = "", amount = "", duration = ""] = match;

// console.log("calculateRelativeDates::match", inputdate, timespan, operation, amount, duration);

  if (SpecialOptions.includes(timespan)) {
    switch (timespan) {
      case "dayof":
        return [
          moment(startDate, inputFormat).format(outputFormat),
          moment(endDate, inputFormat).format(outputFormat)
        ]
      case "weekof":
        return calculateTimespanOf(startDate, endDate, "week", outputFormat);
      case "monthof":
        return calculateTimespanOf(startDate, endDate, "month", outputFormat);
      case "yearof":
        return calculateTimespanOf(startDate, endDate, "year", outputFormat);
    }
  }

  if (inputdate === "startDate") {
    const start = moment(startDate, inputFormat).startOf(timespan).subtract(amount, timespan);
    const end = moment(start).add(duration, timespan).subtract(1, "day");
    return [start.format(outputFormat), end.format(outputFormat)];
  }

  const start = moment(endDate, inputFormat).startOf(timespan).add(amount, timespan);
  const end = moment(start).add(duration, timespan).subtract(1, "day");
  return [start.format(outputFormat), end.format(outputFormat)];
}

const DATE_TIME_REGEX_1 = /^(\d{8})(?:T(\d{2}[:]\d{2}(?:[:]\d{2})?))?/
const DATE_TIME_REGEX_2 = /^(\d{4}[-]\d{2}[-]\d{2})(?:T(\d{2}[:]\d{2}(?:[:]\d{2})?))?/

export const getDatesAndTimes = (dates, format = "YYYYMMDD") => {
  const response = [[null, null], [null, null]];
  dates.forEach((date, i) => {
    if (DATE_TIME_REGEX_1.test(date)) {
      const [, d, t] = DATE_TIME_REGEX_1.exec(date);
      response[0][i] = moment(d, "YYYYMMDD").format(format);
      response[1][i] = t;
    }
    else if (DATE_TIME_REGEX_2.test(date)) {
      const [, d, t] = DATE_TIME_REGEX_2.exec(date);
      response[0][i] = moment(d, "YYYY-MM-DD").format(format);
      response[1][i] = t;
    }
  })
  return response;
}
