import React from "react"

import get from "lodash.get"
import { useHistory, useParams, Link } from "react-router-dom"

import {
  useFalcor,
  useTheme,
  getColorRange,
  ScalableLoading,
  Select
} from "modules/avl-components/src"

import Stuff from "./Stuff"

const StuffInFolder = ({ openedFolders, setOpenedFolders, filter }) => {
  const { falcor, falcorCache } = useFalcor();

  const [stuff, setStuff] = React.useState([]);

  const folder = openedFolders[openedFolders.length - 1]

  React.useEffect(() => {
    falcor.get(["folders2", "stuff", folder.id])
  }, [falcor, folder]);

  React.useEffect(() => {
    const stuff = get(falcorCache, ["folders2", "stuff", folder.id, "value"], []);
    setStuff(stuff);
  }, [falcorCache, folder]);

  return (
    <div>
      <FolderPath filter={ filter }
        openedFolders={ openedFolders }
        setOpenedFolders={ setOpenedFolders }/>
      { stuff.filter(s => !filter || s.stuff_type === filter.slice(0, -1))
          .map((s, i)=> (
            <Stuff key={ i }
              openedFolders={ openedFolders }
              setOpenedFolders={ setOpenedFolders }
              type={ s.stuff_type }
              id={ s.stuff_id }/>
          ))
      }
    </div>
  )
}
export default StuffInFolder;

const PathItem = ({ openPath, setOpenedFolders, name }) => {
  const open = React.useCallback(e => {
    e.stopPropagation();
    setOpenedFolders(openPath);
  }, [openPath, setOpenedFolders]);
  return (
    <div className="cursor-pointer"
      onClick={ open }>
      { name }&nbsp;/&nbsp;
    </div>
  )
}
const FolderPath = ({ openedFolders, setOpenedFolders, filter }) => {
  return (
    <div className="text-4xl font-bold flex">
      { openedFolders.map((f, i) => (
          <PathItem key={ f.id } name={ f.name }
            openPath={ openedFolders.slice(0, i + 1) }
            setOpenedFolders={ setOpenedFolders }
          />
        ))
      }
      { filter }
    </div>
  )
}
