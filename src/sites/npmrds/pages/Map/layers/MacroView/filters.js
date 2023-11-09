import get from 'lodash.get'
import { getColorRange } from "../../utils"

const YEARS = [/*2022, */2021, 2020, 2019, 2018, 2017, 2016];

const filters = {
  geography: {
    name: 'Geography',
    type: 'select',
    domain: [],
    value: [],
    searchable: true,
    accessor: d => d.name,
    valueAccessor: d => d.value,
    multi: true,
  },
  network: {
    name: "Network",
    type: "select",
    value: "tmc",
    multi: false,
    searchable: false,
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "TMC", value: "tmc" },
      { name: "Conflation", value: "con" },
      // { name: "RIS", value: "ris" }
    ]
  },
  conflation: {
    name: "Conflation",
    type: "select",
    value: "tmc",
    multi: false,
    searchable: false,
    accessor: d => d.name,
    valueAccessor: d => d.value,
    active: false,
    domain: [
      { name: "TMC", value: "tmc" },
      { name: "RIS", value: "ris" },
      { name: "OSM", value: "osm" }
    ]
  },

  year: {
    name: 'Year',
    type: "select",
    multi: false,
    domain: [...YEARS],
    value: YEARS[0]
  },
  compareYear: {
    name: 'Compare Year',
    type: 'select',
    multi: false,
    domain: ["none", ...YEARS],
    value: "none",

  },
  measure: {
    name: 'Performance Measure',
    type: 'select',
    domain: [],
    value: 'lottr',
    searchable: true,
    multi: false,
    accessor: d => d.name,
    valueAccessor: d => d.value
  },
  freeflow: {
    name: "Threshold Speed",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "Freeflow", value: true },
      { name: "Speed Limit", value: false }
    ],
    value: true,
    multi: false,
    searchable: false,
    active: false
  },
  risAADT: {
    name: "AADT Source",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "RIS", value: true },
      { name: "NPMRDS", value: false }
    ],
    value: false,
    multi: false,
    searchable: false,
    active: false
  },
  fueltype: {
    name: "Fuel Type",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "Total (Gasoline & Diesel)", value: "total" },
      { name: "Gasoline", value: "gas" },
      { name: "Diesel", value: "diesel" }
    ],
    value: "total",
    multi: false,
    searchable: false,
    active: false
  },
  pollutant: {
    name: "Pollutant",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "CO² (Carbon Dioxide)", value: "co2" },
      { name: "CO (Carbon Monoxide)", value: "co" },
      { name: "NOx (Nitrogen Oxides)", value: "nox" },
      { name: "VOC (Volatile organic compound)", value: "voc" },
      { name: "PM₂.₅ (Fine Particles <= 2.5 microns)", value: "pm2_5" },
      { name: "PM₁₀ (Particulate Matter <= 10 microns)", value: "pm10" }
    ],
    value: "co2",
    multi: false,
    searchable: false,
    active: false
  },
  perMiles: {
    name: "Sum By",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "Per Mile", value: true },
      { name: "Total", value: false }
    ],
    value: true,
    multi: false,
    searchable: false,
    active: false
  },
  vehicleHours: {
    name: "Unit",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "Vehicle Hours", value: true },
      { name: "Person Hours", value: false }
    ],
    value: false,
    value: false,
    multi: false,
    searchable: false,
    active: false
  },
  percentiles: {
    name: "Percentile",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    multi: false,
    domain: [
      { name: "5th Percentile", value: "5pctl" },
      { name: "20th Percentile", value: "20pctl" },
      { name: "25th Percentile", value: "25pctl" },
      { name: "50th Percentile", value: "50pctl" },
      { name: "75th Percentile", value: "75pctl" },
      { name: "80th Percentile", value: "80pctl" },
      { name: "85th Percentile", value: "85pctl" },
      { name: "95th Percentile", value: "95pctl" }
    ],
    value: null,
    active: false
  },
  trafficType: {
    name: "Traffic Type",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "All Traffic", value: "all" },
      { name: "All Trucks", value: "truck" },
      { name: "Single Unit Trucks", value: "singl" },
      { name: "Combination Trucks", value: "combi" },
    ],
    value: 'all',
    active: false
  },
  peakSelector: {
    name: "Peak Selector",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [],
    value: null,
    multi: false,
    active: false
  },
  attributes: {
    name: "Attributes",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [],
    value: null,
    multi: false,
    active: false
  }
}

