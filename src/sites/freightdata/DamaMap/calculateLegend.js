import get from "lodash/get"

import { getColorRange } from "~/modules/avl-map-2/src"

import ckmeans from "~/pages/DataManager/utils/ckmeans";

const calcDomain = (type, data, rangeLength) => {
  const values = data.map(d => d.value).sort((a, b) => a - b);
  switch (type) {
    case "quantize":
      return d3extent(values);
    case "threshold":
      return ckmeans(values.filter(Boolean), rangeLength ? rangeLength - 1 : 6);
    case "ordinal":
      return [...new Set(values)];
    default:
      return values;
  }
}
const calcRange = (type, domainLength, color, reverse = false) => {
  switch (type) {
    case "threshold":
      return getColorRange(domainLength ? domainLength + 1 : 7, color, reverse);
    case "ordinal":
      return getColorRange(Math.min(domainLength || 7, 12), color, reverse);
    default:
      return getColorRange(7, color, reverse);
  }
}

const calculateLegend = (source, data, variableType) => {
  if (!data.length) {
    return null;
  }

  const settings = get(source, ["metadata", "legend"], {});

  const {
    domain = [],
    range = [],
    format = ".2s",
    name,
    title,
    type = variableType === "data-variable" ? "quantile" : "ordinal",
    color = variableType === "data-variable" ? "Blues" : "Set3",
    reverse = false
  } = settings;

  const legend = {
    domain,
    range,
    format,
    name,
    title,
    type,
    color,
    reverse
  };

  if (!legend.domain.length) {
    legend.domain = calcDomain(type, data, range.length);
  }
  if (!legend.range.length) {
    legend.range = calcRange(type, legend.domain.length, color, reverse);
  }

  return legend;
}
export default calculateLegend;
