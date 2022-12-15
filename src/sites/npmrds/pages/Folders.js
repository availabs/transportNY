import React from "react"

import get from "lodash.get"
import { range as d3range } from "d3-array"
import { useHistory, useParams, Link } from "react-router-dom"

import {
  useFalcor,
  useTheme,
  withAuth,
  getColorRange,
  ScalableLoading,
  Select
} from "modules/avl-components/src"

import FolderIcon from "./components/FolderIcon"
import StuffInFolder from "./components/StuffInFolder"
import FolderModal from "./components/FolderModal"

const Folders = ({ user }) => {
  const { falcor, falcorCache } = useFalcor();

  const [folders, setFolders] = React.useState([]);
  const [foldersByType, setFoldersByType] = React.useState([[], [], []]);
  const [openedFolders, setOpenedFolders] = React.useState([]);
  const OpenedFolders = React.useMemo(() => {
    return openedFolders.map(fid => get(falcorCache, ["folders2", "id", fid]));
  }, [falcorCache, openedFolders]);

  const deleteFolder = React.useCallback(fid => {
    falcor.call(["folders2", "delete"], [fid])
      .then(res => {
        const inFolders = folders.reduce((a, c) => {
          return a || (c.id == fid);
        }, false);
        if (inFolders) {
          setFolders(folders.filter(({ id }) => {
            return id != fid;
          }));
        }
        if (openedFolders.includes(fid)) {
          const index = openedFolders.indexOf(fid);
          setOpenedFolders(openedFolders.slice(0, index));
        }
      });
  }, [openedFolders]);

  React.useEffect(() => {
    falcor.get(["folders2", "user", "length"])
      .then(res => {
        const length = get(res, ["json", "folders2", "user", "length"], 0)
        if (length) {
          return falcor.get([
            "folders2", "user", "index", d3range(length),
            ["name", "icon", "color", "id",
              "updated_at", "created_at",
              "type", "owner", "editable"
            ]
          ])
        }
      })
  }, [falcor]);

  React.useEffect(() => {
    const length = get(falcorCache, ["folders2", "user", "length"], 0);
    const refs = d3range(length).map(i => get(falcorCache, ["folders2", "user", "index", i, "value"]));
    const folders = refs.map(ref => get(falcorCache, ref, null)).filter(Boolean);

    folders.sort((a, b) => {
      const aDate = new Date(a.updated_at);
      const bDate = new Date(b.updated_at);
      return bDate.getTime() - aDate.getTime();
    });
    setFolders(folders);

    const byType = folders.reduce((a, c) => {
      if (c.type === "user") {
        a[0].push(c);
      }
      else if (c.type === "group") {
        a[1].push(c);
      }
      else if (c.type === "default") {
        a[2].push(c);
      }
      return a;
    }, [[], [], []]);
    setFoldersByType(byType);
  }, [falcorCache]);

  React.useEffect(() => {
    if (folders.length && !openedFolders.length) {
      setOpenedFolders([folders.filter(f => f.type === "user")[0].id]);
    }
  }, [folders, openedFolders]);

  const params = useParams();

  const [filter, setFilter] = React.useState(null)
  React.useEffect(() => {
    if (params.stuff) {
      setFilter(params.stuff);
    }
  }, [params]);

  const [open, setOpen] = React.useState(false);
  const openModal = React.useCallback(e => {
    setOpen(true);
  }, []);
  const closeModal = React.useCallback(e => {
    setOpen(false);
  }, []);

  return (
    <div className="max-w-screen-xl mx-auto my-8">
      { !openedFolders.length ? null :
        <StuffInFolder filter={ filter }
          deleteFolder={ deleteFolder }
          openedFolders={ OpenedFolders }
          setOpenedFolders={ setOpenedFolders }/>
      }
      <FolderModal isOpen={ open }
        close={ closeModal }/>
    </div>
  )
}

