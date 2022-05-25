import React, { useEffect, useMemo, useState } from 'react';
import { useFalcor, SideNav } from 'modules/avl-components/src'
import { Link } from 'react-router-dom'
import get from 'lodash.get'
import {getDomain,getSubdomain} from 'utils'
import { useParams } from 'react-router-dom'

import {SourceAttributes, ViewAttributes, getAttributes} from './attributes'

import Breadcrumbs from './Breadcrumbs'



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

const SourcesLayout = ({children}) => {
  const SUBDOMAIN = getSubdomain(window.location.host)
  const {falcor,falcorCache} = useFalcor()
  const [displayLayer, setDisplayLayer] = useState(null)
  const [layerSearch, setLayerSearch] = useState('')
  const { sourceId } = useParams()
  
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
  let menuItems =  useMemo(() => { 
      return Object.values(sources
      .filter(d => d.categories.map(d => d[0]).includes(current_site))
      .filter(d => { 
        return !layerSearch || d.name.split('/').pop().split('_').join(' ').toLowerCase().includes(layerSearch.toLowerCase()) 
      })
      .reduce((a,b) => {
        b.categories.forEach(cat => {
          if(cat[0] === current_site){
            if(!a[cat[1]]){
              a[cat[1]] = {
                name: <div className='font-bold'>{cat[1]}</div>,
                subMenus: []
              }
            }
            a[cat[1]].subMenus.push({
              className: ' ',
              name: (
                <div className={`flex p-2 hover:bg-blue-100 border-r-4 ${b.id === +sourceId ? 'border-blue-600 text-blue-600' : 'border-neutral-100'}`}>
                  <Link 
                    to={`/datasources/source/${b.id}`} 
                    className='flex-1 pl-6 cursor-pointer text-sm'>
                      {b.name.split('/').pop().split('_').join(' ')}
                  </Link>
                </div>
              ),
              
            })
          }
        })
        return a
      },{}))
    },[sources,sourceId,layerSearch])


  return (
    <div>
      <div className='pb-2'>
        <Breadcrumbs />
      </div>
      <div className='flex'>
        <div className='w-72  shadow h-full sticky top-0 '>
          <div className='pt-1 pb-4 pr-1'>
            <input 
              className='w-full text-lg p-2 border border-gray-300 ' 
              placeholder='Search for Layers'
              value={layerSearch}
              onChange={(e) => setLayerSearch(e.target.value)}
            />
          </div>
          <div className = 'h-full overflow-y-scroll scrollbar-xs overflow-x-hidden max-h-screen'>
            <SideNav
              menuItems={menuItems}
              themeOptions={{size:'full',responsive: 'none',color: 'transparent'}}
            />
          </div>
        </div>
        <div className='flex-1 pl-4 '>
            {children ? 
              children : 
                sources
                .map((s,i) => <SourceThumb key={i} source={s} />)
            }
          
        </div>
      </div>
    </div>
  )
}


export default SourcesLayout