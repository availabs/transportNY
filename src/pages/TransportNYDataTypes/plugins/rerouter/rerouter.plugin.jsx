import React from "react";

import { DAMA_HOST } from "~/config";
import { DamaContext } from "~/pages/DataManager/store";

import {
  useFetchSources,
  useGetSources,
  useFetchSourceViews,
  useGetViews,
  SourceAndViewSelectors
} from "./utils"

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

    const [conflationDataView, setConflationDataView] = React.useState(null);

    const [minimized, setMinimized] = React.useState(false);
    const toggle = React.useCallback(e => {
      setMinimized(min => !min);
    }, []);

    const viewMetadata = getViewMetadata({ viewId: conflationDataView });
    
    return (
      <div
        style={ {
          left: "50%",
          transform: "translate(-50%, 0)"
        } }
        className={ `
          pointer-events-auto w-screen max-w-xl h-fit grid grid-cols-1 gap-1
          bg-white items-center absolute bottom-4 rounded-lg
          ${ minimized ? "px-2 pt-2" : "p-2" }
        ` }
      >

        <div onClick={ toggle }
          className={ `
            absolute right-0 top-0 px-3 py-1 z-50
            bg-gray-200 hover:bg-gray-400 cursor-pointer
            ${ minimized ? "rounded-r-lg" : "rounded-tr-lg" }
          ` }
        >
          { minimized ?
            <span className="fa fa-caret-up"/> :
            <span className="fa fa-caret-down"/>
          }
        </div>

        { minimized ?
          <>
            <div>&nbsp;</div>
          </> :
          <>

            <div className="border-b-4 border-current text-xl font-bold">
              Rerouter Plugin
            </div>

            <div className="border-b-2 border-current font-bold">
              OSM Data Source and View
            </div>

            <ConflationDataViewSelector
              setConflationDataView={ setConflationDataView }/>

            <div className="h-24"/>

          </>
        }

      </div>
    );
  },
}

const getViewMetadata = ({ viewId }) => {

  const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);
  
}

const CONFLATION_DATA_CATEGORIES = ["OSM Conflation"];
const CONFLATION_DATA_COLUMNS = ["osm", "ris", "tmc", "osm_fwd"];

const ConflationDataViewSelector = ({ setConflationDataView }) => {

  const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);

  const [sourceState, setSourceState] =   React.useState({
    conflationDataSourceId: null,
    conflationDataViewId: null
  });

  useFetchSources({ falcor, falcorCache, pgEnv });
  const conflationDataSources = useGetSources({ falcorCache,
                                          pgEnv,
                                          categories: CONFLATION_DATA_CATEGORIES,
                                          columns: CONFLATION_DATA_COLUMNS
                                      });

  useFetchSourceViews({ falcor, falcorCache, pgEnv, source_id: sourceState.conflationDataSourceId });
  const conflationDataViews = useGetViews({ falcorCache, pgEnv, source_id: sourceState.conflationDataSourceId });

  React.useEffect(() => {
    setConflationDataView(sourceState.conflationDataViewId);
  }, [setConflationDataView, sourceState.conflationDataViewId]);

  return (
    <SourceAndViewSelectors
      label="Conflation Data"

      sources={ conflationDataSources }
      sourceKey="conflationDataSourceId"
      sourceValue={ sourceState.conflationDataSourceId }

      views={ conflationDataViews }
      viewKey="conflationDataViewId"
      viewValue={ sourceState.conflationDataViewId }

      setCreateState={ setSourceState }/>
  )
}