import React from "react"

import get from "lodash.get"
import { useParams} from "react-router-dom"

import {
  useFalcor,
} from "modules/avl-components/src"

import FolderIcon from "./components/FolderIcon"
import StuffInFolder from "./components/StuffInFolder"

const MyStuff = props => {
  const { falcor, falcorCache } = useFalcor();

  const [folders, setFolders] = React.useState([]);
  const [openedFolders, setOpenedFolders] = React.useState([]);

  React.useEffect(() => {
    falcor.get(["folders2", "for", "user"]);
  }, [falcor]);

  React.useEffect(() => {
    const folders = get(falcorCache, ["folders2", "for", "user", "value"], []);
    folders.sort((a, b) => {
      if (a.type === b.type) {
        const aDate = new Date(a.updated_at);
        const bDate = new Date(b.updated_at);
        return bDate.getTime() - aDate.getTime();
      }
      return (a.type === "user") ? -1 : 1;
    })
    setFolders(folders);
    if (!openedFolders.length) {
      setOpenedFolders(folders.slice(0, 1));
    }
  }, [falcorCache,openedFolders.length]);

  const params = useParams();

  const [filter, setFilter] = React.useState(null)
  React.useEffect(() => {
    if (params.stuff) {
      setFilter(params.stuff);
    }
  }, [params]);

  return (
    <div className="max-w-6xl mx-auto my-8">
      <div className="flex border-b-4 border-current mb-2 pb-1">
        { folders.map(f => (
            <FolderIcon key={ f.id } size={ 10 } { ...f }
              onClick={ e => setOpenedFolders([f]) }
              className="cursor-pointer mr-1"
              opened={ +f.id === +get(openedFolders, [openedFolders.length - 1, "id"]) }/>
          ))
        }
      </div>
      { !openedFolders.length ? null :
        <StuffInFolder
          openedFolders={ openedFolders }
          setOpenedFolders={ setOpenedFolders }
          filter={ filter }/>
      }
    </div>
  )
}

const config = [
  { name:'MyStuff',
    path: "/mystuff?",
    exact: true,
    auth: true,
    mainNav: true,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    component: MyStuff
  },
  { name:'Routes',
    path: "/mystuff/routes",
    exact: true,
    auth: true,
    mainNav: true,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    component: MyStuff
  },
  { name:'Reports',
    path: "/mystuff/reports",
    exact: true,
    auth: true,
    mainNav: true,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    component: MyStuff
  },
  { name:'Templates',
    path: "/mystuff/templates",
    exact: true,
    auth: true,
    mainNav: true,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    component: MyStuff
  }
]

export default config;
