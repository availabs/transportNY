import React from "react";

import { useParams } from "react-router-dom";

import { format as d3format } from "d3-format";


import get from "lodash.get";

import {
  useFalcor,
  useTheme,
  Select,
  ScalableLoading,
  Button,
  getColorRange,
} from "modules/avl-components/src";


import TmcMap from "./components/Map";
import IncidentGrid from './components/IncidentGrid'
import IncidentInfo, { IncidentTitle } from './components/IncidentInfo'
import CongestionInfo from './components/CongestionInfo'

import {
  capitalize,
  DelayFormat
} from "./components/utils";



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

const makeNpmrdsRequestKeys = (eventData) => {
  const congestion_data = get(eventData, ["congestion_data", "value"], null);
  if (!congestion_data) {
    return [[], [], null];
  }
  const {
    dates,
    tmcDelayData,
    delay,
    vehicleDelay,
    branches
  } = congestion_data;

  const tmcArray = branches
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



const branchSort = ((a, b) => {
  if (a.branch.length === b.branch.length) {
    return b.length - a.length;
  }
  return b.branch.length - a.branch.length;
})


const IncidentViewNew = ({}) => {
  const { event_id } = useParams(),
    { falcor, falcorCache } = useFalcor();

  const [activeBranches, setActiveBranches] = React.useState([null, null]);
  const setUpstreamBranch = React.useCallback(branch => {
    setActiveBranches(prev => [branch, prev[1]]);
  }, []);
  const setDownstreamBranch = React.useCallback(branch => {
    setActiveBranches(prev => [prev[0], branch]);
  }, []);

  const [requestKeys, setRequestKeys] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [showRaw, setShowRaw] = React.useState(true);
  

  React.useEffect(() => {
    setLoading(true)
  
    falcor.get([
      "transcom2",
      "eventsbyId",
      event_id,
      [
        "geom",
        "congestion_data"
      ]
    ]).then((d) => {
      console.log('got data', d)
      return setLoading(false)
    });
  }, [event_id, setLoading]);

  React.useEffect(() => {
    const eventData = get(
      falcorCache,
      ["transcom2", "eventsbyId", event_id],
      {}
    );
    const [requestKeys, tmcs, year] = makeNpmrdsRequestKeys(eventData);
    setRequestKeys(requestKeys);
    if (requestKeys.length) {
      
      falcor
        .get(
          ["routes", "data", requestKeys],
          ["tmc", tmcs, "meta", year,
            ["aadt", "length", "avg_speedlimit", "roadname", "firstname"]
          ],
          ["pm3", "measuresByTmc", tmcs, year, "freeflow_tt"]
        )
        // .then(() => loadingStop());
    }
  }, [falcorCache, event_id]);

  const eventData = React.useMemo(() => {
    const eData = get(
      falcorCache,
      ["transcom2", "eventsbyId", event_id],
      {}
    );
    
    const dKey = showRaw ? "rawDelay" : "delay";
    const vdKey = showRaw ? "rawVehicleDelay" : "vehicleDelay";

    const conData = get(eData, ["congestion_data", "value"], {}),
      delay = DelayFormat(get(conData, dKey, "No Data")),
      vDelay = DelayFormat(get(conData, vdKey, "No Data"));

    const { eventTmcs = [], startTime, endTime, dates = [""] } = conData;

    return eData;
  }, [event_id, falcorCache, showRaw]);

  const [upstreamBranches, downstreamBranches] = React.useMemo(() => {
    const conData = get(eventData, ["congestion_data", "value"], {}),
      { branches = [], dates = [] } = conData;;

    if (!branches.length) {
      return [[], []];
    }

    const year = get(dates, 0, "").slice(0, 4);

    const tmcKey = showRaw ? "rawTmcDelayData" : "tmcDelayData";

    const upBranches = branches
        .filter((b) => b.direction === "up-stream")
        .map(b => ({
          ...b,
          key: b.branch.join("|"),
          names: b.branch.reduce((a, c, i) => {
            const rn = get(falcorCache, ["tmc", c, "meta", year, "roadname"]);
            if (rn !== a[a.length - 1]) {
              a.push(rn);
            }
            return a;
          }, []).join(", "),
          delay: b.branch.reduce((a, c) => a + get(conData, [tmcKey, c], 0), 0)
        }))
        .sort((a, b) => b.delay - a.delay);
    const downBranches = branches
        .filter((b) => b.direction === "down-stream")
        .map(b => ({
          ...b,
          key: b.branch.join("|"),
          names: b.branch.reduce((a, c, i) => {
            const rn = get(falcorCache, ["tmc", c, "meta", year, "roadname"]);
            if (rn !== a[a.length - 1]) {
              a.push(rn);
            }
            return a;
          }, []).join(", "),
          delay: b.branch.reduce((a, c) => a + get(conData, [tmcKey, c], 0), 0)
        }))
        .sort((a, b) => b.delay - a.delay);

    return [upBranches, downBranches];
  }, [falcorCache, eventData, showRaw]);

  React.useEffect(() => {
    if (!activeBranches[0] && !activeBranches[1] && (upstreamBranches.length || downstreamBranches.length)) {
      setActiveBranches([
        get(upstreamBranches, [0, "key"], null),
        get(downstreamBranches, [0, "key"], null)
      ]);
    }
  }, [upstreamBranches, downstreamBranches, activeBranches]);

  

  return (
    <div className='w-full'>
      <div className={`max-w-7xl mx-auto mb-8`}>
        <div
          className={`
          fixed left-0 top-0 right-0 bottom-0 ${loading ? "flex" : "hidden"}
          justify-center items-center z-50 bg-black opacity-50
        `}
        >
          <ScalableLoading />
        </div>

        <div>
          <div className="grid grid-cols-2 gap-4">
            
            <div className='col-span-2 pt-4'>
              <IncidentTitle event_id={event_id} />
            </div>
            
            <IncidentInfo event_id={event_id} />
            
            <CongestionInfo event_id={event_id} />
            {/*<div className='bg-white shadow rounded p-4'>
              <div className="font-bold text-xl border-b-2 mb-1">
                Up Stream Branches
              </div>
              <Select options={ upstreamBranches }
                value={ activeBranches[0] }
                accessor={ d => d.names }
                valueAccessor={ d => d.key }
                onChange={ setUpstreamBranch }/>
           
              <div className="font-bold text-xl border-b-2 mb-1">
                Down Stream Branches
              </div>
              <Select options={ downstreamBranches }
                value={ activeBranches[1] }
                accessor={ d => d.names }
                valueAccessor={ d => d.key }
                onChange={ setDownstreamBranch }/>
            </div>*/}
          </div>
        </div>
      </div>
      <div className='max-w-7xl mx-auto flex'>
        <div className='w-1/3 py-10' style={{ minHeight: "40rem" }} >
             
          <TmcMap 
            eventData={eventData} 
            activeBranches={activeBranches} 
            showRaw={ showRaw }/>
        </div>

        <div className="flex-1 ">
          <IncidentGrid
            eventData={eventData}
            requestKeys={requestKeys}
            activeBranches={activeBranches}
          />
        </div>

      </div>
    </div>
  );
};


// const EventTmcs = ({ tmcs, year }) => {
//   return (
//     <div>
//       {tmcs.map((tmc) => (
//         <EventTmc key={tmc} tmc={tmc} year={year} />
//       ))}
//     </div>
//   );
// };
// const dFormat = d3format(",d"),
//   fFormat = d3format(",.2f"),
//   dirFormat = {
//     N: "northbound",
//     S: "southbound",
//     E: "eastbound",
//     W: "westbound",
//   };
// const EventTmc = ({ tmc, year }) => {
//   const { falcor, falcorCache } = useFalcor();
//   React.useEffect(() => {
//     falcor.get([
//       "tmc",
//       tmc,
//       "meta",
//       year,
//       ["aadt", "length", "direction", "roadname"],
//     ]);
//   }, [falcor]);
//   return (
//     <div className="grid grid-cols-3">
//       <div className="border-b col-span-3 font-bold">{tmc}</div>
//       <div className="col-span-3 grid grid-cols-12 gap-1">
//         <div className="col-span-3 font-bold">Road Name:</div>
//         <div className="col-span-6 text-right font-mono">
//           {get(falcorCache, ["tmc", tmc, "meta", year, "roadname"], null)}
//         </div>
//         <div className="col-span-3">
//           {
//             dirFormat[
//               get(falcorCache, ["tmc", tmc, "meta", year, "direction"], null)
//             ]
//           }
//         </div>
//       </div>
//       <div className="col-span-3 grid grid-cols-12 gap-1">
//         <div className="col-span-3 font-bold">AADT:</div>
//         <div className="col-span-6 text-right font-mono">
//           {dFormat(get(falcorCache, ["tmc", tmc, "meta", year, "aadt"], null))}
//         </div>
//       </div>
//       <div className="col-span-3 grid grid-cols-12 gap-1">
//         <div className="col-span-3 font-bold">Length:</div>
//         <div className="col-span-6 text-right font-mono">
//           {fFormat(
//             get(falcorCache, ["tmc", tmc, "meta", year, "length"], null)
//           )}
//         </div>
//         <div>miles</div>
//       </div>
//     </div>
//   );
// };





const config = {
  name: "Incident View",
  path: '/incidents/:event_id',
  auth: false,
  exact: true,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: IncidentViewNew
}

export default config;
