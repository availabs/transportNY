import React from "react"

import get from "lodash/get"
import { range as d3range } from "d3-array"

import { useFalcor } from "~/modules/avl-components/src";

const useSourcesWithViewSymbologies = ({ pgEnv = "freight_data", categories = [] }) => {

  const { falcor, falcorCache } = useFalcor();

  const [sourcesLength, setSourcesLength] = React.useState(0);
  const [sourceIds, setSourceIds] = React.useState([]);
  const [viewsLengthBySource, setViewsLengthBySource] = React.useState([]);
  const [sources, setSources] = React.useState([]);

  React.useEffect(() => {
    falcor.get(["dama", pgEnv, "sources", "length"]);
  }, [falcor, pgEnv]);
  React.useEffect(() => {
    const length = +get(falcorCache, ["dama", pgEnv, "sources", "length"], 0);
    setSourcesLength(length);
  }, [falcorCache, pgEnv]);

  React.useEffect(() => {
    if (sourcesLength) {
      const range = d3range(sourcesLength);
      falcor.get([
        "dama", pgEnv, "sources", "byIndex", range,
        "attributes", ["name", "source_id", "categories", "metadata"]
      ])
    }
  }, [falcor, sourcesLength]);

  React.useEffect(() => {
    if (sourcesLength) {
      const srcIds = d3range(sourcesLength)
        
        .reduce((a, c) => {
          const ref = get(falcorCache, ["dama", pgEnv, "sources", "byIndex", c, "value"], null);
          if (ref && ref.length) {
            const [,,,, srcId] = ref;
            const cats = get(falcorCache, ["dama", pgEnv, "sources", "byId", srcId, "attributes", "categories", "value"], []) || []
          
            if(!categories.length > 0 || cats.filter(d=> categories.includes(d?.[0])).length > 0){
              a.push(srcId);
            }
          }
          return a;
        }, []);
      setSourceIds(srcIds);
    }
  }, [falcorCache, pgEnv, sourcesLength]);

  React.useEffect(() => {
    if (sourceIds.length) {
      falcor.get(["dama", pgEnv, "sources", "byId", sourceIds, "views", "length"]);
    }
  }, [falcor, pgEnv, sourceIds]);
  React.useEffect(() => {
    if (sourceIds.length) {
      const views = sourceIds.map(srcId => {
        const length = +get(falcorCache, ["dama", pgEnv, "sources", "byId", srcId, "views", "length"], 0);
        return {
          srcId,
          views: length
        }
      });
      setViewsLengthBySource(views);
    }
  }, [falcorCache, pgEnv, sourceIds]);

  React.useEffect(() => {
    if (viewsLengthBySource.length) {
      const requests = viewsLengthBySource.map(({ srcId, views }) => ([
        "dama", pgEnv, "sources", "byId", srcId, "views", "byIndex", d3range(views),
        "attributes", ["view_id", "source_id", "version", "metadata"]
      ]));
      falcor.get(...requests);
    }
  }, [falcor, pgEnv, viewsLengthBySource]);

  React.useEffect(() => {
    if (viewsLengthBySource.length) {
      const sources = viewsLengthBySource.map(({ srcId, views }) => {
        const srcData = get(falcorCache, ["dama", pgEnv, "sources", "byId", srcId, "attributes"]);
        const src = {
          ...srcData,
          categories: srcData?.categories?.value || [],
          metadata: srcData?.metadata?.value || {},
          views: d3range(views).map((view, i) => {
            const ref = get(falcorCache, ["dama", pgEnv, "sources", "byId", srcId, "views", "byIndex", view, "value"], []);
            const viewData = get(falcorCache, [...ref, "attributes"], {});
            return {
              ...viewData,
              version: get(viewData, ["version", "value"], get(viewData, "version")) || `version ${ i + 1 }`,
              metadata: viewData?.metadata?.value || {}
            };
          })
        }
        return src;
      });
      setSources(
        sources.filter(source => {
          return get(source, "views", [])
            .reduce((a, c) => {
              const hasTiles = Boolean(c?.metadata?.tiles?.layers?.length);
              const hasSymbologies = Boolean(c?.metadata?.symbologies?.length);
              return a || (hasTiles && hasSymbologies)
            }, false)
        })
      );
    }
  }, [falcorCache, pgEnv, viewsLengthBySource]);

  return sources;
}
export default useSourcesWithViewSymbologies;