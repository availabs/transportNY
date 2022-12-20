import TRAFFIC_DISTRIBUTIONS from "./traffic_distributions"

const DOW_MULTS = [
	.8,
	1.05,
	1.05,
	1.05,
	1.05,
	1.1,
	.9,
	1
]

const groupDists = (dists, num) => {
	const newDists = [];
	for (let n = 0; n <= 288; n += num) {
		newDists.push(
			dists.slice(n, n + num).reduce((a, c) => a + c, 0)
		)
	}
	return newDists;
}

export const disaggregateAADT = (aadt, dist, dow=7, resolution=5) => {
	if (!(dist in TRAFFIC_DISTRIBUTIONS)) return [];

	dist = TRAFFIC_DISTRIBUTIONS[dist];
	dow = DOW_MULTS[dow];

	let dists = [];

	for (let epoch = 0; epoch < 288; ++epoch) {
		dists.push(aadt * (dist[epoch] / 100) * dow);
	}

	if (resolution === 15) {
		dists = groupDists(dists, 3);
	}
	else if (resolution === 60) {
		dists = groupDists(dists, 12);
	}

	return dists;
}

export const getDist = (tmcGraph, tmc, _dow=7, year) => {
// FIXME: Deprecated tmc_attributes API Route/Graph Path
	const attributes  = year ? tmcGraph[tmc].meta[year] : null;
	if (!attributes) return "UNKNOWN";

  const dow = _dow === 0 || _dow === 6 ? "WEEKEND" : "WEEKDAY",
    congestionLevel = attributes.congestion_level,
    peakType = attributes.directionality,
    f_system = attributes.f_system,
    roadType = f_system < 3 ? "FREEWAY" : "NONFREEWAY";
  return dow === "WEEKEND" ?
    [dow, roadType].join("_") :
    [dow, congestionLevel, peakType, roadType].join("_");
}

export const getDist2 = (attributes, tmc, _dow=7) => {
  const dow = _dow === 0 || _dow === 6 ? "WEEKEND" : "WEEKDAY",
    congestionLevel = attributes.congestion_level,
    peakType = attributes.directionality,
    f_system = attributes.f_system,
    roadType = f_system < 3 ? "FREEWAY" : "NONFREEWAY";

  return dow === "WEEKEND" ?
    [dow, roadType].join("_") :
    [dow, congestionLevel, peakType, roadType].join("_");
}
