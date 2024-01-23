import React from "react"

import get from "lodash/get"

import {
  useFalcor,
  Modal
} from "~/modules/avl-components/src"

import FolderIcon from "./FolderIcon"

const useDefaultHook = (id, type) => {
  return [{ key: "default", value: `Information not yet available for: ${ type }` }];
}

const useFolderInfo = id => {
  const { falcor, falcorCache } = useFalcor();

  const [info, setInfo] = React.useState([]);
  React.useEffect(() => {
    if (!id) return;
    falcor.get([
      "folders2", "id", id,
      ["name", "description",
        "icon, color", "owner", "type",
        "created_at", "updated_at"]
    ]);
  }, [falcor, id]);

  React.useEffect(() => {
    const info = [];
    const data = get(falcorCache, ["folders2", "id", id], null);
    if (data) {
      info.push({
        key: "name",
        value: get(data, "name", ""),
        className: "text-lg font-bold border-b-2 border-current",
        comp: <div className="inline-block mr-1"><FolderIcon { ...data } size={ 2 }/></div>
      })
      info.push({
        key: "description",
        value: get(data, "description", "")
      })
      info.push({
        key: "created_at",
        name: "Created At",
        value: new Date(get(data, "created_at")).toLocaleString()
      })
      info.push({
        key: "updated_at",
        name: "Updated At",
        value: new Date(get(data, "updated_at")).toLocaleString()
      })
    }
    setInfo(info);
  }, [falcorCache, id]);

  return info;
}

const useRouteInfo = id => {
  const { falcor, falcorCache } = useFalcor();

  const [info, setInfo] = React.useState([]);
  React.useEffect(() => {
    if (!id) return;
    falcor.get([
      "routes2", "id", id,
      ["name", "description",
        "points", "tmc_array",
        "conflation_version", "confltion_array",
        "created_at", "updated_at", "metadata"]
    ]);
  }, [falcor, id]);

  React.useEffect(() => {
    const info = [];
    const data = get(falcorCache, ["routes2", "id", id], null);
    if (data) {
      info.push({
        key: "name",
        value: get(data, "name", ""),
        className: "text-lg font-bold border-b-2 border-current",
        icon: "fa fa-road mr-1"
      })
      info.push({
        key: "description",
        value: get(data, "description", "")
      })
      info.push({
        key: "created_at",
        name: "Created At",
        value: new Date(get(data, "created_at")).toLocaleString()
      })
      info.push({
        key: "updated_at",
        name: "Updated At",
        value: new Date(get(data, "updated_at")).toLocaleString()
      })
      info.push({
        key: "tmcs",
        name: "Number of TMCs",
        value: get(data, ["tmc_array", "value", "length"], 0)
      })
      info.push({
        key: "version",
        name: "Conflation Version",
        value: get(data, "conflation_version") || "none"
      })
      const dates = get(data, ["metadata", "value", "dates"], []);
      if (dates.length) {
        info.push({
          key: "dates",
          name: "Dates",
          value: dates.join(", ")
        })
      }
    }
    setInfo(info);
  }, [falcorCache, id]);

  return info;
}

