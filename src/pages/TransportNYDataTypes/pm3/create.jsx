import React, {
  useState,
  useReducer,
  useEffect,
  useContext,
  useMemo,
} from "react";
import get from "lodash/get";
import DatePicker from "react-datepicker";
import { DAMA_HOST } from "~/config";
import { useFalcor } from "@availabs/avl-falcor";
import { getExternalEnv } from "~/modules/dms/packages/dms/src/patterns/datasets/utils/datasources";
import { DatasetsContext } from '~/modules/dms/packages/dms/src/patterns/datasets/context.js';
import {
  SourceAttributes,
  ViewAttributes,
  getAttributes,
} from "~/pages/DataManager/Source/attributes";
import { MultiLevelSelect } from "~/modules/avl-map-2/src";

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
export default function Pm3Create({
  source = {},
  user = {},
  dataType = "npmrds",
  CustomAttributes = BlankComponent,
  newVersion
}) {
  const { name: damaSourceName, source_id: sourceId, type } = source;
  const { user: ctxUser, datasources } = useContext(DatasetsContext);
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = getExternalEnv(datasources);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, dispatch] = useReducer(reducer, {
    npmrdsSourceId: '',
    years: [2025],
    damaSourceId: sourceId,
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
  const { npmrdsSourceId, years, damaViewId } = state;
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
    if(years.length > 0) {
      setStartDate('');
      setEndDate('');
    }
  }, [years]);

  useEffect(() => {
    if(startDate || endDate){
      dispatch({ type: "update", payload: { years: [] } })
    }

  }, [startDate, endDate]);

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
      ? Object.keys(currentDataSource?.metadata?.npmrds_meta_layer_view_id || {}).map(
          (yearString) => parseInt(yearString)
        )
      : Array.from(
          Array(9)
            .keys()
            .map((k) => k + 2017)
        );
  }, [currentDataSource]);

  useEffect(() => {
    if (!years.length || !availableYears.some(sourceYear => years.includes(sourceYear))) {
      dispatch({ type: "update", payload: { years: [availableYears[0]] } })
    }
  }, [availableYears]);

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


  if (!sourceId && !damaSourceName) {
    return <div> Please enter a datasource name.</div>;
  }
  let errMsg = ''
  const isValidYearRange = (!startDate || !endDate) || (startDate && endDate && startDate.getFullYear() === endDate.getFullYear())
  if(!isValidYearRange){
    errMsg = 'Date range must be contained within the same calendar year.' 
  }

  const isButtonEnabled = (sourceId || damaSourceName) && (years.length || (startDate && endDate)) && npmrdsSourceId && isValidYearRange;
  return (
    <div className="w-full my-4">
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
              Choose an existing PM3 Version to append to (<b>must</b> use the same NPMRDS source)
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
              PM3 Versions
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
      <div className="flex flex-col items-center justify-center p-2">
        <div>Select full year(s) OR starting/ending dates</div>
        <div className="text-xs font-grey">Specific dates can only span a single year</div>
      </div>
      <div className="flex items-center justify-center p-2">
        <div className="w-full max-w-xs mx-auto">
          <div className="flex items-center justify-center">
            <div className="w-[60%]">
              <div className="flex px-2 pb-1 text-sm text-gray-600 capitalize">
                Year
              </div>
              <div className="flex pl-1">
                <MultiLevelSelect
                  isMulti={true}
                  placeholder={"Select year(s)"}
                  options={npmrdsSourceId ? availableYears : []}
                  value={years}
                  onChange={(e) => {
                    dispatch({ type: "update", payload: { years:e } })
                  }}
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
      <div className="md:flex md:items-center gap-4 flex-col">
        <div className="text-red-500 text-sm">
          {errMsg}
        </div>
        <div>
          <PublishPm3
            disabled={!isButtonEnabled}
            years={years}
            startDate={startDate}
            endDate={endDate}
            npmrdsSourceId={npmrdsSourceId}
            loading={loading}
            setLoading={setLoading}
            source_id={sourceId}
            view_id={damaViewId}
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
