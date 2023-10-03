import get from "lodash/get"

import { getColorRange } from "~/modules/avl-map-2/src"

import ckmeans from "~/pages/DataManager/utils/ckmeans";

const strictNaN = v => (v === null) || isNaN(v);
const ordinalSort = (a, b) => {
  return String(a).localeCompare(String(b));
}

const calcDomain = (type, data, length) => {
  const values = data.map(d => strictNaN(d.value) ? d.value : +d.value);
  switch (type) {
    case "quantize":
      return d3extent(values);
    case "threshold":
      return ckmeans(values.filter(Boolean), length ? length - 1 : 6);
    case "ordinal":
      return [...new Set(values)].sort(ordinalSort);
    default:
      return values;
  }
}
const calcRange = (type, length, color, reverse) => {
  switch (type) {
    case "threshold":
      return getColorRange(length ? length + 1 : 7, color, reverse);
    case "ordinal":
      return getColorRange(Math.min(12, length), color, reverse);
    default:
      return getColorRange(7, color, reverse);
  }
}

const getActiveView = (viewId, views = []) => {
  return views.reduce((a, c) => {
    if (c.view_id === viewId) {
      return c;
    }
    return a;
  }, null);
}

const calculateLegend = (source, viewId, adv = {}, data = []) => {
  if (!data.length) {
    return null;
  }

  const {
    type: advt,
    name: advn
  } = adv;

  const view = getActiveView(viewId, source?.views || []);
  const layers = get(view, ["metadata", "tiles", "layers"], []);
  const symbology = get(source, ["metadata", "symbology"], {});

  const [path] = layers.map(({ id, type }) => {
    return [id, `${ type }-color`, advn, "settings"];
  });

  const settings = get(symbology, path, {});

  const {
    domain = [],
    range = [],
    format = ".2s",
    name,
    title,
    type = advt === "data-variable" ? "quantile" : "ordinal",
    color = advt === "data-variable" ? "Blues" : "Set3",
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

console.log("CREATE LEGEND:", data, legend);

  return legend;
}
export default calculateLegend;
