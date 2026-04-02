import React, { useState, useMemo, useEffect, useReducer } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import get from "lodash/get";
import {
  Listbox,
  ListboxOption,
  ListboxOptions,
  ListboxButton,
  Transition,
} from "@headlessui/react";
import { DAMA_HOST } from "~/config";
import { useFalcor } from "@availabs/avl-falcor";
import { getExternalEnv } from "~/modules/dms/packages/dms/src/patterns/datasets/utils/datasources";
import { DatasetsContext } from '~/modules/dms/packages/dms/src/patterns/datasets/context.js';
import PublishMap21 from "./publish";
import {
  SourceAttributes,
  ViewAttributes,
  getAttributes,
} from "~/pages/DataManager/Source/attributes";

export function reducer(state, action) {
  if (action.type === "update") {
    return {
      ...state,
      ...action.payload,
    };
  }

  return state;
}

const Create = ({ source, newVersion, dataType="map21" }) => {
    const { name: damaSourceName, source_id: sourceId, type } = source;
  const [percentTmc, setPercentTmc] = useState(100);

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const [year, setYear] = useState(lastYear);
  const [loading, setLoading] = useState(false);

  const { user, datasources } = React.useContext(DatasetsContext);
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = getExternalEnv(datasources);

  const [state, dispatch] = useReducer(reducer, {
    npmrdsSourceId: '',
    percentTmc: 100,
    damaSourceId: source.id,
    damaViewId: '',
    damaSourceName: damaSourceName,
    userId: user?.id ?? ctxUser.id,
    email: user?.email ?? ctxUser.email,
    etlContextId: null,
    dataType: dataType,
    damaServerPath: `${DAMA_HOST}/dama-admin/${"npmrds"}`,
    sourceType: type,
    startDate: '',
    endDate: '',
  });
  const { npmrdsSourceId, damaViewId } = state;

  useEffect(() => {
    async function getData() {
      const lengthPath = [
        "uda",
        pgEnv,
        "sources",
        "byId",
        sourceId,
        "views",
        "length",
      ];

      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "uda",
        pgEnv,
        "sources",
        "byId",
        sourceId,
        "views",
        "byIndex",
        {
          from: 0,
          to: get(resp.json, lengthPath, 0) - 1,
        },
        Object.values(ViewAttributes),
      ]);
    }
    if(sourceId) {
      getData();
    }
  }, [sourceId])

  const views = useMemo(() => {
    return Object.values(
      get(
        falcorCache,
        ["uda", pgEnv, "sources", "byId", sourceId, "views", "byIndex"],
        {}
      )
    ).map((v) =>
      getAttributes(get(falcorCache, v.value, {}))
    );
  }, [falcorCache, sourceId, pgEnv]);


  //If viewId is selected, must use the same npmrdsSourceID
  useEffect(() => {
    if(damaViewId) {
      const curView = views.find(v => v.view_id === parseInt(damaViewId));
      dispatch({type:"update", payload:{npmrdsSourceId: curView.metadata.npmrds_prod_source_id}})
    }
  }, [damaViewId]);

  //if npmrdsSourceId is selected, cannot select an existing view to append to
  useEffect(() => {
    if(npmrdsSourceId) {
      if(damaViewId) {
        const curView = views.find(v => v.view_id === parseInt(damaViewId));
        if(!curView || parseInt(curView.metadata.npmrds_prod_source_id) !== parseInt(npmrdsSourceId) ) {
          dispatch({type:"update", payload:{damaViewId: ''}})
        }
      }
    }
  }, [npmrdsSourceId]);

  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["uda", pgEnv, "sources", "length"];
      const resp = await falcor.get(lengthPath);

      await falcor.get(
        [
          "uda",
          pgEnv,
          "sources",
          "byIndex",
          { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
          Object.values(SourceAttributes),
        ],
        ["dama-info", pgEnv, "settings"]
      );
    }

    fetchData();
  }, [falcor, pgEnv]);

  const sources = useMemo(() => {
    return Object.values(
      get(falcorCache, ["uda", pgEnv, "sources", "byIndex"], {})
    )
      .map((v) =>
        getAttributes(
          get(falcorCache, v.value, {})
        )
      )
      .filter((source) => source.type === "npmrds");
  }, [falcorCache, pgEnv]);

  const currentDataSource = useMemo(() => {
    return sources.find(
      (dataSource) => dataSource.source_id === parseInt(npmrdsSourceId)
    );
  }, [sources, npmrdsSourceId]);

  const availableYears = useMemo(() => {
    return currentDataSource
      ? Object.keys(currentDataSource?.metadata?.npmrds_meta_layer_view_id).map(
          (yearString) => parseInt(yearString)
        )
      : Array.from(
          Array(9)
            .keys()
            .map((k) => k + 2017)
        );
  }, [currentDataSource]);

  useEffect(() => {
    if (!year || !availableYears.includes(year)) {
      setYear(availableYears[0]);
    }
  }, [availableYears]);
  
  const yearInputClass = !npmrdsSourceId
    ? `w-full p-1 cursor-not-allowed bg-gray-200 hover:bg-gray-300 rounded-md`
    : `w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md`;
  
  return (
    <div className="w-full m-5">
      <div className="flex items-center justify-center p-2">
        <div className="flex flex-col items-center justify-center p-2">
          <div className="flex flex-col items-center">
            <div>
              Select a NPMRDS Production Source
            </div>
            {sourceId && (<>
              <div className="font-bold underline">
                or
              </div>
              <div>
                Choose an existing Map21 View to append to (<b>must</b> use the same NPMRDS source)
              </div>
            </>)}
          </div>

          <div className="flex gap-24">
            <div className="flex flex-col pt-2">
              <div className="flex px-2 text-sm text-gray-600 capitalize">
                NPMRDS Production Source
              </div>
              <div className="flex pl-1">
                <select
                  className={
                    "w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md"
                  }
                  onChange={(e) => {
                    dispatch({ type: "update", payload: { npmrdsSourceId: e.target.value } })
                  }}
                  value={npmrdsSourceId}
                >
                  <option value="">--</option>
                  {sources.map((source) => (
                    <option
                      value={source.source_id}
                      key={`map21_source_select_${source.source_id}`}
                    >
                      {source.name} -- {source.source_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {sourceId && (<div className="flex flex-col pt-2">
              <div className="flex px-2 text-sm text-gray-600 capitalize">
                Map21 View
              </div>
              <div className="flex pl-1">
                <select
                  className={
                    "w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md"
                  }
                  onChange={(e) => {
                    dispatch({ type: "update", payload: { damaViewId: e.target.value } })
                  }}
                  value={damaViewId}
                >
                  <option value="">--</option>
                  {views?.map((view) => (
                    <option key={`pm3_option_${view.view_id}`} value={view.view_id}>
                      {view.version || view.view_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>)}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-2">
        <div className="w-full max-w-xs mx-auto">
          <div className="flex items-center justify-center">
            <div className="w-[50%]">
              <div className="flex px-2 pb-1 text-sm text-gray-600 capitalize">
                Year
              </div>
              <div className="flex pl-1">
                <input
                  disabled={!npmrdsSourceId}
                  className={yearInputClass}
                  type="number"
                  max={availableYears[availableYears.length-1]}
                  min={availableYears[0]}
                  step={1}
                  onChange={(e) => {
                    setYear(e.target.value);
                  }}
                  value={year}
                />
              </div>
            </div>
            <div className="w-[50%]">
              <div className="flex px-2 pb-1 text-sm text-gray-600 capitalize">
                % of tmc
              </div>
              <div className="flex pl-1">
                <input
                  type="number"
                  min={.1}
                  max={100}
                  className={
                    "w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md"
                  }
                  step={.1}
                  onChange={(e) => {
                    setPercentTmc(parseFloat(e.target.value));
                  }}
                  value={percentTmc}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {npmrdsSourceId && year && source?.name ? (
        <PublishMap21
          source_id={source?.source_id || null}
          year={year}
          npmrdsSourceId={npmrdsSourceId}
          loading={loading}
          setLoading={setLoading}
          name={source?.name}
          type={source?.type}
          user_id={user?.id}
          view_id={damaViewId}
          email={user?.email}
          pgEnv={pgEnv}
          percentTmc={percentTmc}
          newVersion={newVersion}
        />
      ) : null}
    </div>
  );
};

export default Create;
