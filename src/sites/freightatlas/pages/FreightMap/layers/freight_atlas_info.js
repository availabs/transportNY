import React from "react";
// import get from "lodash.get";

// import mapboxgl from "mapbox-gl";

import { LayerContainer } from "modules/avl-map/src";

class FreightAtlasInfoLayer extends LayerContainer {
  
  state = {
    showInfo: true,
    infoWidth: 250
  }
  layerControl = 'none'
  infoBoxes = [
        {
            Component: ({layer}) => {
                return React.useMemo( () => {
                  return (
                    <div className="relative border-top">
                        { layer.state.showInfo ?  
                        <div className={'p-1 w-full text-xs font-thin bg-white shadow p-2'}>
                            <div className='flex justify-between items-center'>
                              <div className = 'flex-1'>
                                <p className='font-medium text-sm'>New York State Freight Network Atlas</p>
                              </div>
                              <div className='flex' onClick={(e) => layer.updateState({showInfo: false})} >
                                <i className='fat fa-close text-lg px-1 font-thin cursor-pointer hover:text-blue-500' />
                              </div>
                            </div>

                            <p className = 'p-1'>Welcome to the New York State Freight Network Atlas, Version 2.0. This interactive, web-based map includes various freight-related transportation facilities and data identified by the New York State Freight Transportation Plan (FTP).</p>
                            <p className='p-3 font-medium text-sm'>Navigating the Atlas</p>
                            <p className='p-1'>We organized the state’s freight-related transportation facilities into “layers” of map data (e.g., Port, Intermodal, Interstate Highway, Rail, Border Crossing, etc.) to allow you to view the state with one or more categories of freight facilities or data layers shown as you desire. </p> 
                            <ul>
                              <li className='p-2'> - To add a data layer, click the blue button labeled “Add Data.” This will open a modal of all available layers organized by category. Click on a category, find a layer and click the blue plus symbol on the right. The layer will be added to the left side panel. All layers showing on the map are located in the left side panel.</li>

                              <li className='p-2'> - To remove a layer, hover your cursor on the left side panel over the layer that you wish to remove. An ‘X’ will appear. Click the X to remove the layer. Alternatively, you can remove selected layers via the “Add Data” modal by clicking the ‘-’ (minus symbol).</li>

                              <li className='p-2'> - To zoom in or out on the map, click the + or – symbols in the upper right corner of the screen, or scroll up and down with your mouse.</li>

                              <li className='p-2'> - To hide the menu content, click on the active menu tab.</li>

                              <li className='p-2'> - To download data as a shapefile, Geojson, or CSV, click on the layer in the left side panel to open the layer controls menu. The download button is located in the top right corner of the layer controls.</li>

                              <li className='p-2'> - View or Download Web Atlas User Guide here</li>

                            </ul>
                        </div> :
                        <div className='w-full flex'>
                          <div className='flex-1'/>

                          <div className='flex px-1' onClick={(e) => layer.updateState({showInfo: true})} >
                                <i className='fad text-blue-600 fa-info-circle text-2xl px-1 font-thin cursor-pointer hover:text-blue-500' />
                              </div>
                        </div>
                        }
                    </div>
                // eslint-disable-next-line react-hooks/exhaustive-deps
                )}, [layer.state.showInfo])
            },
            width: this.state.infoWidth
        },
        

    ]

  init(map, falcor) {
    //console.log('----init----', this)
      // return falcor
      //   .get(["geo", "36", "geoLevels"])
  }


  render(map) {
    // console.log('render')
  }
   
}

export {FreightAtlasInfoLayer};