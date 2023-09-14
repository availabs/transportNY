import React from "react"

import get from "lodash/get"

import { useFalcor } from "~/modules/avl-components/src";

import { MultiLevelSelect } from "~/modules/avl-map-2/src"

import useSourceVariables from "./useSourceVariables"

const SourcePanel = props => {

  const {
    activeLayers,
    inactiveLayers,
    MapActions,
    maplibreMap,
    layerProps,
    resourcesLoaded,
    ...rest
  } = props;

  const layers = React.useMemo(() => {
    return [
      ...activeLayers,
      ...inactiveLayers
    ].sort((a, b) => a.name.localeCompare(b.name))
  }, [activeLayers, inactiveLayers]);

  return (
    <div className="grid grid-cols-1 gap-1">
      { layers.map(layer => (
          <LayerPanel key={ layer.name }
            layer={ layer }
            isActive={ activeLayers.includes(layer ) }
            MapActions={ MapActions }
            maplibreMap={ maplibreMap }
            resourcesLoaded={ resourcesLoaded[layer.id] }
            layerProps={ layerProps[layer.id] }/>
        ))
      }
    </div>
  )
}
export default SourcePanel;

const LayerPanel = props => {

  const { falcor, falcorCache } = useFalcor();

  const {
    layer,
    isActive,
    MapActions,
    maplibreMap,
    resourcesLoaded,
    layerProps
  } = props;

  const {
    activateLayer,
    deactivateLayer,
    startLayerLoading,
    stopLayerLoading
  } = MapActions;

  const startLoading = React.useCallback(() => {
    startLayerLoading(layer.id);
  }, [startLayerLoading, layer.id]);
  const stopLoading = React.useCallback(() => {
    stopLayerLoading(layer.id);
  }, [stopLayerLoading, layer.id]);

  const {
    pgEnv,
    setLayerData,
    layerData,
    activeViewId,
    setActiveViewId
  } = layerProps;

  const doSetActiveView = React.useCallback(viewId => {
    setActiveViewId(layer.id, viewId);
  }, [layer.id, setActiveViewId]);

  React.useEffect(() => {
    if (!activeViewId) {
      doSetActiveView(layer?.layers[0]?.viewId);
    }
  }, [layer.layers, activeViewId, doSetActiveView]);

  const toggleSource = React.useCallback(e => {
    e.stopPropagation();
    if (isActive) {
      deactivateLayer(layer.id);
    }
    else {
      activateLayer(layer.id);
    }
  }, [activateLayer, deactivateLayer, layer.id, isActive, setLayerData]);

  const [dataVariables, metaVariables] = useSourceVariables(layer, activeViewId, pgEnv, startLoading, stopLoading);

  const [activeDataVariable, setActiveDataVariable] = React.useState(null);
  const [activeMetaVariables, setActiveMetaVariables] = React.useState(null);

  React.useEffect(() => {
    if (!activeDataVariable) setLayerData([]);
    if (!isActive) setLayerData([]);
    if (!resourcesLoaded) setLayerData([]);

    const dataById = get(falcorCache, ["dama", pgEnv, "viewsbyId", activeViewId, "databyId"], {});
    const data = Object.keys(dataById)
      .map(id => {
        const value = get(dataById, [id, activeDataVariable], null);
        return {
          id,
          var: activeDataVariable,
          value: value === 'null' ? null : value
        }
      }).filter(d => d.value !== null);
    setLayerData(layer.id, data);
  }, [falcorCache, pgEnv, setLayerData, layer.id, activeViewId, activeDataVariable, isActive, resourcesLoaded]);

  const views = React.useMemo(() => {
    return get(layer, ["damaSource", "views"], [])
      .map((view, i) => ({
        viewId: view.view_id,
        version: get(view, ["version", "value"], get(view, "version")) || `unknown version ${ i }`
      }))
  }, [layer.damaSource]);

  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = React.useCallback(e => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div>
      <div onClick={ toggle }
        className={ `
          border border-current rounded-t font-bold flex p-1
          bg-gray-200 hover:bg-gray-300 cursor-pointer
          ${ isOpen ? "rounded-t" : "rounded" }
        ` }
      >
        <ActiveIcon isActive={ isActive }
          onClick={ toggleSource }/>{ layer.name }
      </div>
      <div className={ isOpen ? "block" : "h-0 overflow-hidden invisible" }>
        <div className="border-x border-b border-current rounded-b grid grid-cols-1 gap-1 p-1">
          <div>
            <div className="font-bold">Version</div>
            <MultiLevelSelect
              options={ views }
              value={ activeViewId }
              onChange={ doSetActiveView }
              displayAccessor={ lbv =>  lbv.version }
              valueAccessor={ lbv => lbv.viewId }
              removable={ false }/>
          </div>

          <div>
            <div className="font-bold">Data Variables</div>
            <MultiLevelSelect
              options={ dataVariables }
              value={ activeDataVariable }
              onChange={ setActiveDataVariable }
              removable={ false }
              placeholder="Select a data variable..."/>
          </div>

          <div>
            <div className="font-bold">Meta Variables</div>
            <MultiLevelSelect isMulti
              options={ metaVariables }
              value={ activeMetaVariables }
              onChange={ setActiveMetaVariables }
              placeholder="Select meta variables..."/>
          </div>

        </div>
      </div>

    </div>
  )
}

const ActiveIcon = ({ isActive, onClick }) => {
  return (
    <div className="mr-1" onClick={ onClick }>
      <span className={ `
        fa ${ isActive ? "fa-toggle-on text-green-500" : "fa-toggle-off text-red-500" }
      ` }/>
    </div>
  )
}
