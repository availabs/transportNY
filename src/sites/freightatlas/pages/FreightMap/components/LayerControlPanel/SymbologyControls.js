import React from 'react'
// import { TabPanel, Dropdown } from "modules/avl-components/src"
import get from 'lodash.get'

const LayerStylePane = (props) => {
  const mapBoxLayer = React.useMemo(() => 
  	get(props.layer.views, `[${props.layer.activeView}]metadata.tiles.layers[0]`, {}),
  	[props.layer.views, props.layer.activeView]
  )

  const renderControl = React.useMemo(() => {
  	switch(mapBoxLayer.type) {
  		case 'line':
  			return <LineSymbologyControl />
  		case 'circle':
  			return <PointSymbologyControl />
  		case 'fill':
  			return <PolygonSymbologyControl />
  		default:
  			return <div>Invalid Layer</div>
  	} 
  		
  },[mapBoxLayer])

  React.useMemo(() => (
    <div className='border-t border-gray-300 h-full bg-gray-100 w-full'> 
      {renderControl}
      {/*<pre>
        {JSON.stringify(mapBoxLayer, null,3)}
      </pre>*/}

    </div>
  ), [renderControl])
}

const StrokeWidthControl = () => {
	return (
		<div className='flex px-2 py-4 '>
			<div className='p-2 text-left text-xs w-14'>Stroke</div>
			<div className='bg-white flex-1 border border-gray-300 hover:bg-gray-100'>
				
			</div>
		</div>
	)
}

const StrokeColorControl = () => {
	return (
		<div className='flex px-2 py-4 '>
			<div className='p-2 text-left text-xs w-14'>Color</div>
			<div className='bg-white flex-1 border border-gray-300 hover:bg-gray-100'>
				
			</div>
		</div>
	)
}

const OpacityControl = () => {
	return (
		<div className='flex px-2 py-4 '>
			<div className='p-2 text-left text-xs w-14'>Opacity</div>
			<div className='bg-white flex-1 border border-gray-300 hover:bg-gray-100'>
				
			</div>
		</div>
	)
} 

const LineSymbologyControl = (props) => {
  return (
    <div className=''> 
      <StrokeWidthControl />
      <StrokeColorControl />
      <OpacityControl />
    </div>
  )
}

const PointSymbologyControl = (props) => {
  return (
    <div className='border-t border-gray-300 h-full bg-gray-100 w-full'> 
      Point
    </div>
  )
}

const PolygonSymbologyControl = (props) => {
  return (
    <div className='border-t border-gray-300 h-full bg-gray-100 w-full'> 
      Polygon
    </div>
  )
}

export { LayerStylePane }