const useReportInfo = id => {
  const { falcor, falcorCache } = useFalcor();

  const [info, setInfo] = React.useState([]);

  React.useEffect(() => {
    if (!id) return;
    falcor.get([
      "reports2", "id", id,
      ["name", "description",
        "route_comps", "graph_comps", "station_comps",
        "color_range", "created_at", "updated_at"]
    ]);
  }, [falcor, id]);

  React.useEffect(() => {
    const info = [];
    const data = get(falcorCache, ["reports2", "id", id], null);

    if (data) {
      info.push({
        key: "name",
        value: get(data, "name", ""),
        className: "text-lg font-bold border-b-2 border-current",
        icon: "fa fa-chart-column mr-1"
      })
      info.push({
        key: "description",
        value: get(data, "description", "")
      })
      info.push({
        key: "created_at",
        name: "Created At",
        value: new Date(get(data, "created_at")).toLocaleString()
      })
      info.push({
        key: "updated_at",
        name: "Updated At",
        value: new Date(get(data, "updated_at")).toLocaleString()
      })
      info.push({
        key: "routes",
        name: "Number of Unique Routes",
        value: get(data, ["route_comps", "value"], [])
          .reduce((a, c) => {
            a.add(c.routeId);
            return a;
          }, new Set()).size
      })
      info.push({
        key: "stations",
        name: "Number of Unique Stations",
        value: get(data, ["station_comps", "value"], [])
          .reduce((a, c) => {
            a.add(c.stationId);
            return a;
          }, new Set()).size
      })
      info.push({
        key: "graphs",
        name: "Number of Graphs",
        value: get(data, ["graph_comps", "value", "length"], 0)
      })
    }
    setInfo(info);
  }, [falcorCache, id]);

  return info;
}

const useTemplateInfo = id => {
  const { falcor, falcorCache } = useFalcor();

  const [info, setInfo] = React.useState([]);

  React.useEffect(() => {
    if (!id) return;
    falcor.get([
      "templates2", "id", id,
      ["name", "description",
        "routes", "route_comps", "graph_comps",
        "stations", "station_comps",
        "color_range", "special", "default_type",
        "created_at", "updated_at"]
    ]);
  }, [falcor, id]);

  React.useEffect(() => {
    const info = [];
    const data = get(falcorCache, ["templates2", "id", id], null);
    if (data) {
      info.push({
        key: "name",
        value: get(data, "name", ""),
        className: "text-lg font-bold border-b-2 border-current",
        icon: "fa fa-gear mr-1"
      })
      info.push({
        key: "description",
        value: get(data, "description", "")
      })
      info.push({
        key: "created_at",
        name: "Created At",
        value: new Date(get(data, "created_at")).toLocaleString()
      })
      info.push({
        key: "updated_at",
        name: "Updated At",
        value: new Date(get(data, "updated_at")).toLocaleString()
      })
      info.push({
        key: "routes",
        name: "Number of Unique Routes",
        value: get(data, "routes", 0)
      })
      info.push({
        key: "stations",
        name: "Number of Unique Stations",
        value: get(data, "stations", 0)
      })
      info.push({
        key: "graphs",
        name: "Number of Graphs",
        value: get(data, ["graph_comps", "value", "length"], 0)
      })
    }
    setInfo(info);
  }, [falcorCache, id]);

  return info;
}

const Hooks = [
  { type: "folder", hook: useFolderInfo },
  { type: "route", hook: useRouteInfo },
  { type: "report", hook: useReportInfo },
  { type: "template", hook: useTemplateInfo }
]

const StuffInfoModal = ({ type, id, isOpen = false, close }) => {

  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);

  const hook = React.useMemo(() => {
    return Hooks.reduce((a, c) => {
      return c.type === type ? c.hook : a;
    }, useDefaultHook);
  }, [type]);

  const info = hook(id, type);

  return (
    <Modal open={ isOpen }>
      <div className="bg-gray-100 overflow-auto h-fit"
        onClick={ stopPropagation }
      >

        <div onClick={ close }
          className={ `
            absolute top-1 right-1 h-6 w-6
            rounded hover:bg-gray-400
            flex items-center justify-center
            cursor-pointer pointer-events-auto
          ` }
        >
          <span className="fa fa-close"/>
        </div>

        <div className="px-4 py-4">
          { info.map(({ key, name, value, className, icon, comp }) => (
              <div key={ key } className={ className || null }>
                { comp ? comp : null }
                { icon ? <span className={ icon }/> : null }
                { name ? <span className="font-bold mr-1">{ name }:</span> : null }
                { value }
              </div>
            ))
          }
        </div>

      </div>
    </Modal>
  )
}

export default StuffInfoModal;
