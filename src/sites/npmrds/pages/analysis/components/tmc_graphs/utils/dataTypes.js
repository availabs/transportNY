import React from "react"

import { sum, mean, rollup } from "d3-array"

import { format } from "d3-format"

import get from "lodash.get"

const oneSixtieth = 1.0 / 60.0,

	secondsToMinutes = tt => tt * oneSixtieth,
	toSpeed = (tt, l) =>  l * (3600.0 / tt),
	identity = v => v,
	aadtToVmt = (aadt, l) => aadt * l,

	toFixed2 = format(",.2f"),
	toMinutesWithSeconds = v => {
		const isNegative = v < 0;
		v = Math.abs(v);
		const minutes = Math.trunc(v),
			seconds = v - minutes;
		return `${ isNegative ? "-" : "" }${ minutes }:${ `0${ Math.round(seconds * 60) }`.slice(-2) }`;
	},

	indexReducer = (data, tmcGraph, year) => {
		const tmcArray = [...new Set(data.map(d => d.tmc))],
			length = tmcArray.reduce((a, c) => a + get(tmcGraph, `${ c }.meta.${ year }.miles`, 0), 0);
		if (length === 0) return 0;
		return sum(data, d => d.value * get(tmcGraph, `${ d.tmc }.meta.${ year }.miles`, 0)) / length;
	},

	speedReducer = (data, tmcGraph, year) => {
		const tmcArray = [...new Set(data.map(d => d.tmc))],
			length = tmcArray.reduce((a, c) => a + get(tmcGraph, `${ c }.meta.${ year }.miles`, 0), 0);
		if (length === 0) return 0;
		return toSpeed(sum(data, d => d.value), length);
	},
	speedTmcReducer = (data, tmcGraph, year) => {
		const tmcArray = [...new Set(data.map(d => d.tmc))],
			length = tmcArray.reduce((a, c) => a + get(tmcGraph, `${ c }.meta.${ year }.miles`, 0), 0);
		if (length === 0) return 0;
		return toSpeed(mean(data, d => d.value), length);
	},
	speedAllReducer = (data, tmcGraph, year) => {
		const byTmc = Array.from(rollup(data, v => mean(v, d => d.value), d => d.tmc)),
			tmcArray = [...new Set(byTmc.map(d => d[0]))],
			length = tmcArray.reduce((a, c) => a + get(tmcGraph, `${ c }.meta.${ year }.miles`, 0), 0);
		if (length === 0) return 0;
		return toSpeed(sum(byTmc, d => d[1]), length);
	},

	travelTimeReducer = data => secondsToMinutes(sum(data, d => d.value)),
	travelTimeTmcReducer = data => secondsToMinutes(mean(data, d => d.value)),
	travelTimeAllReducer = data => {
		const byTmc = Array.from(rollup(data, v => mean(v, d => d.value), d => d.tmc));
		return secondsToMinutes(sum(byTmc, d => d[1]));
	},

	sumReducer = data => sum(data, d => d.value),
	meanReducer = data => mean(data, d => d.value),

	meanWithFilter = data => mean(data.filter(d => d.value), d => d.value),
	meanByTmc = data => {
		const rolled = rollup(data, v => mean(v, d => d.value), d => d.tmc);
		return sum(Array.from(rolled), d => d[1])
	};

export {toMinutesWithSeconds};

export const BASE_DATA_TYPES = [
	{ key: 'speed', alias: 'travelTime', name: 'Speed', reverseColors: false,
		label: 'MPH', transform: toSpeed, format: toFixed2,
		reducer: speedReducer, tmcReducer: speedTmcReducer, allReducer: speedAllReducer },
	{ key: 'travelTime', name: 'Travel Time', reverseColors: true,
		label: 'Minutes', transform: secondsToMinutes, format: toMinutesWithSeconds,
		reducer: travelTimeReducer, tmcReducer: travelTimeTmcReducer, allReducer: travelTimeAllReducer },

	{ key: 'hoursOfDelay', group: 'hoursOfDelay', name: 'Hours of Delay', reverseColors: true,
		label: 'Hours', transform: identity, format: format(",.2f"),
		reducer: sumReducer, tmcReducer: sumReducer, allReducer: sumReducer },
	{ key: 'avgHoursOfDelay', group: 'hoursOfDelay', name: 'Avg. Hours of Delay', reverseColors: true,
		label: 'Hours', transform: identity, format: format(",.2f"),
		reducer: sumReducer, tmcReducer: meanReducer, allReducer: meanReducer },

	{ key: 'co2Emissions', group: 'co2Emissions', name: "CO\u2082 Emissions", reverseColors: true,
		label: 'Tonnes', transform: identity, format: format(",.2f"),
		reducer: sumReducer, tmcReducer: sumReducer, allReducer: sumReducer },
	{ key: 'avgCo2Emissions', group: 'co2Emissions', name: "Avg. CO\u2082 Emissions", reverseColors: true,
		label: 'Tonnes', transform: identity, format: format(",.2f"),
		reducer: meanReducer, tmcReducer: meanReducer, allReducer: meanByTmc },

	{ key: 'dataQuality', name: 'Data Quality', reverseColors: false,
		label: 'Percent of Epochs Reporting', transform: identity, format: format(",d"),
		reducer: meanReducer, tmcReducer: meanReducer, allReducer: meanReducer }
]

