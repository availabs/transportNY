import React, {
  useState,
  useReducer,
  useEffect,
  useContext,
} from "react";
import { DamaContext } from "~/pages/DataManager/store";
import { DAMA_HOST } from "~/config";
import { reducer } from "./components/reducer";
import PublishNpmrds from "./components/publish";
import SelectSpeedLimitSource from "./components/selectSpeedLimitSource";
import SelectMpoBoundariesSource from "./components/selectMpoBoundariesSource";

//max data table name length is 63
//we append the following:: 's784_v1323_${damaSourceName}_tmc_meta_geometry'
//s784_v1323__tmc_meta_geometry is 29 chars
//63-29=34 chars remaining
//lets build in 1 char each to accomodate 4 digit source_id & 5 digit view_id
//and some more extra, max name length is 30
export const MAX_NPMRDS_SOURCE_NAME_LENGTH = 30;
const BlankComponent = () => <></>;
export default function NpmrdsCreate({
  source = {},
  user = {},
  dataType = "npmrds",
  CustomAttributes = BlankComponent,
}) {
  const { name: damaSourceName, source_id: sourceId, type } = source;
  const { pgEnv, user: ctxUser } = useContext(DamaContext);

  const [loading, setLoading] = useState(false);
  const [state, dispatch] = useReducer(reducer, {
    damaSourceId: sourceId,
    damaSourceName: damaSourceName,
    userId: user?.id ?? ctxUser.id,
    email: user?.email ?? ctxUser.email,
    etlContextId: null,
    dataType: dataType,
    damaServerPath: `${DAMA_HOST}/dama-admin/${"npmrds"}`,
    sourceType: type,
    selectedViewId: '',
    selectedSourceId: '',
    selectedMpoBoundariesViewId: '',
    selectedMpoBoundariesSourceId: '',
  });

  useEffect(() => {
    dispatch({ type: "update", payload: { damaSourceName } });
  }, [damaSourceName]);

  useEffect(() => {
    dispatch({ type: "update", payload: { sourceType: type } });
  }, [type]);

  if (!sourceId && !damaSourceName) {
    return <div> Please enter a datasource name.</div>;
  }

  return (
    <div className="w-full my-4">
      {damaSourceName.length > MAX_NPMRDS_SOURCE_NAME_LENGTH && (
        <p className="text-red-500">
          The source name is too long. Please enter a name with{" "}
          {MAX_NPMRDS_SOURCE_NAME_LENGTH + " "}
          characters or less.
        </p>
      )}
      <div className="md:flex md:items-center gap-4">
        <div className="flex flex-col gap-4">
          <SelectSpeedLimitSource
            dispatch={dispatch}
            selectedViewId={state.selectedViewId}
            selectedSourceId={state.selectedSourceId}
          />
          <SelectMpoBoundariesSource
            dispatch={dispatch}
            selectedMpoBoundariesViewId={state.selectedMpoBoundariesViewId}
            selectedMpoBoundariesSourceId={state.selectedMpoBoundariesSourceId}
          />
        </div>
        <PublishNpmrds
          loading={loading}
          setLoading={setLoading}
          source_id={sourceId}
          user_id={user?.id ?? ctxUser.id}
          name={source?.name}
          type={source?.type}
          selectedViewId={state.selectedViewId}
          selectedSourceId={state.selectedSourceId}
          selectedMpoBoundariesViewId={state.selectedMpoBoundariesViewId}
          selectedMpoBoundariesSourceId={state.selectedMpoBoundariesSourceId}
          pgEnv={pgEnv}
        />
      </div>
    </div>
  );
}
