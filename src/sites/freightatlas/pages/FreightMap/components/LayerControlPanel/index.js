import React from 'react'
import { TabPanel, Dropdown } from "modules/avl-components/src"
import get from 'lodash.get'

const LayerStylePane = (props) => {
  console.log('LayerStylePane', props)
  const viewData = get(props.layer, 'view_data', {})
  return (
    <div className='border-t border-gray-300 h-full bg-gray-100 w-full'> 
      Styles ...
      <pre>
        {JSON.stringify(viewData, null,3)}
      </pre>

    </div>
  )
}


const LayerControlPanel = (props) => {
  const LayerTabs = [
        {
            name: 'styles',
            Component: LayerStylePane
        },
        {
            name: 'filter',
            Component: () => <div className='border-t border-gray-300 h-full bg-gray-100'> filter </div>
        },
        {
            name: 'source',
            Component: () => <div className='border-t border-gray-300 h-full bg-gray-100'> source </div>
        },
    ]

  const downloads = React.useMemo(() => get(props,'layer.metadata.download', {}), [props])

  return (
    <div className='pl-[4px] w-full bg-gray-100' style={{height: get(props, 'rect.height',0) - 15}}>
      <div className='w-full h-full  border-l border-gray-200'>
        <div className=' flex justify-between p-2 h-11  bg-white'>
          <div className='text-lg text-bold flex-1'>  {get(props, 'layer.name' , '')} </div>
          <div className='p-1 hover:border-blue-50 cursor-pointer'> 
            <Dropdown 
              control={<span className ='fad fa-download text-blue-500 p-2' alt='download' />} 
              className={` group `} 
              openType='click'
            >
               {Object.keys(downloads)
                .map((d,i) => (
                  <div key={i} className='bg-white p-2'>
                    <a onClick={() => console.log('clicked', d)} className='w-full text-center hover:border-b border-blue-300'  href={downloads[d]}>{d}</a>
                  </div>
                ))
              }    
                       
            </Dropdown>


          </div>
        </div>
        <div className='bg-white overflow-hidden'>
         <TabPanel 
            tabs={LayerTabs} 
            {...props} 
            themeOptions={{tabLocation:'top'}}
          />
        </div>
      </div>
    </div>
  )
}
export default LayerControlPanel