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

import {
  capitalize,
  DelayFormat
} from "./components/utils";

const Columns = [
  { id: "key", accessor: (d) => d.key, Header: () => null, colSpan: 1 },
  { id: "value", accessor: (d) => d.value, Header: () => null, colSpan: 3 },
];

const rawDataKeys = [
 "event_id",
 "event_class",
 "reporting_organization",
 "start_date_time",
 "end_date_time",
 "last_updatedate",
 "close_date",
 "estimated_duration_mins",
 "event_duration",
 "facility",
 "event_type",
 "lanes_total_count",
 "lanes_affected_count",
 "lanes_detail",
 "lanes_status",
 "description",
 "direction",
 "county",
 "city",
 "city_article",
 "primary_city",
 "secondary_city",
 "location_article",
 "primary_marker",
 "secondary_marker",
 "primary_location",
 "secondary_location",
 "state",
 "region_closed",
 "point_datum",
 "marker_units",
 "marker_article",
 "summary_description",
 "eventstatus",
 "is_highway",
 "icon_file",
 //"start_incident_occured",
 "started_at_date_time_comment",
 // "incident_reported",
 "incident_reported_comment",
 //"incident_verified",
 "incident_verified_comment",
 "response_identified_and_dispatched",
 "response_identified_and_dispatched_comment",
 "response_arrives_on_scene",
 "response_arrives_on_scene_comment",
 // "end_all_lanes_open_to_traffic",
 "ended_at_date_time_comment",
 "response_departs_scene",
 "response_departs_scene_comment",
 "time_to_return_to_normal_flow",
 "time_to_return_to_normal_flow_comment",
 "no_of_vehicle_involved",
 "secondary_event",
 "secondary_event_types",
 "secondary_involvements",
 "within_work_zone",
 "truck_commercial_vehicle_involved",
 "shoulder_available",
 "injury_involved",
 "fatality_involved",
 "maintance_crew_involved",
 "roadway_clearance",
 "incident_clearance",
 "time_to_return_to_normal_flow_duration",
 "duration",
 "associated_impact_ids",
 "secondary_event_ids",
 "is_transit",
 "is_shoulder_lane",
 "is_toll_lane",
 "lanes_affected_detail",
 "to_facility",
 "to_state",
 "to_direction",
 "fatality_involved_associated_event_id",
 "with_in_work_zone_associated_event_id",
 "to_lat",
 "to_lon",
 "primary_direction",
 "secondary_direction",
 "is_both_direction",
 "secondary_lanes_affected_count",
 "secondary_lanes_detail",
 "secondary_lanes_status",
 "secondary_lanes_total_count",
 "secondary_lanes_affected_detail",
 "event_location_latitude",
 "event_location_longitude",
 "tripcnt",
 "tmclist",
 "recoverytime",
 "year",
 "datasource",
 "datasourcevalue",
 "day_of_week",
 // "tmcs_arr",
 // "event_interval",
 "nysdot_display_in_incident_dashboard",
 "nysdot_general_category",
 "nysdot_sub_category",
 "nysdot_detailed_category",
 "nysdot_waze_category",
 "nysdot_display_if_lane_closure",
 "nysdot_duration_accurate",
 
];

