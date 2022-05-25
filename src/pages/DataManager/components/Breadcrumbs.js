import React, {useMemo, useEffect} from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFalcor } from 'modules/avl-components/src'
import get from 'lodash.get'
import { getAttributes } from './attributes'


export default function BreadCrumbs () {
  const { sourceId,view } = useParams()
  const {falcor,falcorCache} = useFalcor()
  useEffect(async () => {
    return await falcor.get(
      [
        "datamanager","sources","byId",sourceId,
        "attributes",["categories","name"]
      ]
    )
  }, [])

  const pages = useMemo(() => {
    let attr = getAttributes(get(falcorCache,['datamanager','sources','byId', sourceId],{'attributes': {}})['attributes']) 
    if(!get(attr, 'categories[0]', false)) { 
      return [{name:'',to:''}]
    }
    let cats =  attr.categories[0].map(d => {
      return {
        name: d,
        to: ''
      }
    })
    cats.push({name:attr.name.split('/').pop().split('_').join(' ')})
    return cats

  },[falcorCache,sourceId])

  return (
    <nav className="border-b border-gray-200 flex" aria-label="Breadcrumb">
      <ol role="list" className="max-w-screen-xl w-full mx-auto px-4 flex space-x-4 sm:px-6 lg:px-8">
        <li className="flex">
          <div className="flex items-center">
            <Link to='/datasources' className="text-blue-400 hover:text-blue-500">
              <i className="fad fa-database flex-shrink-0 h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Data Sources</span>
            </Link>
          </div>
        </li>
        {pages.map((page) => (
          <li key={page.name} className="flex">
            <div className="flex items-center">
              <svg
                className="flex-shrink-0 w-6 h-full text-gray-300"
                viewBox="0 0 30 44"
                preserveAspectRatio="none"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              <Link
                href={page.href}
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                aria-current={page.current ? 'page' : undefined}
              >
                {page.name}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}