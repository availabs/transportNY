import React from "react"
// import { useSelector } from 'react-redux';
import { AvlMap } from "modules/avl-map/src"
import { Select, useTheme, CollapsibleSidebar, TabPanel } from "modules/avl-components/src"
// import {MacroLayerFactory} from './IncidentsLayer'
import {FreightAtlasFactory} from '../layers/freight_atlas'
import config from "config.json"

import {StylesTab, LayerPanel} from './map-controls'


const LayersTab = ({activeLayers,MapActions,...rest},) => {
    const theme = useTheme()
    return (
        <div>
           <div>
                <div className={theme.button}>Add Data</div>
           </div>
           { activeLayers.map(layer =>
              <LayerPanel
                key={ layer.id } { ...rest }
                layer={ layer } MapActions={ MapActions }/>
            )
          }
        </div>
    )

}





const CustomSidebar = (props) => {
    const SidebarTabs = [
        {
            icon: "fa fa-layer-group",
            Component: LayersTab
        },
        {
            icon: "fa fa-map",
            Component: StylesTab
        }
    ]
    // console.log('CustomSidebar props', props)
    return (
        <CollapsibleSidebar>
            <div className='relative w-full h-full bg-gray-100  z-10 shadow-lg'> 
                <TabPanel tabs={SidebarTabs} {...props} />
            </div>
        </CollapsibleSidebar>
    )
}


const Map = ({ events }) => {
    
    const [layerList, setLayers] = React.useState(['primary_freight_network_v2016']) 
    const mapOptions =  {
        zoom: 6.5,
        center: [
            -75.750732421875,
           42.89206418807337
        ],
        logoPosition: "bottom-right",
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
                CustomSidebar={CustomSidebar}
            />
        </div>
       
    )
}

export default Map