const updateSubMeasures = (measure, filters, falcor) => {
  const {
    // fetchData,
    peakSelector,
    freeflow,
    risAADT,
    perMiles,
    vehicleHours,
    attributes,
    percentiles,
    trafficType,
    fueltype,
    pollutant
  } = filters;

  const cache = falcor.getCache();

  const mIds = get(cache, ["pm3", "measureIds","value"], []);
  const mInfo = get(cache, ["pm3", "measureInfo"], {});

  peakSelector.active = false;
  peakSelector.domain = [];
  trafficType.active = false;
  trafficType.value = 'all'

  freeflow.active = false;
  risAADT.active = false;
  perMiles.active = false;
  vehicleHours.active = false;
  percentiles.active = false;

  attributes.active = false;

  fueltype.active = false;
  pollutant.active = false;

  switch (measure) {
    case "emissions":
      peakSelector.active = true;

      fueltype.active = true;
      fueltype.value = "total";
      pollutant.active = true;
      pollutant.value = "co2";

      peakSelector.domain = [
        { name: "No Peak", value: "none" },
        { name: "AM Peak", value: "am" },
        { name: "Off Peak", value: "off" },
        { name: "PM Peak", value: "pm" },
        { name: "Overnight", value: "overnight" },
        { name: "Weekend", value: "weekend" }
      ]
      risAADT.active = true;
      break;
    case "RIS":
      attributes.active = true;
      attributes.domain = mIds.filter(m => /^RIS_/.test(m))
        .map(id => ({
          name: get(mInfo, [id, "fullname"], id),
          value: id.replace("RIS_", "")
        }));
      break;
    case "TMC":
      attributes.active = true;
      attributes.domain =  mIds.filter(m => /^TMC_/.test(m)).filter(m => m !== "TMC_tmc")
        .map(id => ({
          name: get(mInfo, [id, "fullname"], id),
          value: id.replace("TMC_", "")
        }));
      break;
    case "lottr":
      peakSelector.active = true;
      peakSelector.domain = [
        { name: "No Peak", value: "none" },
        { name: "AM Peak", value: "am" },
        { name: "Off Peak", value: "off" },
        { name: "PM Peak", value: "pm" },
        { name: "Weekend", value: "weekend" }
      ]
      break;
    case "tttr":
      peakSelector.active = true;
      peakSelector.domain = [
        { name: "No Peak", value: "none" },
        { name: "AM Peak", value: "am" },
        { name: "Off Peak", value: "off" },
        { name: "PM Peak", value: "pm" },
        { name: "Overnight", value: "overnight" },
        { name: "Weekend", value: "weekend" }
      ]
      break;
    case "phed":
      peakSelector.active = true;
      peakSelector.domain = [
        { name: "No Peak", value: "none" },
        { name: "AM Peak", value: "am" },
        { name: "PM Peak", value: "pm" }
      ]
      freeflow.active = true;
      risAADT.active = true;
      perMiles.active = true;
      vehicleHours.active = true;
      trafficType.active = true;
      break;
    case "ted":
      freeflow.active = true;
      risAADT.active = true;
      perMiles.active = true;
      vehicleHours.active = true;
      trafficType.active = true;
      break;
    case "pti":
    case "tti":
      peakSelector.active = true;
      peakSelector.domain = [
        { name: "No Peak", value: "none" },
        { name: "AM Peak", value: "am" },
        { name: "PM Peak", value: "pm" }
      ]
      break;
    case "pct_bins_reporting":
      peakSelector.active = true;
      peakSelector.domain = [
        { name: "No Peak", value: "none" },
        { name: "AM Peak", value: "am" },
        { name: "Off Peak", value: "off" },
        { name: "PM Peak", value: "pm" },
        { name: "Overnight", value: "overnight" },
        { name: "Weekend", value: "weekend" }
      ]
      peakSelector.value = 'none';
    break;
    case "speed":
      peakSelector.active = true;
      peakSelector.domain = [
        { name: "No Peak", value: "total" },
        { name: "AM Peak", value: "am" },
        { name: "Off Peak", value: "off" },
        { name: "PM Peak", value: "pm" },
        { name: "Overnight", value: "overnight" },
        { name: "Weekend", value: "weekend" }
      ]
      percentiles.active = true;
      break;
    default:
      break;
  }

  if (!peakSelector.domain.reduce((a, c) => a || (c.value === peakSelector.value), false)) {
    peakSelector.value = measure === "speed" ? "total" : "none";
  }
  if ((measure !== "phed") && (measure !== "ted")) {
    freeflow.value = false;
    perMiles.value = false;
    vehicleHours.value = false;
  } else {
    freeflow.value = true;
    perMiles.value = true;
    vehicleHours.value = true;
  }

  risAADT.value = false;

  percentiles.value = null;
  attributes.value = null;
}

