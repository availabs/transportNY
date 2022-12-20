import get from "lodash.get"

export const getRoutePeaks = (graph, path) => {
  if (graph && path) {
    return get(graph, path, {});
  }
  return {
		amPeakStart: 7 * 12,
		amPeakEnd: 10 * 12,
		pmPeakStart: (4 + 12) * 12,
		pmPeakEnd: (7 + 12) * 12
  }
}
const peaks = getRoutePeaks();
export const PEAKS = [
  { peak: "amPeak",
    name: "AM Peak",
    range: [peaks.amPeakStart, peaks.amPeakEnd]
  },
  { peak: "offPeak",
    name: "Off Peak",
    range: [peaks.amPeakEnd, peaks.pmPeakStart]
  },
  { peak: "pmPeak",
    name: "PM Peak",
    range: [peaks.pmPeakStart, peaks.pmPeakEnd]
  }
]
