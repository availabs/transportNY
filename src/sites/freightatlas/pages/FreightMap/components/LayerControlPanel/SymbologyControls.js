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

export LayerStylePane