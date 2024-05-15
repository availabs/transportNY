import React from "react"

import get from "lodash/get"
import moment from "moment"

import ReactTooltip from "react-tooltip"

import { Input } from "~/modules/avl-map-2/src/uicomponents"

import {
  getDatesAndTimes
} from "~/sites/npmrds/pages/analysis/reports/store/utils/relativedates.utils"

const RouteTd = props => {
  const {
    children,
    index = null,
    minWidth = 24,
    hoverStyle = null
  } = props;

  const [hover, setHover] = React.useState(null);
  const [ref, setRef] = React.useState(null);
  const [xDir, setXDir] = React.useState(1);
  const [yDir, setYDir] = React.useState(1);
  const onMouseEnter = React.useCallback(key => {
    setHover(key);
    if (!ref) {
      setXDir(1);
      setYDir(1);
      return;
    }
    const { left, top } = ref.getBoundingClientRect();
    if (left > window.innerWidth * 0.5) {
      setXDir(-1);
    }
    if (top > window.innerHeight * 0.5) {
      setYDir(-1);
    }
  }, [ref]);
  const onMouseLeave = React.useCallback(() => {
    setHover(null);
    setXDir(1);
    setYDir(1);
  }, []);

  const isShaded = (index !== null) && (index % 2 === 0);

  const Children = React.Children.toArray(children);

hover && console.log("DIRS:", xDir, yDir)

  return (
    <td ref={ setRef }
      style={ { minWidth: minWidth ? `${ minWidth }rem` : null } }
      className={ `
        pl-1 last:pr-1 py-1 ml-1 last:mr-1 relative bg-gray-600
        ${ isShaded ? "bg-opacity-25" : "bg-opacity-0" }
        ${ Children.length === 2 ? "cursor-pointer" : "" }
         whitespace-nowrap
      ` }
      onMouseEnter={ onMouseEnter }
      onMouseLeave={ onMouseLeave }
    >
      { Children[0] }
      <div className="absolute inset-0">
        <div className={ `
            absolute z-10 pointer-events-none w-full min-w-fit
            ${ hover ? "block" : "hidden" }
            ${ xDir === 1 ? "right-0" : "right-0" }
            ${ yDir === 1 ? "top-0" : "bottom-0" }
          ` }
        >
          <div className="w-full min-w-fit relative">
            <div style={ hoverStyle }
              className="pointer-events-auto relative"
            >
              { Children[1] }
            </div>
          </div>
        </div>
      </div>
    </td>
  )
}

const HasDates = () => {
  return (
    <div>
      <span data-tip data-for="has-dates"
        className="fa-regular fa-calendar mx-1 text-gray-500"/>
      <ReactTooltip id="has-dates">
        Has Dates
      </ReactTooltip>
    </div>
  )
}
const HasTimes = () => {
  return (
    <div>
      <span data-tip data-for="has-times"
        className="fa-regular fa-clock mx-1 text-gray-500"/>
      <ReactTooltip id="has-times">
        Has Times
      </ReactTooltip>
    </div>
  )
}

