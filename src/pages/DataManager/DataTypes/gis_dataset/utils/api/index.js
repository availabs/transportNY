import { DAMA_HOST } from "config";

import { createEtlContextPropsProxy } from "../EtlContext";

export async function checkApiResponse(res) {
  if (!res.ok) {
    let errMsg = res.statusText;
    try {
      const { message } = await res.json();
      errMsg = message;
    } catch (err) {
      console.error(err);
    }

    throw new Error(errMsg);
  }
}

export function getDamaApiRoutePrefix(pgEnv) {
  return `${DAMA_HOST}/dama-admin/${pgEnv}`;
}

export async function getNewEtlContextId(pgEnv) {
  const rtPfx = `${DAMA_HOST}/dama-admin/${pgEnv}`;

  const newEtlCtxRes = await fetch(`${rtPfx}/new-etl-context-id`);

  await checkApiResponse(newEtlCtxRes);

  const etlContextId = +(await newEtlCtxRes.text());

  return etlContextId;
}

export async function stageLayerData(ctx) {
  const {
    meta: { rtPfx },
  } = ctx;

  const { etlContextId, gisUploadId, layerName, tableDescriptor } =
    createEtlContextPropsProxy(ctx);

  const updTblDscRes = await fetch(
    `${rtPfx}/staged-geospatial-dataset/${gisUploadId}/updateTableDescriptor`,
    {
      method: "POST",
      body: JSON.stringify(tableDescriptor),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  await checkApiResponse(updTblDscRes);

  const url = new URL(
    `${rtPfx}/staged-geospatial-dataset/stageLayerData/${layerName}`
  );
  url.searchParams.append("etl_context_id", etlContextId);

  const stgLyrDataRes = await fetch(url);

  await checkApiResponse(stgLyrDataRes);
}

export async function approveQA(ctx) {
  const {
    meta: { rtPfx },
  } = ctx;

  const { etlContextId, userId } = createEtlContextPropsProxy(ctx);

  const url = new URL(`${rtPfx}/staged-geospatial-dataset/approveQA`);
  url.searchParams.append("etl_context_id", etlContextId);
  url.searchParams.append("user_id", userId);

  await fetch(url);
}

export async function createNewDataSource(ctx) {
  const {
    meta: { rtPfx },
  } = ctx;

  const { dataSourceName, dataSourceDisplayName } =
    createEtlContextPropsProxy(ctx);

  const res = await fetch(`${rtPfx}/metadata/createNewDataSource`, {
    method: "POST",
    body: JSON.stringify({
      name: dataSourceName,
      display_name: dataSourceDisplayName,
      type: "gis_dataset",
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  await checkApiResponse(res);

  const newSrcMeta = await res.json();

  return newSrcMeta;
}

export async function submitViewMeta(ctx) {
  const {
    meta: { rtPfx },
  } = ctx;

  const { etlContextId, userId, dataSourceName } =
    createEtlContextPropsProxy(ctx);

  const url = new URL(`${rtPfx}/staged-geospatial-dataset/submitViewMeta`);
  url.searchParams.append("etl_context_id", etlContextId);
  url.searchParams.append("user_id", userId);

  const viewMetadata = {
    data_source_name: dataSourceName,
    version: 1,
  };

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(viewMetadata),
    headers: {
      "Content-Type": "application/json",
    },
  });

  await checkApiResponse(res);

  const submitViewMetaResponse = await res.json();

  console.log({ submitViewMetaResponse });
}

export async function publishGisDatasetLayer(ctx) {
  const {
    meta: { rtPfx },
  } = ctx;

  const { etlContextId, userId } = createEtlContextPropsProxy(ctx);

  const url = new URL(
    `${rtPfx}/staged-geospatial-dataset/publishGisDatasetLayer`
  );
  url.searchParams.append("etl_context_id", etlContextId);
  url.searchParams.append("user_id", userId);

  const res = await fetch(url);

  await checkApiResponse(res);
}

export async function simpleUpdateExistingDataSource(ctx) {
  await stageLayerData(ctx);

  await approveQA(ctx);

  await submitViewMeta(ctx);

  await publishGisDatasetLayer(ctx);
}

export async function simpleCreateNewDataSource(ctx) {
  const { id } = await createNewDataSource(ctx);

  await simpleUpdateExistingDataSource(ctx);

  return id;
}
