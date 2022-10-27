import React, { useEffect, useMemo, useState, useRef } from "react";
import { useFalcor, Button } from "modules/avl-components/src";
import { useSelector } from "react-redux";
// import { useParams } from 'react-router-dom'

import get from "lodash.get";

import GisDatasetLayer from "./GisDatasetLayer";
import { AvlMap } from "modules/avl-map/src";

import Create from "./create";
import config from "config.json";

import { selectPgEnv } from "pages/DataManager/store";

// import { getAttributes } from 'pages/DataManager/components/attributes'

const Map = ({ layers }) => {
  const mapOptions = {
    zoom: 6.2,
    center: [-75.95, 42.89],
    logoPosition: "bottom-right",
    styles: [
      {
        name: "Light",
        style: "mapbox://styles/am3081/ckm86j4bw11tj18o5zf8y9pou",
      },
      {
        name: "Blank Road Labels",
        style: "mapbox://styles/am3081/cl0ieiesd000514mop5fkqjox",
      },
      {
        name: "Dark",
        style: "mapbox://styles/am3081/ckm85o7hq6d8817nr0y6ute5v",
      },
    ],
  };

  const map_layers = useMemo(() => {
    return layers.map((l) => GisDatasetLayer(l));
  }, [layers]);

  return (
    <div className="w-full h-full">
      <AvlMap
        accessToken={config.MAPBOX_TOKEN}
        mapOptions={mapOptions}
        layers={map_layers}
        CustomSidebar={() => <div />}
      />
    </div>
  );
};


const Edit = ({ startValue, attr, viewId, parentData, cancel = () => {} }) => {
  const { falcor } = useFalcor();
  const [value, setValue] = useState("");
  const pgEnv = useSelector(selectPgEnv);

  /*const [loading, setLoading] = useState(false)*/
  const inputEl = useRef(null);

  useEffect(() => {
    setValue(startValue);
    inputEl.current.focus();
  }, [startValue]);

  useEffect(() => {
    inputEl.current.style.height = "inherit";
    inputEl.current.style.height = `${inputEl.current.scrollHeight}px`;
  }, [value]);

  const save = async (attr, value) => {
    if (viewId) {
      try {
        let update = JSON.parse(value);
        let val = parentData;
        val.tiles[attr] = update;
        // console.log('testing',JSON.stringify(val), val)
        await falcor.set({
          paths: [
            ["dama", pgEnv, "views", "byId", viewId, "attributes", "metadata"],
          ],
          jsonGraph: {
            dama: {
              [pgEnv]: {
                views: {
                  byId: {
                    [viewId]: {
                      attributes: { metadata: JSON.stringify(val) },
                    },
                  },
                },
              },
            },
          },
        });
        // console.log('set run', response)
        cancel();
      } catch (error) {
        // console.log('error stuff',error,value, parentData);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="w-full flex">
        <textarea
          ref={inputEl}
          className="flex-1 px-2 shadow text-base bg-blue-100 focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div>
        <Button
          themeOptions={{ size: "sm", color: "primary" }}
          onClick={() => save(attr, value)}
        >
          {" "}
          Save{" "}
        </Button>
        <Button
          themeOptions={{ size: "sm", color: "cancel" }}
          onClick={() => cancel()}
        >
          {" "}
          Cancel{" "}
        </Button>
      </div>
    </div>
  );
};

const MapPage = () => {
  // const { sourceId } = useParams()
  const [activeView /*, setActiveView*/] = useState(null);
  const [mapData /*, setMapData*/] = useState({});
  const [editing, setEditing] = React.useState(null);

  return (
    <div>
      Map View {/*{get(activeView,'id','')}*/}
      <div className="w-ful h-[700px]">
        <Map
          layers={[
            {
              name: "Test123",
              sources: get(mapData, "sources", []),
              layers: get(mapData, "layers", []),
            },
          ]}
        />
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {["sources", "layers"].map((attr, i) => {
            let val = JSON.stringify(get(mapData, attr, []), null, 3);
            return (
              <div key={i} className="flex justify-between group">
                <div className="flex-1 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 py-5">
                    {attr}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                    {editing === attr ? (
                      <div className="pt-3 pr-8">
                        <Edit
                          startValue={val}
                          attr={attr}
                          viewId={get(activeView, "id", null)}
                          parentData={get(activeView, "metadata", {})}
                          cancel={() => setEditing(null)}
                        />
                      </div>
                    ) : (
                      <div className="py-3 pl-2 pr-8">
                        <pre className="bg-gray-100 tracking-tighter overflow-auto scrollbar-xs">
                          {val}
                        </pre>
                      </div>
                    )}
                  </dd>
                </div>

                <div
                  className="hidden group-hover:block text-blue-500 cursor-pointer"
                  onClick={() =>
                    editing === attr ? setEditing(null) : setEditing(attr)
                  }
                >
                  <i className="fad fa-pencil absolute -ml-12 mt-3 p-2.5 rounded hover:bg-blue-500 hover:text-white " />
                </div>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
};

const Table = (/*{ source }*/) => {
  return <div> Table View </div>;
};

const AddView = ({ layers }) => { 
  return (
    <div className="w-full h-full">
      Add New View
    </div>
  );
};

const GisDatasetConfig = {
  map: {
    name: "Map",
    path: "/map",
    component: MapPage,
  },
  table: {
    name: "Table",
    path: "/table",
    component: Table,
  },
  sourceCreate: {
    name: "Create",
    component: Create,
  },
  addView: {
    name: 'Add View',
    path: '/view',
    component: AddView
  },
  pwrUsrOnly: false,
};

export default GisDatasetConfig;
