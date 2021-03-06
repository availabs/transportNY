import React, { useEffect, /*useMemo,*/ useState } from 'react';
import { useFalcor, withAuth, Input, Button } from 'modules/avl-components/src'
import get from 'lodash.get'
import { SourceAttributes } from 'pages/DataManager/components/attributes'

const Edit = ({startValue, attr, sourceId, cancel=()=>{}}) => {
  const { falcor } = useFalcor()
  const [value, setValue] = useState('')
  /*const [loading, setLoading] = useState(false)*/

  useEffect(() => {
    setValue(startValue)
  },[startValue])

  const save = (attr, value) => {
    if(sourceId) {
      falcor.set({
          paths: [
            ['datamanager','sources','byId',sourceId,'attributes', attr ]
          ],
          jsonGraph: {
            datamanager:{
              sources: {
                byId:{
                  [sourceId] : {
                      attributes : {[attr]: value}
                  }
                }
              }
            }
          }
      }).then(d => {
        console.log('set run', d)
        cancel()
      })
    }
  }

  return (
    <div className='w-full flex'>
      <Input className='flex-1 px-2 shadow bg-blue-100 focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md' value={value} onChange={e => setValue(e)}/>
      <Button themeOptions={{size:'sm', color: 'primary'}} onClick={e => save(attr,value)}> Save </Button>
      <Button themeOptions={{size:'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
    </div>
  )
}

const OverviewEdit = withAuth(({source, views, user}) => {
  const [editing, setEditing] = React.useState(null)
  
  return (
    <div className="overflow-hidden">
      <div className="pl-4 py-6 hover:py-6 sm:pl-6 flex justify-between group">
        <div className="flex-1 mt-1 max-w-2xl text-sm text-gray-500">
          {editing === 'description' ? 
            <Edit startValue={get(source,'description', '')} cancel={() => setEditing(null)}/> : 
            get(source,'description', false) || 'No Description'}
        </div>
        <div className='hidden group-hover:block text-blue-500 cursor-pointer' onClick={e => setEditing('description')}>
            <i className="fad fa-pencil absolute -ml-12  p-2 hover:bg-blue-500 rounded focus:bg-blue-700 hover:text-white "/>
        </div>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {Object.keys(SourceAttributes)
            .filter(d => !['id','metadata','description', 'statistics', 'category'].includes(d))
            .map((attr,i) => {
              let val = typeof source[attr] === 'object' ? JSON.stringify(source[attr]) : source[attr]
              return (
                <div key={i} className='flex justify-between group'>
                  <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 py-5">{attr}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {editing === attr ? 
                        <div className='pt-3 pr-8'>
                          <Edit 
                            startValue={val} 
                            attr={attr}
                            sourceId={source.id} 
                            cancel={() => setEditing(null)}
                          />
                        </div> :  
                        <div className='py-5 px-2'>{val}</div> 
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
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Versions</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {views.map((v,i) => (
                  <li key={i} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <span className="ml-2 flex-1 w-0 truncate">{v.version}</span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="font-medium text-indigo-600 hover:text-indigo-500">
                        Table
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="font-medium text-indigo-600 hover:text-indigo-500">
                        Download
                      </div>
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
})


export default OverviewEdit    
