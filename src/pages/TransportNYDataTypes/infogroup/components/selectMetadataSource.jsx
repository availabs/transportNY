import React, { useMemo, useContext, useEffect } from 'react';
import { useFalcor } from "@availabs/avl-falcor";
import { getExternalEnv } from "~/modules/dms/packages/dms/src/patterns/datasets/utils/datasources";
import { DatasetsContext } from '~/modules/dms/packages/dms/src/patterns/datasets/context.js';
import { get } from "lodash";
import {
  ViewAttributes,
  getAttributes,
} from "~/pages/DataManager/Source/attributes";

/**
 * This needs a state key as well
 */
const SelectMetadataSource = ({ dispatch, stateMetadataPrefix, inputLabel="metadata", selectedViewId, selectedSourceId }) => {
  const { falcor, falcorCache } = useFalcor();
  const { datasources } = useContext(DatasetsContext);
  const pgEnv = getExternalEnv(datasources);
  const handleSourceChange = (event) => {
    const selected = event.target.value;
    dispatch({ type: "update", payload: { [`${stateMetadataPrefix}SourceId`]: selected } });
  };
  console.log({selectedViewId, selectedSourceId})
  const handleViewChange = (event) => {
    const selected = event.target.value;
    dispatch({ type: "update", payload: { [`${stateMetadataPrefix}ViewId`]: selected } });
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

  // useEffect(() => {
  //   async function getData() {
  //     console.log("getting data")
  //     const lengthPath = [
  //       "dama",
  //       pgEnv,
  //       "sources",
  //       "byId",
  //       selectedSourceId,
  //       "views",
  //       "length",
  //     ];

  //     const resp = await falcor.get(lengthPath);
  //     await falcor.get([
  //       "dama",
  //       pgEnv,
  //       "sources",
  //       "byId",
  //       selectedSourceId,
  //       "views",
  //       "byIndex",
  //       {
  //         from: 0,
  //         to: get(resp.json, lengthPath, 0) - 1,
  //       },
  //       "attributes",
  //       Object.values(ViewAttributes),
  //     ]).then(res => console.log("views res::", res));
  //   }
  //   if(selectedSourceId) {
  //     getData();
  //   }
  // }, [selectedSourceId])


  useEffect(() => {
    const getData = async () => {
      const lengthPath = [
        "uda",
        pgEnv,
        "sources",
        "byId",
        selectedSourceId,
        "views",
        "length",
      ];

      const resp = await falcor.get(lengthPath);

      const requests = [
        "uda",
        pgEnv,
        "sources",
        "byId",
        selectedSourceId,
        "views",
        "byIndex",
        {
          from: 0,
          to:
            get(
              resp.json,
              ["uda", pgEnv, "sources", "byId", selectedSourceId, "views", "length"],
              0
            ) - 1,
        },
        Object.values(ViewAttributes),
      ]
      falcor.get(requests);
    };

    if(selectedSourceId) {
      getData();
    }
  }, [falcor, selectedSourceId]);


  const views = useMemo(() => {
    console.log(falcorCache)
    return Object.values(
      get(
        falcorCache,
        ["uda", pgEnv, "sources", "byId", selectedSourceId, "views", "byIndex"],
        {},
      ),
    ).map((v) =>
      getAttributes(
        get(falcorCache, v.value, {}),
      ),
    );
  }, [falcorCache, selectedSourceId, pgEnv]);

  return (
    <div className='flex gap-4'>
      <div className='flex flex-col'>
        <label htmlFor="metadataSource">Select a source for {inputLabel}:</label>
        <select
          id="metadataSource"
          value={selectedSourceId}
          onChange={handleSourceChange}
        >
          <option value="" disabled>
            -- Select a Metadata Source --
          </option>
          {existingMetaSources?.map((source) => (
            <option key={`${stateMetadataPrefix}_source_option_${source.source_id}`} value={source.source_id}>
              {source.name}
            </option>
          ))}
        </select>
      </div>
      <div className='flex flex-col'>
        <label htmlFor="metadataView">Select a view for {inputLabel}:</label>
        <select
          id="metadataView"
          value={selectedViewId}
          onChange={handleViewChange}
        >
          <option value="" disabled>
            -- Select a Metadata View --
          </option>
          {views?.map((view) => (
            <option key={`${stateMetadataPrefix}_view_option_${view.view_id}`} value={view.view_id}>
              {view.version || view.view_id}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectMetadataSource;