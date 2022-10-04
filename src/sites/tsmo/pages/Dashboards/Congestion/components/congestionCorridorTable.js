import React from "react"

import get from "lodash.get";
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom'

import { format as d3format } from "d3-format"

import {
  useFalcor,
  /*useTheme,*/
  Table,
} from "modules/avl-components/src"

import {getTMCs, getCorridors} from './data_processing'

import { F_SYSTEM_MAP } from 'sites/tsmo/pages/Dashboards/components/metaData'


// const fFormat = d3format(",.1f")
// const floatFormat = f => (f === null) || isNaN(f) ? "no data" : fFormat(f);
const siFormat = d3format(".3s")

const TableColumns = [
  { accessor: "corridor",
    Header: "Rank",
    Cell: (d) => {
        //console.log('d', d)
        let rank = get(d, 'row.original.rank', ''),
          pm_rank = get(d, 'row.original.pm_rank', ''),
          change = rank - pm_rank

      return (
        <Link to={`/corridor/${d.row.original.corridor}/${d.row.original.year}-${d.row.original.month}`}>
          {rank}
          <span className='pl-2 text-sm w-full text-center'>
          {change === 0 ?
            <i className="fas fa-arrows-h"/> :
            change > 0 ?
            <span><i className="fas fa-arrow-down"/> {Math.abs(change)}</span> :
            <span><i className="fas fa-arrow-up"/> {Math.abs(change)}</span>
          }
          </span>
        </Link>
      )
    }
  },
  { accessor: "roadname",
    Header: "Road Name",
    Cell: (d) => {
      let from = get(d, 'row.original.from', ''),
          to = get(d, 'row.original.to', '')

      return (<div>
        <Link to={`/corridor/${d.row.original.corridor}/${d.row.original.year}-${d.row.original.month}`}>
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
        </Link>
      </div>)
    }
  },
  { accessor: "fsystem",
    Header: "F cls"
  },
  { accessor: "total_delay_per_mile",
    Header: "Delay / Mile",
    Cell: ({ value }) => siFormat(value)
  },
  { accessor: "total_delay",
    Header: () => <div>Total Delay</div>,
    Cell: ({ value }) => siFormat(value)
  }
]

const CongestionSegmentTable = ({ rawDelayData, setHoveredTMCs }) => {
  const {region, month: tableDate, fsystem } = useSelector(state => state.dashboard)
  const [year, month] = tableDate.split("-").map(Number),
        pm = (month - 2 + 12) % 12 + 1,
        prevYearMonth = `${ +pm === 12 ? year - 1 : year }-${ `0${ pm }`.slice(-2) }`;

  const { falcor, falcorCache } = useFalcor();

  const Years = React.useMemo(() => {
    return Object.keys(rawDelayData)
      .map((d) => +d)
      .sort((a, b) => a - b);
  }, [rawDelayData]);

  const f_systems = get(F_SYSTEM_MAP, fsystem, []);


  const tmcs = React.useMemo(() => getTMCs(rawDelayData,year,month,region,f_systems,prevYearMonth),
    [rawDelayData,year,month,region,f_systems,prevYearMonth]);

  //console.log('total', tmcs)

  React.useEffect(() => {
    if (Object.keys(tmcs).length) {
      falcor.chunk(
        [
        "tmc", Object.keys(tmcs), "meta", Years, ["length", "roadname", "tmclinear","road_order","county_code", "firstname", "direction"]
        ]
      );
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


  const corridors = React.useMemo(() =>
    getCorridors(tmcMetaData,year,tmcs)
      .slice(0, 15)
      .map(d => {
        d.month = (month+'').padStart(2,'0')
        return d
      })
    ,
    [tmcMetaData,year,tmcs,month]
  )

  const onRowEnter = React.useCallback((e, { original }) => {
    setHoveredTMCs(Object.values(original.tmcs));
  }, [setHoveredTMCs]);
  const onRowLeave = React.useCallback((e, { original }) => {
    setHoveredTMCs([]);
  }, [setHoveredTMCs]);

  
  return (
    <div>
       <Table
          data={ corridors }
          pageSize={15}
          columns={ TableColumns }
          disableFilters={ true }
          sortBy="total_delay_per_mile"
          sortOrder="DESC"
          onRowEnter={ onRowEnter }
          onRowLeave={ onRowLeave }
        />
    </div>
  )
}


export default CongestionSegmentTable
