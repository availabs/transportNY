import React from "react"

import get from "lodash/get"
import { range as d3range } from "d3-array"

import { useFalcor } from "~/modules/avl-components/src"

import { MultiLevelSelect } from "~/modules/avl-map-2/src/uicomponents"

const nameAccessor = r => r.name;
const idAccessor = r => r.id;
const valueAccessor = r => r.value;

const fillFolders = (falcor, falcorCache, fids) => {
  return fids.reduce((a, c) => {
    const folder = get(falcorCache, ["folders2", "id", c], null);
    const stuff = get(falcorCache, ["folders2", "stuff", c, "value"], []);
    const routeIds = stuff.filter(stuff => stuff.stuff_type === "route")
      .map(stuff => stuff.stuff_id);
    const folderIds = stuff.filter(stuff => stuff.stuff_type === "folder")
      .map(stuff => stuff.stuff_id);

    if (routeIds.length) {
      falcor.get(["routes2", "id", routeIds, ["id", "name", "metadata", "tmc_array"]]);
    }

    if (folderIds.length) {
      falcor.get(
        ["folders2", "id", folderIds, ["id", "name", "type"]],
        ["folders2", "stuff", folderIds]
      )
    }

    const subFolders = fillFolders(falcor, falcorCache, folderIds);

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

const FolderTypeValues = {
  "user": 0,
  "group": 1,
  "AVAIL": 2
}

const setFolderValues = (folderTree, falcorCache) => {
  return folderTree.reduce((a, c) => {
    const stuff = get(falcorCache, ["folders2", "stuff", c.id, "value"], []);
    const routeIds = stuff.filter(stuff => stuff.stuff_type === "route")
      .map(stuff => stuff.stuff_id);
    if (routeIds.length) {
      a.push({
        ...c,
        value: routeIds,
        children: [
          ...setFolderValues(c.children, falcorCache),
          ...routeIds.reduce((a, c) => {
            const route = get(falcorCache, ["routes2", "id", c], null);
            if (route) {
              a.push({
                name: `${route.name} (${route.id})`,
                value: c
              })
            }
            return a;
          }, [])
        ]
      })
    }
    return a;
  }, []).sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name)
    }
    return FolderTypeValues[a.type] - FolderTypeValues[b.type];
  });
}

const RouteSelector = ({ addRoutes, clearRoutes }) => {

  const { falcor, falcorCache } = useFalcor();

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
  // React.useEffect(() => {
  //   const numFolders = get(falcorCache, ["folders2", "user", "length"], 0);
  //   const fids = d3range(numFolders)
  //     .reduce((a, c) => {
  //       const [,, fid] = get(falcorCache, ["folders2", "user", "index", c, "value"], []);
  //       if (fid) {
  //         a.push(fid);
  //       }
  //       return a;
  //     }, []);
  //   setFolders(fillFolders(falcor, falcorCache, fids));
  // }, [falcor, falcorCache]);
  React.useEffect(() => {
    const foldersTree = get(falcorCache, ["folders2", "user", "tree", "value"], []);
    setFolders(setFolderValues(foldersTree, falcorCache));
  }, [falcorCache]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-2 border-b-2 border-current font-bold">
        Route Selection
      </div>

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

      <button className="px-2 py-1 col-start-2 outline outline-2 outline-red-500 text-red-500 rounded hover:bg-red-200"
        onClick={ clearRoutes }
      >
        Clear Routes
      </button>
    </div>
  )
}
export default RouteSelector;
