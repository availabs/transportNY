import React from "react"

import get from "lodash.get"
import { useHistory, useParams, Link } from "react-router-dom"

import Fuse from "fuse.js"

import {
  useFalcor,
  Input
  // useTheme,
  // getColorRange,
  // ScalableLoading,
  // Select
} from "modules/avl-components/src"

import { FolderStuff } from "./Stuff"
import FolderModal from "./FolderModal"
import ActionBar from "./ActionBar"

const FuseWrapper = (stuff, options) => {
  const fuse = new Fuse(stuff, options)
  return search => {
    if (!search) return stuff;
    return fuse.search(search).map(f => f.item);
  }
}

const StuffInFolder = ({ openedFolders, setOpenedFolders, filter }) => {
  const { falcor, falcorCache } = useFalcor();

  const [stuff, setStuff] = React.useState([]);

  const folder = openedFolders[openedFolders.length - 1];

  React.useEffect(() => {
    falcor.get(["folders2", "stuff", folder.id])
  }, [falcor, folder]);

  React.useEffect(() => {
    const stuff = get(falcorCache, ["folders2", "stuff", folder.id, "value"], []);
    const [folders, routes, reports, templates] = stuff.reduce((a, c) => {
      switch (c.stuff_type) {
        case "folder":
          a[0].push(c.stuff_id);
          break;
        case "route":
          a[1].push(c.stuff_id);
          break;
        case "report":
          a[2].push(c.stuff_id);
          break;
        case "template":
          a[3].push(c.stuff_id);
          break;
      }
      return a;
    }, [[], [], [], []]);

    const requests = [];
    if (folders.length) {
      requests.push(["folders2", "id", folders, ["name", "description"]])
    }
    if (routes.length && (!filter || (filter === "routes"))) {
      requests.push(["routes2", "id", routes, ["name", "description"]])
    }
    if (reports.length && (!filter || (filter === "reports"))) {
      requests.push(["reports2", "id", reports, ["name", "description"]])
    }
    if (templates.length && (!filter || (filter === "templates"))) {
      requests.push(["templates2", "id", templates, ["name", "description"]])
    }
    if (requests.length) {
      falcor.get(...requests);
    }
  }, [falcor, falcorCache, folder, filter]);

  React.useEffect(() => {
    const stuff = get(falcorCache, ["folders2", "stuff", folder.id, "value"], [])
      .map(s => {
        switch (s.stuff_type) {
          case "folder":
            return {
              ...s,
              ...get(falcorCache, ["folders2", "id", s.stuff_id], {})
            };
          case "route":
            return {
              ...s,
              ...get(falcorCache, ["routes2", "id", s.stuff_id], {})
            };
          case "report":
            return {
              ...s,
              ...get(falcorCache, ["reports2", "id", s.stuff_id], {})
            };
          case "template":
            return {
              ...s,
              ...get(falcorCache, ["templates2", "id", s.stuff_id], {})
            };
        }
      })
      .filter(s => !filter || filter.includes(s.stuff_type))
    setStuff(stuff);
  }, [falcorCache, folder, filter]);

  const [selectedStuff, setSelectedStuff] = React.useState([]);
  const selectStuff = React.useCallback(stuff => {
    setSelectedStuff(prev => [...prev, stuff]);
  }, []);
  const deselectStuff = React.useCallback(stuff => {
    setSelectedStuff(prev => prev.filter(s => !((s.type === stuff.type) && (s.id === stuff.id))));
  }, []);
  const deselectAll = React.useCallback(e => {
    setSelectedStuff([]);
  }, []);

  React.useEffect(() => {
    deselectAll();
  }, [folder, deselectAll]);

  const [open, setOpen] = React.useState(false);
  const openModal = React.useCallback(e => {
    setOpen(true);
  }, []);
  const closeModal = React.useCallback(e => {
    setOpen(false);
  }, []);

  const [search, setSearch] = React.useState("");
  const clearSearch = React.useCallback(() => {
    setSearch("");
  }, [])

  const fuse = React.useMemo(() => {
    return FuseWrapper(stuff, { keys: ["name", "description"] });
  }, [stuff]);

  return (
    <div>
      <FolderPath filter={ filter }
        openedFolders={ openedFolders }
        setOpenedFolders={ setOpenedFolders }
        openModal={ openModal }/>
      <ActionBar parent={ folder.id }
        selectedStuff={ selectedStuff }
        deselectAll={ deselectAll }/>
      <div className="flex">
        { !stuff.length ? null :
          <Input type="text" className="w-full max-w-md px-2 py-1"
            value={ search }
            onChange={ setSearch }
            placeholder="search stuff..."/>
        }
        { !search.length ? null :
          <div onClick={ clearSearch }
            className={ `
              w-8 h-8 flex items-center justify-center
              cursor-pointer hover:bg-gray-400 rounded ml-1
              text-large hover:text-2xl
            ` }
          >
            <span className={ `
              fa fa-close
            ` }/>
          </div>
        }
      </div>
      { fuse(search).map((s, i)=> (
          <FolderStuff key={ i }
            openedFolders={ openedFolders }
            setOpenedFolders={ setOpenedFolders }
            type={ s.stuff_type }
            id={ s.stuff_id }
            selected={
              selectedStuff.reduce((a, c) => {
                return a || (c.id == s.stuff_id);
              }, false)
            }
            select={ selectStuff }
            deselect={ deselectStuff }
            parent={ folder.id }/>
        ))
      }
      <FolderModal isOpen={ open }
        close={ closeModal }
        openedFolders={ openedFolders }/>
    </div>
  )
}
export default StuffInFolder;

const PathItem = ({ openPath, setOpenedFolders, name }) => {
  const open = React.useCallback(e => {
    e.stopPropagation();
    setOpenedFolders(openPath.map(f => f.id));
  }, [openPath, setOpenedFolders]);
  return (
    <div onClick={ open }
      className="cursor-pointer">
      { name }
    </div>
  )
}
const FolderPath = ({ openedFolders, setOpenedFolders, filter, openModal }) => {
  return (
    <div className="text-4xl font-bold flex relative">
      { openedFolders.map((f, i) => (
          <div key={ f.id } className="flex items-center">
            <PathItem name={ f.name }
              openPath={ openedFolders.slice(0, i + 1) }
              setOpenedFolders={ setOpenedFolders }
            />
            { i === openedFolders.length - 1 ?
              <>
                <span>&nbsp;</span>
                <div onClick={ openModal }
                  className={ `
                    h-10 w-10 rounded hover:bg-gray-400
                    flex items-center justify-center
                    text-xl hover:text-3xl cursor-pointer
                  ` }
                >
                  <span className="fa fa-plus"/>
                </div>
              </> : null
            }
            <span>&nbsp;/&nbsp;</span>
          </div>
        ))
      }
      { filter }
    </div>
  )
}