const RouteTableRow = ({ route, remove, update, index, columns }) => {
  const doRemove = React.useCallback(e => {
    e.stopPropagation();
    remove(index);
  },[ remove, index]);
  const doUpdate = React.useCallback((v, e) => {
    update(index, e.target.id, v);
  }, [update, index]);

  const [hasDates, hasTimes] = React.useMemo(() => {
    const { startDate: sd, endDate: ed, startTime: st, endTime: et } = route;
    return [Boolean(sd && ed), Boolean(st && et)];
  }, [route]);

  return (
    <tr className="odd:bg-gray-400 even:bg-gray-300">
      <RouteTd minWidth={ null }>
        <div onClick={ doRemove }
          className={ `
            px-3 py-1 inline-block rounded bg-white cursor-pointer
            bg-opacity-50 hover:bg-opacity-100
            text-gray-600 hover:text-red-600
          ` }
        >
          <span className="fa fa-trash"/>
        </div>
      </RouteTd>

      <RouteTd hoverStyle={ { maxWidth: "85%", minWidth: "85%" } }>
        <div className="w-full flex">
          <div className="flex-1">
            { route.name }
          </div>
          <div className="flex items-center justify-center w-14">
            { hasDates ? <HasDates /> : null }
            { hasTimes ? <HasTimes /> : null }
            { hasDates || hasTimes ? null :
              <span className="fa fa-eye px-2 text-gray-500"/>
            }
          </div>
        </div>
        <div className="w-full py-2 shadow-lg shadow-black bg-white px-2">
          <div className="font-bold text-lg">
            { route.name }
          </div>
          <div className="grid grid-cols-1 gap-1">

            <div className="grid grid-cols-3 gap-1">
              <div className="py-1 font-bold text-right">Start Date</div>
              <div className="col-span-2">
                <Input type="date" id="startDate"
                  value={ route.startDate || "" }
                  onChange={ doUpdate }/>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="py-1 font-bold text-right">End Date</div>
              <div className="col-span-2">
                <Input type="date" id="endDate"
                  min={ route.startDate }
                  value={ route.endDate || "" }
                  onChange={ doUpdate }/>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1">
              <div className="py-1 font-bold text-right">Start Time</div>
              <div className="col-span-2">
                <Input type="time" id="startTime"
                  step={ 1 }
                  value={ route.startTime || "" }
                  onChange={ doUpdate }/>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="py-1 font-bold text-right">End Time</div>
              <div className="col-span-2">
                <Input type="time" id="endTime"
                  step={ 1 }
                  min={ route.startTime }
                  value={ route.endTime || "" }
                  onChange={ doUpdate }/>
              </div>
            </div>

            <div className="border-b-2 border-current font-bold">TMCs</div>
            <div className="whitespace-pre-wrap">
              { route.tmcs.join(", ") }
            </div>
          </div>
        </div>
      </RouteTd>

      { columns.map((col, i) => {
          return (
            <RouteTd key={ col.name }
              index={ i }
              minWidth={ col.dataColumns.length * 12 }
              hoverStyle={ { pointerEvents: "none" } }
            >
              <div className={ `grid grid-cols-${ col.dataColumns.length } gap-2` }>
                { col.dataColumns.map((dc, i) => {
                    return (
                      <div key={ dc.key }>
                        { route[col.name][dc.key] }
                      </div>
                    )
                  })
                }
              </div>
              <div
                className={ `
                  pointer-events-none bg-white
                  px-2 py-2 w-full min-w-fit shadow-lg shadow-black
                ` }
              >
                <div className="min-w-fit w-full font-bold text-center">
                  { moment(route[col.name].startDate, "YYYY-MM-DD").format("MMM Do YYYY") }
                  { route[col.name].startDate === route[col.name].endDate ? null : " - " }
                  { route[col.name].startDate === route[col.name].endDate ? null :
                    moment(route[col.name].endDate, "YYYY-MM-DD").format("MMM Do YYYY")
                  }
                </div>
                { !col.descriptor ? null :
                  <div className="text-center">
                    <span className="font-normal text-sm">
                      ({ col.descriptor })
                    </span>
                    <br />
                    <span className="font-normal text-sm">
                      { route[columns[0].name].startDate === route[columns[0].name].endDate ?
                        `(Base Date: ${ moment(route[columns[0].name].startDate, "YYYY-MM-DD").format("MMM Do YYYY") })` :
                        `(Base Dates: ${ moment(route[columns[0].name].startDate, "YYYY-MM-DD").format("MMM Do YYYY") } - ${ moment(route[columns[0].name].endtDate, "YYYY-MM-DD").format("MMM Do YYYY") })`
                      }

                    </span>
                  </div>
                }
                <div className={ `grid grid-cols-${ col.dataColumns.length } gap-2` }>
                  { col.dataColumns.map((dc, i) => {
                      return (
                        <div key={ dc.key }
                          className="font-bold border-b-2 border-current"
                        >
                          { dc.header }
                        </div>
                      )
                    })
                  }
                  { col.dataColumns.map((dc, i) => {
                      return (
                        <div key={ dc.key }>
                          { route[col.name][dc.key] }
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </RouteTd>
          )
        })
      }
    </tr>
  )
}
export default RouteTableRow;
