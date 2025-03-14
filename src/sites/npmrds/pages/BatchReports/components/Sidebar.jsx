import React from "react"

import get from "lodash/get"
import { range as d3range } from "d3-array"

import { useFalcor } from "~/modules/avl-components/src"

import { MultiLevelSelect } from "~/modules/avl-map-2/src/uicomponents"

import RelativeDateControls from "./RelativeDateControls"

const fillFolders = (falcorCache, fids) => {
  return fids.reduce((a, c) => {
    const folder = get(falcorCache, ["folders2", "id", c], null);
    const stuff = get(falcorCache, ["folders2", "stuff", c, "value"], []);
    const routeIds = stuff.filter(stuff => stuff.stuff_type === "route")
      .map(stuff => stuff.stuff_id);
    const folderIds = stuff.filter(stuff => stuff.stuff_type === "folder")
      .map(stuff => stuff.stuff_id);
    const subFolders = fillFolders(falcorCache, folderIds)
    if (folder && (routeIds.length || subFolders.length)) {
      a.push({
        name: folder.name,
        value: routeIds,
        children: [
          ...subFolders,
          ...routeIds.reduce((a, c) => {
            const route = get(falcorCache, ["routes2", "id", c], null);
            if (route) {
              a.push({
                name: route.name,
                value: c
              })
            }
            return a;
          }, [])
        ]
      })
    }
    return a;
  }, []);
}

const nameAccessor = r => r.name;
const idAccessor = r => r.id;
const valueAccessor = r => r.value;
const headerAccessor = c => c.header;
const valueComparator = (a, b) => a.key === b.key;

const Sidebar = props => {
  const {
    addRoutes,
    activeDataColumns,
    setActiveDataColumns,
    activePCColumns,
    setActivePCColumns,
    activeDateColumns,
    setActiveDateColumns,
    dataColumnOptions,
    pcColumnOptions,
    children
  } = props;

  const { falcorCache } = useFalcor();

  const [routes, setRoutes] = React.useState([]);
  React.useEffect(() => {
    const numRoutes = get(falcorCache, ["routes2", "user", "length"], 0);
    const routes = d3range(numRoutes)
      .reduce((a, c) => {
        const ref = get(falcorCache, ["routes2", "user", "index", c, "value"], []);
        const route = get(falcorCache, ref, null);
        if (route) {
          a.push(route);
        }
        return a;
      }, []);
    setRoutes(routes.sort((a, b) => a.name.localeCompare(b.name)));
  }, [falcorCache]);

  const [folders, setFolders] = React.useState([]);
  React.useEffect(() => {
    const numFolders = get(falcorCache, ["folders2", "user", "length"], 0);
    const fids = d3range(numFolders)
      .reduce((a, c) => {
        const [,, fid] = get(falcorCache, ["folders2", "user", "index", c, "value"], []);
        if (fid) {
          a.push(fid);
        }
        return a;
      }, []);

console.log("FOLDER IDs:", fids);

    setFolders(fillFolders(falcorCache, fids));
  }, [falcorCache]);

console.log("????????????????????????????????????????")

  return (
    <div className="w-[400px] h-fit">
      <div className="h-fit relative">

        <div className="grid grid-cols-2 gap-2 p-4">
          <div className="col-span-2 text-2xl font-bold">
            Batch Reports
          </div>

          <div className="col-span-2 border-b-2">Route Selection</div>
          <MultiLevelSelect isDropdown searchable
            onChange={ addRoutes }
            options={ routes }
            displayAccessor={ nameAccessor }
            valueAccessor={ idAccessor }
          >
            <div className="px-2 py-1 outline outline-2 rounded hover:bg-gray-300">
              Select a Route
            </div>
          </MultiLevelSelect>

          <MultiLevelSelect isDropdown searchable
            onChange={ addRoutes }
            options={ folders }
            displayAccessor={ nameAccessor }
            valueAccessor={ valueAccessor }
          >
            <div className="px-2 py-1 outline outline-2 rounded hover:bg-gray-300">
              Search Folders
            </div>
          </MultiLevelSelect>
          <div className="col-span-2"/>

          <div className="col-span-2 border-b-2">Data Selection</div>
          <div className="col-span-2">
            <MultiLevelSelect isMulti
              onChange={ setActiveDataColumns }
              options={ dataColumnOptions }
              displayAccessor={ headerAccessor }
              value={ activeDataColumns }
              valueComparator={ valueComparator }
              placeholder="Add a data column..."/>
          </div>
          <div className="col-span-2"/>

          <div className="col-span-2 border-b-2">Percent Change Selection</div>
          <div className="col-span-2">
            <MultiLevelSelect isMulti
              onChange={ setActivePCColumns }
              options={ pcColumnOptions }
              displayAccessor={ headerAccessor }
              value={ activePCColumns }
              valueComparator={ valueComparator }
              placeholder="Add a percent change column..."/>
          </div>
          <div className="col-span-2"/>

          <div className="col-span-2 border-b-2">Relative Date Selection</div>
          <div className="col-span-2">
            <RelativeDateControls
              activeDateColumns={ activeDateColumns }
              setActiveDateColumns={ setActiveDateColumns }/>
          </div>

        </div>
      </div>
    </div>
  )
}
export default Sidebar
