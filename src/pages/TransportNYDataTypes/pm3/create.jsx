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


import PublishPm3 from "./publish";
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
export default function NpmrdsCreate({
  source = {},
  user = {},
  dataType = "npmrds",
  CustomAttributes = BlankComponent,
  newVersion
}) {
  const { name: damaSourceName, source_id: sourceId, type } = source;
  const { pgEnv, user: ctxUser, falcor, falcorCache } = useContext(DamaContext);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, dispatch] = useReducer(reducer, {
    npmrdsSourceId: '',
    year: 2025,
    damaSourceId: sourceId,
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
  console.log("state::",state)
  const { npmrdsSourceId, year } = state;

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
    if(year !== '') {
      setStartDate('');
      setEndDate('');
    }
  }, [year]);

  useEffect(() => {
          console.log({startDate})
    if(startDate){
      console.log("getyear",startDate.getFullYear());
      dispatch({ type: "update", payload: { year: '' } })
    }


  }, [startDate, endDate]);


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
      dispatch({ type: "update", payload: { year: availableYears[0] } })
    }
  }, [availableYears]);
  
  const yearInputClass = !npmrdsSourceId
    ? `flex-0 w-full p-1 cursor-not-allowed bg-gray-200 hover:bg-gray-300 rounded-md`
    : `flex-0 w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md`;

  if (!sourceId && !damaSourceName) {
    return <div> Please enter a datasource name.</div>;
  }

  const isButtonEnabled = (sourceId || damaSourceName) && (year || (startDate && endDate)) && npmrdsSourceId;
  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-center p-2">
        <div className="w-full max-w-xs mx-auto">
          <div className="flex flex-col pt-2">
            <div className="flex px-2 text-sm text-gray-600 capitalize">
              NPMRDS Production Source
            </div>
            <div className="flex pl-1">
              <select
                className={
                  "flex-0 w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md"
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
        </div>
      </div>
      <div className="flex items-center justify-center p-2">
        Select a year OR starting/ending dates
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
                    dispatch({ type: "update", payload: { year: e.target.value } })
                  }}
                  value={year}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="basis-1/2">
          <div className="flex items-center justify-left mt-4">
            <div className="w-full max-w-xs mx-auto">
              <div className="block text-sm leading-5 font-medium text-gray-700">
                Start Date
              </div>
              <div className="relative">
                <DatePicker
                  required
                  showIcon
                  toggleCalendarOnIconClick
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  maxDate={endDate}
                  isClearable
                />
              </div>
            </div>
          </div>
        </div>
        <div className="basis-1/2">
          <div className="flex items-center justify-left mt-4">
            <div className="w-full max-w-xs mx-auto">
              <div className="block text-sm leading-5 font-medium text-gray-700">
                End Date
              </div>
              <div className="relative">
                <DatePicker
                  required
                  showIcon
                  toggleCalendarOnIconClick
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  minDate={startDate}
                  isClearable
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="md:flex md:items-center gap-4">
        <PublishPm3
          disabled={!isButtonEnabled}
          year={year}
          startDate={startDate}
          endDate={endDate}
          npmrdsSourceId={npmrdsSourceId}
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
  );
}
