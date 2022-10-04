import React, {useRef} from "react"
// import { useSelector } from 'react-redux';
import { AvlMap } from "modules/avl-map/src"
import { useFalcor } from "modules/avl-components/src"
import { useSelector } from "react-redux";
import get from 'lodash.get'

// import {MacroLayerFactory} from './IncidentsLayer'
//import {FreightAtlasFactory} from '../layers/freight_atlas'
import FreightAtlasLayer from 'pages/DataManager/DataTypes/freight_atlas_shapefile/FreightAtlasLayer'
import {SourceAttributes, ViewAttributes, getAttributes, getName} from 'pages/DataManager/components/attributes'
import config from "config.json"

import {CustomSidebar} from './MapControls'

import { selectPgEnv } from "pages/DataManager/store"

export const LayerContext = React.createContext({
  layerList: [],
  setLayerList: () => {}
});


const Map = ({ events }) => {
    const mounted = useRef(false);
    const {falcor,falcorCache} = useFalcor()
    const [layerList, setLayerList] = React.useState([54,17,8])
    const [layerData, setLayerData] = React.useState([])
    const pgEnv = useSelector(selectPgEnv);

    const layerContextValue = React.useMemo(() => {
        return { 
            layerList, 
            toggleLayer: (id, mapActions, activeLayers) => {
                let newlayers = layerList.includes(id) ? 
                    [...layerList].filter(d => d !== id) :
                    [...layerList , id]
                setLayerList(newlayers)                  
            }
        }
    }, [layerList])

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
            {name: "Dark",
                style: 'mapbox://styles/am3081/ckm85o7hq6d8817nr0y6ute5v' },
            { name: "Satellite Streets",
                style: 'mapbox://styles/am3081/cjya70364016g1cpmbetipc8u' }
           
        ]
    }

    const fetchSourceData = async (sourceId) => {
        const lengthPath = ["dama", pgEnv,"sources","byId",sourceId,"views","length"]
        const resp = await falcor.get(lengthPath);
        return falcor.get(
            [
              "dama", pgEnv,"sources","byId",sourceId,"views","byIndex",
              {from:0, to:  get(resp.json, lengthPath, 0)-1},
              "attributes",Object.values(ViewAttributes)
            ],
            [
              "dama", pgEnv,"sources","byId",sourceId,
              "attributes",Object.values(SourceAttributes)
            ]
        )
     
    }

    const getMapData = ((sourceId) => {
        let views = Object.values(get(falcorCache,["dama", pgEnv,"sources","byId",sourceId,"views","byIndex",],{}))
            .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
            .sort((a,b) => {
                return new Date(a.last_updated) - new Date(b.last_updated)
            })

        
        // to do - get layer name
        let sourceAttributes = getAttributes(get(falcorCache,[
              "dama", pgEnv,"sources","byId",sourceId,
              "attributes"
            ], {}))
        return views[0] ? 
            {
                layer_id: sourceId,
                view_id: get(views[0],'id',null),
                version: get(views[0],'version',null),
                metadata: get(views[0],'metadata',{}),
                name: getName(sourceAttributes),
                sources: get(views[0],'metadata.tiles.sources',[]),
                layers: get(views[0],'metadata.tiles.layers',[])

            } : null
          
    })
 
    React.useEffect( () => {
        const updateLayers = async () => {
            await Promise.all(layerList.map(sourceId => fetchSourceData(sourceId)))
            let currentLayerIds = layerData.map(d => d.layer_id).filter(d => d)
            //console.log('layerData', layerData,currentLayerIds)
            
            let output = layerList
                .map(sourceId => getMapData(sourceId))
                .filter(d => d)
                // don't call layer a second time
                .filter(d => !currentLayerIds.includes(d.layer_id))
                .map(l => FreightAtlasLayer(l))
            if(mounted.current) {
                setLayerData([...layerData.filter(d => layerList.includes(d.layer_id)), ...output])
            }
        }
        updateLayers()
    },[layerList,falcorCache,mounted.current])

    return (
        
        <div className='w-full h-full' ref={mounted}>
            <LayerContext.Provider value={layerContextValue}>
                <AvlMap
                    accessToken={ config.MAPBOX_TOKEN }
                    mapOptions={ mapOptions }
                    layers={layerData}
                    CustomSidebar={CustomSidebar}
                />
            </LayerContext.Provider>
        </div>
       
    )
}

export default Map


