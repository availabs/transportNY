import React from "react"

import { format as d3format } from "d3-format"
import get from 'lodash/get'

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

export const getCorridors = (tmcMetaData,year,tmcs,congestionData) => { 
  let corridors = tmcs.reduce((corridors,tmcId) => {
      let tmc = tmcMetaData[tmcId]

      let tmcLinear = get(tmc, `[${year}].tmclinear`, false)
      let county_code = get(tmc, `[${year}].county_code`, false)
      let direction = get(tmc, `[${year}].direction`, false)

      let corridor = `${county_code}_${tmcLinear}_${direction}`

      if(tmcLinear) {
        if(!corridors[corridor]) {
          corridors[corridor] = {
            corridor: corridor,
            roadnames: [],
            directions: [],
            fsystems: [],
            length: 0,
            tmcs: {},           
            total_delay: 0,
          }
        }
        corridors[corridor].length += tmc[year].length
        if(!corridors[corridor].roadnames.includes(tmc[year].roadname)){
          corridors[corridor].roadnames.push(tmc[year].roadname)
        }
        if(!corridors[corridor].directions.includes(tmc[year].direction)){
          corridors[corridor].directions.push(tmc[year].direction)
        }
        if(get(tmcs,`[${tmcId}].fsystem`,false) && !corridors[corridor].fsystems.includes(tmcs[tmcId].fsystem)){
          corridors[corridor].fsystems.push(tmcs[tmcId].fsystem)
        }
        // console.log(get(tmcs,`[${tmcId}].total`,0), tmcId)
        corridors[corridor].tmcs[tmc[year].road_order*10] = tmcId
        corridors[corridor].total_delay += get(congestionData,`[${tmcId}]`,0)
        

      }
      return corridors
    },{})

    //console.log('corridors corridors', corridors)
  
    return Object.values(corridors).map((c,i) => {
      c.roadname = c.roadnames.join(',')
      c.direction = c.directions.join(',')
      c.fsystem = c.fsystems.join(',')
      c.from = tmcMetaData[Object.values(c.tmcs)[0]][year].firstname
      c.to = tmcMetaData[Object.values(c.tmcs)[Object.values(c.tmcs).length-1]][year].firstname
      return c
    })
    .filter(d => d.total_delay > 0)
    
}

const Weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const getNpmrdsDate = date =>
  +`${ date.getFullYear() }${ `00${ date.getMonth() + 1 }`.slice(-2) }${ `00${ date.getDate() }`.slice(-2) }`;

export const makeNpmrdsRequestKeys = (congestion_data) => {
  if (!congestion_data.dates) {
    return [[], [], null];
  }
  const {
    dates,
    branches
  } = congestion_data;

  console.log('utils makeNpmrdsRequestKeys', branches)
  const tmcArray = [...branches]
    .sort((a, b) => a.branch.length - b.branch.length)
    .reduce((a, { branch }) => {
      branch.forEach((tmc) => {
        if (!a.includes(tmc)) {
          // && tmcs.includes(tmc)) {
          a.push(tmc);
        }
      });
      return a;
    }, []);

  const year = dates[0].slice(0, 4);

  const keys = dates.map(date => {
    const [year, month, day] = date.split("-"),
      mDate = new Date(year, +month - 1, day),
      dow = mDate.getDay(),
      npmrdsDate = getNpmrdsDate(mDate);

    // console.log("DATE:", date, mDate, dow , npmrdsDate);

    return [
      tmcArray,
      npmrdsDate,
      npmrdsDate,
      0,
      288,
      [Weekdays[dow]],
      "5-minutes",
      "travel_time_all",
      "travelTime",
      encodeURI(JSON.stringify({})),
      "ny"
    ].join("|");
  });

  keys.push([
    tmcArray,
    +`${year}0101`,
    +`${year}1231`,
    0,
    288,
    Weekdays.slice(1, 6),
    "5-minutes",
    "travel_time_all",
    "travelTime",
    encodeURI(JSON.stringify({})),
    "ny"
  ].join("|"));

  return [keys, tmcArray, year];
};

