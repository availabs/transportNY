import React from "react"

import get from "lodash.get"

import {
  useFalcor,
} from "modules/avl-components/src"

const Folder = ({ id, openedFolders, setOpenedFolders }) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get(["folders2", "id", id, ["name", "icon", "color", "id"]])
  }, [falcor, id]);

  const [folder, setFolder] = React.useState(null);
  React.useEffect(() => {
    const folder = get(falcorCache, ["folders2", "id", id], null);
    setFolder(folder);
  }, [falcorCache, id]);

  const openFolder = React.useCallback(e => {
    e.stopPropagation();
    setOpenedFolders([...openedFolders, folder]);
  }, [openedFolders, setOpenedFolders, folder]);

  return (
    <div onClick={ openFolder } className="flex items-center cursor-pointer">
      <span className="fa fa-folder mr-1"/>
      <span className="pt-1">
        { get(folder, "name", "loading...") }
      </span>
    </div>
  )
}
const Route = ({ id }) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get(["routes2", "id", id, ["name"]]);
  }, [falcor, id]);

  return (
    <div className="flex items-center">
      <span className="fa fa-road mr-1"/>
      <span className="pt-1">
        { get(falcorCache, ["routes2", "id", id, "name"], "loading...") }
      </span>
    </div>
  )
}
const Report = ({ id }) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get(["reports2", "id", id, ["title"]]);
  }, [falcor, id]);

  return (
    <div className="flex items-center">
      <span className="fa fa-chart-column mr-1"/>
      <span className="pt-1">
        { get(falcorCache, ["reports2", "id", id, "title"], "loading...") }
      </span>
    </div>
  )
}
const Template = ({ id }) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get(["templates2", "id", id, ["title"]]);
  }, [falcor, id]);

  return (
    <div className="flex items-center">
      <span className="fa fa-gear mr-1"/>
      <span className="pt-1">
        { get(falcorCache, ["templates2", "id", id, "title"], "loading...") }
      </span>
    </div>
  )
}

const Stuff = ({ type, ...props }) => {
  return (
    type === "folder" ? <Folder { ...props }/> :
    type === "route" ? <Route { ...props }/> :
    type === "report" ? <Report { ...props }/> :
    type === "template" ? <Template { ...props }/> : null
  )
}
export default Stuff
