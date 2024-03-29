import React from "react"
import { useSelector } from 'react-redux';
import { AvlMap } from "~/modules/avl-map/src"
import {MacroLayerFactory} from './layers/congestion-layer'
import config from "~/config.json"


const Map = ({ rawDelayData, hoveredTMCs }) => {
    const {region, month, fsystem} = useSelector(state => state.dashboard)
    const mapOptions =  {
        zoom: 8.5,
        center: [-73.911895, 40.88],
        styles: [
        {name: "Terrain",
            style: 'mapbox://styles/am3081/cjgi6glse001h2sqgjqcuov28'
          },
        {name: "streets",
            style: 'mapbox://styles/am3081/ckt3271or0nnu17oikkvl0eme' },

        {name: "Dark",
            style: 'mapbox://styles/am3081/ckm85o7hq6d8817nr0y6ute5v' },

          {name: "Blank Road Labels",
            style: 'mapbox://styles/am3081/cl0ieiesd000514mop5fkqjox'},

        ]
    }
    const layers = React.useRef([MacroLayerFactory()]);
    const layerProps = React.useMemo(() => {
    return {
      [layers.current[0].id]: { region, month, fsystem, rawDelayData, hoveredTMCs }
    };
  }, [region, month, rawDelayData, fsystem, hoveredTMCs]);

    return (

        <div className='w-full h-full border min-h-[850px]'  >

          <AvlMap
              accessToken={ config.MAPBOX_TOKEN }
              mapOptions={ mapOptions }
              layers={layers.current}
              layerProps={layerProps}
              sidebarTabPosition='side'
              navigationControl="bottom-right"
          />

        </div>

    )
}

export default Map