const FolderIconWrapper = ({ opened, onClick, deleteFolder, userAuth, ...folder }) => {

  const isEditable = userAuth >= folder.editable;

  const [showTools, setShowTools] = React.useState(false);
  const onMouseOver = React.useCallback(() => {
    setShowTools(true);
  }, []);
  const onMouseLeave = React.useCallback(() => {
    setShowTools(false);
  }, []);

  const [showConfirm, setShowConfirm] = React.useState(false);
  const show = React.useCallback(e => {
    e.stopPropagation();
    setShowConfirm(true);
  }, []);
  const hide = React.useCallback(e => {
    e.stopPropagation();
    setShowConfirm(false);
  }, []);

  const doDeleteFolder = React.useCallback(e => {
    e.stopPropagation();
    deleteFolder(folder.id);
  }, [deleteFolder, folder.id]);

  const [open, setOpen] = React.useState(false);
  const openModal = React.useCallback(e => {
    e.stopPropagation();
    setOpen(true);
  }, []);
  const closeModal = React.useCallback(e => {
    e.stopPropagation();
    setOpen(false);
  }, []);

  return (
    <>
      <div
        onClick={ onClick }
        onMouseOver={ isEditable ? onMouseOver : null }
        onMouseLeave={ isEditable ? onMouseLeave : null }
        className={ `
          rounded-xl border-2 hover:border-current
          cursor-pointer relative px-1 flex justify-center
          ${ opened ? "border-current" : "border-transparent" }
        ` }
      >
        { !showConfirm ? null :
          <div
            className={ `
              absolute inset-0 bg-opacity-50 bg-gray-500 z-50
              flex justify-center items-center
              cursor-auto
            ` }
          >
            <div className="text-5xl font-bold w-full grid grid-cols-2">
              <div className="flex justify-center items-center">
                <span className="fa fa-ban cursor-pointer hover:text-6xl"
                  onClick={ hide }/>
              </div>
              <div className="flex justify-center items-center">
                <span className="fa fa-trash cursor-pointer hover:text-6xl text-red-500"
                  onClick={ doDeleteFolder }/>
              </div>
            </div>
          </div>
        }
        <div className="relative pb-4">
          <FolderIcon { ...folder }>
            { !showTools || !isEditable ? null :
              <div style={ { right: "-0.75rem" } }
                className="absolute top-1 flex">
                <div onClick={ show }
                  className={ `
                      w-8 h-8 rounded mr-1 text-red-500
                      bg-gray-300 hover:bg-gray-400
                      flex items-center justify-center
                      text-xl hover:text-2xl
                  ` }
                >
                  <span className="fa fa-trash"/>
                </div>
                <div onClick={ openModal }
                  className={ `
                      w-8 h-8 rounded text-blue-500
                      bg-gray-300 hover:bg-gray-400
                      flex items-center justify-center
                      text-xl hover:text-2xl
                  ` }
                >
                  <span className="fa fa-edit"/>
                </div>
              </div>
            }
          </FolderIcon>
          <div style={ { left: "-0.5rem", right: "-0.5rem" } }
            className="absolute bottom-0"
          >
            <div className="truncate whitespace-nowrap">
              { folder.name }
            </div>
          </div>
        </div>
      </div>
      <FolderModal folder={ folder }
        isOpen={ open }
        close={ closeModal }/>
    </>
  )
}

const config = [
  { name:'Folders',
    icon: 'fa fa-folder',
    path: "/folders",
    subMenus: [
      {
        name: 'Routes',
        icon: 'fa fa-road',
        path: '/folders/routes'
      },
      {
        name: 'Reports',
        icon: 'fa fa-file-lines',
        path: '/folders/reports'
      },
      {
        name: 'Templates',
        icon: 'fa fa-gear',
        path: '/folders/templates'
      }
    ],
    exact: true,
    auth: true,
    mainNav: true,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    component: withAuth(Folders)
  },
  { name:'Folders',
    icon: 'fa fa-folder',
    path: "/folders/:stuff",
    exact: true,
    auth: true,
    mainNav: false,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    component: withAuth(Folders)
  }
]

export default config;
