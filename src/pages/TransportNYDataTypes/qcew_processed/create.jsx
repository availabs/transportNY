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


import PublishQcew from "./publish";
export function reducer(state, action) {
  if (action.type === "update") {
    return {
      ...state,
      ...action.payload,
    };
  }

  return state;
}

export const RAW_QCEW_PREFIX = "rawQcew"
const BlankComponent = () => <></>;
export default function QcewCreate({
  source = {},
  user = {},
  dataType = "gis_dataset",
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
    damaSourceId: sourceId,
    damaSourceName: damaSourceName,
    userId: user?.id ?? ctxUser.id,
    email: user?.email ?? ctxUser.email,
    etlContextId: null,
    dataType: dataType,
    damaServerPath: `${DAMA_HOST}/dama-admin/${"qcew_processed"}`,
    sourceType: type,
    [`${RAW_QCEW_PREFIX}SourceId`]: '',
    [`${RAW_QCEW_PREFIX}ViewId`]: '',
  });

  useEffect(() => {
    dispatch({ type: "update", payload: { sourceType: type } });
  }, [type]);


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


  if (!sourceId && !damaSourceName) {
    return <div> Please enter a datasource name.</div>;
  }
  let errMsg = ''

  const isMetadataProvided =
    !!state[`${RAW_QCEW_PREFIX}ViewId`] &&
    !!state[`${RAW_QCEW_PREFIX}SourceId`];
  const isButtonEnabled = (sourceId || damaSourceName) && isMetadataProvided;
  return (
    <div className="w-full my-4">
      <div className="md:flex md:items-center gap-4 flex-col">
        <div className="text-red-500 text-sm">
          {errMsg}
        </div>
        <div className="md:flex md:items-center gap-4 w-full">
          <div className="flex flex-col gap-4">
            <SelectMetadataSource
              dispatch={dispatch}
              stateMetadataPrefix={RAW_QCEW_PREFIX}
              selectedViewId={state[`${RAW_QCEW_PREFIX}ViewId`]}
              selectedSourceId={state[`${RAW_QCEW_PREFIX}SourceId`]}
              inputLabel="Raw Qcew"
              sourceCat="raw_qcew"
            />
          </div>
          <PublishQcew
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
