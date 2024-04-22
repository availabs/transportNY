import React from "react"

import get from "lodash/get"

import { useFalcor } from "~/modules/avl-components/src"

import { Input } from "~/modules/avl-map-2/src/uicomponents"

const NameInput = ({ name, update }) => {
  const [value, setValue] = React.useState(name);
  const MOUNTED = React.useRef(false);
  React.useEffect(() => {
    MOUNTED.current = true;
    return () => MOUNTED.current = false;
  }, []);
  const timeout = React.useRef(null);
  const doUpdate = React.useCallback(v => {
    if (MOUNTED) update(v);
  }, [MOUNTED, update]);
  const onKeyUp = React.useCallback(e => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(doUpdate, 2500, value);
  }, [doUpdate, value]);
  return (
    <div>
      <Input type="text"
        style={ { minWidth: "10rem" } }
        value={ value }
        onChange={ setValue }
        onKeyUp={ onKeyUp }/>
    </div>
  )
}

const DisaplyDiv = ({ className, children }) => {
  return (
    <div className={ `py-1 px-2 rounded bg-white` }>
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
        comp === "name-input" ?
        <NameInput
          name={ get(route, "name", "") }
          update={ doUpdate }/> :
        comp === "tmcs" ?
        <DisaplyDiv>
          { (route.tmcs || []).join(", ") || NBSP }
        </DisaplyDiv> :
        comp === "data" ?
        <DisaplyDiv>
          { column.header }
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
          flex items-center justify-center py-1 rounded
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
      doUpdate("tmcs", tmcs);
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
          <RouteColumn key={ i }
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
