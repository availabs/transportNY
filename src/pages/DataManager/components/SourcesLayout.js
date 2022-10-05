import React, { useEffect, useMemo, useState } from 'react';
import { useFalcor, /*SideNav,*/ Dropdown, withAuth } from 'modules/avl-components/src'
import { Link } from 'react-router-dom'
import { useSelector } from "react-redux";

import get from 'lodash.get'
// import {getDomain,getSubdomain} from 'utils'
import { useParams } from 'react-router-dom'

import {Item} from 'pages/Auth/AuthMenu'

import { selectPgEnv } from "pages/DataManager/store"

import {SourceAttributes, ViewAttributes, getAttributes} from './attributes'

import Breadcrumbs from './Breadcrumbs'


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
  }, [falcor, source.id, pgEnv])

  // const views = useMemo(() => {
  //   return Object.values(get(falcorCache,["dama", pgEnv,"sources","byId",source.id,"views","byIndex",],{}))
  //     .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
  // },[falcorCache,source.id])

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

// const domainFilters = {
//   freightatlas: 'Freight Atlas',
//   npmrds: 'NPMRDS',
//   tsmo: 'TSMO',
//   transit: 'Transit'
// }

const SourcesLayout = ({children}) => {
  //const SUBDOMAIN = getSubdomain(window.location.host)
  const {falcor,falcorCache} = useFalcor()
  // const [displayLayer, setDisplayLayer] = useState(null)
  const [layerSearch, setLayerSearch] = useState('')
  const { sourceId } = useParams()
  const pgEnv = useSelector(selectPgEnv);
  
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
  }, [falcor, pgEnv])

  const sources = useMemo(() => {
      return Object.values(get(falcorCache,["dama", pgEnv,'sources','byIndex'],{}))
        .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
  },[falcorCache, pgEnv])

  // const current_site = get(domainFilters, `[${SUBDOMAIN}]`, '') //'Freight Atlas'
  
  /*let menuItems =  useMemo(() => { 
    let menu =  Object.values(sources
        .filter(d => get(d,`categories`,[]).map(d => d[0]).includes(current_site))
        .filter(d => { 
          return !layerSearch || d.name.split('/').pop().split('_').join(' ').toLowerCase().includes(layerSearch.toLowerCase()) 
        })
      .reduce((a,b) => {/
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
      console.log('cacl menu', menu)
      return menu
    },[sources,sourceId,layerSearch,current_site])*/


  return (
    <div>
      <div className=''>
        <Breadcrumbs />
      </div>
      <div className='flex'>
        {/*<div className='w-72  shadow h-full sticky top-0 '>
          <div className='pt-1 pb-4 px-1'>
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
        </div>*/}
        <div className='flex-1 pl-4 '>
          {sourceId ? '' : 
            
            <div className='py-4'>
              <div>
                <input 
                  className='w-full text-lg p-2 border border-gray-300 ' 
                  placeholder='Search datasources'
                  value={layerSearch}
                  onChange={(e) => setLayerSearch(e.target.value)}
                />
              </div>
            </div>
          }
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

export const DataManagerHeader = withAuth(({user}) => {
  return (
    <div className='pt-[2px]'>
      { user.authLevel >= 5 ? 
        (
          <div className=' h-full'>
            <Dropdown control={
              <div className='px-2 flex text-lg'>
                <div className=' font-medium text-gray-800'> Data Manager</div> 
                <div className='fal fa-angle-down px-3 mt-[6px] '/>
              </div>} 
              className={`text-gray-800 group`} openType='click'
            >
              <div className='p-1 bg-blue-500 text-base'>
                <div className='py-1 '> 
                    {Item('/datasources/create/source', 'fa fa-file-plus flex-shrink-0  pr-1', 'Add New Datasource')}
                </div>
              </div>          

              <div className='p-1 bg-blue-500 text-base'>
                <div className='py-1 '>
                    {Item('/datasources/settings', 'fa fa-file-plus flex-shrink-0  pr-1', 'Settings')}
                </div>
              </div>
            </Dropdown>
          </div>
        ) 
        : <div/>
      }
    </div>
  )
})


export default SourcesLayout
