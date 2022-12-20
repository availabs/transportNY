import deepequal from "deep-equal"

const COMP_DOMAIN = new Map();

const DOMAIN_MAP = new Map();

export const register = (graphType, displayData, resolution, graphId, data) => {
	const key = makeKey(graphType, displayData.key, resolution);
	unregister(graphId);

	if (!data.length || (displayData.key === "none")) return [0, 0];

	let [min, max] = data.reduce(([min, max], d) => [Math.min(min, d), Math.max(max, d)], [data[0], data[0]]);
	let compDomain = [graphId, [min, max]];

	if ((min === 0) && (max === 0)) {
		return [0, 0];
	}

	if (DOMAIN_MAP.has(key)) {
		const [dMin, dMax] = DOMAIN_MAP.get(key);
		min = Math.min(min, dMin);
		max = Math.max(max, dMax);
	}
	DOMAIN_MAP.set(key, [min, max]);
	compDomain.push([min, max]);

	let temp = [];
	if (COMP_DOMAIN.has(key)) {
		temp = COMP_DOMAIN.get(key)
			.filter(([id]) => id !== graphId)
	}
	temp.push(compDomain);
	COMP_DOMAIN.set(key, temp);

	return [min, max];
}
export function unregister(graphId) {
	const domains = [];
	COMP_DOMAIN.forEach((value, key) => {
		value = value.filter(([id]) => id !== graphId);
		if (value.length) {
			domains.push([key, value]);
		}
	})
	COMP_DOMAIN.clear();
	domains.forEach(d => COMP_DOMAIN.set(...d));
}
export const needsUpdate = () => {
	let needsUpdate = false;
	COMP_DOMAIN.forEach((value, key) => {
		const domain = value.reduce(([min, max], [, [dMin, dMax]]) => {
			return [Math.min(min, dMin), Math.max(max, dMax)];
		}, [Infinity, -Infinity]);
		DOMAIN_MAP.set(key, domain);
		needsUpdate = value.reduce((a, [, , d]) => {
			return a || !deepequal(domain, d);
		}, needsUpdate);
	})
	return needsUpdate;
}

const makeKey = (graphType, displayDataKey, resolution) => {
	switch (graphType) {
		case "Route Line Graph":
		case "Route Bar Graph":
			return `Route-Line-Bar-${ displayDataKey }-${ resolution }`;
		default:
			return `${ graphType }-${ displayDataKey }-${ resolution }`;
	}
}
