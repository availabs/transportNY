import React, {useState, useMemo, useEffect} from 'react'
import { TabPanel,  ColorInput } from "modules/avl-components/src"
import get from 'lodash.get'

const SymbologyControls = ({layer, onChange}) => {
  const [symbology, setSymbology] = useState(get(layer.views, `[${layer.activeView}]metadata.tiles.symbology`, []))

  useEffect(() => {
  	onChange(symbology)
  },[symbology])

  const mapBoxLayer = React.useMemo(() => 
  	get(layer.views, `[${layer.activeView}]metadata.tiles.layers[0]`, {}),
  	[layer.views, layer.activeView]
  )

  const data_table = useMemo(() => 
  	get(layer.views, `[${layer.activeView}].data_table`, ''),
  [layer.views, layer.activeView])
  
  const layerName = useMemo(() => 
  	get(data_table.split('.'),'[1]','').slice(0,-6),
  [data_table])

  const version = useMemo(() => 
  	get(data_table.split('.'),'[1]','').slice(-4),
  [data_table])

  const renderControl = React.useMemo(() => {
  	switch(mapBoxLayer.type) {
  		case 'line':
  			return <LineSymbologyControl 
  				symbology={symbology}
  				layerName={layerName}
  				version={version}
  				setSymbology={setSymbology}
  			/>
  		case 'circle':
  			return <PointSymbologyControl />
  		case 'fill':
  			return <PolygonSymbologyControl />
  		default:
  			return <div>Invalid Layer</div>
  	} 
  		
  },[mapBoxLayer,symbology, layerName, version])

  return React.useMemo(() => (
    <div className='border-t border-gray-300 h-full w-full'> 
      {/*<pre>
      	{JSON.stringify(symbology,null,3)}
    	</pre>*/}
      {renderControl}

    </div>
  ), [renderControl])
}

//
const LineSymbologyControl = (props) => {
  return (
    <div className=''>
    	<TabPanel 
            tabs={[
            	{
            		name: <div className='text-sm text-left'> Color </div>,
            		Component: () => <LineColorControl {...props}/>
        			},
        			{
            		name: <div className='text-sm text-left'> Opacity </div>,
            		Component: LineOpacityControl
        			},
            	{
            		name: <div className='text-sm text-left'> Width </div>,
            		Component: StrokeWidthControl
        			},
        			
       			]}
            {...props} 
            themeOptions={{tabLocation:'left'}}
       />
    </div>
  )
}



const ColorControl = ({symbology,onChange}) => {
		const renderControl = React.useMemo(() => {
	  	switch(symbology.type) {
	  		case 'simple':
	  			return <SimpleColorControl 
						{...symbology}
						onChange={onChange}
					/>
	  		case 'scale-ordinal':
	  			return <OrdinalScaleColorControl 
						{...symbology}
						onChange={onChange}
					/>
	  		case 'scale-threshold':
	  			return <ThresholdScaleColorControl 
						{...symbology}
						onChange={onChange}
					/>
	  		default:
	  			return <div>Invalid Layer</div>
	  	}
	  },[symbology])

		return (
			<div>
				<div className='p-1'>
					<select 
						className='p-2 w-full bg-white'
						value={symbology.type} 
						onChange={v => onChange("type", v.target.value)} >
						<option value='simple'>Single Color</option>
						<option value='scale-ordinal'>Category</option>
						<option value='scale-threshold'>Threshold</option>
					</select>
				</div>
				{renderControl}

			</div>
		)

}

const SimpleColorControl = ({value,onChange}) => 
		<ColorInput 
			value={ value } small
      onChange={ v => onChange("value", v) }
      showInputs={ true }
     />

const ThresholdScaleColorControl = ({value,onChange}) => 
		<div> Threshold Scale Color Control </div>

const OrdinalScaleColorControl = ({value,onChange}) => 
		<div> Ordinal Scale Color Control </div>
	
const SimpleRangeControl = ({value,onChange, min=0, max=1,step=0.01}) => 
		<div className = 'flex justify-between items-center p-1 '>
			<div className='pt-2'>
				<input 
					type='range'
					min={min}
					max={max}
					step={step}
					value={ value } 
		      onChange={ v => onChange("value", v.target.value) }
		     />
		  </div>
		  <div>{value}</div>
		</div>

const LineColorControl = ({symbology, layerName, version, setSymbology}) => {
	const lineColorIndex = useMemo(() => getStyleIndex(symbology,'line-color'),[symbology])
	const [lineColor,setLineColor] = useState({
		paint: 'line-color',
		type: get(symbology, `[${lineColorIndex}].type`, 'simple'),
		value: get(symbology, `[${lineColorIndex}].value`, '#fff'),
		range: get(symbology, `[${lineColorIndex}].range`, []),
		domain: get(symbology, `[${lineColorIndex}].domain`, []),
		column: get(symbology, `[${lineColorIndex}].column`, ''),
	})

	const update = (attr,value) => {
		setLineColor({...lineColor, [attr]: value})
		if(lineColorIndex === -1) {
			setSymbology([
				...symbology,
				{...lineColor, [attr]: value}
			])
		} else {
			let newSymbology = [...symbology]
			newSymbology[lineColorIndex] = {...lineColor, [attr]: value}
			setSymbology(newSymbology)
		}

	}

	return (
		<div className='flex px-2 py-4 h-full'>
			<div className='bg-white flex-1 border border-gray-300 hover:bg-gray-100 h-full'>
				<ColorControl
					symbology={lineColor}
					onChange={update}
				/>
			</div>
		</div>
	)
}

const LineOpacityControl = ({symbology, layerName, version, setSymbology}) => {
	const lineColorIndex = useMemo(() => getStyleIndex(symbology,'line-opacity'),[symbology])
	const [lineColor,setLineColor] = useState({
		paint: 'line-opacity',
		type: get(symbology, `[${lineColorIndex}].type`, 'simple'),
		value: get(symbology, `[${lineColorIndex}].value`, 1),
		range: get(symbology, `[${lineColorIndex}].range`, []),
		domain: get(symbology, `[${lineColorIndex}].domain`, []),
		column: get(symbology, `[${lineColorIndex}].column`, ''),
	})

	const update = (attr,value) => {
		setLineColor({...lineColor, [attr]: value})
		if(lineColorIndex === -1) {
			setSymbology([
				...symbology,
				{...lineColor, [attr]: +value}
			])
		} else {
			let newSymbology = [...symbology]
			newSymbology[lineColorIndex] = {...lineColor, [attr]: value}
			setSymbology(newSymbology)
		}

	}

	return (
		<div className='flex px-2 py-4 h-full'>
			<div className='bg-white flex-1 border border-gray-300 hover:bg-gray-100 h-full'>
				<SimpleRangeControl 
					value={lineColor.value}
					onChange={update}
				/>
			</div>
		</div>
	)
}


const StrokeWidthControl = () => {
	return (
		<div className='flex px-2 py-4 '>
			<div className='bg-white flex-1 border border-gray-300 hover:bg-gray-100'>
				x
			</div>
		</div>
	)
}

const OpacityControl = () => {
	return (
		<div className='flex px-2 py-4 '>
			<div className='bg-white flex-1 border border-gray-300 hover:bg-gray-100'>
				x	
			</div>
		</div>
	)
} 

const PointSymbologyControl = (props) => {
  return (
    <div className='-t border-gray-300 h-full bg-gray-100 w-full'> 
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

const getStyleIndex = (symbologoy, paint) => {
	return symbologoy.reduce((out,current,i) => {
		if(current.paint === paint) {
			out = i
		}
		return out
	},-1)
}

export { SymbologyControls }