const getMeasure = (filters) => {
  const {
    measure,
    peakSelector,
    freeflow,
    risAADT,
    perMiles,
    vehicleHours,
    attributes,
    percentiles,
    trafficType,
    fueltype,
    pollutant
  } = filters;

  const out = [
    measure.value,
    (trafficType.value !== "all") && trafficType.value,
    freeflow.value && "freeflow",
    risAADT.value ? "ris" : false,
    fueltype.active && (fueltype.value !== "total") ? fueltype.value : false,
    pollutant.active && pollutant.value,
    fueltype.active && (fueltype.value === "gas") ? "pass" : false,
    fueltype.active && (fueltype.value === "diesel") ? "truck" : false,
    perMiles.value && "per_mi",
    vehicleHours.value && "vhrs",
    (measure.value === "speed") && percentiles.value,
    (peakSelector.value !== "none") && peakSelector.value,
    attributes.value
  ].filter(Boolean).join("_")

// console.log("GET MEASURE:", out);

  const NOT_MEASURES = ["RIS", "TMC", "speed_total"]

  if (NOT_MEASURES.includes(out)) {
    return ""
  }

  return out
}

const getMeasureName = (falcor, measure) => {
  let path = ["pm3", "measureInfo", measure, "fullname"]
  return get(falcor.getCache(path), path, "Measure");
}

const updateLegend = (filters, legend) => {
  if (filters.compareYear.value === "none") {
    switch (filters.measure.value) {
      case 'lottr':
        legend.range = getColorRange(get(legend, 'range.length', 7), "RdYlBu", true).reverse()
        legend.format = ",.2~f";
        break;
       case 'tttr':
        legend.range = getColorRange(get(legend, 'range.length', 7), "RdYlGn", true).reverse()
        legend.format = ",.2~f";
        break;
      case 'freeflow':
        legend.range = getColorRange(get(legend, 'range.length', 7), "RdPu", true)
        legend.format = ",.0~f";
        break;
      case 'pti':
        legend.range = getColorRange(get(legend, 'range.length', 7), "PRGn", true)
        legend.format = ",.2~f";
        break;
      case 'pti':
        legend.range = getColorRange(get(legend, 'range.length', 7), "PiYG", true)
        legend.format = ",.2~f";
        break;
      case 'phed':
        legend.range = getColorRange(get(legend, 'range.length', 7), "YlOrRd", true)
        legend.format = ",.2~s";
        break;
      case 'ted':
        legend.range = getColorRange(get(legend, 'range.length', 7), "YlOrBr", true)
        legend.format = ",.2~s";
      case 'emissions':
        legend.range = getColorRange(get(legend, 'range.length', 7), "Oranges", true)
        legend.format = ",.2~s";
        break;
      case 'speed':
        legend.range = getColorRange(get(legend, 'range.length', 7), "Spectral", true)
        legend.format = ",.0~f";
        break;
      case 'pct_bins_reporting':
        legend.range = getColorRange(get(legend, 'range.length', 7), "RdYlGn", true)
        // legend.domain = [.1,.25,.5, .75, .9]
        legend.format = ",.2~f";
        break;
      default:
        legend.range = getColorRange(get(legend, 'range.length', 7), "Reds");
        legend.format = ",.2~s";
        break;
    }
  }
  else {
    //legend.type = "threshold";
    legend.domain = [-.30, -.20, -.10, 0, .10, .20, .30];
    legend.range = getColorRange(get(legend, 'range.length', 7), "RdYlGn").reverse();
    legend.format = ",.0%";
  }
}


const getNetwork = (filters) => {
  if(filters.network.value == 'con') {
    return filters.conflation.value
  }
  return filters.network.value
}

const setActiveLayer = (layers, filters, mapboxMap) => {
  // console.log('setLayers ', filters.network.value, filters.year.value)
  return layers
    .map(l => l.id)
    .filter(l => l !== 'traffic_signals_layer')
    .map(l => {
      let output = null
      let type = l.split('-')[0]
      let year = l.split('-')[1]
      let checkYear = filters.network.value === 'con' ? 2019 : filters.year.value
      if(type === filters.network.value && +year === +checkYear) {
        output = l
        mapboxMap.setLayoutProperty(
          l,'visibility','visible'
        )
      } else if(type !== 'geo'){
        mapboxMap.setLayoutProperty(
          l,'visibility','none'
        )
      }
      return output
    }).filter(d => d)

}


// export filters
// export updateSubMeasures
// export getMeasure
// export getMeasureName
export {
  filters,
  updateSubMeasures,
  getMeasure,
  getMeasureName,
  updateLegend,
  getNetwork,
  setActiveLayer

}
