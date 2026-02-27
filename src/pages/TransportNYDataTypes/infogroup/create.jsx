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

import SelectMetadataSource from "./components/selectMetadataSource";


import PublishInfogroup from "./publish";
export function reducer(state, action) {
  if (action.type === "update") {
    return {
      ...state,
      ...action.payload,
    };
  }

  return state;
}

export const MPO_BOUNDARIES_PREFIX = "mpoBoundaries"
export const UA_BOUNDARIES_PREFIX = "uaBoundaries"
export const REGION_BOUNDARIES_PREFIX = "regionBoundaries"
export const RAW_INFOGROUP_PREFIX = "rawInfogroup"
const BlankComponent = () => <></>;
export default function InfogroupCreate({
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
    [`${MPO_BOUNDARIES_PREFIX}SourceId`]: '',
    [`${MPO_BOUNDARIES_PREFIX}ViewId`]: '',
    [`${UA_BOUNDARIES_PREFIX}SourceId`]: '',
    [`${UA_BOUNDARIES_PREFIX}ViewId`]: '',
    [`${REGION_BOUNDARIES_PREFIX}SourceId`]: '',
    [`${REGION_BOUNDARIES_PREFIX}ViewId`]: '',
    [`${RAW_INFOGROUP_PREFIX}SourceId`]: '',
    [`${RAW_INFOGROUP_PREFIX}ViewId`]: '',
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
  const isMetadataProvided =
    !!state[`${MPO_BOUNDARIES_PREFIX}ViewId`] &&
    !!state[`${MPO_BOUNDARIES_PREFIX}SourceId`] &&
    !!state[`${UA_BOUNDARIES_PREFIX}ViewId`] &&
    !!state[`${UA_BOUNDARIES_PREFIX}SourceId`] &&
    !!state[`${REGION_BOUNDARIES_PREFIX}ViewId`] &&
    !!state[`${REGION_BOUNDARIES_PREFIX}SourceId`] && 
    !!state[`${RAW_INFOGROUP_PREFIX}ViewId`] &&
    !!state[`${RAW_INFOGROUP_PREFIX}SourceId`];
  const isButtonEnabled = (sourceId || damaSourceName) && isMetadataProvided;
  return (
    <div className="w-full my-4">
      <div className="flex flex-col items-center justify-center p-2">

      </div>

      <div className="md:flex md:items-center gap-4 flex-col">
        <div className="text-red-500 text-sm">
          {errMsg}
        </div>
        <div className="md:flex md:items-center gap-4">
          <div className="flex flex-col gap-4">
            <SelectMetadataSource
              dispatch={dispatch}
              stateMetadataPrefix={RAW_INFOGROUP_PREFIX}
              selectedViewId={state[`${RAW_INFOGROUP_PREFIX}ViewId`]}
              selectedSourceId={state[`${RAW_INFOGROUP_PREFIX}SourceId`]}
              inputLabel="Raw Infogroup"
              sourceCat="raw_infogroup"
            />
            <SelectMetadataSource
              dispatch={dispatch}
              stateMetadataPrefix={MPO_BOUNDARIES_PREFIX}
              selectedViewId={state[`${MPO_BOUNDARIES_PREFIX}ViewId`]}
              selectedSourceId={state[`${MPO_BOUNDARIES_PREFIX}SourceId`]}
              inputLabel="MPO Boundaries"
              sourceCat="tmc_metadata"
            />
            <SelectMetadataSource
              dispatch={dispatch}
              stateMetadataPrefix={UA_BOUNDARIES_PREFIX}
              selectedViewId={state[`${UA_BOUNDARIES_PREFIX}ViewId`]}
              selectedSourceId={state[`${UA_BOUNDARIES_PREFIX}SourceId`]}
              inputLabel="UA Boundaries"
              sourceCat="tmc_metadata"
            />
            <SelectMetadataSource
              dispatch={dispatch}
              stateMetadataPrefix={REGION_BOUNDARIES_PREFIX}
              selectedViewId={state[`${REGION_BOUNDARIES_PREFIX}ViewId`]}
              selectedSourceId={state[`${REGION_BOUNDARIES_PREFIX}SourceId`]}
              inputLabel="Region Boundaries"
              sourceCat="tmc_metadata"
            />
          </div>
          <PublishInfogroup
            {...state}
            loading={loading}
            setLoading={setLoading}
            source_id={sourceId}
            user_id={user?.id ?? ctxUser.id}
            email={user?.email ?? ctxUser.email}
            name={source?.name}
            type={source?.type}
            pgEnv={pgEnv}
            disabled={!isButtonEnabled}
          />
        </div>

      </div>
    </div>
  );
}
