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

const Map = ({ event_id, activeBranch, view_id }) => {
  const { falcor, falcorCache } = useFalcor();

  console.log("event_id ", event_id );
  console.log("view_id ", view_id );
  
  React.useEffect(() => {
    async function load() {
      if (event_id) {
        await falcor.get([
          "uda",
          ["npmrds2"],
          "viewsById",
          [view_id],
          "options",
          JSON.stringify({ filter: { event_id: [event_id] } }),
          "dataByIndex",
          { "from": 0, "to": 1},
          ["event_id", "congestion_data"]
        ])
      }
    }
    load();
  }, [falcor, event_id]);

  const data = React.useMemo(() =>
    Object.values(get(
      falcorCache,
      ["uda", "npmrds2", "viewsById", view_id, "options", JSON.stringify({ filter: { event_id: [event_id] } }), "dataByIndex"],
      []
    )).map(v => ({
      event_id: v.event_id?.value ?? v.event_id,
      congestion_data: v.congestion_data?.value ?? v.congestion_data
    })
    ).find(f => f.event_id === event_id),
    [falcorCache, event_id]
  );

  const congestionData = React.useMemo(() => {
    return data?.congestion_data;
  }, [data]);

  const eventData = {
    'open_time': congestionData?.startTime,
    'close_time': congestionData?.endTime
  };

  const tmcs = React.useMemo(() => Object.keys(get(congestionData, 'rawTmcDelayData', {}))
    , [congestionData])

  const year = React.useMemo(() => {
    const start_date = get(
      falcorCache,
      ["transcom2", "eventsbyId", event_id, "start_date_time"],
      new Date().toISOString() //if no date, use now 
    );
    return new Date(start_date).getFullYear();
  }, [event_id, falcorCache]);

  const point = React.useMemo(() => {
    let point = get(
      falcorCache,
      ["transcom2", "eventsbyId", event_id, "geom", "value"],
      null
    );
    return point
  }, [event_id, falcorCache]);

  const showRaw = true

  const layers = React.useRef([new ConflationLayer(), new PointLayer()]);
  const layerProps = React.useMemo(() => {
    return {
      [layers.current[0].id]: { tmcs, year, point, congestionData, showRaw, activeBranch },
      [layers.current[1].id]: { point, eventData },
    };
  }, [tmcs, year, point, congestionData, activeBranch, showRaw]);

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