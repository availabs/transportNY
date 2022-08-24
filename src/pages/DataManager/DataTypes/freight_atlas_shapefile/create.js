import React from 'react'

const HOST = 'http://localhost:5566'

const Create = ({}) => {
  const [state, setState] = React.useState({
    gisUploadId: null,
    fileName: '',
    layerNames: [],
    layerName: null,
    forceUpdate: null,
    tableDescriptor: null,
    routesByLayer: {},
    addedSources: {},
  })


  const selectLayer = async (_layerName) => {
        
    setState({...state, ...{layerName: _layerName, tableDescriptor: null}})

    const tableDescriptorRes = await fetch(
      `${HOST}/staged-geospatial-dataset/${state.gisUploadId}/${_layerName}/tableDescriptor`
    );

    // The tableDescriptor controls DB table creation and loading.
    let tabledata = await tableDescriptorRes.json()
    console.log('testing data', tabledata)
    setState({...state, ...{tableDescriptor: tabledata}})
       
  }

  const uploadGisFile = async (file) => {
    
    const formData = new FormData();
    formData.append("file", file);
    
    // Upload the Geospatial Dataset
    const idRes = await fetch(
      `${HOST}/staged-geospatial-dataset/uploadGeospatialDataset`,
      {
        method: "POST",
        body: formData,
      }
    );

    // Upload response is the ETL ID
    const { id } = await idRes.json();

    const layerNamesRes = await fetch(
      `${HOST}/staged-geospatial-dataset/${id}/layerNames`
    ); 

    const layerNames = await layerNamesRes.json();
    if(layerNames[0]){
      selectLayer(layerNames[0])  
    }

    setState({...state, ...{gisUploadId: id, layerNames, fileName: file.name }})
  }

  

  return (
    <div className='w-full'>
      <div> Add New Source</div>
      <div className='fixed right-0 top-[380px] w-64 '>
          <pre>
            {JSON.stringify(state,null,3)}
          </pre>
      </div>
      <div className='w-full border border-dashed border-gray-300 bg-gray-100'>
        <div className='p-4'>
          <button >
              <input
                type="file"
                onChange={async (e) => {
                  uploadGisFile(e.target.files[0]);
                }}
              />
            </button>
        </div>
      </div>
      { state.layerNames.length > 0 ? 
        (<div className='w-full '>
          <div className='p-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
            <dt className="text-sm font-medium text-gray-500 py-5">Select Layer</dt>
            <div className='sm:col-span-2 pr-8 pt-3'>
              <select className='w-full bg-white p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300' 
                value={state.layerName}        
              >
                {state.layerNames.map(l => <option value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>) : ''
      }
    </div>
  )
}

export default Create