import React, {useEffect, useMemo, useRef} from "react";
import get from "lodash/get";
import { AvlMap } from "~/modules/avl-map-2/src"
import {PMTilesProtocol} from '~/pages/DataManager/utils/pmtiles/index.ts'
//import {useFalcor} from '~/modules/avl-falcor';
// import {pgEnv} from "~/utils";


const getData = async () => {
    return {}
} 

const Edit = ({value, onChange, size}) => {
    // const {falcor, falcorCache} = useFalcor();
    const mounted = useRef(false);

    return (
        <div className="w-full h-full h-[calc(100vh_-_51px)] relative" ref={mounted}>
            <AvlMap
              layers={ [] }
              layerProps = { {} }
              mapOptions={{
                center: [-76, 43.3],
                zoom: 6,
                protocols: [PMTilesProtocol],
                styles: defaultStyles
              }}
              leftSidebar={ false }
              rightSidebar={ false }
            />
            <div className={'absolute inset-0 flex pointer-events-none'}>
              <div className='p-2'><div className='bg-white'>Left Sidebar Edit</div></div>
              <div className='flex-1'/>
              <div className='p-2'><div className='bg-white'>Right Sidebar</div></div>
            </div>
      </div>
    )
}

Edit.settings = {
    hasControls: false,
    name: 'ElementEdit'
}

const View = ({value}) => {
    const mounted = useRef(false);
    // if (!value) return ''

    // let data = typeof value === 'object' ?
    //     value['element-data'] :
    //     JSON.parse(value)
    // const baseUrl = '/';
    // const attributionData = data?.attributionData;
    // const layerProps =  {ccl: {...data }}
    console.log('render view', value)
    // h-[calc(100vh_-_52px)] 

    return (
        <div className="w-full h-full h-[calc(100vh_-_51px)] relative" ref={mounted}>
            <AvlMap
              layers={ [] }
              layerProps = { {} }
              mapOptions={{
                center: [-76, 43.3],
                zoom: 6,
                protocols: [PMTilesProtocol],
                styles: defaultStyles
              }}
              leftSidebar={ false }
              rightSidebar={ false }
            />
            <div className={'absolute inset-0 flex pointer-events-none'}>
              <div className='p-2'><div className='bg-white'>Left Sidebar</div></div>
              <div className='flex-1'/>
              <div className='p-2'><div className='bg-white'>Right Sidebar</div></div>
            </div>
        </div>
    )
}


export default {
    "name": 'Map: Dama',
    "type": 'Map',
    "variables": 
    [       
        {
            name: 'geoid',
            default: '36'
        },
        {
            name: 'ealViewId',
            default: 837,
            hidden: true
        }
        
    ],
    getData,

    "EditComp": Edit,
    "ViewComp": View
}

const defaultStyles = [
    {
    name: "dataviz",
    style: "https://api.maptiler.com/maps/dataviz/style.json?key=mU28JQ6HchrQdneiq6k9"
  }
]