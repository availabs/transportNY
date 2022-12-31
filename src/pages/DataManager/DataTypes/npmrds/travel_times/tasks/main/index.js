import React, { useEffect, useReducer, useRef } from "react";
import { useSelector } from "react-redux";

import EtlContext, {
  useEtlContext,
  EtlContextReact,
} from "pages/DataManager/utils/EtlContext";

import { selectPgEnv, selectUserId } from "pages/DataManager/store";

import RequestStatus from "./constants/RequestStatus";

import * as _store_ from "./store";

import NpmrdsTravelTimeExportForm from "./components/NpmrdsTravelTimeExportForm";
import ErrorMessage from "./components/ErrorMessage";
import RequestStatusMessage from "./components/RequestStatusDisplay";

const Main = ({ store = _store_ }) => {
  const { reducer, init } = store;

  const pgEnv = useSelector(selectPgEnv);
  const userId = useSelector(selectUserId);

  const [state, dispatch] = useReducer(reducer, null, init);

  const { current: ctx } = useRef(
    new EtlContext({
      name: "NpmrdsTravelTimesExportRequester",
      ...store,
      dispatch,
      meta: { userId, pgEnv },
    })
  );

  ctx.setState(state);

  const { etlContextId, requestStatus } = useEtlContext(ctx);

  ctx.assignMeta({ etlContextId, userId, pgEnv });

  useEffect(() => {
    ctx.operations.configure();
  }, [ctx]);

  if (requestStatus === RequestStatus.INITIAL) {
    return <div>Initializing</div>;
  }

  const key = `${pgEnv}-${userId}-${etlContextId || "fresh-request"}`;

  return (
    <EtlContextReact.Provider key={key} className="w-full" value={ctx}>
      <NpmrdsTravelTimeExportForm />
      <RequestStatusMessage />
      <ErrorMessage />
    </EtlContextReact.Provider>
  );
};

export default Main;
