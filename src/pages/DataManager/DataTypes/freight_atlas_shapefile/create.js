import React from 'react'
import get from 'lodash.get'
const HOST = 'http://localhost:5566'

const Create = ({}) => {
 
    const[ gisUploadId, setGisUploadId ] = React.useState(null)
    const[ fileName, setFileName] = React.useState ('')
    const[ layerNames, setLayerNames] = React.useState ([])
    const[ layerName, setLayerName] = React.useState ('')
    const[ forceUpdate, setForceUpdate] = React.useState (null)
    const[ tableDescriptor, setTableDescriptor] = React.useState (null)
    const[ routesByLayer, setRoutesByLayer] = React.useState ({})
    const[ addedSources, setAddedSources] = React.useState ({})


  const selectLayer = async (_layerName, _id) => {
    if(!_id) {
      _id = gisUploadId
    }
        
    setLayerName(_layerName)
    setTableDescriptor({})

    const tableDescriptorRes = await fetch(
      `${HOST}/staged-geospatial-dataset/${_id}/${_layerName}/tableDescriptor`
    );

    // The tableDescriptor controls DB table creation and loading.
    let tabledata = await tableDescriptorRes.json()
    setTableDescriptor(tabledata)
       
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
    setGisUploadId(id)
    setLayerNames(layerNames)
    setFileName(file.name)
    if(layerNames[0]){
      selectLayer(layerNames[0], id)  
    }

    
  }

  

  return (
    <div className='w-full'>
      <div> Add New Source</div>
      {/*<div className='fixed right-0 top-[380px] w-64 '>
          <pre>
            {JSON.stringify(state,null,3)}
          </pre>
      </div>*/}
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
      { layerNames.length > 0 ? 
        (<div className='w-full '>
          <div className='p-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
            <dt className="text-sm font-medium text-gray-500 py-5">Select Layer</dt>
            <div className='sm:col-span-2 pr-8 pt-3'>
              <select 
                className='w-full bg-white p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300' 
                value={layerName}
                onChange={e => selectLayer(e.target.value)}      
              >
                {layerNames.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>) : ''
      }
      <div >

        <table className='w-full'>
          <thead>
            <tr>
              <th className='text-left'>GIS Dataset Field Name</th>
              <th className='text-right'>
                Database Column Name
              </th>
              <td className='text-right'>
                Database Column Type
              </td>
            </tr>
          </thead>
          <tbody>
            {get(tableDescriptor,'columnTypes',[]).map((row) => (
              <tr
                key={row.key}
                className='border-b'
              >
                <td className='py-4'>
                  {row.key}
                </td>
                <td className='text-right  p-2'>
                  <input
                    className='w-full p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300'
                    id={row.key}
                    defaultValue={row.col}
                    onChange={(e) => (row.col = e.target.value)}
                  />
                </td>
                <td className='text-right  p-2'>{row.db_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Create