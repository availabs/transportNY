import get from "lodash/get"

import { getColorRange } from "~/modules/avl-map-2/src"

import ckmeans from "~/pages/DataManager/utils/ckmeans";

const calcDomain = (type, data, length) => {
  const values = data.map(d => +d.value);
  switch (type) {
    case "quantize":
      return d3extent(values);
    case "threshold":
      return ckmeans(values.filter(Boolean), length ? length - 1 : 6);
    default:
      return values;
  }
}
const calcRange = (type, length, color, reverse) => {
  switch (type) {
    case "threshold":
      return getColorRange(length ? length + 1 : 7, color, reverse);
    default:
      return getColorRange(7, color, reverse);
  }
}

const calculateLegend = (source, data) => {
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
    type = "quantile",
    color = "Blues",
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

  if (!domain.length) {
    legend.domain = calcDomain(type, data, range.length);
  }
  if (!range.length) {
    legend.range = calcRange(type, domain.length, color, reverse);
  }
  return legend;
}
export default calculateLegend;