const getTableValue = (key, eData) => {
  switch (key) {
    case "event_category":
    case "event_type":
      return capitalize(eData[key]);
    case "open_time":
    case "close_time":
    case "creation":
      return new Date(eData[key]).toLocaleString();
    case "duration": {
      const dur = eData[key];
      const [days, hours, mins] = dur.split(/[-:]/g).map(Number);
      return [
        days ? `${ days } day${ days > 1 ? "s": "" }` : "",
        hours ? `${ hours } hour${ hours > 1 ? "s": "" }` : "",
        mins ? `${ mins } minute${ mins > 1 ? "s": "" }` : ""
      ].filter(Boolean).join(", ")
    }
    default:
      return eData[key];
  }
};



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
        ...rawDataKeys,
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

  const [eventData, rawData] = React.useMemo(() => {
    const eData = get(
      falcorCache,
      ["transcom2", "eventsbyId", event_id],
      {}
    );

    const rData = Object.keys(eData)
      .filter((key) => rawDataKeys.includes(key))
      .map((key) => {
        console.log('key')
        return {
          key: capitalize(key),
          value: getTableValue(key, eData),
        }
      })
      

    
    const dKey = showRaw ? "rawDelay" : "delay";
    const vdKey = showRaw ? "rawVehicleDelay" : "vehicleDelay";

    const conData = get(eData, ["congestion_data", "value"], {}),
      delay = DelayFormat(get(conData, dKey, "No Data")),
      vDelay = DelayFormat(get(conData, vdKey, "No Data"));


    const { eventTmcs = [], startTime, endTime, dates = [""] } = conData;

    
    return [eData, rData];
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

        <div className={` `}>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-3xl font-bold border-b-4 col-span-2">
              TRANSCOM EVENT ID: {event_id}
            </div>

            <div className='bg-white shadow rounded p-4'>
              <div className="grid col-spans-1 gap-2">
                <div className="grid grid-cols-4 gap-2 text-lg">
                  {rawData.map(({ key, value }) => (
                    <React.Fragment key={key}>
                      <div className="col-span-1 font-bold">{key}</div>
                      <div className="col-span-3">{value}</div>
                    </React.Fragment>
                  ))}
                </div>

                <div className="font-bold text-2xl border-b-2 grid grid-cols-3">
                  <div className="col-span-2">
                    Calculated Data ({ showRaw ? "unfilled" : "filled" })
                  </div>
                  <div className="col-span-1">
                    {/*<Button block onClick={ () => setShowRaw(!showRaw) }>
                      Toggle Data
                    </Button>*/}
                  </div>
                </div>
                
              </div>
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
            </div>
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


const EventTmcs = ({ tmcs, year }) => {
  return (
    <div>
      {tmcs.map((tmc) => (
        <EventTmc key={tmc} tmc={tmc} year={year} />
      ))}
    </div>
  );
};
const dFormat = d3format(",d"),
  fFormat = d3format(",.2f"),
  dirFormat = {
    N: "northbound",
    S: "southbound",
    E: "eastbound",
    W: "westbound",
  };
const EventTmc = ({ tmc, year }) => {
  const { falcor, falcorCache } = useFalcor();
  React.useEffect(() => {
    falcor.get([
      "tmc",
      tmc,
      "meta",
      year,
      ["aadt", "length", "direction", "roadname"],
    ]);
  }, [falcor]);
  return (
    <div className="grid grid-cols-3">
      <div className="border-b col-span-3 font-bold">{tmc}</div>
      <div className="col-span-3 grid grid-cols-12 gap-1">
        <div className="col-span-3 font-bold">Road Name:</div>
        <div className="col-span-6 text-right font-mono">
          {get(falcorCache, ["tmc", tmc, "meta", year, "roadname"], null)}
        </div>
        <div className="col-span-3">
          {
            dirFormat[
              get(falcorCache, ["tmc", tmc, "meta", year, "direction"], null)
            ]
          }
        </div>
      </div>
      <div className="col-span-3 grid grid-cols-12 gap-1">
        <div className="col-span-3 font-bold">AADT:</div>
        <div className="col-span-6 text-right font-mono">
          {dFormat(get(falcorCache, ["tmc", tmc, "meta", year, "aadt"], null))}
        </div>
      </div>
      <div className="col-span-3 grid grid-cols-12 gap-1">
        <div className="col-span-3 font-bold">Length:</div>
        <div className="col-span-6 text-right font-mono">
          {fFormat(
            get(falcorCache, ["tmc", tmc, "meta", year, "length"], null)
          )}
        </div>
        <div>miles</div>
      </div>
    </div>
  );
};





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
