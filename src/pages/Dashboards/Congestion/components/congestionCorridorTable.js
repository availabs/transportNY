import React from "react"

import get from "lodash.get";
import { useSelector } from 'react-redux';

import { format as d3format } from "d3-format"

import {
  useFalcor,
  /*useTheme,*/
  Table,
} from "modules/avl-components/src"

import { F_SYSTEMS } from 'pages/Dashboards/components//metaData'

const fFormat = d3format(",.1f")
const floatFormat = f => (f === null) || isNaN(f) ? "no data" : fFormat(f);



const CongestionSegmentTable = ({rawDelayData}) => {
  // const theme = useTheme()
  const {region, month: tableDate, /*fsystem*/} = useSelector(state => state.dashboard)
  const [year, month] = tableDate.split("-").map(Number)
        // py = year - 1,
        // pm = (month - 2 + 12) % 12 + 1,
        // prevMonth = `${ pm == 12 ? year - 1 : year }-${ `0${ pm }`.slice(-2) }`,
        // prevYear = `${ py }-${ `0${ month }`.slice(-2) }`,
        // prevYearMonth = `${ pm == 12 ? py - 1 : py }-${ `0${ pm }`.slice(-2) }`;

  const { falcor, falcorCache } = useFalcor();

  console.log('update', year,month)

  const Years = React.useMemo(() => {
    return Object.keys(rawDelayData)
      .map((d) => +d)
      .sort((a, b) => a - b);
  }, [rawDelayData]);

  
  const tmcs = React.useMemo(() => {
    let total = F_SYSTEMS.reduce((out,fclass) => {
      // console.log('tmcs get', rawDelayData, get(rawDelayData,`[${year}][${+month}][${region}][${fclass}].total.value`,[]))
      get(rawDelayData,`[${year}][${+month}][${region}][${fclass}].total.value`,[])
        .forEach(tmc => {
          if(!out[tmc.tmc]){
            out[tmc.tmc] = tmc 
          }
        })
      return out 
    },{})

     F_SYSTEMS.forEach((fclass) => {
      // console.log('tmcs get', rawDelayData, get(rawDelayData,`[${year}][${+month}][${region}][${fclass}].total.value`,[]))
      get(rawDelayData,`[${year}][${+month}][${region}][${fclass}].non_recurrent.value`,[])
        .forEach(tmc => {
          if(total[tmc.tmc]){
            total[tmc.tmc].non_recurrent = tmc.value 
          }
        })
      
    },{})

    return total
  }, [rawDelayData,year,month,region]);

  React.useEffect(() => {
    if (Object.keys(tmcs).length) {
      falcor.chunk([
        "tmc", Object.keys(tmcs), "meta", Years, ["length", "roadname", "tmclinear","road_order","county_code", "firstname", "direction"]
      ]);
    }
  }, [falcor, tmcs, Years]);


  const [tmcMetaData, setTmcMetaData] = React.useState({});
  React.useEffect(() => {

    const data = Object.keys(tmcs).reduce((a, c) => {
      a[c] = Years.reduce((aa, cc) => {
        const d = get(falcorCache, ["tmc", c, "meta", cc], null);
        if (d) {
          aa[cc] = d;
        }
        return aa;
      }, {});
      return a;
    }, {});
    setTmcMetaData(data);
  }, [falcorCache, tmcs, Years]);


  const corridors = React.useMemo(() => {
    let corridors = Object.keys(tmcMetaData).reduce((corridors,tmcId) => {
      let tmc = tmcMetaData[tmcId]
      
      let tmcLinear = get(tmc, `[${year}].tmclinear`, false)
      let county_code = get(tmc, `[${year}].county_code`, false)
      let direction = get(tmc, `[${year}].direction`, false)

      //console.log('tmcs', tmcLinear, tmc, tmc[year], year)
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

        corridors[corridor].tmcs[tmc[year].road_order*10] = tmcId 
        corridors[corridor].total_delay += get(tmcs,`[${tmcId}].value`,0)
        corridors[corridor].non_recurrent_delay += get(tmcs,`[${tmcId}].non_recurrent`,0)
        corridors[corridor].recurrent_delay += get(tmcs,`[${tmcId}].value`,0) - get(tmcs,`[${tmcId}].non_recurrent`,0)

      }        
      return corridors
    },{})

    return Object.values(corridors).map((c,i) => {
      c.roadname = c.roadnames.join(',')
      c.direction = c.directions.join(',')
      c.fsystem = c.fsystems.join(',')
      c.total_delay_per_mile = c.total_delay / c.length
      c.recurrent_delay_per_mile = c.recurrent_delay / c.length
      c.non_recurrent_delay_per_mile = c.non_recurrent_delay / c.length
      c.from = tmcMetaData[Object.values(c.tmcs)[0]][year].firstname
      c.to = tmcMetaData[Object.values(c.tmcs)[Object.values(c.tmcs).length-1]][year].firstname
      return c
    })
    .sort((a,b) => b.total_delay_per_mile - a.total_delay_per_mile)
    .filter(d => d.length > 2)

  },[tmcMetaData,year,tmcs]) 
  
  return (
    <>
      <div>
         <Table 
            data={ corridors }
            columns={[
              // { accessor: "corridor",
              //   Header: "TMC",
              //   disableSortBy: true
              // },
              { accessor: "roadname",
                Header: "Road Name",
                Cell: (d) => {
                  let from = get(d, 'row.original.from', ''),
                      to = get(d, 'row.original.to', '')

                  return (<div>
                    <div>
                      {get(d, 'row.original.roadname', '')} 
                      <span className='font-bold text-sm'>
                      &nbsp;{get(d, 'row.original.direction','')}
                      </span>
                      <span className='font-bold text-sm float-right text-gray-500'>
                      &nbsp;{get(d, 'row.original.length',0).toFixed(2)} mi
                      </span>
                    </div>
                    <div className='text-xs font-italic text-gray-600'> 
                      {from} {from !== to ? `to ${to}` : ''}
                    </div>
                  </div>)
                } 
              },
              { accessor: "fsystem",
                Header: "F cls"
              },
              { accessor: "total_delay_per_mile",
                Header: "Delay / Mile",
                Cell: ({ value }) => floatFormat(value)
              },
              { accessor: "total_delay",
                Header: () => <div>Total Delay</div>,
                Cell: ({ value }) => floatFormat(value)
              }
            ]}
            disableFilters={ true }
            sortBy="total_delay_per_mile"
            sortOrder="DESC"
          />
      </div>
    </>
   
  )
}


export default CongestionSegmentTable