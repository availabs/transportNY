import React from "react"
import get from "lodash/get"
import { Disclosure } from '@headlessui/react'
import { useSearchParams } from "react-router-dom";

import { MultiLevelSelect } from "~/modules/avl-map-2/src"

const SourcePanel = props => {
	const [searchParams, setSearchParams] = useSearchParams();

	const urlActiveLayers = searchParams.get("layers")?.split('|').map(id => parseInt(id)).filter(item => !isNaN(item)) || [];

  const {
  	activeLayers,
  	inactiveLayers,
    layerProps,
    layerState,
    maplibreMap,
    ...rest
  } = props;

  const layerCategories = React.useMemo(() => {
  	return [...activeLayers, ...inactiveLayers]
	  	.reduce((out,layer) => {
	  		let cat = layer.categories.filter(d => d[0] === 'Freight Atlas')?.[0]?.[1] || 'other'
	  		if(!out[cat]) {
	  			out[cat] = []
	  		}
	  		out[cat].push(layer)
	  		return out
	  	},{})
  },[activeLayers, inactiveLayers, urlActiveLayers])

  return (
		<div className="border-t border-slate-200">
			{Object.keys(layerCategories)
				.sort((a,b) =>  a.localeCompare(b))
				.map((cat,i) => {
				return (
					<Disclosure key={`${cat}_disclosure`} defaultOpen={cat === 'Highway Network'}>
						 {({ open }) => (
            	<>
								<Disclosure.Button 
									className={"flex w-full justify-between items-center bg-slate-100 border-b border-slate-200 px-4 py-2 text-left text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75"}
								>
                <span>{cat}</span>
                <span
                  className={`${
                    open ? 'far fa-caret-down' : 'far fa-caret-right'
                  }  text-blue-500`}
                />
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
								{ layerCategories[cat].sort((a,b) => a.id - b.id).map(layer => (
										<SourceLayer key={ layer.id } { ...rest }
											layer={ layer }
											layerState={ get(layerState, layer.id, {}) }
											layerProps={ get(layerProps, layer.id, {}) }/>
									))
								}
							</Disclosure.Panel>
							</>
						)}
					</Disclosure>
				)})}
		</div>
  )
}
export default SourcePanel;

const SourceLayer = ({ layer, ...rest }) => {
	const [activeSymbology, setActiveSymbology] = React.useState(layer?.layers?.[0])

	return (
		<div className='border-b pl-1'>
			<div className="text-sm flex">
				<div className='flex items-center font-medium text-gray-800'>{ layer.name }</div>
				<div className='flex-1'/>
				<div className='flex items-center p-2  hover:text-blue-500 cursor-pointer'><span className='fa fa-info text-xs'/></div>
				<div className='flex items-center p-2  hover:text-blue-500 cursor-pointer'><span className='fa fa-download text-xs'/></div>
			</div>
			
			{/*<div className='flex'>
				<div className='text-xs text-gray-500 flex items-center pr-2' >version</div>
				<div className='flex-1 bg-slate-100'>
					<select 
						className={'p-1 text-sm w-full bg-slate-100'}
						onChange={e => setActiveView(layer.layers.filter(v=> v.id == e.target.value)?.[0] || {})}>
						{layer.layers.map(view => <option key={view.id} value={view.id}>{view.version || view.id}</option>)}		
					</select>
				</div>
			</div>*/}
			
			<ViewLayer
				key={ activeSymbology.id }
				MapActions={ rest.MapActions }
				layerState= { rest.layerState }
				layerId={ layer.id }
				symbology={ activeSymbology }
			/>
			
		</div>
	)
}

const ViewLayer = ({ layerId, symbology, layerState, MapActions }) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const urlActiveLayers = searchParams.get("layers")?.split('|').map(id => parseInt(id)).filter(item => !isNaN(item)) || [];

	const symbologies = React.useMemo(() => {
		return symbology?.symbology || []
	}, [symbology]);

	const activeSymbology = React.useMemo(() => {
		const active = get(layerState, "activeSymbology", null);
		return symbologies.reduce((a, c) => {
			return c === active ? c : a;
		}, null);
	}, [symbologies, layerState]);

	const setActiveSymbology = React.useCallback(value => {
		MapActions.updateLayerState(layerId, {
			activeSymbology: value
		});

		if (value) {
			if(!urlActiveLayers.includes(symbology.symbology_id)){
				//If activating layer, add symbology_id to URL
				setSearchParams(params => {
					urlActiveLayers.push(symbology.symbology_id);
					const newParams = urlActiveLayers.join('|');
					params.set("layers", newParams);
					return params;
				});
			}
			MapActions.activateLayer(layerId);
		}
		else {
			//If deactivating layer, remove symbology_id from URL
			setSearchParams(params => {
				const newActiveLayers = urlActiveLayers.filter(symbId => symbId !== symbology.symbology_id)
				const newParams = newActiveLayers.join('|');
				params.set("layers", newParams);
				return params;
			});

			MapActions.deactivateLayer(layerId);
		}
	}, [MapActions, layerId, urlActiveLayers, symbology]);

	React.useEffect(() => {
		// MapActions.toggleLayerVisibility(layerId);
		if(urlActiveLayers.includes(symbology.symbology_id)){
			console.log("should be active on map", symbology.symbology_id);
			setActiveSymbology(symbologies[0])
		}
		else{
			console.log("should not be active on map", symbology.symbology_id)
			setActiveSymbology()
		}
	},[urlActiveLayers.includes(symbology.symbology_id)])


	return (
		<div>
			<MultiLevelSelect
				placeholder="Select a symbology..."
				options={ symbologies }
				displayAccessor={ s => s.name }
				value={ activeSymbology }
				onChange={ setActiveSymbology }/>
		</div>
	)
}
