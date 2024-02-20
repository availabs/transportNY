import React from "react"

import get from "lodash/get"
import { range as d3range } from "d3-array"

import { useFalcor } from "~/modules/avl-components/src";

const useSourcesWithViewSymbologies = ({ pgEnv = "freight_data", categories = [] }) => {

  const { falcor, falcorCache } = useFalcor();

  const [collectionsLength, setCollectionsLength] = React.useState(0);
  const [collectionIds, setCollectionIds] = React.useState([]);
  const [symbologyLengthBySource, setSymbologyLengthBySource] = React.useState([]);
  const [sources, setSources] = React.useState([]);

  React.useEffect(() => {
    falcor.get(["dama", pgEnv, "collections", "length"]);
  }, [falcor, pgEnv]);
  React.useEffect(() => {
    const length = +get(falcorCache, ["dama", pgEnv, "collections", "length"], 0);
    //console.log('set collection length',length)
    setCollectionsLength(length);
  }, [falcorCache, pgEnv]);

  React.useEffect(() => { 
    if (collectionsLength) {
      const range = d3range(collectionsLength);
      falcor.get([
        "dama", pgEnv, "collections", "byIndex", range,
        "attributes", ["name", "collection_id", "categories"]
      ])
    }
  }, [falcor, collectionsLength]);

  React.useEffect(() => {
    if (collectionsLength) {
      const srcIds = d3range(collectionsLength)
        
        .reduce((a, c) => {
          const ref = get(falcorCache, ["dama", pgEnv, "collections", "byIndex", c, "value"], null);
          if (ref && ref.length) {
            const [,,,, srcId] = ref;
            const cats = get(falcorCache, ["dama", pgEnv, "collections", "byId", srcId, "attributes", "categories", "value"], []) || []
          
            if(!categories.length > 0 || cats.filter(d=> categories.includes(d?.[0])).length > 0){
              a.push(srcId);
            }
          }
          return a;
        }, []);
      //console.log('set collection_ids', srcIds)
      setCollectionIds(srcIds);
    }
  }, [falcorCache, pgEnv, collectionsLength]);

  React.useEffect(() => {
    if (collectionIds.length) {
      falcor.get(["dama", pgEnv, "collections", "byId", collectionIds, "symbologies", "length"]);
    }
  }, [falcor, pgEnv, collectionIds]);
  React.useEffect(() => {
    if (collectionIds.length) {
      const views = collectionIds.map(collection_id => {
        const length = +get(falcorCache, ["dama", pgEnv, "collections", "byId", collection_id, "symbologies", "length"], 0);
        return {
          collection_id,
          symbologies: length
        }
      });
      //console.log('set views,', views)
      setSymbologyLengthBySource(views);
    }
  }, [falcorCache, pgEnv, collectionIds]);

  React.useEffect(() => {
    if (symbologyLengthBySource.length) {
      const requests = symbologyLengthBySource.map(({ collection_id, symbologies }) => ([
        "dama", pgEnv, "collections", "byId", collection_id, "symbologies", "byIndex", d3range(symbologies),
        "attributes", ["symbology_id", "collection_id", "symbology"]
      ]));
      falcor.get(...requests);
    }
  }, [falcor, pgEnv, symbologyLengthBySource]);

  React.useEffect(() => {
    if (symbologyLengthBySource.length) {
      const sources = symbologyLengthBySource.map(({ collection_id, symbologies }) => {
        const srcData = get(falcorCache, ["dama", pgEnv, "collections", "byId", collection_id, "attributes"]);
        //console.log('final data', falcorCache)
        const src = {
          ...srcData,
          categories: srcData?.categories?.value || [],
          symbologies: d3range(symbologies)
            .filter(symbology => {
              const ref = get(falcorCache, ["dama", pgEnv, "collections", "byId", collection_id, "symbologies", "byIndex", symbology, "value"], []);
              const viewData = get(falcorCache, [...ref, "attributes"], false);
              //console.log('viewData filter', viewData)
              return viewData
            })
            .map((symbology, i) => {
              const ref = get(falcorCache, ["dama", pgEnv, "collections", "byId", collection_id, "symbologies", "byIndex", symbology, "value"], []);
              const viewData = get(falcorCache, [...ref, "attributes"], {});
              
            return {
              ...viewData,
              symbology: viewData?.symbology?.value || {}
            };
          })
        }
        return src;
      });
      console
      setSources(
        sources
          .filter(source => source?.symbologies && source?.symbologies?.length)
      );
    }
  }, [falcorCache, pgEnv, symbologyLengthBySource]);

  return sources;
}
export default useSourcesWithViewSymbologies;