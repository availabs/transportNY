import { createEtlContextPropsProxy } from "pages/DataManager/utils/EtlContext";

import { checkApiResponse } from "pages/DataManager/utils/DamaControllerApi";

export {
  checkApiResponse,
  getNewEtlContextId,
  getDamaApiRoutePrefix,
} from "pages/DataManager/utils/DamaControllerApi";

export async function getNpmrdsDataDateExtent(ctx) {
  const {
    meta: { rtPfx },
  } = ctx;

  const url = `${rtPfx}/data-sources/npmrds/travel-times/downloader/getNpmrdsDataDateExtent`;

  const res = await fetch(url);

  await checkApiResponse(res);

  const npmrdsDataDateExtent = await res.json();

  return npmrdsDataDateExtent;
}

export async function queueNpmrdsExportRequest(ctx) {
  const {
    meta: { rtPfx, userId },
  } = ctx;

  const { dataState, dataStartDate, dataEndDate, expandedMap } =
    createEtlContextPropsProxy(ctx);

  const url = `${rtPfx}/data-sources/npmrds/travel-times/downloader/queueNpmrdsExportRequest`;

  const updTblDscRes = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      state: dataState,
      start_date: dataStartDate,
      end_date: dataEndDate,
      is_expanded: expandedMap,
      user_id: userId,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  await checkApiResponse(updTblDscRes);

  return await updTblDscRes.text();
}
