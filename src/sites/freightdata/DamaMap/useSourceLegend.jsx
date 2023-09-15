import React from "react"

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
    case "quantize":
      return getColorRange(7, color, reverse);
    case "threshold":
      return getColorRange(length ? length + 1 : 7, color, reverse);
    default:
      return data;
  }
}

const useSourceLegend = source => {
  const [legend, setLegend] = React.useState(null);

  React.useEffect(() => {
    const legend = get(source, ["metadata", "legend"], {});
    setLegend(legend);
  }, [source]);

  const createLegend = React.useCallback((settings = {}) => {

    const {
      domain = [],
      range = [],
      format = ".2s",
      name,
      title,
      type = "threshold",
      data = [],
      color = "BrBG",
      reverse = false
    } = settings;

    const legend = {
      domain,
      range,
      format,
      name,
      title,
      type,
      data,
      color,
      reverse
    };

    if (!domain.length) {
      legend.domain = calcDomain(type, data, range.length);
    }
    if (!range.length) {
      legend.range = calcRange(type, domain.length, color, reverse);
    }

    setLegend(legend);
  }, []);

  return [legend, createLegend];
}
