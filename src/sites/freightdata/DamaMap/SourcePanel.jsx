import React from "react"

import get from "lodash/get"

import { useFalcor } from "~/modules/avl-components/src";

import {
  MultiLevelSelect,
  useTheme
} from "~/modules/avl-map-2/src"

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
    setActiveViewId,
    activeDataVariable,
    setActiveDataVariable
  } = layerProps;

  const doSetActiveView = React.useCallback(view_id => {
    setActiveViewId(layer.id, view_id);
  }, [layer.id, setActiveViewId]);

  const doSetActiveDataVariable = React.useCallback(v => {
    setActiveDataVariable(layer.id, v);
  }, [layer.id, setActiveDataVariable]);

  React.useEffect(() => {
    if (!activeViewId) {
      doSetActiveView(layer?.layers[0]?.view_id);
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

  const sourceVariables = useSourceVariables(layer, activeViewId, pgEnv, startLoading, stopLoading);

  // const [activeDataVariable, setActiveDataVariable] = React.useState(null);
  // const [activeMetaVariables, setActiveMetaVariables] = React.useState(null);

  React.useEffect(() => {
    if (!activeDataVariable || !isActive || !resourcesLoaded) {
      setLayerData([]);
      return;
    }

    const dataById = get(falcorCache, ["dama", pgEnv, "viewsbyId", activeViewId, "databyId"], {});
    const data = Object.keys(dataById)
      .map(id => {
        const value = get(dataById, [id, activeDataVariable.name], null);
        return {
          id,
          var: activeDataVariable.name,
          type: activeDataVariable.type,
          value: value === 'null' ? null : value
        }
      }).filter(d => d.value !== null);
    setLayerData(layer.id, data);
  }, [falcorCache, pgEnv, setLayerData, layer.id, activeViewId, activeDataVariable, isActive, resourcesLoaded]);

  const views = React.useMemo(() => {
    return layer.damaSource?.views || [];
  }, [layer.damaSource]);

  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = React.useCallback(e => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);

  const theme = useTheme();

  return (
    <div>
      <div onClick={ toggle }
        className={ `
          rounded-t font-bold cursor-pointer flex
          ${ theme.bgAccent1 }
        ` }
      >
        <div onClick={ toggleSource }
          className={ `
            border border-current p-1 group ${ theme.bgAccent2Hover }
            ${ isOpen ? "rounded-tl" : "rounded-l" }
          ` }
        >
          <ActiveIcon isActive={ isActive }/>
          </div>
        <div className={ `
            border-y border-r border-current p-1 flex-1 ${ theme.bgAccent2Hover }
            ${ isOpen ? "rounded-tr" : "rounded-r" } flex
          ` }
        >
          <div className="flex-1">
            { layer.name }
          </div>
        </div>
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
              valueAccessor={ lbv => lbv.view_id }
              removable={ false }/>
          </div>

          <div>
            <div className="font-bold">Variables</div>
            <MultiLevelSelect
              options={ sourceVariables }
              value={ activeDataVariable }
              onChange={ doSetActiveDataVariable }
              displayAccessor={ v => v.name }
              removable={ false }
              placeholder="Select a data variable..."/>
          </div>
{/*
          <div>
            <div className="font-bold">Meta Variables</div>
            <MultiLevelSelect isMulti
              options={ metaVariables }
              value={ activeMetaVariables }
              onChange={ setActiveMetaVariables }
              placeholder="Select meta variables..."/>
          </div>
*/}
        </div>
      </div>

    </div>
  )
}

const ActiveIcon = ({ isActive, onClick }) => {
  const theme = useTheme();
  return (
    <div onClick={ onClick }>
      <span className={ `
        fa ${ isActive ?
              `fa-toggle-on ${ theme.textHighlight }` :
              `fa-toggle-off ${ theme.text }`
            }
      ` }/>
    </div>
  )
}
