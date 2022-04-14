import React, { useEffect, useMemo, useState } from 'react';
import { useFalcor } from 'modules/avl-components/src'
import { Link } from 'react-router-dom'
import get from 'lodash.get'

import {SourceAttributes, ViewAttributes, getAttributes} from './attributes'



const SourceThumb = ({source}) => {
  const {falcor,falcorCache} = useFalcor()
  useEffect(async () => {
    const lengthPath = ["datamanager","sources","byId",source.id,"views","length"]
    const resp = await falcor.get(lengthPath);
    return await falcor.get([
      "datamanager","sources","byId",
      source.id, "views","byIndex",
      {from:0, to:  get(resp.json, lengthPath, 0)-1},
      "attributes", Object.values(ViewAttributes)
    ])
  }, [])

  const views = useMemo(() => {
    return Object.values(get(falcorCache,["datamanager","sources","byId",source.id,"views","byIndex",],{}))
      .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
  },[falcorCache,source.id])

  return (
    <div className='w-full p-4 bg-white my-1'>
      <div className='text-xl font-medium'>
        <Link to={`/datasources/source/${source.id}`}>{source.name}</Link>
      </div>
      <div className='py-2'>
        {source.description}
      </div>
    </div>
  )
}

const SourcesList = () => {
  const {falcor,falcorCache} = useFalcor()
  
  useEffect(async () => {
    const lengthPath = ["datamanager", "sources", "length"];
    const resp = await falcor.get(lengthPath);
    return await falcor.get([
      "datamanager","sources","byIndex",
      {from:0, to:  get(resp.json, lengthPath, 0)-1},
      "attributes",Object.values(SourceAttributes),
    ])
  }, [])

  const sources = useMemo(() => {
    return Object.values(get(falcorCache,['datamanager','sources','byIndex'],{}))
      .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
  },[falcorCache])

  const current_site = 'Freight Atlas'
  const current_filter = null
  let categories = sources
    .filter(d => d.categories.map(d => d[0]).includes(current_site))
    .reduce((a,b) => {
      b.categories.forEach(cat => {
        if(cat[0] === current_site){
          if(!a.includes(cat[1])){
            a.push(cat[1])
          }
        }
      })
      return a
    },[])
    .sort()
  categories.unshift('All')


  return (
    <div>
      <input className='w-full text-xl p-4 my-4' placeholder='Search' type='text' />
      <div className='flex'>
        <div className='pt-1 mr-2'>
          {
            categories.map(d => (
              <div className='border-r-4 border-gray-100 hover:border-blue-500 hover:text-blue-500 cursor-pointer p-4'>
                {d}
              </div>
            ))
          }
        </div>
        <div className='flex-1'>
            {sources
              //.filter(d => d.categories.map(d => d[0]).includes(current_site))
              .map(s => <SourceThumb source={s} />)
            }
            {/*<pre>
              {JSON.stringify(Object.values(sources),null,3)}
            </pre>*/}
        </div>
      </div>
    </div>
  )
}

export default SourcesList