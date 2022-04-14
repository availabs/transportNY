import React from "react"
// import { useSelector } from 'react-redux';
import { AvlMap } from "modules/avl-map/src"
// import {MacroLayerFactory} from './IncidentsLayer'
import {FreightAtlasFactory} from '../layers/freight_atlas'
import config from "config.json"


const Map = ({ events }) => {
    
    const [layerList, setLayers] = React.useState(['primary_freight_network_v2016']) 
    const mapOptions =  {
        zoom: 6.5,
        center: [-75.750732421875,
          42.89206418807337],
        styles: [
            {name: "Light",
            style: 'mapbox://styles/am3081/ckm86j4bw11tj18o5zf8y9pou' },
           
            {name: "Blank Road Labels",
                style: 'mapbox://styles/am3081/cl0ieiesd000514mop5fkqjox'},
         
           
            {name: "Dark",
                style: 'mapbox://styles/am3081/ckm85o7hq6d8817nr0y6ute5v' }
        ]
    }
    // const layers = React.useMemo(() => {
    //     layerList.map(d => )
    // },[layerList])
 
    const layers = React.useRef([FreightAtlasFactory({name: 'Primary Freight Network'})])
    return (
        
        <div className='w-full h-full'  >   
            <AvlMap
                accessToken={ config.MAPBOX_TOKEN }
                mapOptions={ mapOptions }
                layers={layers.current}
            />
        </div>
       
    )
}

export default Map


