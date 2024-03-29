import React from "react";
import { useFalcor } from "~/modules/avl-components/src";
import get from "lodash/get";


let incidentsColors = {
  "accident": 'red',
  "construction": 'yellow',
  "other": 'blue'
}

const MeasureInfoBox = ({ layer, excludeFullNameInInfoBox = true }) => {
  const { falcor, falcorCache } = useFalcor();
  const [display, setDisplay] = React.useState({
    accident: true,
    construction: true,
    other:true
  });


    const startDate = `${layer.filters.year.value}-01-01`
    const endDate = `${layer.filters.year.value}-12-31`
    const bounds= layer.getBounds(layer.filters.geography.value)
    const boundingBox = layer.filters.geography.value.length > 0 ?
      [[bounds._sw.lng,bounds._sw.lat],[bounds._ne.lng,bounds._ne.lat]] : false


    const request = JSON.stringify([
        startDate, endDate,
        boundingBox,
        null,
        null
      ]);
    React.useEffect(() => {
      if(boundingBox){
        falcor.get(["transcom", "historical", "eventsData", request])
      }
    }, [request]);

  const incidentData = React.useMemo(() => {
    let data = get(falcorCache, ["transcom", "historical", "eventsData", request, 'value'], []);
    return data
  }, [request, falcorCache]);

  React.useEffect(() => {
    if (incidentData.length) {
      const collection = mapIncidents(incidentData, layer.mapboxMap);
      layer.mapboxMap.getSource("incidents-source").setData(collection);
    }
  }, [layer.mapboxMap, incidentData])

  React.useEffect(() => {
    let showData = ["nothing", ...Object.keys(display).filter(k => display[k])];
    layer.mapboxMap.setFilter('geo-incidents', ['match', ["get", "category"], showData, true, false]);
  }, [layer.mapboxMap, display]);

  // const incidentGeo = React.useMemo(() => {
  //   mapIncidents(incidentData,layer.mapboxMap, display)
  // },[incidentData])

  const incidentSummary = React.useMemo(() => {
    return incidentData.reduce((out,incident) => {
      if(!out[incident.event_category]){
        out[incident.event_category] = {
          count: 0,
          vehicle_delay: 0
        }
      }
      out[incident.event_category].count += 1
      out[incident.event_category].vehicle_delay += !isNaN(+incident.vehicle_delay) ?
        incident.vehicle_delay : 0
      return out
    },{})
  }, [incidentData])

  // console.log('incidentData', incidentData)

  return (
    <div className="p-1">
      <div className=" px-2">
        <div className='flex flex-col flex-wrap'>
          {Object.keys(incidentSummary).sort().map((category,ix) =>
           <div key={ix} className='flex-1 flex border-b border-gray-700 pt-2 h-12'>
              <div className={`pt-2 px-2 h-8 rounded-full`} style={{backgroundColor: incidentsColors[category]}}>
                <input type='checkbox'
                  checked={display[category]}
                  onChange={e => {
                    let newDisplay = {...display}
                    newDisplay[category] = !display[category]
                    let showData = Object.keys(newDisplay).filter(k => newDisplay[k])
                    setDisplay(newDisplay)
                  }}
                />
              </div>
              <div className=' text-npmrds-100 flex-1 py-2 text-center'>
                <div className=' text-npmrds-100'>{category.toUpperCase()} </div>
              </div>
              <div className='text-base text-npmrds-100 text-center'>
                <div className='text-xs text-npmrds-100 pr-2 '># of Events</div>
                {incidentSummary[category].count.toLocaleString()}
              </div>
              <div className='text-base text-npmrds-100 text-center'>
                <div className='text-xs text-npmrds-100 '>Delay (Vehicle Hours)</div>
                {incidentSummary[category].vehicle_delay
                  .toLocaleString("en", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                }
              </div>


           </div>
          )}
        </div>
      </div>
    </div>
  );
};
const mapIncidents = data => {

  return {
    type: "FeatureCollection",
    features: data.map((incident, i) => ({
       type: "Feature",
       id: i,
       properties: {
         event_id: incident.event_id,
         category: incident.event_category,
         color: incidentsColors[incident.event_category],
         open_time: incident.open_time,
         vehicle_delay: incident.vehicle_delay ? incident.vehicle_delay.toLocaleString() : 0,
         type: 'incident'
       },
       geometry: JSON.parse(incident.point)
    }))
  }

  // let incidentsGeo = { type: "FeatureCollection", features: [] };

  // data.forEach((incident, i) => {
  //    incidentsGeo.features.push({
  //       type: "Feature",
  //       id: i,
  //       properties: {
  //         event_id: incident.event_id,
  //         category: incident.event_category,
  //         color: incidentsColors[incident.event_category],
  //         open_time: incident.open_time,
  //         vehicle_delay: incident.vehicle_delay ? incident.vehicle_delay.toLocaleString() : 0,
  //         type: 'incident'
  //       },
  //       geometry: JSON.parse(incident.point)
  //   })
  // });
/*
  let source = {
    type: "geojson",
    data: incidentsGeo,
  };
  let newLayer = {
    id: "incidents",
    type: "circle",
    source: "incidents-source",
    paint: {
      "circle-radius": {
       stops: [[8, 1], [16, 8]]
      },
      'circle-opacity': [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.4,
        1
      ],
      "circle-color": ["string", ["get", "color"]],
    },
  };

  if (map.getLayer("incidents")) {
    let layerId = map.getLayer("incidents").id;
    let source = map.getLayer("incidents").source;
    map.removeLayer(layerId);
    map.removeSource(source);
  }
  map.addSource("incidents-source", source);
  map.addLayer(newLayer);
*/

  // map.getSource("incidents-source").setData(incidentsGeo);

  //console.log('incidentgeo', incidentsGeo)
  // return incidentsGeo;
};


export default MeasureInfoBox;
