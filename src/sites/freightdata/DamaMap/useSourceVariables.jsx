import React from "react"

import get from "lodash/get"

import { useFalcor } from "~/modules/avl-components/src";

const useSourceVariables = (source, activeViewId, pgEnv, startLoading, stopLoading) => {

  const { falcor, falcorCache } = useFalcor();

  const columns = React.useMemo(() => {
    const md = get(source, ["metadata", "columns"], get(source, "metadata", []));
    if (Array.isArray(md)) {
      return md;
    }
    return [];
  }, [source]);

  const dataVariables = React.useMemo(() => {
    return columns
      .filter(md => md.display === "data-variable")
      .map(md => ({ name: md.name, type: "data-variable" }));
  }, [columns]);

  const metaVariables = React.useMemo(() => {
    return columns
      .filter(md => md.display === "meta-variable")
      .map(md => ({ name: md.name, type: "meta-variable" }));
  }, [columns]);

  const variables = React.useMemo(() => {
    return [...dataVariables, ...metaVariables].map(d => d.name);
  }, [dataVariables, metaVariables]);

  React.useEffect(() => {
    if (!activeViewId) return;
    startLoading();
    falcor.get(["dama", pgEnv, "viewsbyId", activeViewId, "data", "length"])
      .then(() => stopLoading())
  }, [falcor, pgEnv, activeViewId, startLoading, stopLoading]);

  const [dataLength, setDataLength] = React.useState(0);
  React.useEffect(() => {
    if (!activeViewId) {
      setDataLength(0);
      return;
    }
    const dl = get(falcorCache, ["dama", pgEnv, "viewsbyId", activeViewId, "data", "length"], 0);
    setDataLength(dl);
  }, [falcorCache, pgEnv, activeViewId]);

  React.useEffect(() => {
    if (!(dataLength && variables.length)) return;
    startLoading();
    falcor.chunk([
      "dama", pgEnv, "viewsbyId", activeViewId, "databyIndex",
      {from:0, to: dataLength-1}, variables
    ]).then(() => stopLoading())
  }, [falcor, pgEnv, activeViewId, dataLength, variables, startLoading, stopLoading]);

  return [...dataVariables, ...metaVariables];
}
export default useSourceVariables;
