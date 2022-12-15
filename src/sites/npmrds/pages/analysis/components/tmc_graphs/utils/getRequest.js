import DateObject from "./DateObject"

export default ({ settings }, tmcArray, displayData) => ({
	tmcArray,
	startDate: settings.startDate,
	endDate: settings.endDate,
	startTime: DateObject.timeStringToEpoch(settings.startTime),
	endTime: DateObject.timeStringToEpoch(settings.endTime === "00:00" ? "24:00" : settings.endTime),
	weekdays: Object.keys(settings.weekdays).filter(w => settings.weekdays[w]),
	resolution: settings.resolution,
	dataColumn: settings.dataColumn || "travel_time_all",
	dataType: displayData.group || displayData.alias || displayData.key
})