import React from "react"

import get from "lodash/get"
import { range as d3range } from "d3-array"
import { useParams, useLocation } from "react-router-dom"

import {
  useFalcor
} from "~/modules/avl-components/src"

// import { withAuth } from "@availabs/ams"
import { withAuth } from "~/modules/ams/src"

import FolderIcon from "./components/FolderIcon"
import StuffInFolder from "./components/StuffInFolder"
import FolderModal from "./components/FolderModal"

const Folders = ({ user }) => {

  const { falcor, falcorCache } = useFalcor();

  const [folders, setFolders] = React.useState([]);
  const [openedFolders, _setOpenedFolders] = React.useState([]);
  const setOpenedFolders = React.useCallback(openedFolders => {
    if (window.localStorage) {
      window.localStorage.setItem("openedFolders", JSON.stringify(openedFolders.slice(0, 1)))
    }
    _setOpenedFolders(openedFolders);
  }, []);
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
  }, [falcorCache]);

  React.useEffect(() => {
    if (!folders.length) return;
    falcor.get(["folders2", "stuff", folders.map(f => f.id)]);
  }, [falcor, folders]);

  React.useEffect(() => {
    let set = false;
    if (window.localStorage && folders.length && !openedFolders.length) {
      const storedOpenedFolders = window.localStorage.getItem("openedFolders");
      if (storedOpenedFolders) {
        const [id] = JSON.parse(storedOpenedFolders);
        const [folder] = folders.filter(f => f.id == id);
        if (folder) {
          setOpenedFolders([id]);
          set = true;
        }
      }
    }
    if (!set && folders.length && !openedFolders.length) {
      setOpenedFolders([folders.filter(f => f.type === "user")?.[0]?.id]);
    }
  }, [folders, openedFolders]);

  const [filter, setFilter] = React.useState(null);

  const params = useParams();
  React.useEffect(() => {
    if (params.stuff) {
      setFilter(params.stuff);
    }
  }, [params]);

  const location = useLocation();
  React.useEffect(() => {
    const { pathname } = location;
    const [,, stuff] = pathname.split("/");
    if (stuff) {
      setFilter(stuff);
    }
  }, [location]);

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
          setOpenedFolders={ setOpenedFolders }
          folders={ folders }/>
      }
      <FolderModal isOpen={ open }
        close={ closeModal }/>
    </div>
  )
}

const config = [
  { name:'Folders',
    icon: 'fa fa-folder',
    path: "/folders",
    // subMenus: [
    //   { name: 'Routes',
    //     icon: 'fa fa-road',
    //     path: '/folders/routes'
    //   },
    //   { name: 'Reports',
    //     icon: 'fa fa-file-lines',
    //     path: '/folders/reports'
    //   },
    //   // { name: 'Templates',
    //   //   icon: 'fa fa-gear',
    //   //   path: '/folders/templates'
    //   // }
    // ],
    exact: true,
    auth: true,
    mainNav: false,
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
  },
  { name:'Routes',
    icon: 'fa fa-road',
    path: "/folders/routes",
    exact: true,
    auth: true,
    mainNav: true,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    component: withAuth(Folders)
  },
  { name:'Reports',
    icon: 'fa fa-file-alt',
    path: "/folders/reports",
    exact: true,
    auth: true,
    mainNav: true,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    component: withAuth(Folders)
  }
]

export default config;
