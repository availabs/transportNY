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

  const currentFilter = 'FREIGHT_ATLAS'

  return (
    <div className=''>
      
        {sources
          //.filter(s => s.category.includes(currentFilter)) 
          .map(s => <SourceThumb source={s} />)
        }
        {/*<pre>
          {JSON.stringify(Object.values(sources),null,3)}
        </pre>*/}
    </div>
  )
}

export default SourcesList