export const INDICES = [
	{ key: 'avgTT', group: 'indices', name: 'Average Travel Time', reverseColors: true,
		label: 'Minutes', transform: secondsToMinutes,
		format: toMinutesWithSeconds, reducer: travelTimeReducer, tmcReducer: travelTimeTmcReducer },

	{ key: 'freeflow', group: 'indices', name: 'Freeflow', reverseColors: false,
		label: 'MPH', transform: toSpeed,
		format: toFixed2, reducer: (...args) => +speedReducer(...args).toFixed(2), tmcReducer: speedTmcReducer },

	{ key: 'percentile95', group: 'indices', name: '95th Percentile', reverseColors: true,
		label: 'Minutes', transform: secondsToMinutes,
		format: toMinutesWithSeconds, reducer: travelTimeReducer, tmcReducer: travelTimeTmcReducer },

	{ key: 'percentile97', group: 'indices', name: '97th Percentile', reverseColors: true,
		label: 'Minutes', transform: secondsToMinutes,
		format: toMinutesWithSeconds, reducer: travelTimeReducer, tmcReducer: travelTimeTmcReducer },

	{ key: 'bufferTime', group: 'indices', name: 'Buffer Time Index', reverseColors: true,
		label: '', format: toFixed2, reducer: indexReducer, transform: identity },

	{ key: 'planningTime', group: 'indices', name: 'Planning Time Index', reverseColors: true,
		label: '', format: toFixed2, reducer: indexReducer, transform: identity },

	{ key: 'miseryIndex', group: 'indices', name: 'Misery Index', reverseColors: true,
		label: '', format: toFixed2, reducer: indexReducer, transform: identity },

	{ key: 'travelTimeIndex', group: 'indices', name: 'Travel Time Index', reverseColors: true,
		label: '', format: toFixed2, reducer: indexReducer, transform: identity }
]

export const INDICES_BY_DATE_RANGE = [
	{ key: 'avgTT-byDateRange', group: 'indices-byDateRange', name: 'Average Travel Time', reverseColors: true,
		label: 'Minutes', transform: secondsToMinutes,
		format: toMinutesWithSeconds, reducer: travelTimeReducer },

	{ key: 'percentile95-byDateRange', group: 'indices-byDateRange', name: '95th Percentile', reverseColors: true,
		label: 'Minutes', transform: secondsToMinutes,
		format: toMinutesWithSeconds, reducer: travelTimeReducer },

	{ key: 'percentile97-byDateRange', group: 'indices-byDateRange', name: '97th Percentile', reverseColors: true,
		label: 'Minutes', transform: secondsToMinutes,
		format: toMinutesWithSeconds, reducer: travelTimeReducer },

	{ key: 'freeflow-byDateRange', group: 'indices-byDateRange', name: 'Freeflow', reverseColors: false,
		label: 'MPH', transform: toSpeed,
		format: toFixed2, reducer: speedAllReducer },

	{ key: 'miseryIndex-byDateRange', group: 'indices-byDateRange', name: 'Misery Index', reverseColors: true,
		label: '', format: toFixed2, reducer: indexReducer, transform: identity },

	{ key: 'bufferTime-byDateRange', group: 'indices-byDateRange', name: 'Buffer Time Index', reverseColors: true,
		label: '', format: toFixed2, reducer: indexReducer, transform: identity },

	{ key: 'planningTime-byDateRange', group: 'indices-byDateRange', name: 'Planning Time Index', reverseColors: true,
		label: '', format: toFixed2, reducer: indexReducer, transform: identity },

	{ key: 'travelTimeIndex-byDateRange', group: 'indices-byDateRange', name: 'Travel Time Index', reverseColors: true,
		label: '', format: toFixed2, reducer: indexReducer, transform: identity }
]

const vmtReducer = (data, tmcGraph, year) => {
	const tmcArray = [...new Set(data.filter(d => d.value).map(d => d.tmc))],
		length = tmcArray.reduce((a, c) => a + get(tmcGraph, `${ c }.meta.${ year }.miles`, 0), 0);
	if (length === 0) return 0;

	return aadtToVmt(mean(data, d => d.value), length)
}
const aadtDataOverride = (data, overrides) => data.map(d => ({ ...d, value: get(overrides, "aadt", d.value) })),
	aadtValueOverride = overrides => get(overrides, "aadt", 0);

export const TMC_ATTRIBUTES = [
	{ key: "length", alias: 'miles', group: 'tmcAttribute', name: "Length", label: "Miles",
		format: format(",.2f"), reducer: sumReducer, transform: identity },

	{ key: "avg_speedlimit", group: 'tmcAttribute', name: "Average Speed Limit", label: "MPH",
		format: format(",.2f"), reducer: indexReducer, transform: identity },

	{ key: "aadt", group: 'tmcAttribute', name: "Annual Average Daily Traffic", label: "Vehicles",
		format: format(",d"), reducer: meanReducer, transform: identity,
	 	overrideData: aadtDataOverride, overrideValue: aadtValueOverride },

	{ key: "vmt", group: 'tmcAttribute', alias: "aadt", name: "Vehicle Miles Traveled", label: "Vehicle Miles",
		format: format(",.2f"), reducer: vmtReducer, transform: aadtToVmt,
	 	overrideData: aadtDataOverride, overrideValue: aadtValueOverride }
]

export const TRAFFIC_VOLUME = TMC_ATTRIBUTES.slice(2);

const DEFAULT_DATA_TYPES = [
	...BASE_DATA_TYPES,
	...INDICES
]
export default DEFAULT_DATA_TYPES
