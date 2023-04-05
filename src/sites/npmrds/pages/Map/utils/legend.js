import React from "react"

import { BooleanInput, Select } from "@availabs/avl-components"

import deepequal from "deep-equal"
import get from "lodash.get"
import {
  groups,
  scaleLinear,
  scaleOrdinal,
  scaleQuantize,
  scaleQuantile,
  scaleThreshold,
  extent as d3extent,
  format as d3format
} from "d3"

import { ColorBar, ColorRanges } from "./color-ranges"

const ColorSteps = Object.keys(ColorRanges).sort((a, b) => +a - +b);

export const Legend = ({ type, domain, range, format, ...props }) => {

  const scale = React.useMemo(() => {
    return getScale(type, domain, range);
  }, [type, domain, range]);

  const Format = React.useMemo(() => {
    return getFormat(format);
  }, [format]);

  return (
    <div>
      { type === "linear" ?
        <LinearScale scale={ scale } format={ Format } { ...props }/> :
        type === "ordinal" ?
        <OrdinalScale scale={ scale } format={ Format } { ...props }/> :
        type === "quantize" || type === "quantile" || type === "threshold"  ?
        <QuantizleScale scale={ scale } format={ Format } { ...props }/> :
        <div>Unknown scale type "{ type }."</div>
      }
    </div>
  )
}

const getScale = (type, domain, range) => {
  switch (type) {
    case "linear":
      return scaleLinear()
        .domain(domain)
        .range(range);
    case "ordinal":
      return scaleOrdinal()
        .domain(domain)
        .range(range);
    case "quantize":
      return scaleQuantize()
        .domain(d3extent(domain))
        .range(range);
    case "quantile":
      return scaleQuantile()
        .domain(domain)
        .range(range);
    case "threshold":
      return scaleThreshold()
        .domain(domain)
        .range(range);
    default:
      return null;
  }
}

const Identity = i => i;
const getFormat = format => {
  if (!format) return Identity;

  if (typeof format === "string") {
    return d3format(format);
  }
  return format;
}

const InitialToolState = {
  size: 5,
  reverse: false,
  opened: null
}
const InitReducer = size => ({
  ...InitialToolState,
  size: size || 5
})
const ToolReducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "set-size":
    case "set-reverse":
    case "set-opened":
      return {
        ...state,
        ...payload
      }
    default:
      return state;
  }
}
export const useLegendReducer = size => {
  return React.useReducer(ToolReducer, size, InitReducer);;
}

export const LegendTools = ({ layer, MapActions }) => {

  const range = get(layer, ["legend", "range"], []);

  const [toolState, dispatch] = useLegendReducer(range.length);

  const updateLegend = React.useCallback(update => {
    MapActions.updateLegend(layer, update);
  }, [layer, MapActions]);

  return (
    <DummyLegendTools { ...toolState } layer={ layer } current={ range }
      updateLegend={ updateLegend } dispatch={ dispatch }/>
  )
}
export const DummyLegendTools = ({ layer, current, updateLegend, dispatch, size, reverse, opened }) => {

  const colorsByType = React.useMemo(() => {
    return groups(get(ColorRanges, size, []), r => r.type);
  }, [size]);

  return (
    <React.Fragment>
      <div className="flex items-center mb-1">
        <div className="w-36">Step Size</div>
        <div className="flex-1">
          <Select options={ ColorSteps }
            valueAccessor={ v => +v }
            value={ size }
            onChange={ v => dispatch({ type: "set-size", size: v }) }
            multi={ false }
            removable={ false }
            searchable={ false }/>
        </div>
      </div>

      <div className="flex items-center mb-1">
        <div className="w-36">Reverse Colors</div>
        <div className="flex-1">
          <BooleanInput value={ reverse }
            onChange={ v => dispatch({ type: "set-reverse", reverse: v }) }/>
        </div>
      </div>

      <div>
        <div className="font-bold border-b mb-1">
          Color Range Types:
        </div>
        { colorsByType.map(([type, ranges]) =>
            <ColorType key={ type } type={ type } ranges={ ranges }
              opened={ opened } update={ updateLegend }
              setOpen={ opened => dispatch({ type: "set-opened", opened }) }
              current={ current } reverse={ reverse }/>
          )
        }
      </div>
    </React.Fragment>
  )
}
const ColorType = ({ type, ranges, current, opened, setOpen, reverse, update }) => (
  <div className={ `
      px-2 hover:border-current border-transparent border
      cursor-pointer rounded transition
    ` }
    onClick={ e => { e.stopPropagation(); setOpen(type); } }>
    { type }
    <div className="pb-1"
      style={ { display: opened === type ? "block" : "none" } }>
      { ranges.map(({ name, colors }) => {
          if (reverse) {
            colors = colors.slice().reverse();
          }
          const active = deepequal(colors, current);
          return (
            <div key={ name }
              onClick={ e => update({ range: colors }) }
              className={ `
                p-1 border rounded-lg hover:border-current transition
                ${ active ? "border-current" : "border-transparent" }
              ` }>
              <ColorBar key={ name } colors={ colors } small/>
            </div>
          )
        })
      }
    </div>
  </div>
)

const LinearScale = ({ scale, format, ticks = 5 }) => {

  const scaleTicks = scale.ticks(ticks);

  return (
    <div>
      <ColorBar colors={ scaleTicks.map(t => scale(t)) }/>
      <div className={ `text-sm grid grid-cols-${ scaleTicks.length }` }>
        { scaleTicks.map(t =>
            <div className="col-span-1 text-right pr-1" key={ t }>
              { format(t) }
            </div>
          )
        }
      </div>
    </div>
  )
}
const OrdinalScale = ({ scale, format, height = 3, direction = "vertical" }) => {

  const range = scale.range();

  return (
    <div>
      { direction === "horizontal" ?
        <>
          <div className={ `grid grid-cols-${ range.length }` }>
            { range.map(c =>
                <div className="col-span-1 h-3 mx-2 rounded" key={ c }
                  style={ { backgroundColor: c } }/>
              )
            }
          </div>
          <div className={ `grid grid-cols-${ range.length }` }>
            { scale.domain().map(d =>
                <div className="col-span-1 text-center" key={ d }>
                  { format(d) }
                </div>
              )
            }
          </div>
        </> :
        <div className="flex">
          { scale.domain().reduce((a, c, i) => {
              if (i % height === 0) {
                a.push([]);
              }
              a[a.length - 1].push(c);
              return a;
            }, [])
            .map((d, i) =>
              <div key={ i }
                className={ `${ i > 0 ? "ml-6" : "" } flex-1` }>
                { d.map(dd =>
                    <div className="flex items-center" key={ dd }>
                      <div className="h-6 w-6 rounded mr-1 mb-1"
                        style={ {
                          backgroundColor: scale(dd)
                        } }/>
                      <div>{ format(dd) }</div>
                    </div>
                  )
                }
              </div>
            )
          }
        </div>
      }
    </div>
  )
}
const QuantizleScale = ({ scale, format }) => {

  const range = scale.range();

  return (
    <div>
      <ColorBar colors={ range }/>
      <div className={ `text-sm grid grid-cols-${ range.length }` }>
        { range.map(r =>
            <div className="col-span-1 text-right pr-1" key={ r }>
              { format(scale.invertExtent(r)[1]) }
            </div>
          )
        }
      </div>
    </div>
  )
}
