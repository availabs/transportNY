import React, { useEffect, useMemo, useState } from 'react';
import { useFalcor,TopNav } from 'modules/avl-components/src'
import get from 'lodash.get'
import { useParams } from 'react-router-dom'

import {SourceAttributes, ViewAttributes, getAttributes} from './components/attributes'

import SourcesLayout from './components/SourcesLayout'


const Overview = ({source, views}) => {
  return (
    <div className="overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <p className="mt-1 max-w-2xl text-sm text-gray-500">{get(source,'description', false) || 'No Description'}</p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {Object.keys(SourceAttributes)
            .filter(d => !['id','metadata','description'].includes(d))
            .map((attr,i) => (
            <div key={i} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">{attr}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {typeof source[attr] === 'object'}
                {typeof source[attr] === 'object' ? JSON.stringify(source[attr]) : source[attr]}
              </dd>
            </div>
          ))}
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Versions</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <ul role="list" className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {views.map((v,i) => (
                  <li key={i} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                  
                    <div className="w-0 flex-1 flex items-center">
                      <span className="ml-2 flex-1 w-0 truncate">{v.version}</span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Table
                      </a>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Download
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

const Metadata = ({source}) => {
  const metadata = get(source,'metadata',[])
  if (!metadata || metadata.length === 0) return <div> Metadata Not Available </div> 
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
         
          {metadata
            //.filter(d => !['id','metadata','description'].includes(d))
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


const Pages = {
  meta: Metadata
}


const Source = ({}) => {
  const {falcor,falcorCache} = useFalcor()
  const { sourceId,view } = useParams()
  const Page = useMemo(() => {
    return view ? get(Pages,view,Overview)  : Overview
  },[view])
  useEffect(async () => {
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
  }, [])

  const views = useMemo(() => {
    return Object.values(get(falcorCache,["datamanager","sources","byId",sourceId,"views","byIndex",],{}))
      .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
  },[falcorCache,sourceId])

  const source = useMemo(() => {
    return getAttributes(get(falcorCache,['datamanager','sources','byId', sourceId],{'attributes': {}})['attributes']) 
  },[falcorCache,sourceId])

  return (
    <div className='max-w-6xl mx-auto'>
      <SourcesLayout>
        <div className='text-xl font-medium overflow-hidden '>
          {source.name}
        </div>
        <TopNav 
          menuItems={[
            { 
              name: 'Overview',
              path: `/datasources/source/${sourceId}`
            },
            {
              name: 'Metadata',
              path: `/datasources/source/${sourceId}/meta`
            }
          ]}
          themeOptions={{size:'inline'}}
        />
        <div className='w-full p-4 bg-white shadow mb-4'>
          <Page source={source} views={views} />
        </div>
      </SourcesLayout>
    </div>
  )
}



const config = [{
  name:'View Source',
  path: "/datasources/source/:sourceId",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Source
},
{
  name:'View Source',
  path: "/datasources/source/:sourceId/:view",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Source
}]

export default config;
