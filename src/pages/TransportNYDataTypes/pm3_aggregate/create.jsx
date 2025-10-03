import React, {
  useState,
  useReducer,
  useEffect,
  useContext,
  useMemo,
} from "react";
import get from "lodash/get";
import DatePicker from "react-datepicker";
import { DamaContext } from "~/pages/DataManager/store";
import { DAMA_HOST } from "~/config";
import {
  SourceAttributes,
  ViewAttributes,
  getAttributes,
} from "~/pages/DataManager/Source/attributes";
import { MultiLevelSelect } from "~/modules/avl-map-2/src";

import PublishPm3Aggregate from "./publish";
export function reducer(state, action) {
  if (action.type === "update") {
    return {
      ...state,
      ...action.payload,
    };
  }

  return state;
}

const BlankComponent = () => <></>;
export default function Pm3Create({
  source = {},
  user = {},
  dataType = "npmrds",
  CustomAttributes = BlankComponent,
  newVersion
}) {
  const { name: damaSourceName, source_id: sourceId, type } = source;
  const { pgEnv, user: ctxUser, falcor, falcorCache } = useContext(DamaContext);
  console.log("in pm3 aggregate create")
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, dispatch] = useReducer(reducer, {
    pm3SourceId: '',
    pm3ViewId: '',
    damaSourceId: sourceId,
    damaSourceName: damaSourceName,
    userId: user?.id ?? ctxUser.id,
    email: user?.email ?? ctxUser.email,
    etlContextId: null,
    dataType: dataType,
    sourceType: type,
  });
  console.log("state::",state)
  const { pm3SourceId, pm3ViewId, years } = state;

  useEffect(() => {
    dispatch({ type: "update", payload: { damaSourceName } });
  }, [damaSourceName]);

  useEffect(() => {
    dispatch({ type: "update", payload: { sourceType: type } });
  }, [type]);

  useEffect(() => {
    dispatch({ type: "update", payload: { startDate } });
  }, [startDate]);

  useEffect(() => {
    dispatch({ type: "update", payload: { endDate } });
  }, [endDate]);

  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "sources", "length"];
      const resp = await falcor.get(lengthPath);

      await falcor.get(
        [
          "dama",
          pgEnv,
          "sources",
          "byIndex",
          { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
          "attributes",
          Object.values(SourceAttributes),
        ],
        ["dama-info", pgEnv, "settings"]
      );
    }

    fetchData();
  }, [falcor, pgEnv]);

  const sources = useMemo(() => {
    return Object.values(
      get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {})
    )
      .map((v) =>
        getAttributes(
          get(falcorCache, v.value, { attributes: {} })["attributes"]
        )
      )
      .filter((source) => source.type === "pm3");
  }, [falcorCache, pgEnv]);

  const currentDataSource = useMemo(() => {
    return sources.find(
      (dataSource) => dataSource.source_id === parseInt(pm3SourceId)
    );
  }, [sources, pm3SourceId]);

  useEffect(() => {
    async function getData() {
      console.log("getting view data")
      const lengthPath = [
        "dama",
        pgEnv,
        "sources",
        "byId",
        pm3SourceId,
        "views",
        "length",
      ];

      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama",
        pgEnv,
        "sources",
        "byId",
        pm3SourceId,
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
    if(pm3SourceId) {
      getData();
    }
  }, [pm3SourceId])

  const views = useMemo(() => {
    return Object.values(
      get(
        falcorCache,
        ["dama", pgEnv, "sources", "byId", pm3SourceId, "views", "byIndex"],
        {}
      )
    ).map((v) =>
      getAttributes(get(falcorCache, v.value, { attributes: {} })["attributes"])
    );
  }, [falcorCache, pm3SourceId, pgEnv]);
  console.log({views})

  useEffect(() => {
    if(views && views.length === 1) {
      dispatch({ type: "update", payload: { pm3ViewId: views[0].view_id } })
    }
  }, [views])

  if (!sourceId && !damaSourceName) {
    return <div> Please enter a datasource name.</div>;
  }
  let errMsg = ''
  console.log(!pm3SourceId)
  const isButtonEnabled = (sourceId || damaSourceName) && pm3SourceId && pm3ViewId;
  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-center p-2">
        <div className="w-full max-w-xs mx-auto">
          <div className="flex flex-col pb-2">
            <label htmlFor="pm3_source">Select PM3 Source:</label>
            <select
              id="pm3_source"
              className={
                "flex-0 w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md"
              }
              onChange={(e) => {
                dispatch({ type: "update", payload: { pm3SourceId: e.target.value } })
              }}
              value={pm3SourceId}
            >
              <option value="">--</option>
              {sources.map((source) => (
                <option
                  value={source.source_id}
                  key={`pm3_aggregate_source_select_${source.source_id}`}
                >
                  {source.name} -- {source.source_id}
                </option>
              ))}
            </select>
        
          </div>
          <div className='flex flex-col'>
            <label htmlFor="pm3View">Select PM3 View:</label>
            <select
              className={
                "flex-0 w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md"
              }
              id="pm3View"
              value={pm3ViewId}
              onChange={(e) => {
                dispatch({ type: "update", payload: { pm3ViewId: e.target.value } })
              }}
            >
              <option value="" disabled>
                -- Select a PM3 View --
              </option>
              {views?.map((view) => (
                <option key={`pm3_option_${view.view_id}`} value={view.view_id}>
                  {view.version || view.view_id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="md:flex md:items-center gap-4 flex-col">
        <div className="text-red-500 text-sm">
          {errMsg}
        </div>
        <div>
          <PublishPm3Aggregate
            disabled={!isButtonEnabled}
            years={years}
            startDate={startDate}
            endDate={endDate}
            pm3SourceId={pm3SourceId}
            pm3ViewId={pm3ViewId}
            loading={loading}
            setLoading={setLoading}
            source_id={sourceId}
            user_id={state.userId}
            email={state.email}
            name={source?.name}
            type={source?.type}
            pgEnv={pgEnv}
            newVersion={newVersion}
          />
        </div>

      </div>
    </div>
  );
}
