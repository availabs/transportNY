import React from "react"

import { format as d3format } from "d3-format"

export const capitalize = string =>
  !string ? string : string.split(/\s|_|-|(?<!^)(?=[A-Z])/)
    .map(word => word.split("").map((c, i) => i === 0 ? c.toUpperCase() : c).join(""))
    .join(" ");

export const useComponentDidMount = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    return () => { setMounted(false); };
  }, [])
  return mounted;
}

const numFormat = d3format(",d");
const zeroPad = v => +v < 10 ? `0${ v }` : numFormat(v);

export const DelayFormat = v => {
  if (isNaN(v)) return v;

  const hours = Math.floor(v),
    _minutes = 60 * (v - hours),
    minutes = Math.floor(_minutes),
    seconds = Math.round(60 * (_minutes - minutes));
  return `${ zeroPad(hours) }:${ zeroPad(minutes) }:${ zeroPad(seconds) }`;
}
