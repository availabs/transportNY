import React from "react"

import get from "lodash/get"

import { useFalcor } from "~/modules/avl-components/src"

import { Input } from "~/modules/avl-map-2/src/uicomponents"

const DisaplyDiv = ({ className, children }) => {
  return (
    <div className={ `
        max-w-md py-1 px-2 rounded bg-white
        text-ellipsis overflow-hidden
      ` }
    >
      { children }
    </div>
  )
}
const NBSP = <span>&nbsp;</span>;

const RouteTD = ({ isOdd, children }) => {
  return (
    <td className={ `
        whitespace-nowrap px-1 py-1 min-w-fit
        ${ isOdd ? "opacity-75" : "" }
        first:pl-2 last:pr-2
      ` }
    >
      { children }
    </td>
  )
}

const RouteColumn = ({ route, column, update, isOdd }) => {
  const [comp, type = null] = React.useMemo(() => {
    return column.comp.split(":");
  }, [column]);
  const doUpdate = React.useCallback(v => {
    update(column.key, v);
  }, [column]);
  return (
    <RouteTD isOdd={ isOdd }>
      { comp === "input" ?
        <Input type={ type }
          style={ { minWidth: "10rem" } }
          step={ type === "time" ? 1 : null }
          value={ get(route, column.key, "") }
          onChange={ doUpdate }/> :
        comp === "tmcs" ?
        <DisaplyDiv>
          { (route.tmcs || []).join(", ") || NBSP }
        </DisaplyDiv> :
        <DisaplyDiv>
          { get(route, column.key) || NBSP }
        </DisaplyDiv>
      }
    </RouteTD>
  )
}

const RemoveTD = ({ remove }) => {
  return (
    <RouteTD>
      <div onClick={ remove }
        className={ `
          flex items-center justify-center py-1 px-2 rounded
          bg-gray-200 hover:bg-white cursor-pointer
          text-red-300 hover:text-red-600
        `}
      >
        &nbsp;<span className="fa fa-trash"/>&nbsp;
      </div>
    </RouteTD>
  )
}

const Route = ({ route, columns, update, index, remove }) => {
  const doUpdate = React.useCallback((k, v) => {
    update(index, k, v);
  }, [index, update]);

  const { falcor, falcorCache } = useFalcor();
  React.useEffect(() => {
    if (route.tmcs.length) return;
    const { startDate, id } = route;
    if (startDate) {
      const year = startDate.slice(0, 4);
      falcor.get(["routes2", "id", id, year, "tmc_array"])
    }
  }, [falcor, route]);
  React.useEffect(() => {
    if (route.tmcs.length) return;
    const { startDate, id } = route;
    if (startDate) {
      const year = startDate.slice(0, 4);
      const tmcs = get(falcorCache, ["routes2", "id", id, year, "tmc_array", "value"], [])
      if (tmcs.length) {
        doUpdate("tmcs", tmcs);
      }
    }
  }, [falcorCache, route, doUpdate]);

  const doRemove = React.useCallback(e => {
    e.stopPropagation();
    remove(index);
  }, [remove, index]);

  return (
    <tr className="odd:bg-gray-500 even:bg-gray-200">
      <RemoveTD remove={ doRemove }/>
      { columns.map((col, i) => (
          <RouteColumn key={ `${ col.key }-${ i }` }
            route={ route }
            column={ col }
            update={ doUpdate }
            isOdd={ index % 2 === 0 }/>
        ))
      }
    </tr>
  )
}
export default Route;
