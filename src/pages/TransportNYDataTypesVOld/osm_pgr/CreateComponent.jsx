import React from "react"

// import { useParams, useNavigate, useSearchParams } from 'react-router'

import { DAMA_HOST } from "~/config";
import { DamaContext } from "~/pages/DataManager/store";

import {
  useFetchSources,
  useGetSources,
  useFetchSourceViews,
  useGetViews,
  SourceAndViewSelectors
} from "./utils"

const OSM_DATA_CATEGORIES = ["OSM Data"];
const OSM_DATA_COLUMNS = ["osm_id", "wkb_geometry"];

const CreateComponent = ({ source }) => {

  const { pgEnv, baseUrl, falcor, falcorCache } = React.useContext(DamaContext);
  const { name: damaSourceName, source_id: damaSourceId, type } = source;

  const [createState, setCreateState] = React.useState({
      osmDataSourceId: null,
      osmDataViewId: null,
      pointsFile: null
  });

  const choosePointsFile = React.useCallback(e => {
    setCreateState(prev => ({
      ...prev,
      pointsFile: e.target.files[0]
    }));
  }, []);

  useFetchSources({ falcor, falcorCache, pgEnv });
  const osmDataSources = useGetSources({ falcorCache,
                                          pgEnv,
                                          categories: OSM_DATA_CATEGORIES,
                                          columns: OSM_DATA_COLUMNS
                                      });

  useFetchSourceViews({ falcor, falcorCache, pgEnv, source_id: createState.osmDataSourceId });
  const osmDataViews = useGetViews({ falcorCache, pgEnv, source_id: createState.osmDataSourceId });

  const okToSend = React.useMemo(() => {
    const {
      osmDataSourceId,
      osmDataViewId,
      pointsFile
    } = createState;
    return Boolean(osmDataSourceId) &&
            Boolean(osmDataViewId) &&
            Boolean(pointsFile) &&
            Boolean(damaSourceName);
  }, [createState, damaSourceName]);

  // const navigate = useNavigate();

  const sendRequest = React.useCallback(e => {
    const {
      osmDataViewId,
      pointsFile
    } = createState;

    const formData = new FormData();

    formData.append("name", damaSourceName);
    formData.append("type", "gis_dataset");
    formData.append("categories", JSON.stringify([["PGR Routing"]]));
    formData.append("view_id", createState.osmDataViewId);
    formData.append("file", createState.pointsFile);

    fetch(
      `${ DAMA_HOST }/dama-admin/${ pgEnv }/pgr/routing`,
      { method: "POST", body: formData }
    ).then(res => res.json())
      .then(json => {
        console.log("RES:", json);
        // const { source_id, etl_context_id } = json;
        // navigate(`${ baseUrl }/source/${ source_id }/uploads/${ etl_context_id }`);
      })
  }, [pgEnv, createState, damaSourceName/*, navigate*/]);

  return (
    <div className="grid grid-cols-3 gap-4 mt-4">

      <div className="col-span-3">
        <SourceAndViewSelectors
          label="OSM Data"

          sources={ osmDataSources }
          sourceKey="osmDataSourceId"
          sourceValue={ createState.osmDataSourceId }

          views={ osmDataViews }
          viewKey="osmDataViewId"
          viewValue={ createState.osmDataViewId }

          setCreateState={ setCreateState }/>
      </div>

      <div className="col-span-3">
        <div className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-t mt-3">
          <dt className="text-sm font-medium text-gray-500 pt-5 pb-3">
            Select Points File
          </dt>
          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            <div className="pt-3 pr-8">
              <input type="file"
                className="px-2 py-4 w-full bg-white shadow"
                onChange={ choosePointsFile }
                accept=".csv,.txt"/>
            </div>
          </dd>
        </div>
      </div>

      <div className="col-start-3">
        <button onClick={ sendRequest }
          className={ `
            bg-green-300 disabled:bg-red-300
            hover:bg-green-400 disabled:hover:bg-red-200
            cursor-pointer disabled:cursor-not-allowed
            px-4 py-2 rounded w-full
          ` }
          disabled={ !okToSend }
        >
          Send Request
        </button>
      </div>

    </div>
  )
}
export default CreateComponent;