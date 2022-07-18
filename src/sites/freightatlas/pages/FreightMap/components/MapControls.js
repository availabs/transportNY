import React, {useContext} from "react"
import { /*Select,*/ useTheme, CollapsibleSidebar, TabPanel, Modal, DndList } from "modules/avl-components/src"
import { LayerContext } from './FreightMap'
import LayerManager from './LayerManager'
// import get from 'lodash.get'


export const Icon = ({
  onClick=()=>{},
  className = "",
  children,
}) => {
  const theme = useTheme();
  return (
    <div
      onClick={onClick}
      className={`
        ${className} transition h-6 w-6 text-white group-hover:text-gray-600
        hover:${theme.menuTextActive} flex items-center justify-center
      `}
    >
      {children}
    </div>
  );
};

const StylesTab = ({ mapStyles, styleIndex, MapActions, mapboxMap }) => {

  const theme = useTheme();

  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (loading) {
      const done = () => setLoading(false);
      mapboxMap.once("style.load", done);
      return () => mapboxMap.off("style.load", done);
    }
  }, [loading, mapboxMap]);

  const updateStyle = React.useCallback(index => {
    setLoading(true);
    MapActions.setMapStyle(index);
  }, [MapActions]);

  return (
    <div className={ `` }>
      <div className = 'p-4'> Select Basemap </div>
      <div className={ `
        absolute top-0 bottom-0 left-0 right-0 opacity-50 z-10
         ${ loading ? "block" : "hidden" }
      ` }/>

      <div className={ `${ theme.bg } p-1  relative` }>

        { 
          mapStyles.map(({ name, imageUrl }, i) =>
            <div key={ i } className={ `
              ${ i === 0 ? "" : "mt-1" } p-1  hover:${ theme.menuTextActive }
              flex items-center transition
              ${ i === styleIndex ?
                `border-r-4 ${ theme.borderInfo } ${ theme.accent2 }` :
                `${ theme.accent1 } cursor-pointer`
              }
            ` } onClick={ i === styleIndex ? null : e => updateStyle(i) }>
              <img src={ imageUrl } alt={ name } className={`${theme.rounded}`}/>
              <div className="ml-2">{ name }</div>
            </div>
          )
        }

      </div>
    </div>
  )
}

const LayerControl = ({ layer, setActiveLayer, activeLayer, MapActions }) => {
  //const theme = useTheme();
  const { /*layerList,*/ toggleLayer } = useContext(LayerContext);
  return (
    <div
      onClick={e => {
        if(activeLayer === layer.layer_id) {
          setActiveLayer(null)
        }
        setActiveLayer(layer.layer_id)
      }} 
      className={` flex flex-col border-b border-gray-100 hover:bg-blue-50 cursor-pointer`}>
      <div className={`${activeLayer === layer.layer_id ? 'border-r-4 border-blue-500': ''} pl-2 py-2 pr-1 flex items-center group`}>
        <Icon className="cursor-move">
          <span className="fa fa-bars mr-1 " />
        </Icon>
        <div className="text-sm leading-5">{layer.name}</div>
        <div className="flex-1 flex justify-end">
          <Icon onClick={(e) => { 
            MapActions.removeLayer(layer)
            toggleLayer(layer.layer_id)
          }}
          className='cursor-pointer'
          >
            <span className="fa fa-times" />
          </Icon>
          {/*<Icon onClick={toggleOpen}>
            <span className={`fa fa-sm ${open ? "fa-minus" : "fa-plus"}`} />
          </Icon>*/}
        </div>
      </div>
      
    </div>
  );
};


const LayersTab = ({activeLayers,MapActions,...rest},) => {
    const theme = useTheme()
    const [modalOpen, modalToggle] = React.useState()
    const [activeLayer, setActiveLayer] = React.useState(null)
    const droppedSection = React.useCallback((start, end) => {
        //console.log('onDrop', start,end)
        // const sections = [...dataItems]
        //     .filter(({data}) => data.sectionLanding)
        //     .sort((a, b) => a.data.index - b.data.index);

        // const [item] = sections.splice(start, 1);
        // sections.splice(end, 0, item);

        // sections.forEach((item, i) => {
        //     interact("api:edit", item.id, {...item.data, index: i}, {loading: false});
        //     item.data.index = i; // <-- this is temp. It just makes the list look nice until data is updated
        // })
    }, [/*activeLayers*/])

    return (
        <div>
           <div className='p-4 border-b border-gray-200'>
                <button onClick={e => modalToggle(!modalOpen)} className={theme.button({color:'primary',width:'full', size: 'sm'}).button}>
                    Add Data
                    <i className='fa-solid fa-plus px-2' />
                </button>
            </div>
            <div className=''>
              <DndList onDrop={droppedSection}>
                { activeLayers.map(layer =>
                    <LayerControl
                        key={ layer.id }
                        setActiveLayer={setActiveLayer}
                        activeLayer={activeLayer}
                        MapActions={MapActions} 
                        layer={ layer }
                        { ...rest }
                    
                    />)
                }
              </DndList>
            </div>
            <Modal open={modalOpen} themeOptions={{size: 'large'}}>
                <LayerManager
                    MapActions={ MapActions } 
                    activeLayers={activeLayers} 
                />
                <div className='border-t border-gray-300'>
                    <button 
                        onClick={e => modalToggle(!modalOpen)} 
                        className={theme.button({color:'primary', size: 'base'}).button + ' float-right'}>
                        Close
                    </button>
                </div>
            </Modal>
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
    return (
        <CollapsibleSidebar>
            <div className='relative w-full h-full bg-gray-100  z-10 shadow-lg overflow-hidden'> 
                {/*<div className='py-2 px-4 font-medium'> Freight Layers</div>*/}
                <TabPanel 
                  tabs={SidebarTabs} 
                  {...props} 
                  themeOptions={{tabLocation:'top'}}
                />
            </div>
        </CollapsibleSidebar>
    )
}
export {
  StylesTab,
  LayersTab,
  CustomSidebar
}