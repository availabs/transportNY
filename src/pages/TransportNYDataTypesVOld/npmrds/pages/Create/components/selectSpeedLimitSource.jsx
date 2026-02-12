import React, { useMemo, useContext, useEffect } from 'react';
import { DamaContext } from "~/pages/DataManager/store";
import { useFalcor } from "~/modules/avl-components/src";
import { get } from "lodash";
import {
  ViewAttributes,
  getAttributes,
} from "~/pages/DataManager/Source/attributes";


const SelectSpeedLimitSource = ({ dispatch, selectedViewId, selectedSourceId }) => {
  const { falcor, falcorCache } = useFalcor();
  const { pgEnv } = useContext(DamaContext);
  const handleSourceChange = (event) => {
    const selected = event.target.value;
    dispatch({ type: "update", payload: { selectedSourceId: selected } });
  };

  const handleViewChange = (event) => {
    const selected = event.target.value;
    dispatch({ type: "update", payload: { selectedViewId: selected } });
  };

  const tmcMetaSourcesPath = [
    "dama",
    pgEnv,
    "sources",
    "byCategory",
    "tmc_metadata",
  ]
  useEffect(() => {
    falcor.get(tmcMetaSourcesPath);
  }, [tmcMetaSourcesPath, falcor])

  const existingMetaSources = useMemo(() => {
    return get(falcorCache, tmcMetaSourcesPath, {})?.value
  },[falcorCache])

  useEffect(() => {
    async function getData() {
      console.log("getting data")
      const lengthPath = [
        "dama",
        pgEnv,
        "sources",
        "byId",
        selectedSourceId,
        "views",
        "length",
      ];

      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama",
        pgEnv,
        "sources",
        "byId",
        selectedSourceId,
        "views",
        "byIndex",
        {
          from: 0,
          to: get(resp.json, lengthPath, 0) - 1,
        },
        "attributes",
        Object.values(ViewAttributes),
      ]);
    }
    if(selectedSourceId) {
      getData();
    }
  }, [selectedSourceId])

  const views = useMemo(() => {
    return Object.values(
      get(
        falcorCache,
        ["dama", pgEnv, "sources", "byId", selectedSourceId, "views", "byIndex"],
        {}
      )
    ).map((v) =>
      getAttributes(get(falcorCache, v.value, { attributes: {} })["attributes"])
    );
  }, [falcorCache, selectedSourceId, pgEnv]);

  return (
    <div className='flex gap-4'>
      <div className='flex flex-col'>
        <label htmlFor="speedLimitSource">Select Speed Limit Source:</label>
        <select
          id="speedLimitSource"
          value={selectedSourceId}
          onChange={handleSourceChange}
        >
          <option value="" disabled>
            -- Select a TMC Meta Source --
          </option>
          {existingMetaSources?.map((source) => (
            <option key={`meta_s_option_${source.source_id}`} value={source.source_id}>
              {source.name}
            </option>
          ))}
        </select>
      </div>
      <div className='flex flex-col'>
        <label htmlFor="speedLimitView">Select Speed Limit View:</label>
        <select
          id="speedLimitView"
          value={selectedViewId}
          onChange={handleViewChange}
        >
          <option value="" disabled>
            -- Select a TMC Meta View --
          </option>
          {views?.map((view) => (
            <option key={`meta_s_option_${view.view_id}`} value={view.view_id}>
              {view.version || view.view_id}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectSpeedLimitSource;