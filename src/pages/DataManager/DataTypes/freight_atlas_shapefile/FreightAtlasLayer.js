import React from 'react'
import { useFalcor } from 'modules/avl-components/src'
import get from 'lodash.get'
import { LayerContainer } from "modules/avl-map/src";

const HoverComp = ({ data, layer }) => {
  const { falcor, falcorCache } = useFalcor() 
  const layerName = React.useMemo(() => get(data ,'[1]', '').slice(0,-6), [data])
  const version = React.useMemo(() => get(data, '[1]', '').slice(-4), [data])
  const id = React.useMemo(() => get(data, '[0]', null), [data])
  let attributes = React.useMemo(() => get(layer.source, 'metadata', [])
    .map(d => d.name)
    .filter(d => !['wkb_geometry', 'objectid', 'objectid_1'].includes(d)), 
    [layer.source])
  
  React.useEffect(() => {
    // console.log('hover fetch')
    falcor.get(
      [
        "nysdot-freight-atlas",
        layerName,
        "byVersion",
        version,
        "byId",
        id,
        attributes
      ]
    )
  }, [ id, layerName, version, attributes, falcor]);

  const AttrInfo = React.useMemo(() => {
    return get(falcorCache, [
        "nysdot-freight-atlas",
        layerName,
        "byVersion",
        version,
        "byId",
        id
      ], {});
  }, [id, falcorCache, layerName, version]);

  return (
    <div className='bg-white p-4 max-h-64 scrollbar-xs overflow-y-scroll'>
      <div className='font-medium pb-1 w-full border-b '>{layer.source.display_name}</div>
        {Object.keys(AttrInfo).length === 0 ? `Fetching Attributes ${id}` : ''}
        {Object.keys(AttrInfo).map((k,i) => 
          <div className='flex border-b pt-1' key={i}>
            <div className='flex-1 font-medium text-sm pl-1'>{k}</div>
            <div className='flex-1 text-right font-thin pl-4 pr-1'>{AttrInfo[k].value}</div>
          </div>
        )} 
    </div>
  )
}

class FreightAtlasLayer extends LayerContainer {
  legend = {
    type: "quantile",
    domain: [0, 150],
    range: [],
    format: ".2s",
    show: false,
    Title: ''
  };

  onHover = {
    layers: this.layers.map(d => d.id),
    callback: (layerId, features, lngLat) => {
      let feature = features[0];
      
      let data = [feature.properties.id,  layerId ] 
      
      return data
    },
    HoverComp
  };

  init(map, falcor) {
    
  }

  render(map) {
    console.log('FreightAtlasFactory', this.layer_id)  
  }
   
}

const FreightAtlasFactory = (options = {}) => new FreightAtlasLayer(options);
export default FreightAtlasFactory

