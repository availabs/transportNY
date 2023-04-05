import React from "react"

import { useTheme } from "@availabs/avl-components"

export const SidebarContext = React.createContext({})

export const useSidebarContext = () => {
  return React.useContext(SidebarContext);
}

const InitialState = {
  Comp: null,
  top: 0,
  compProps: {},
  open: true,
  transitioning: false
}
const InitState = open => ({
  ...InitialState,
  open
})
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "update-state":
      return {
        ...state,
        ...payload
      }
    default:
      return state;
  }
}

const Shift = {
  value: 0.25,
  unit: "rem"
}

export const CollapsibleSidebar = ({ placeBeside,
                                      width = 320,
                                      padding = 8,
                                      children,
                                      startOpen = true,
                                      position = "left",
                                      shift = Shift }) => {

  const [state, dispatch] = React.useReducer(Reducer, startOpen, InitState);

  const { open, transitioning } = state;

  const setOpen = React.useCallback(open => {
    dispatch({ type: "update-state", open, transitioning: true });
    timeout.current = setTimeout(dispatch, 500, { type: "update-state", transitioning: false });
  }, []);

  const dir = position === "left" ? 1 : -1;

  const timeout = React.useRef();

  React.useEffect(() => {
    return () => clearTimeout(timeout.current);
  }, []);

  const doToggle = React.useCallback(e => {
    setOpen(open > 0 ? open - 1 : 1);
  }, [open, setOpen]);

  const theme = useTheme();

  const [node, setNode] = React.useState();
  const sidebarTop = React.useMemo(() => {
    return node ? node.getBoundingClientRect().top : 0;
  }, [node]);

  const extendSidebar = React.useCallback(({ Comp, top = 0, compProps = {} }) => {
    if (open === 0) return;
    setOpen(2);
    dispatch({ type: "update-state", Comp, compProps, top: top - sidebarTop });
  }, [open, setOpen, sidebarTop]);
  const passCompProps = React.useCallback(compProps => {
    if (open !== 2) return;
    dispatch({ type: "update-state", compProps });
  }, [open]);
  const closeExtension = React.useCallback(() => {
    if (open !== 2) return;
    setOpen(1);
  }, [open, setOpen]);

  const contextValue = React.useMemo(() => {
    return { ...state, extendSidebar, passCompProps, closeExtension, open };
  }, [extendSidebar, passCompProps, closeExtension, state, open]);

  const styleWidth = `calc(${ (width - padding * 2) * open }px - ${ open > 1 ? `${ shift.value * (open - 1) }${ shift.unit }` : "0rem" })`;

  return (
    <div className={ `absolute ${ position }-0 top-0 bottom-0 z-30` }
      style={ { padding: `${ padding }px` } }>

      <SidebarContext.Provider value={ contextValue }>

        <div className="h-full relative"
          style={ {
            transition: "width 500ms",
            width: styleWidth
          } }>

          <div className="absolute top-0 bottom-0"
            style={ {
              [position]: `calc(100% + ${ padding }px - ${ open ? 0 : padding }px)`,
              transition: `${ position } 500ms`
            } }>

            { placeBeside }

            <div className={ `
                rounded bg-white z-10 py-1 absolute hover:${ theme.textInfo }
                ${ theme.sidebarBg } cursor-pointer flex flex-col
                hover:${ theme.menuBg } transition ${ position }-0
              ` }
              style={ {
                transform: `translateY(-50%)`,
                top: "50%"
              } }
              onClick={ doToggle }>

              <div className="fa fa-caret-left text-2xl pl-1 pr-2"
                style={ {
                  transform: `scaleX(${ (open ? 1 : -1) * dir }`,
                  transition: "transform 500ms"
                } }/>
              <div className="fa fa-caret-left text-2xl pl-1 pr-2"
                style={ {
                  transform: `scaleX(${ (open ? 1 : -1) * dir }`,
                  transition: "transform 500ms ease 250ms"
                } }/>
              <div className="fa fa-caret-left text-2xl pl-1 pr-2"
                style={ {
                  transform: `scaleX(${ (open ? 1 : -1) * dir }`,
                  transition: "transform 500ms ease 500ms"
                } }/>

            </div>

          </div>

          <ExtendedSidebar top={ state.top } open={ open === 2 }
            transitioning={ transitioning }
            width={ width} padding={ padding }>

            { typeof state.Comp !== "function" ? state.Comp :
              <state.Comp { ...state.compProps }/>
            }

          </ExtendedSidebar>

          <Expandable open={ open } ref={ setNode }
            transitioning={ transitioning }
            width={ width } padding={ padding }>

            { children }

          </Expandable>

        </div>

      </SidebarContext.Provider>
    </div>
  )
}

export const Expandable = React.forwardRef(({ open, transitioning, width, padding, children, heightFull = true }, ref) => {

  const theme = useTheme();

  const hFull = heightFull ? "h-full" : "";

  return (
    <div className={ `${ hFull } w-full` } ref={ ref }
      style={ {
        overflow: open && !transitioning ? "visible" : "hidden"
      } }>
      <div className={ `${ hFull } scrollbar-sm overflow-y-auto` }
        style={ {
          width: `${ width - padding * 2 }px`
        } }>

        <div className={ `
          absolute top-0 right-0 bottom-0 left-0 pointer-events-none z-10
          ${ open ? "opacity-0" : "opacity-100" } ${ theme.sidebarBg }
        ` } style={ { transition: "opacity 500ms" } }/>

        { children }

      </div>
    </div>
  )
})

const ExtendedSidebar = ({ width, padding, open, top = 0, children, ...props }) => {
  return (
    <div className="absolute"
      style={ {
        width: `${ open ? width - padding * 2 : 0 }px`,
        left: `calc(${ width - padding * 2 }px - 0.25rem)`,
        transition: "width 500ms", top: `${ top }px`
      } }>

      <Expandable { ...props } heightFull={ false }
        width={ width } padding={ padding } open={ open }>

        { children }

      </Expandable>

    </div>
  )
}
