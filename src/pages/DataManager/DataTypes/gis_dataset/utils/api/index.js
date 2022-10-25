import { DAMA_HOST } from "config";

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
