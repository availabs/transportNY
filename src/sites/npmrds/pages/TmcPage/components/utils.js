
import { format as d3format } from "d3-format"

export const tmcAttributes = [
  'aadt',
  'aadt_combi',
  'aadt_singl',
  'altrtename',
  'avg_speedlimit',
  // 'bounding_box',
  'county_code',
  'county_name',
  'direction',
  'f_system',
  'faciltype',
  'is_controlled_access',
  'miles',
  'tmclinear',
  'mpo_code',
  'mpo_name',
  'nhs',
  'nhs_pct',
  'roadname',
  'route_numb',
  'route_qual',
  'route_sign',
  'state',
  'state_code',
  'state_name',
  'strhnt_pct',
  'strhnt_typ',
  'structype',
  'thrulanes',
  'truck',
  'ua_code',
  'ua_name'
];

export const routeSigningCodes = {
  1: 'Not Signed',
  2: 'Interstate',
  3: 'U.S.',
  4: 'State',
  5: 'Off-Interstate Business Marker',
  6: 'County',
  7: 'Township',
  8: 'Municipal',
  9: 'Parkway Marker or Forest Route Marker',
  10: 'Other or Unknown'
};

export const routeQualifierCodes = {
  1: 'No qualifier or Not Signed',
  2: 'Alternate',
  3: 'Business Route',
  4: 'Bypass Business',
  5: 'Spur',
  6: 'Loop',
  7: 'Proposed',
  8: 'Temporary',
  9: 'Truck Route',
  10: 'Other or Unknown'
};

export const fSystemCodes = {
  1: 'Interstate',
  2: 'Principal Arterial – Other Freeways and Expressways',
  3: 'Principal Arterial – Other',
  4: 'Minor Arterial',
  5: 'Major Collector',
  6: 'Minor Collector',
  7: 'Local',
  8: "Unknown"
};

export const facilityTypeCodes = {
  1: 'One-Way Roadway',
  2: 'Two-Way Roadway',
  4: 'Ramp',
  5: 'Non Mainlane',
  6: 'Non Inventory Direction',
  7: 'Planned/Unbuilt',
  8: "Unknown"
};

export const nationalHighwaySystemCodes = {
  1: 'Non Connector NHS',
  2: 'Major Airport',
  3: 'Major Port Facility',
  4: 'Major Amtrak Station',
  5: 'Major Rail/Truck Terminal',
  6: 'Major Inter City Bus Terminal',
  7: 'Major Public Transportation or Multi-Modal Passenger Terminal',
  8: 'Major Pipeline Terminal',
  9: 'Major Ferry Terminal',
  0: "Unknown"
};

export const strategicHighwayNetworkCodes = {
  1: 'Regular STRAHNET',
  2: 'Connector',
  0: "Unknown"
};

export const numDaysPerMonth = year => {
  const map = {};
  for (let m = 1; m <= 12; ++m) {
    const date = new Date(year, m, 0);
    map[m] = +date.getDate();
  }
  return map;
}


const oneTwelfth = 1.0 / 12.0;
const tsFormat = d3format("02d");
const epochFormat = epoch => {
  return `${ tsFormat(parseInt(epoch * oneTwelfth)) }:${ tsFormat((epoch % 12) * 5) }`;
}
const fifteenFormat = f => epochFormat(f * 3)
const hourFormat = hour => {
	return `${ hour }:00`;
}

export const getResolutionGrouper = ({ bins }) => {
  return d => Math.floor(+d.ts.slice(11) / bins)
}

export const getResolutionFormat = ({ key }) => {
  switch (key) {
    case "5-min":
      return epochFormat;
    case "15-min":
      return fifteenFormat;
    case "hour":
      return hourFormat;
  }
}

export const Months = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December"
}
export const MonthKeys = Object.keys(Months);
export const MonthFormat = m => Months[m].slice(0, 3);
export const FullMonthFormat = m => Months[m];
