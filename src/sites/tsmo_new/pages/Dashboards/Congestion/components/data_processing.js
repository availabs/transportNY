import get from "lodash/get";

export const getTMCs = (rawDelayData,year,month,region,f_systems,prevYearMonth) => {
  let total = f_systems.reduce((out,fclass) => {
      get(rawDelayData,`[${year}][${+month}][${region}][${fclass}].delay.value`,[])
        .forEach(tmc => {
          if(!out[tmc.tmc]){
            out[tmc.tmc] = tmc
          }
        })
      return out
    },{})

    // console.log('total', total)
    f_systems.forEach((fclass,i) => {
      get(rawDelayData,`[${prevYearMonth.split('-')[0]}][${+prevYearMonth.split('-')[1]}][${region}][${fclass}].delay.value`,[])
        .forEach(tmc => {
          if(total[tmc.tmc]){
            total[tmc.tmc].pm_total = tmc.total
            total[tmc.tmc].pm_non_recurrent = tmc.non_recurrent
          }
        })
    })
    return total
}

export const getCorridors = (tmcMetaData,year,tmcs) => {
  let corridors = Object.keys(tmcMetaData).reduce((corridors,tmcId) => {
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
            recurrent_delay: 0,
            non_recurrent_delay: 0,
            total_delay: 0,
            pm_total_delay: 0,
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
        corridors[corridor].total_delay += get(tmcs,`[${tmcId}].total`,0)
        corridors[corridor].pm_total_delay += get(tmcs,`[${tmcId}].pm_total`,0)
        corridors[corridor].non_recurrent_delay += get(tmcs,`[${tmcId}].non_recurrent`,0)
        corridors[corridor].recurrent_delay += get(tmcs,`[${tmcId}].total`,0) - get(tmcs,`[${tmcId}].non_recurrent`,0)

      }
      return corridors
    },{})

    //console.log('corridors corridors', corridors)

    return Object.values(corridors).map((c,i) => {
      c.roadname = c.roadnames.join(',')
      c.direction = c.directions.join(',')
      c.fsystem = c.fsystems.join(',')
      c.year = year
      c.total_delay_per_mile = c.total_delay / c.length
      c.pm_total_delay_per_mile = c.pm_total_delay / c.length
      c.recurrent_delay_per_mile = c.recurrent_delay / c.length
      c.non_recurrent_delay_per_mile = c.non_recurrent_delay / c.length
      c.from = tmcMetaData[Object.values(c.tmcs)[0]][year].firstname
      c.to = tmcMetaData[Object.values(c.tmcs)[Object.values(c.tmcs).length-1]][year].firstname
      return c
    })
    .filter(d => d.length > 2)
    .sort((a,b) => b.pm_total_delay_per_mile - a.pm_total_delay_per_mile)
    .map((cor,i) => {
      cor.pm_rank = i+1
      return cor
    })
    .sort((a,b) => b.total_delay_per_mile - a.total_delay_per_mile)
    .map((cor,i) => {
      cor.rank = i+1
      return cor
    })
}

export const calcCost = (delay, { aadt, aadt_combi, aadt_singl }) => {
  // if (!delay || !aadt) return 0;
  // return (aadt - aadt_combi - aadt_singl) / aadt * delay * 1.66 * 17 +
  //         (aadt_combi + aadt_singl) / aadt * delay * 33


   // Convert to numbers safely
  const d   = Number(delay);
  const a   = Number(aadt);
  const c   = Number(aadt_combi);
  const s   = Number(aadt_singl);

  // Bail out if invalid or zero denominator
  if (!Number.isFinite(d) || !Number.isFinite(a) || a <= 0) {
    return 0;
  }

  const mainlineRatio = (a - c - s) / a * d * 1.66 * 17 ;
  const truckRatio    = (c + s) / a * d * 33;

  const cost = mainlineRatio  +
               truckRatio ;

  // Handle NaN/Infinity just in case
  return Number.isFinite(cost) ? cost : 0;
}
