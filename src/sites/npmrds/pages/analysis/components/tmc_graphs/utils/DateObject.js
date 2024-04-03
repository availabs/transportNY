import { format } from "d3-format"

const oneFifth = 1.0 / 5.0,
	oneTwelfth = 1.0 / 12.0,
	oneSixtieth = 1.0 / 60.0;

const timeStringFormat = format("02d");

class DateObject {
	static timeStringToEpoch(string, roundUp = false) {
		if (!string) return null;
		const [hours, mins, secs = 0] = string.split(":").map(Number);
		const func = roundUp ? Math.ceil : Math.floor;
		return (hours * 12) + func((mins + (secs * oneSixtieth)) * oneFifth);
	}
	static epochToTimeString(epoch) {
		epoch = +epoch;
		// epoch = Math.min(288, epoch);
	  epoch %= 288;
	  return `${ timeStringFormat(parseInt(epoch * oneTwelfth)) }:${ timeStringFormat((epoch % 12) * 5) }`;
	}
}
export default DateObject
