import React, { useEffect, useMemo, useState } from 'react';
import { useFalcor, SideNav } from 'modules/avl-components/src'
import { Link } from 'react-router-dom'
import { useSelector } from "react-redux";

import get from 'lodash.get'
import {/*getDomain,*/getSubdomain} from 'utils'
import { useParams } from 'react-router-dom'

import { selectPgEnv } from "pages/DataManager/store"

import {SourceAttributes, ViewAttributes, getAttributes} from '../../components/attributes'

import Breadcrumbs from '../../components/Breadcrumbs'


const SourceThumb = ({source}) => {
  const {falcor} = useFalcor()
  const pgEnv = useSelector(selectPgEnv);
  
  useEffect(() => {
    async function fetchData () {
      const lengthPath = ["dama", pgEnv,"sources","byId",source.id,"views","length"]
      const resp = await falcor.get(lengthPath);
      return await falcor.get([
        "dama", pgEnv,"sources","byId",
        source.id, "views","byIndex",
        {from:0, to:  get(resp.json, lengthPath, 0)-1},
        "attributes", Object.values(ViewAttributes)
      ])
    }
    fetchData()
  }, [falcor,source.id])

  // const views = useMemo(() => {
  //   return Object.values(get(falcorCache,["dama", pgEnv,"sources","byId",source.id,"views","byIndex",],{}))
  //     .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
  // },[falcorCache,source.id])

  return (
    <div className='w-full p-4 bg-white my-1'>
      <div className='text-xl font-medium'>
        <Link to={`/datamanager/source/${source.id}`}>{source.name}</Link>
      </div>
      <div className='py-2'>
        {source.description}
      </div>
    </div>
  )
}

const domainFilters = {
  freightatlas: 'Freight Atlas',
  npmrds: 'NPMRDS',
  tsmo: 'TSMO',
  transit: 'Transit'
}

const SourcesLayout = ({children}) => {
  const SUBDOMAIN = getSubdomain(window.location.host)
  const {falcor,falcorCache} = useFalcor()
  // const [displayLayer, setDisplayLayer] = useState(null)
  const [layerSearch, setLayerSearch] = useState('')
  const { sourceId } = useParams()
  
  useEffect(() => {
      async function fetchData () {
        const lengthPath = ["dama", pgEnv, "sources", "length"];
        const resp = await falcor.get(lengthPath);
        return await falcor.get([
          "dama", pgEnv,"sources","byIndex",
          {from:0, to:  get(resp.json, lengthPath, 0)-1},
          "attributes",Object.values(SourceAttributes),
        ])
      }
      return fetchData()
  }, [falcor])

  const sources = useMemo(() => {
      return Object.values(get(falcorCache,["dama", pgEnv, 'sources','byIndex'],{}))
        .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
  },[falcorCache])

  const current_site = get(domainFilters, `[${SUBDOMAIN}]`, '') //'Freight Atlas'
  
  


  return (
    <div>
      <div className='pb-2'>
        <Breadcrumbs />
      </div>
      <div className='flex'>
        <div className='flex-1 pl-4 '>
          <div>
            <input 
              className='w-full text-lg p-2 border border-gray-300 ' 
              placeholder='Search for Layers'
              value={layerSearch}
              onChange={(e) => setLayerSearch(e.target.value)}
            />
          </div>
            {children ? 
              children : 
                sources
                .filter(d => { 
                  return !layerSearch || d.name.toLowerCase().includes(layerSearch.toLowerCase()) 
                })
                .map((s,i) => <SourceThumb key={i} source={s} />)
            }
          
        </div>
      </div>
    </div>
  )
}


export default SourcesLayout
