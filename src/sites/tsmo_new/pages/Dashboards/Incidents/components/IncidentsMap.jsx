import React from "react"
import { useSelector } from 'react-redux';
import { AvlMap } from "~/modules/avl-map/src"
import {MacroLayerFactory} from './IncidentsLayer'
import config from "~/config.json"


const Map = ({ events, colorsForTypes, hoveredEvent }) => {
    const {region, month, fsystem} = useSelector(state => state.dashboard);
    const mapOptions =  {
        zoom: 8.5,
        center: [-73.911895, 40.88],
        styles: [
        {name: "Terrain",
            style: 'mapbox://styles/am3081/cjgi6glse001h2sqgjqcuov28'
          },
          {name: "Dark",
            style: 'mapbox://styles/am3081/ckm85o7hq6d8817nr0y6ute5v' },
          {name: "Light",
            style: 'mapbox://styles/am3081/ckm86j4bw11tj18o5zf8y9pou' },
          {name: "Blank Road Labels",
            style: 'mapbox://styles/am3081/cl0ieiesd000514mop5fkqjox'},
        ]
    }
    const layers = React.useRef([MacroLayerFactory()]);
    const layerProps = React.useMemo(() => {
    return {
      [layers.current[0].id]: { region, month, fsystem, events, colorsForTypes, hoveredEvent }
    };
  }, [region, month, events, fsystem, colorsForTypes, hoveredEvent]);
  // console.log('what is the layerprops in incidentsMat component: ', layerProps);

    return (

        <div className='w-full h-full border min-h-[850px]'  >


            <AvlMap accessToken={ config.MAPBOX_TOKEN }
              mapOptions={ mapOptions }
              layers={ layers.current }
              layerProps={ layerProps }
              sidebarTabPosition='side'
              navigationControl="bottom-right"/>


        </div>

    )
}

export default Map
