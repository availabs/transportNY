import React from 'react'
import get from 'lodash.get'

import { getColorRange, Legend } from "avl-components"
import { Select, useFalcor } from '@availabs/avl-components'

import { RISSources, RISLayers } from 'pages/map/map-styles/ris'

import { LayerContainer } from "modules/avl-map/src"


const HoverComp = ({ data, layer }) => {
  const { falcor, falcorCache} = useFalcor();
  const risId = get(data , `[4][1]` , null)

  React.useEffect(() => {
    if (risId === null) return;
    falcor.get([
      "ris", risId, 'meta', 2018,
      [
       'region',
       'gis_id',
       'road_name',
       'begin_description',
       'end_description',
       'county_order',
       'aadt_single_unit',
       'aadt_combo',
       'beg_mp',
       'end_mp'
      ]
    ])
  }, [falcor, risId]);

  const RisInfo = React.useMemo(() => {
    return  get(falcorCache, ["ris", risId, 'meta', 2018], {})
  }, [risId, falcorCache,]);

  return (
    <div className="p-1 bg-gray-600">
      <div className=" px-2">
        <div className="text-center">
          {RisInfo.road_name}
        </div>
        <div className='flex text-xs text-center'>
          <div className='flex-1'>from</div>
          <div className='flex-1'>to</div>
        </div>
        <div className='flex text-xs text-center'>
          <div className='flex-1'>{RisInfo.begin_description}</div>
          <div className='flex-1'>{RisInfo.end_description}</div>
        </div>
        <div className='flex text-xs text-center'>
          <div className='flex-1'>{RisInfo.beg_mp}</div>
          <div className='flex-1'>{RisInfo.end_mp}</div>
        </div>
        <div className='flex text-xs px-1'>
          <div className='flex-1 font-bold'>GIS ID</div>
          <div className='flex-0'>{RisInfo.gis_id}</div>
        </div>
        <div className='flex text-xs pb-1'>
          <div className='flex-1 font-bold'>Co Order</div>
          <div className='flex-0'>{RisInfo.county_order}</div>
        </div>
        <div className='flex text-xs pb-1'>
          <div className='flex-1 font-bold'>Region</div>
          <div className='flex-0'>{RisInfo.region}</div>
        </div>
         <div className='flex text-xs  p-1'>
          <div className='flex-1 font-bold text-center'>Station {get(data , `[1][1]` , '')}</div>
        </div>
        <div className='flex text-xs pb-1'>
          <div className='flex-1 font-bold'>AADT</div>
          <div className='flex-0'>{get(data , `[2][1]` , 0).toLocaleString()}</div>
        </div>
        <div className='flex text-xs pb-1'>
          <div className='flex-1 font-bold'>AADT SU</div>
          <div className='flex-0'>{RisInfo.aadt_single_unit}</div>
        </div>
        <div className='flex text-xs pb-1'>
          <div className='flex-1 font-bold'>AADT Comb</div>
          <div className='flex-0'>{RisInfo.aadt_combo}</div>
        </div>
        <div className='flex text-xs pb-1'>
          <div className='flex-1 font-bold'>Last Count</div>
          <div className='flex-0'>{get(data , `[3][1]` , 0)}</div>
        </div>
        
      </div>
    </div>
  )
}

const displayModes = {
  'a': {  
    domain:[1500,5000,10000,25000,40000,75000,150000],
    range: getColorRange(7, "Reds", true),
    format: ".2s"
  },
  'l': {
    domain:[2004,2008,2012,2016,2018],
    range: getColorRange(5, "RdYlGn", true),
    format: ""
  }
}


class RisLayer extends LayerContainer {
  name = "RIS"
  sources = RISSources
  layers = RISLayers
  
  state = {
    activeStation: null,
    displayMode: 'a',
    ...displayModes['a']
  }
 
  onHover = {
    layers: [...RISLayers.map(d => d.id)],
    callback: (layerId, features, lngLat) => {

      let feature = features[0]
      const data = Object.keys(feature.properties)
        .map(k=> [k, feature.properties[k]])

      data.push(['id', feature.id])
      return data;
    },
    HoverComp
  }

  onClick = {
    layers: [...RISLayers.map(d => d.id)],
    callback: (features, lngLat) => {

      let feature = features[0]
      console.log('click', feature, features)
      this.updateState({activeStation: feature.s})
    },
   
  }

  setActiveStation = () => {

  }

  infoBoxes = [
    { Component: ({ layer }) => {
        return (
          <div>
            <Select 
              options={[
                {name:'Annual Average Daily Traffic', v:'a'},
                {name:'Year of Last Count', v:'l'}
              ]}
              valueAccessor={d => d.v}
              accessor={d => d.name}
              onChange={d => {
                layer.updateState({
                  displayMode: d, 
                  ...displayModes[d]
                })
                layer.setDisplayMode(d)
                
              }}
              value={layer.state.displayMode}
              multi={ false } 
              searchable={ false } 
              removable={ false }
            />
            <div className='py-2'>
              <Legend
                domain={layer.state.domain}
                range={layer.state.range}
                format={layer.state.format}
                type={'threshold'}
              />
            </div>
          </div>
        )
      }
    },
    {
      Component: ({layer}) => <div><h4>{layer.state.activeStation}</h4></div>
    }
  ]

  setDisplayMode = (displayMode) => {
    console.log('set displayMode',...this.state.domain.map((d,i) => [d,this.state.range[i]]))  
    RISLayers.forEach(d => {
        this.mapboxMap.setPaintProperty(d.id, 'line-color',  {
          property: displayMode,
          stops: [
            [0, 'hsl(185, 0%, 27%)'],
            ...this.state.domain.map((d,i) => [d,this.state.range[i]])
          ]
        })
    })
    
    
  }

  init(map, falcor) {
    
  }
  render(map) {
    this.setDisplayMode(this.state.displayMode)
    
  } 
}

export const RisLayerFactory = (options = {}) => new RisLayer(options);
