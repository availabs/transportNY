import React, { useEffect, useMemo } from 'react';
import { useFalcor } from 'modules/avl-components/src'
import get from 'lodash.get'
// import { useParams } from 'react-router-dom'

import {SourceAttributes, ViewAttributes, getAttributes} from 'pages/DataManager/components/attributes'


const Overview = ({source, views}) => {

  return (
    <div className="overflow-hidden">
      <div className='flex'>
        <div className="flex-1">
          <div>
          {get(source,'categories',[]).map(cat => cat.map(s => <span className='text-xs p-1 px-2 bg-blue-200 text-blue-600 mr-2'>{s}</span>))}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 py-2">
            {get(source,'description', false) || 'No Description'}
          </p>
        </div>
        <div className=" px-4 py-5 sm:p-0 w-40 border-l border-gray-300">
          <div className="py-4 sm:px-6">
                
                <div className="text-sm font-medium text-gray-500">Versions</div>
                <div className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <select className='w-full bg-white border border-gray-300 p-2'>
                    {views.map(v => (
                      <option>{v.version}</option>
                      
                    ))}
                   
                  </select>
                      
                </div>
              </div>
            {Object.keys(SourceAttributes)
              .filter(d => !['id','metadata','description','name','category', 'categories'].includes(d))
              .map(attr => (
              <div className="py-4 sm:py-5  sm:px-6">
                <div className="text-sm font-medium text-gray-500">{attr}</div>
                <div className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {typeof source[attr] === 'object'}
                  {typeof source[attr] === 'object' ? JSON.stringify(source[attr]) : source[attr]}
                  
                </div>
              </div>
            ))}
          
        </div>
      </div>
      <div>   
        <dl> 
          
        </dl>
      </div>
    </div>
  )
}

const Metadata = ({source}) => {
  return (
    <div className="overflow-hidden">
      
      <div className="py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b-2">
        <dt className="text-sm font-medium text-gray-600">
          Column
        </dt>
        <dd className="text-sm font-medium text-gray-600 ">
          Description
        </dd>
        <dd className="text-sm font-medium text-gray-600">
          Type
        </dd>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
         
          {get(source,'metadata',[])
            .map(col => (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm text-gray-900">
                {col.name}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                {get(col,'desc', false) || 'No Description'}
              </dd>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                <div className='text-gray-400 italic'>{col.type}</div>
              </dd>

            </div>
          ))}
          
        </dl>
      </div>
    </div>
  )
}



const Source = ({sourceId}) => {
  const {falcor,falcorCache} = useFalcor()
  
  useEffect( () => {
    const fetchData = async () => { 
      const lengthPath = ["datamanager","sources","byId",sourceId,"views","length"]
      const resp = await falcor.get(lengthPath);
      return await falcor.get(
        [
          "datamanager","sources","byId",sourceId,"views","byIndex",
          {from:0, to:  get(resp.json, lengthPath, 0)-1},
          "attributes",Object.values(ViewAttributes)
        ],
        [
          "datamanager","sources","byId",sourceId,
          "attributes",Object.values(SourceAttributes)
        ]
      )
    }
    fetchData()
  }, [falcor, sourceId])

  const views = useMemo(() => {
    return Object.values(get(falcorCache,["datamanager","sources","byId",sourceId,"views","byIndex",],{}))
      .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
  },[falcorCache,sourceId])

  const source = useMemo(() => {
    return getAttributes(get(falcorCache,['datamanager','sources','byId', sourceId],{'attributes': {}})['attributes']) 
  },[falcorCache,sourceId])

  return (
    <div className='max-w-6xl mx-auto px-2'>
      <div className='text-xl font-medium overflow-hidden '>
        <div>{source.name} <i className='fa fa-plus text-base text-blue-700 cursor-pointer rounded-sm py-0.5 px-2 hover:bg-blue-400 hover:text-white'/></div>
      </div>
      <div className='w-full bg-white'>
        <Overview source={source} views={views} />
      </div>
      <div className='w-full p-4 bg-white'>
        <Metadata source={source} views={views} />
      </div>
    </div>
  )
}

export default Source