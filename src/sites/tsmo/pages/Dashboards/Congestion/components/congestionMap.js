import React from "react"
import { useSelector } from 'react-redux';
import { AvlMap } from "modules/avl-map/src"
import {MacroLayerFactory} from './layers/congestion-layer'
import config from "config.json"


const Map = ({ rawDelayData }) => {
    const {region, month, fsystem} = useSelector(state => state.dashboard)
    const mapOptions =  {
        zoom: 8.5,
        center: [-73.911895, 40.88],
        styles: [
          {name: "Blank Road Labels",
            style: 'mapbox://styles/am3081/cl0ieiesd000514mop5fkqjox'},
         {name: "Light",
            style: 'mapbox://styles/am3081/ckm86j4bw11tj18o5zf8y9pou' },
           
           
            {name: "Dark",
            style: 'mapbox://styles/am3081/ckm85o7hq6d8817nr0y6ute5v' }
        ]
    }
    const layers = React.useRef([MacroLayerFactory()]);
    const layerProps = React.useMemo(() => {
    return {
      [layers.current[0].id]: { region, month, fsystem, rawDelayData }
    };
  }, [region, month, rawDelayData, fsystem]);

    return (
        
        <div className='w-full h-full border h-[700px]'  >   
           
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


