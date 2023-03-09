import get from "lodash.get"
import moment from "moment"

import DateObject from "./DateObject"

const identity = v => v;

const hourFormat = hour => {
	if (hour === 0) return "12am";
	if (hour < 12) return `${ hour }am`;
	if (hour === 12) return "12pm";
	return `${ hour - 12 }pm`;
}

const DOW = [
	"sunday", "monday", "tuesday", "wednesday",
	"thursday", "friday", "saturday"
]
const dowFormat = dow => {
	if (DOW.includes(dow)) return dow;
	return DOW[dow];
};
const dateFormat = date => {
	date = date.toString();
	return `${ +date.slice(4, 6) }-${ +date.slice(6, 8) }-${ +date.slice(0, 4) }`;
}

const RESOLUTIONS = {
	'NONE': {
		name: 'None (data download only)',
		label: "none",
		format: identity
	},
	'5-minutes': {
		name: '5 Minutes (epoch)',
		label: 'Time',
		format: DateObject.epochToTimeString
	},
	'15-minutes': {
		name: '15 Minutes (epoch / 3)',
		label: 'Time',
		format: d => DateObject.epochToTimeString(d * 3)
	},
	'hour': {
		name: 'Hour',
		label: 'Hour',
		format: hourFormat
	},
	'weekday': {
		name: 'Day of Week',
		label: 'Day of Week',
		format: dowFormat
	},
	// 'dow': {
	// 	name: 'Day of Week',
	// 	label: 'Day of Week',
	// 	format: dowFormat
	// },
	'day': {
		name: 'Date',
		label: 'Date',
		format: dateFormat
	},
	'month': {
		name: 'Month',
		label: 'Month',
		format: d => d.toString().split(/(?<=\d{4})(\d{2})/).reverse().join(" ")
	},
	'year': {
		name: 'Year',
		label: 'Year',
		format: identity
	}
}

export const resolutions = Object.keys(RESOLUTIONS)
	.filter(r => r !== "NONE")
	.map(r => ({
		resolution: r,
		...RESOLUTIONS[r]
	}))

export const getResolutionFormat = resolution =>
	get(RESOLUTIONS, `${ resolution }.format`, identity);

const WEEKDAYS_SORT_ORDER = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
}

export const getResolutionSort = (resolution, accessor = d => d.resolution) => {
  switch (resolution) {
    case 'weekday':
      return (a, b) => WEEKDAYS_SORT_ORDER[accessor(a)] - WEEKDAYS_SORT_ORDER[accessor(b)];
    default:
      return (a, b) => +accessor(a) - +accessor(b);
  }
};

// export const getXscaleType = resolution => {
// 	switch (resolution) {
// 		case "weekday":
// 		case "day":
// 		case "month":
// 			return "point";
// 		default:
// 			return "linear"
// 	}
// }
export const getXscaleType = () => "point"

export const getXscaleTickDensity = resolution => {
	switch (resolution) {
		case "weekday":
			return 1;
		default:
			return 15;
	}
}
export const getResolutionLabel = resolution =>
	get(RESOLUTIONS, `${ resolution }.label`, 'Unknown Resolution')

export const getResolutionName = resolution =>
	get(RESOLUTIONS, [resolution, 'name'], 'Unknown Resolution')
