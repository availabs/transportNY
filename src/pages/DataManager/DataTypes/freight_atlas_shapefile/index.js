import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useFalcor, Button } from 'modules/avl-components/src'
import get from 'lodash.get'
import { useParams } from 'react-router-dom'




import {SourceAttributes, ViewAttributes, getAttributes} from 'pages/DataManager/components/attributes'
    
const Edit = ({startValue, attr, viewId, parentData, cancel=()=>{}}) => {
  const { falcor } = useFalcor()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const inputEl = useRef(null);

  useEffect(() => {
    setValue(startValue)
    inputEl.current.focus();
  },[])

  useEffect(() => {
    inputEl.current.style.height = 'inherit';
    inputEl.current.style.height = `${inputEl.current.scrollHeight}px`; 
  },[value])

  const save = async (attr, value) => {
    if(viewId) {
      try{
        let update = JSON.parse(value)
        let val = parentData
        val.tiles[attr] = update
        console.log('testing',JSON.stringify(val), val)
        let response = await falcor.set({
            paths: [
              ['datamanager','views','byId',viewId,'attributes', 'metadata' ]
            ],
            jsonGraph: {
              datamanager:{
                views: {
                  byId:{
                    [viewId] : {
                        attributes : { 'metadata': JSON.stringify(val)}
                    }
                  }
                }
              }
            }
        })
        console.log('set run', response)
        cancel()
      } catch (error) {
        console.log('error stuff',error,value, parentData);
      }
    }
  }

  return (
    <div className='w-full'>
      <div className='w-full flex'>
        <textarea
          ref={inputEl} 
          className='flex-1 px-2 shadow text-base bg-blue-100 focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md' 
          value={value} 
          onChange={e => setValue(e.target.value)}
        />
      </div>
      <div>
        <Button themeOptions={{size:'sm', color: 'primary'}} onClick={e => save(attr,value)}> Save </Button>
        <Button themeOptions={{size:'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
      </div>
    </div>
  )
}

const Map = () => {
  const {falcor,falcorCache} = useFalcor()
  const { sourceId } = useParams()
  const [ activeView, setActiveView ] = useState(null)
  const [ mapData, setMapData ] = useState({})
  const [ editing, setEditing ] = React.useState(null)

  const views = useMemo(() => {
    let views = Object.values(get(falcorCache,["datamanager","sources","byId",sourceId,"views","byIndex",],{}))
      .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
      .sort((a,b) => {
        return new Date(a.last_updated) - new Date(b.last_updated)
      })

    if(views[0]) {
      setActiveView(views[0])
      setMapData(get(views[0],'metadata.tiles',{}))
    }


  },[falcorCache,sourceId])

  return (
    <div> 
      Map View {get(activeView,'id','')}
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {['sources','layers']
            .map((attr,i) => {
              let val = JSON.stringify(get(mapData,attr,[]),null,3)
              return (
                <div key={i} className='flex justify-between group'>
                  <div  className="flex-1 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 py-5">{attr}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                      {editing === attr ? 
                        <div className='pt-3 pr-8'>
                          <Edit 
                            startValue={val} 
                            attr={attr}
                            viewId={get(activeView,'id',null)}
                            parentData={get(activeView,'metadata',{})}
                            cancel={() => setEditing(null)}
                          />
                        </div> :  
                        <div className='py-3 pl-2 pr-8'>
                          <pre className='bg-gray-100 tracking-tighter overflow-auto scrollbar-xs'>
                            {val}
                          </pre>
                        </div> 
                      }
                    </dd>
                  </div>

                  <div className='hidden group-hover:block text-blue-500 cursor-pointer' onClick={e => editing === attr ? setEditing(null): setEditing(attr)}>
                    <i className="fad fa-pencil absolute -ml-12 mt-3 p-2.5 rounded hover:bg-blue-500 hover:text-white "/>
                  </div>
                </div>
              )
            })
          }
        </dl>
      </div>
    </div>
  ) 
}

const Table = ({source}) => {
  return <div> Table View </div>  
}

export default {
  map: {
    name: 'Map',
    path: '/map',
    component: Map
  },
  table: {
    name: 'Table',
    path: '/table',
    component: Table
  }
}