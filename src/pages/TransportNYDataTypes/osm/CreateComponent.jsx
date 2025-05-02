import React from "react"

import { DAMA_HOST } from "~/config";
import { DamaContext } from "~/pages/DataManager/store";

const CreateComponent = ({ source }) => {

  // const navigate = useNavigate();
  const { pgEnv, baseUrl } = React.useContext(DamaContext);
  const { name: sourceName } = source;

  const uploadOSMFile = React.useCallback(file => {
    const formData = new FormData();
    formData.append("name", sourceName);
    formData.append("type", "osm-dataset");
    formData.append("categories", JSON.stringify([["OSM"]]));
    formData.append("file.size", file.size);
    formData.append("file", file);
    fetch(
      `${ DAMA_HOST }/dama-admin/${ pgEnv }/osm/upload`,
      { method: "POST", body: formData }
    ).then(res => res.json())
      .then(json => {
        console.log("UPLOAD OSM FILE RESPONSE:", json);
        // const { source_id, etl_context_id } = json;
        // navigate(`${ baseUrl }/source/${ source_id }/uploads/${ etl_context_id }`);
      })
  }, [pgEnv, sourceName/*, navigate, baseUrl*/]);

  const [file, setFile] = React.useState(null);

  const handleOnChange = React.useCallback(e => {
    setFile(e.target.files[0]);
  }, []);

  const doUploadOSMFILE = React.useCallback(e => {
    if (file === null) return;
    uploadOSMFile(file);
  }, [uploadOSMFile, file]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <input type="file
        className="bg-white px-4 py-2 rounded"
        onChange={ handleOnChange }/>
      <button onClick={ doUploadOSMFILE }
        className={ `
          bg-green-300 disabled:bg-red-300
          hover:bg-green-400 disabled:hover:bg-red-200
          cursor-pointer disabled:cursor-not-allowed
          px-4 py-2 rounded
        ` }
        disabled={ !file }
      >
        UPLOAD FILE
      </button>
    </div>
  )
}
export default CreateComponent;
