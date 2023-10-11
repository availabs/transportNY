import React from "react"

import get from "lodash/get"

import { MultiLevelSelect } from "~/modules/avl-map-2/src"

const SourcePanel = props => {

  const {
  	activeLayers,
  	inactiveLayers,
    layerProps,
    layerState,
    maplibreMap,
    ...rest
  } = props;

  const layers = React.useMemo(() => {
  	return [...activeLayers, ...inactiveLayers];
  }, [activeLayers, inactiveLayers]);

  return (
		<div className="p-1 grid grid-cols-1 gap-1">
			<div className="font-bold text-lg border-b-2 border-current">
				Sources with Symbologies
			</div>
			{ layers.map(layer => (
					<SourceLayer key={ layer.id } { ...rest }
						layer={ layer }
						layerState={ get(layerState, layer.id, {}) }
						layerProps={ get(layerProps, layer.id, {}) }/>
				))
		}
		</div>
  )
}
export default SourcePanel;

const SourceLayer = ({ layer, ...rest }) => {

console.log("SourceLayer", layer)

	return (
		<div>
			<div className="font-bold border-b border-current">
				{ layer.name }
			</div>
			{ layer.layers.map(view => (
					<ViewLayer key={ view.id } { ...rest }
						layerId={ layer.id }
						view={ view }/>
				))
			}
		</div>
	)
}

const ViewLayer = ({ layerId, view, layerState, MapActions }) => {
	const symbologies = React.useMemo(() => {
		return get(view, ["metadata", "symbologies"], []);
	}, [view]);

console.log("VIEW LAYER", layerId, layerState);

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
			MapActions.activateLayer(layerId);
		}
		else {
			MapActions.deactivateLayer(layerId);
		}
	}, [MapActions, layerId]);

	return (
		<div>
			<div>{ view.version || view.id }</div>
			<MultiLevelSelect
				placeholder="Select a symbology..."
				options={ symbologies }
				displayAccessor={ s => s.name }
				value={ activeSymbology }
				onChange={ setActiveSymbology }/>
		</div>
	)
}