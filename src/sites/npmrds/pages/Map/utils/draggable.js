import React from "react"

import { useTheme } from "@availabs/avl-components"

import { useSetSize } from "./utils"

const InitialState = {
  size: [0, 0],
  modalPos: [400, 800],
  currPos: [0, 0],
  dragging: false,
  bounds: [0, 0]
}
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "drag-start":
      return {
        ...state,
        ...payload,
        dragging: true
      }
    case "drag-move": {
      const { currPos } = payload;
      const shift = [
        currPos[0] - state.currPos[0],
        currPos[1] - state.currPos[1]
      ];
      return {
        ...state,
        currPos,
        modalPos: [
          Math.max(8, Math.min(state.modalPos[0] + shift[0], state.bounds[0] - state.size[0] - 8)),
          Math.max(8, Math.min(state.modalPos[1] + shift[1], state.bounds[1] - state.size[1] - 8))
        ]
      }
    }
    case "drag-end":
      return {
        ...state,
        ...payload,
        dragging: false
      }
    case "set-modal-pos":
    case "set-bounds":
    case "set-size":
      return {
        ...state,
        ...payload
      }
    default:
      return state;
  }
}

export const Draggable = ({ bounds,
                            children,
                            toolbar = [],
                            style = {},
                            className = "",
                            onDragStart = null,
                            ...props }) => {

  const [state, dispatch] = React.useReducer(Reducer, InitialState);

  const setModalPos = React.useCallback(() => {
    if (!(state.bounds[0] || state.bounds[1] || state.size[0] || state.size[1])) return;

    const modalPos = [
      Math.max(8, Math.min(state.modalPos[0], state.bounds[0] - state.size[0] - 8)),
      Math.max(8, Math.min(state.modalPos[1], state.bounds[1] - state.size[1] - 8))
    ];
    if ((modalPos[0] !== state.modalPos[0]) || (modalPos[1] !== state.modalPos[1])) {
      dispatch({
        type: "set-modal-pos",
        modalPos
      })
    }
  }, [state.bounds, state.size, state.modalPos]);

  React.useEffect(() => {
    if (state.dragging) return;
    setModalPos();
  }, [state.dragging, setModalPos]);

  React.useEffect(() => {
    dispatch({
      type: "set-bounds",
      bounds: [bounds.width, bounds.height]
    });
  }, [bounds]);

  const dragMove = React.useCallback(e => {
    e.stopPropagation();
    e.preventDefault();
    dispatch({
      type: "drag-move",
      currPos: [e.clientX, e.clientY]
    });
  }, []);

  React.useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", dragMove);
    }
  }, [dragMove]);

  const dragStart = React.useCallback(e => {
    const dragEnd = e => {
      window.removeEventListener("mousemove", dragMove);
      dispatch({ type: "drag-end" });
    }
    if (typeof onDragStart === "function") {
      onDragStart(e);
    }
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", dragEnd, { once: true });
    e.stopPropagation();
    e.preventDefault();
    dispatch({
      type: "drag-start",
      currPos: [e.clientX, e.clientY]
    });
  }, [dragMove, onDragStart]);

  const setSize = React.useCallback(({ width, height }) => {
    dispatch({
      type: "set-size",
      size: [width, height]
    });
  }, []);

  const ref = React.useRef();
  useSetSize(ref, setSize);

  const theme = useTheme();

  return (
    <div ref={ ref } { ...props }
      className={ `
        absolute inline-block ${ theme.sidebarBg } rounded z-20
        ${ className }
      ` }
      style={ {
        transform: `translate(${ state.modalPos[0] }px, ${ state.modalPos[1] }px)`,
        ...style
      } }>

      <div className="top-0 right-0 flex justify-end absolute"
        style={ { transform: "translate(0.5rem, -0.5rem)" } }>

        { toolbar.map(({ icon, ...tool }, i) => (
            <Tool key={ i } { ...tool } className="mr-1">
              <span className={ `fa ${ icon } text-lg` }/>
            </Tool>
          ))
        }

        <DragHandle dragging={ state.dragging }
          onMouseDown={ dragStart }/>

      </div>

      { children }

    </div>
  )
}

const Tool = ({ children, className = "", style = {}, ...props }) => {

  const theme = useTheme();

  return (
    <div { ...props } style={ { cursor: "pointer", ...style } }
      className={ `
        h-7 w-7 flex items-center justify-center inline-block rounded
        hover:${ theme.bg } hover:${ theme.textInfo } ${ theme.menuBg }
        ${ className }
      ` }>
      { children }
    </div>
  )
}

const DragHandle = ({ dragging, ...props }) => {
  return (
    <Tool { ...props }
      style={ { cursor: dragging ? "grabbing" : "pointer" } }>
      <span className="fa fa-bars text-lg"/>
    </Tool>
  )
}
