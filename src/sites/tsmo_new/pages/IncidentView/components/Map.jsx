import React from "react";
import get from "lodash/get";
import { AvlMap } from "~/modules/avl-map/src";
import config from "~/config.json"

import {
  useFalcor,
} from "~/modules/avl-components/src";

import layers from './IncidentLayer'
const { ConflationLayer, PointLayer } = layers
const MAPBOX_TOKEN = config.MAPBOX_TOKEN;

const TSMO_VIEW_ID = 1947;
const TMC_META_VIEW_ID = 984;
const Map = ({ event_id, activeBranch }) => {

  console.log('event_id', event_id, activeBranch);
  const { falcor, falcorCache } = useFalcor();
  console.log('what is the falcor cache?', falcorCache);

  React.useEffect(() => {
    falcor.get([
      "transcom3",
      TSMO_VIEW_ID,
      "eventsbyId",
      event_id,
      [
        "congestion_data",
        "start_date_time",
        "geom"
      ]
    ])
  }, [event_id, falcor]);

  const congestionData = React.useMemo(() => {
    return get(
      falcorCache,
      ["transcom3", TSMO_VIEW_ID, "eventsbyId", event_id, "congestion_data", "value"],
      {}
    );
  }, [event_id, falcorCache]);

  const eventData = {
    'open_time': congestionData?.startTime,
    'close_time': congestionData?.endTime
  };

  // const eventData = [];
  const tmcs = React.useMemo(() => Object.keys(get(congestionData, 'rawTmcDelayData', {}))
    , [congestionData])

  const year = React.useMemo(() => {
    const start_date = get(
      falcorCache,
      ["transcom3", TSMO_VIEW_ID, "eventsbyId", event_id, "start_date_time"],
      new Date().toISOString() //if no date, use now 
    );
    return new Date(start_date).getFullYear();
  }, [event_id, falcorCache]);

  const point = React.useMemo(() => {
    let point = get(
      falcorCache,
      ["transcom3", TSMO_VIEW_ID, "eventsbyId", event_id, "geom", "value"],
      null
    );
    return point
  }, [event_id, falcorCache]);

  const showRaw = true


  console.log("point: ", point);

  const layers = React.useRef([new ConflationLayer(), new PointLayer()]);
  const layerProps = React.useMemo(() => {
    return {
      [layers.current[0].id]: { tmcs, year, point, congestionData, showRaw, activeBranch },
      [layers.current[1].id]: { point, eventData },
    };
  }, [tmcs, year, point, congestionData, activeBranch, showRaw]);
  console.log('what is the layerProps: ', layerProps);

  return congestionData ?
    <div className='bg-white p-2' style={{ minHeight: "50rem", color: 'rgb(180, 180, 180)' }} >
      <AvlMap
        accessToken={MAPBOX_TOKEN}
        navigationControl={false}
        layers={layers.current}
        layerProps={layerProps}
        sidebar={false}
      />
    </div>
    : <span />

};
export default Map;


/*const [prevTmcs, setPrevTmcs] = React.useState([]);

const { tmcs, ways, year, point } = React.useMemo(() => {
  let mData = {
    tmcs: [],
    ways: [],
    year: null,
    point: null,
  };
  if (!eventData) {
    return mData;
  }
  const congestionData = get(eventData, ["congestion_data", "value"], null);
  if (!congestionData) {
    return mData;
  }

  const branchMap = congestionData.branches.reduce((a, c) => {
    a[c.branch.join("|")] = c;
    return a;
  }, {})

  const upBranch = get(branchMap, activeBranches[0], { branch: [], ways: [] });
  const downBranch = get(branchMap, activeBranches[1], { branch: [], ways: [] });

  // const upBranch = get(activeBranches, 0, { branch: [], ways: [] });
  // const downBranch = get(activeBranches, 1, { branch: [], ways: [] });

  mData.tmcs = [...new Set([...upBranch.branch, ...downBranch.branch])];
  mData.ways = [...new Set([...upBranch.ways, ...downBranch.ways])].map((id) => +id);

  const open_time = new Date(eventData.open_time);
  mData.year = open_time.getFullYear();

  mData.point = get(eventData, ["geom", "value"], null);

  return mData;
}, [eventData, activeBranches]);*/
