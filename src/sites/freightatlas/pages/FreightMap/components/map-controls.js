import React from "react"
import { Select, useTheme, CollapsibleSidebar, TabPanel } from "modules/avl-components/src"


export const Icon = ({
  onClick,
  cursor = "cursor-pointer",
  className = "",
  style = {},
  children,
}) => {
  const theme = useTheme();
  return (
    <div
      onClick={onClick}
      className={`
        ${cursor} ${className} transition h-6 w-6
        hover:${theme.menuTextActive} flex items-center justify-center
      `}
      style={{ ...style }}
    >
      {children}
    </div>
  );
};

const LayerHeader = ({ layer, toggleOpen, open, MapActions }) => {
  const theme = useTheme();

  return (
    <div className={`flex flex-col px-1 ${theme.bg} rounded`}>
      <div className="flex items-center">
        <Icon cursor="cursor-move">
          <span className="fa fa-bars mr-1" />
        </Icon>
        <div className="font-semibold text-lg leading-5">{layer.name}</div>
        <div className="flex-1 flex justify-end">
          {!layer.isDynamic ? null : (
            <Icon onClick={(e) => MapActions.removeDynamicLayer(layer)}>
              <span className="fa fa-trash" />
            </Icon>
          )}
          <Icon onClick={(e) => MapActions.removeLayer(layer)}>
            <span className="fa fa-times" />
          </Icon>
          <Icon onClick={toggleOpen}>
            <span className={`fa fa-sm ${open ? "fa-minus" : "fa-plus"}`} />
          </Icon>
        </div>
      </div>
      <div className="flex items-center" style={{ marginTop: "-0.25rem" }}>
        {/*{layer.toolbar.map((tool, i) => (
          <LayerTool
            MapActions={MapActions}
            layer={layer}
            tool={tool}
            key={i}
          />
        ))}*/}
      </div>
    </div>
  );
};

const LayerPanel = ({ layer, layersLoading, ...rest }) => {
  const [open, setOpen] = React.useState(true),
    toggleOpen = React.useCallback(
      (e) => {
        setOpen(!open);
      },
      [open, setOpen]
    );

  const theme = useTheme();

  const filters = React.useMemo(() => {
    return Object.values(layer.filters).map(
      ({ name, type, layerId, active = true, ...rest }, i) => {
        if (!active) return;
        switch (type) {
          default:
            return (
              <div
                className={`pt-2 ${theme.bg} p-1 rounded`}
                key={`${layerId}-${name}`}
              >
                <div className="text-base leading-4 mb-1">{name}</div>
                <Select {...rest} removable={rest.multi ? true : false} />
              </div>
            );
        }
      }
    );
  }, [layer.filters, theme]);

  return (
    <div className={`${theme.menuBg} p-1 mb-1 rounded relative`}>
      <div
        className={`
        absolute top-0 bottom-0 left-0 right-0 z-10 opacity-50
        ${Boolean(layersLoading[layer.id]) ? "block" : "hidden"}
        ${theme.sidebarBg}
      `}
      />

      <LayerHeader
        layer={layer}
        {...rest}
        open={open}
        toggleOpen={toggleOpen}
      />

      <div style={{ display: open ? "block" : "none" }}>
        {filters}
      </div>
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
      <div className = 'p-2 pt-0'> Select Basemap </div>
      <div className={ `
        absolute top-0 bottom-0 left-0 right-0 opacity-50 z-10
         ${ loading ? "block" : "hidden" }
      ` }/>

      <div className={ `${ theme.bg } p-1  relative` }>

        { mapStyles.map(({ name, imageUrl }, i) =>
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

export {
  StylesTab,
  LayerPanel
}