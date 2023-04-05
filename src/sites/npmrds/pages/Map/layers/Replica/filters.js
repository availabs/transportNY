import get from 'lodash.get'
import { getColorRange } from "../../utils"
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
      { name: "RIS", value: "ris" },
      { name: "OSM", value: "osm" }
    ]
  },
  year: {
    name: 'Year',
    type: "select",
    multi: false,
    domain: [2016, 2017, 2018, 2019,2020, 2021],
    value: 2019
  },
  compareYear: {
    name: 'Compare Year',
    type: 'select',
    multi: false,
    domain: ["none", 2016, 2017, 2018, 2019],
    value: "none",
    active: false
    
  },
  measure: {
    name: 'Performance Measure',
    type: 'select',
    domain: [],
    value: 'OSM',
    searchable: true,
    multi: false,
    accessor: d => d.name,
    valueAccessor: d => d.value,
    active:false
  },
  freeflow: {
    name: "Use Freeflow",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "True", value: true },
      { name: "False", value: false }
    ],
    value: false,
    multi: false,
    searchable: false,
    active: false
  },
  risAADT: {
    name: "Use RIS AADT",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "True", value: true },
      { name: "False", value: false }
    ],
    value: false,
    multi: false,
    searchable: false,
    active: false
  },
  perMiles: {
    name: "Show Per Mile",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "True", value: true },
      { name: "False", value: false }
    ],
    value: false,
    multi: false,
    searchable: false,
    active: false
  },
  vehicleHours: {
    name: "Show Vehicle Hours",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "True", value: true },
      { name: "False", value: false }
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
      { name: "All Traffic", value: "" },
      { name: "All Trucks", value: "truck" },
      { name: "Single Unit Trucks", value: "singl" },
      { name: "Combination Trucks", value: "combi" },
    ],
    value: '',
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
    value: 'replica_aadt',
    multi: false,
    active: false
  }
}

const updateSubMeasures = (measure, filters, falcor, state) => {
  const {
    // fetchData,
    peakSelector,
    freeflow,
    risAADT,
    perMiles,
    vehicleHours,
    attributes,
    percentiles,
    trafficType
  } = filters;
  const mIds = get(falcor.getCache(["pm3", "measureIds"]), ["pm3", "measureIds","value"], [])
  const mInfo = get(falcor.getCache(["pm3", "measureInfo"]), ["pm3", "measureInfo"], {});

  peakSelector.active = false;
  peakSelector.domain = [];
  trafficType.active = false;
  trafficType.value = ''

  freeflow.active = false;
  risAADT.active = false;
  perMiles.active = false;
  vehicleHours.active = false;
  percentiles.active = false;

  //attributes.active = false;
  

  switch (measure) {
    case "emissions":
      peakSelector.active = true;
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
      attributes.domain =  mIds.filter(m => /^TMC_/.test(m))
        .map(id => ({
          name: get(mInfo, [id, "fullname"], id),
          value: id.replace("TMC_", "")
        }));
      break;
    case "OSM":
      attributes.active = true;
      // attributes.domain =  mIds.filter(m => /^OSM_/.test(m))
      //   .map(id => ({
      //     name: get(mInfo, [id, "fullname"], id),
      //     value: id.replace("OSM_", "")
      //   }));

      attributes.domain.push({
        name: 'Replica AADT',
        value: 'OSM_replica_aadt'
      },
      {
        name: 'RIS AADT',
        value: 'RIS_aadt_current_yr_est'
      },
      {
        name: 'Compare vs RIS',
        value: 'COMP-OSM_replica_aadt-RIS_aadt_current_yr_est'
      })
      attributes.value = 'OSM_replica_aadt'
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
  }
  if ((measure !== "phed") && (measure !== "ted") && (measure !== "emissions")) {
    risAADT.value = false;
  }

  percentiles.value = null;
  
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
  } = filters;
  return [
    measure.value,
    trafficType.value,
    freeflow.value && "freeflow",
    risAADT.value && "ris",
    perMiles.value && "per_mi",
    vehicleHours.value && "vhrs",
    (measure.value === "speed") && percentiles.value,
    (peakSelector.value !== "none") && peakSelector.value,
    attributes.value
  ].filter(Boolean).join("_")
}

const getMeasureName = (falcor, measure) => {
  let path = ["pm3", "measureInfo", measure, "fullname"]
  return get(falcor.getCache(path), path, "Measure");
}

const updateLegend = (filters, legend) => {
  console.log('update legend',getMeasure(filters).indexOf('COMP') )
  if (getMeasure(filters).indexOf('COMP') === -1) {
    switch (filters.measure.value) {
      case 'lottr':
        legend.range = getColorRange(get(legend, 'range.length', 6), "RdYlBu", true).reverse()
        legend.format = ",.2~f";
        break;
       case 'tttr':
        legend.range = getColorRange(get(legend, 'range.length', 6), "RdYlGn", true).reverse()
        legend.format = ",.2~f";
        break;
      case 'freeflow':
        legend.range = getColorRange(get(legend, 'range.length', 6), "RdPu", true)
        legend.format = ",.0~f";
        break;
      case 'pti':
        legend.range = getColorRange(get(legend, 'range.length', 6), "PRGn", true)
        legend.format = ",.2~f";
        break;
      case 'pti':
        legend.range = getColorRange(get(legend, 'range.length', 6), "PiYG", true)
        legend.format = ",.2~f";
        break;
      case 'phed':
        legend.range = getColorRange(get(legend, 'range.length', 6), "YlOrRd", true)
        legend.format = ",.2~s";
        break;
      case 'ted':
        legend.range = getColorRange(get(legend, 'range.length', 6), "YlOrBr", true)
        legend.format = ",.2~s";
      case 'emissions':
        legend.range = getColorRange(get(legend, 'range.length', 6), "Oranges", true)
        legend.format = ",.2~s";
        break;
      case 'speed':
        legend.range = getColorRange(get(legend, 'range.length', 6), "Spectral", true)
        legend.format = ",.0~f";
        break;
      default:
        legend.range = getColorRange(get(legend, 'range.length', 6), "Reds");
        legend.format = ",.2~s";
        break;
    }
  }
  else {
    legend.type = "threshold";
    legend.domain = [-1,-.30, -.20, -.10, 0, .10, .20, .30,1];
    legend.range = getColorRange(9, "RdYlGn").reverse();
    legend.format = ",.0%";
  }
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
  updateLegend

}