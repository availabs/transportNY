import _ from "lodash";

import Falcor from "./FalcorWrapper";

export async function getEtlContextsForDamaSourceId(
  pgEnv,
  sourceId,
  etlContextStatus
) {
  sourceId = +sourceId;

  const eventsForEtlCtxStatusPath = [
    "dama",
    pgEnv,
    "etlContexts",
    "byDamaSourceId",
    sourceId,
    etlContextStatus,
  ];

  await Falcor.get(eventsForEtlCtxStatusPath);

  const eventsForCtxStatus = _.get(Falcor.cache, [
    ...eventsForEtlCtxStatusPath,
    "value",
  ]);

  return eventsForCtxStatus;
}
