import { format } from "d3-format"

const oneFifth = 1.0 / 5.0,
	oneTwelfth = 1.0 / 12.0;

const timeStringFormat = format("02d");

class DateObject {
	static timeStringToEpoch(string) {
		if (!string) return null;
		const temp = string.split(":");
		return (+temp[0] * 12) + parseInt(+temp[1] * oneFifth);
	}
	static epochToTimeString(epoch) {
		epoch = +epoch;
		// epoch = Math.min(288, epoch);
	  epoch %= 288;
	  return `${ timeStringFormat(parseInt(epoch * oneTwelfth)) }:${ timeStringFormat((epoch % 12) * 5) }`;
	}
}
export default DateObject