import React from "react";

// import {
//   useFetchSources,
//   useGetSources,
//   useFetchSourceViews,
//   useGetViews,
//   SourceAndViewSelectors
// } from "./utils"

export const RerouterPlugin = {
  id: "rerouter",
  type: "plugin",
  mapRegister: (map, state, setState) => {
  },
  dataUpdate: (map, state, setState) => {
  },
  internalPanel: ({ state, setState }) => {
    return [];
  },
  externalPanel: ({ state, setState }) => {
    return [];
  },
  cleanup: (map, state, setState) => {
  },
  comp: ({ map }) => {

    const [conflationSource, setConflationSource] = React.useState(null);

    
    
    return (
      <div>

      </div>
    );
  },
}

const CONFLATION_DATA_CATEGORIES = ["OSM Conflation"];
const CONFLATION_DATA_COLUMNS = ["osm", "ris", "tmc", "osm_fwd"];

const ConflationDataViewSelector = ({ setConflationDataView }) => {

  const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);

  const [createState, setCreateState] = React.useState({
    conflationDataSourceId: null,
    conflationDataViewId: null
  });

  useFetchSources({ falcor, falcorCache, pgEnv });
  const conflationDataSources = useGetSources({ falcorCache,
                                          pgEnv,
                                          categories: CONFLATION_DATA_CATEGORIES,
                                          columns: CONFLATION_DATA_COLUMNS
                                      });

  useFetchSourceViews({ falcor, falcorCache, pgEnv, source_id: createState.conflationDataSourceId });
  const conflationDataViews = useGetViews({ falcorCache, pgEnv, source_id: createState.conflationDataSourceId });

  React.useEffect(() => {
    setConflationDataView(createState.conflationDataViewId);
  }, [setConflationDataView, createState.conflationDataViewId]);

  return (
    <SourceAndViewSelectors
      label="Conflation Data"

      sources={ conflationDataSources }
      sourceKey="conflationDataSourceId"
      sourceValue={ createState.conflationDataSourceId }

      views={ conflationDataViews }
      viewKey="conflationDataViewId"
      viewValue={ createState.conflationDataViewId }

      setCreateState={ setCreateState }/>
  )
}