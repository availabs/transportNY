import React from 'react';

import get from "lodash/get"
import { Link } from "react-router-dom"
import { range as d3range } from "d3-array"

import {
  Button,
  withAuth,
  useFalcor
} from "~/modules/avl-components/src"

import { Modal, FuseWrapper } from "~/sites/npmrds/components"

import FolderIcon from "./components/FolderIcon"
import {
  Stuff,
  ThumbnailContainer,
  ThumbnailPlaceholder,
  getStuffSorter
} from "./components/Stuff"

import FocusAnalysis from "./FocusAnalysis.config"

const Title = ({ children }) => {
  return (
    <div className="mb-2 text-2xl font-bold text-gray-800 border-current">
      { children }
    </div>
  )
}

const Section = ({ title, children }) => {
  return (
    <div className="pb-6">
      <div className="text-xl font-bold w-3/4  border-current">
        { title }
      </div>
      <div className="">
        { children }
      </div>
    </div>
  )
}

const TemplateSelector = ({ id, title, onClick, children }) => {
  const doOnClick = React.useCallback(e => {
    onClick({ templateId: id, templateTitle: title });
  }, [id, title, onClick]);
  return (
    <div onClick={ doOnClick }
      className="cursor-pointer"
    >
      <span className="fad fa-file-invoice text-lime-500 text-sm mr-1"/>
      <span>{title[1]}</span>
    </div>
  )
}
const ReportLink = ({ id, name }) => {
  return (
    <Link to={ `/report/edit/${ id }`}>
      <div className=''>
        <span className="fad fa-file-chart-line text-blue-500 text-sm mr-1"/>
        { name }
        <span className="fa fa-up-right-from-square ml-1"/>
      </div>
    </Link>
  )
}

const NoData = { templateId: null }

const Home = () => {
  const [templateData, setTemplateData] = React.useState(NoData);
  const close = React.useCallback(e => {
    e.stopPropagation();
    setTemplateData(NoData);
  }, []);

  const { falcor, falcorCache } = useFalcor();

  const [recent, setRecent] = React.useState([]);

  React.useEffect(() => {
    falcor.get([
      "reports2", "user", "recent", [0, 1, 2, 3, 4],
      ["name", "description", "updated_at", "stuff_type", "id"]
    ])
  }, [falcor]);
  React.useEffect(() => {
    const recent = [];
    for (let i = 0; i < 5; ++i) {
      const ref = get(falcorCache, ["reports2", "user", "recent", i, "value"]);
      const stuff = get(falcorCache, ref);
      if (stuff) {
        recent.push(stuff);
      }
    }
    setRecent(recent);
  }, [falcorCache]);

  return (
    <div className="max-w-6xl mx-auto my-8">
      <div className="grid grid-cols-2 gap-4 bg-white p-10">

        <div>
          <Title>
            Focus Analysis
          </Title>
          { FocusAnalysis.map(({ title, Templates }) => {
              return (
                <Section key={ title } title={ title }>
                  { Templates.map((t,i) => {
                      return (
                        <TemplateSelector key={ t.title }
                          onClick={ setTemplateData }
                          title={ [title, t.title] }
                          id={ t.id }
                        >
                          { t.title }
                          <div className="text-sm italic ml-2">
                            { t.description }
                          </div>
                        </TemplateSelector>
                      )
                    })
                  }
                </Section>
              )
            })
          }
          <Section title="Custom Reports">
            <Link to="/report/new">
              <div>
                <span className="fad fa-file-chart-line text-blue-500 text-sm mr-1"/>
                New Report<span className="fa fa-up-right-from-square ml-1"/>
              </div>
            </Link>
            { recent.map(r => {
                return r.stuff_type === "report" ?
                  <ReportLink key={ r.id } { ...r }/> :
                  <TemplateSelector key={ r.id }
                    onClick={ setTemplateData }
                    title={ ["Custom Reports", r.name] }
                    id={ r.id }
                  >
                    { r.name }
                  </TemplateSelector>
              })
            }
          </Section>
        </div>

        <div className="flex flex-col">
          <Title>
            Regional Analysis
          </Title>
          <Section title="Reliability">
            <div>Car</div>
            <div>Truck</div>
          </Section>
          <Section title="Congestion">
            <div>Total</div>
            <div>Peak Hour</div>
            <div>Recurrent / Non-Recurrent</div>
          </Section>
          <Section title="PM3"/>
          <Section title="TSMO"/>
        </div>

        <TemplateModal close={ close }
          { ...templateData }/>

      </div>
    </div>
  )
}

const PathItem = ({ openPath, setOpenedFolders, name }) => {
  const open = React.useCallback(e => {
    e.stopPropagation();
    setOpenedFolders(openPath.map(f => f.id));
  }, [openPath, setOpenedFolders]);
  return (
    <div onClick={ open } className="cursor-pointer">
      { name }<span>&nbsp;/</span>
    </div>
  )
}
const FolderPath = ({ OpenedFolders, setOpenedFolders }) => {
  return (
    <div className="text-2xl font-medium flex relative">
      <div className="flex-1 flex items-end">
        { OpenedFolders.map((f, i) => (
            <div key={ f.id }>
              <PathItem name={ f.name }
                openPath={ OpenedFolders.slice(0, i + 1) }
                setOpenedFolders={ setOpenedFolders }
              />
            </div>
          ))
        }
      </div>
    </div>
  )
}

const FolderSelector = ({ Folder, folders, foldersByType, OpenedFolders, setOpenedFolders }) => {

  const [show, setShow] = React.useState(false);
  const onMouseEnter = React.useCallback(e => {
    setShow(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    setShow(false);
  }, []);

  const openFolder = React.useCallback((e, fid) => {
    setShow(false);
    setOpenedFolders([fid]);
  }, [setOpenedFolders])

  return (
    <div>
      <div className="flex relative border-b border-current"
        onMouseEnter={ onMouseEnter }
        onMouseLeave={ onMouseLeave }
      >
        <FolderIcon { ...Folder } size={ 1.75 }/>
        <div className="text-xl ml-1">
          <FolderPath OpenedFolders={ OpenedFolders }
            setOpenedFolders={ setOpenedFolders }/>
        </div>
        { !show ? null :
          <div className={ `
              absolute p-2 bg-gray-200 z-10 grid grid-cols-2 gap-2
              w-screen max-w-4xl
            ` }
            style={ { top: "100%" } }
          >
            <div>
              { foldersByType.slice(0, 2).map(({ type, folders }) => (
                  <div key={ type }>
                    <div className="font-medium border-b border-current px-2 mt-1">
                      { type }
                    </div>
                    { folders.map(f => (
                        <div key={ f.id }
                          onClick={ e => openFolder(e, f.id) }
                          className={ `
                            whitespace-nowrap px-2 py-1 flex
                            ${ f.id === Folder.id ?
                              "bg-gray-400 cursor-not-allowed" : "hover:bg-gray-300 cursor-pointer"
                            }
                          ` }
                        >
                          <div className="mr-1">
                            <FolderIcon { ...f } size={ 1.125 }/>
                          </div>
                          { f.name }
                        </div>
                      ))
                    }
                  </div>
                ))
              }
            </div>

            <div>
              { foldersByType.slice(2).map(({ type, folders }) => (
                  <div key={ type }>
                    <div className="font-medium border-b border-current px-2 mt-1">
                      { type }
                    </div>
                    { folders.map(f => (
                        <div key={ f.id }
                          onClick={ e => openFolder(e, f.id) }
                          className={ `
                            whitespace-nowrap px-2 py-1 flex
                            ${ f.id === Folder.id ?
                              "bg-gray-400 cursor-not-allowed" : "hover:bg-gray-300 cursor-pointer"
                            }
                          ` }
                        >
                          <div className="mr-1">
                            <FolderIcon { ...f } size={ 1.125 }/>
                          </div>
                          { f.name }
                        </div>
                      ))
                    }
                  </div>
                ))
              }
            </div>
          </div>
        }
      </div>
      <div>
        { folders.map(f => {
            return (
              <Stuff key={ f.id } { ...f }
                openedFolders={ OpenedFolders }
                setOpenedFolders={ setOpenedFolders }
              />
            )
          })
        }
      </div>
    </div>
  )
}

const DefaultFoldersByType = [
  { type: "User Folders", folders: [] },
  { type: "Group Folders", folders: [] },
  { type: "AVAIL Folders", folders: [] }
]

const getDefaultFoldersByType = () => ([
  { type: "User Folders", folders: [] },
  { type: "Group Folders", folders: [] },
  { type: "Default Folders", folders: [] }
])

const TemplateLoader = ({ id, title }) => {

  const { falcor, falcorCache } = useFalcor();

  const [template, setTemplate] = React.useState(null);

  React.useEffect(() => {
    if (id === null) return;
    falcor.get([
      "templates2", "id", id,
      ["name", "routes", "updated_at",
        "description", "thumbnail", "id"
      ]
    ])
  }, [falcor, id]);

  React.useEffect(() => {
    if (id === null) {
      setTemplate(null);
    }
    else {
      const template = get(falcorCache, ["templates2", "id", id]);
      if (template) {
        setTemplate(template);
      }
    }
  }, [falcorCache, id]);

  const [folders, setFolders] = React.useState([]);
  const [foldersByType, setFoldersByType] = React.useState(DefaultFoldersByType);

  const [openedFolders, setOpenedFolders] = React.useState([]);
  const OpenedFolders = React.useMemo(() => {
    return openedFolders.map(fid => get(falcorCache, ["folders2", "id", fid]));
  }, [falcorCache, openedFolders]);

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

    const foldersByType = folders.reduce((a, c) => {
      if (c.type === "user") {
        a[0].folders.push(c);
      }
      else if (c.type === "group") {
        a[1].folders.push(c);
      }
      else if (c.type === "AVAIL") {
        a[2].folders.push(c);
      }
      return a;
    }, getDefaultFoldersByType());
    setFoldersByType(foldersByType);
  }, [falcorCache]);

  React.useEffect(() => {
    if (!folders.length) return;
    falcor.get(["folders2", "stuff", folders.map(f => f.id)]);
  }, [falcor, folders]);

  const [stuff, setStuff] = React.useState([]);

  const Folder = React.useMemo(() => {
    return OpenedFolders[OpenedFolders.length - 1];
  }, [OpenedFolders]);

  React.useEffect(() => {
    if (!Folder) return;

    const stuff = get(falcorCache, ["folders2", "stuff", Folder.id, "value"], []);
    const [folders, routes] = stuff.reduce((a, c) => {
      if (c.stuff_type === "folder") {
        a[0].push(c.stuff_id);
      }
      if (c.stuff_type === "route") {
        a[1].push(c.stuff_id);
      }
      return a;
    }, [[], []]);

    const requests = [];
    if (folders.length) {
      requests.push(["folders2", "id", folders, ["name", "description", "updated_at", "id"]]);
    }
    if (routes.length) {
      requests.push(["routes2", "id", routes, ["name", "description", "updated_at", "id"]]);
    }
    if (requests.length) {
      falcor.get(...requests);
    }
  }, [falcor, falcorCache, Folder]);

  React.useEffect(() => {
    if (!Folder) {
      setStuff([]);
      return;
    }
    const stuff = get(falcorCache, ["folders2", "stuff", Folder.id, "value"], [])
      .filter(s => ["folder", "route"].includes(s.stuff_type))
      .map(s => {
        if (s.stuff_type === "folder") {
          return({
            ...get(falcorCache, ["folders2", "id", s.stuff_id], {}),
            id: s.stuff_id,
            type: "folder"
          });
        }
        if (s.stuff_type === "route") {
          return({
            ...get(falcorCache, ["routes2", "id", s.stuff_id], {}),
            id: s.stuff_id,
            type: "route"
          });
        }
      })
      .sort(getStuffSorter(Folder));
    setStuff(stuff);
  }, [falcorCache, Folder]);

  React.useEffect(() => {
    if (folders.length && !openedFolders.length) {
      setOpenedFolders([folders.filter(f => f.type === "user")[0].id]);
    }
  }, [folders, openedFolders]);

  const [selectedRoutes, setSelectedRoutes] = React.useState([]);
  const addRoute = React.useCallback(rt => {
    setSelectedRoutes(prev => [...prev, rt]);
  }, []);
  const removeRoute = React.useCallback(rt => {
    setSelectedRoutes(prev => prev.filter(r => r.id !== rt.id));
  }, []);

  React.useEffect(() => {
    if (!id && selectedRoutes.length) {
      setSelectedRoutes([]);
    }
  }, [id, selectedRoutes]);

  const totalRoutes = get(template, "routes", 0);
  const remaining = totalRoutes - selectedRoutes.length;

  const URL = React.useMemo(() => {
    if (totalRoutes > selectedRoutes.length) {
      return null;
    }
    if (!template) {
      return null;
    }
    const routeId = selectedRoutes.map(r => r.id).join("_");

    return `/template/edit/${ template.id }/route/${ routeId }`;

  }, [template, totalRoutes, selectedRoutes]);

  const routes = React.useMemo(() => {
    const routes = stuff.filter(s => s.type === "route")
      .filter(r => !selectedRoutes.reduce((a, c) => {
        return a || (r.id === c.id);
      }, false));
    return routes;
  }, [Folder, stuff, selectedRoutes]);

  const [search, setSearch] = React.useState("");
  const onChange = React.useCallback(e => {
    setSearch(e.target.value);
  }, []);

  const getRouteName = React.useCallback(r => {
    return r.name;
  }, []);

  const fuse = React.useMemo(() => {
    return FuseWrapper(
      routes,
      { keys: [{ name: "label", getFn: getRouteName }],
        threshold: 0.25
      }
    );
  }, [routes, getRouteName]);

  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="font-bold border-b-2 border-current">
        <div className="text-3xl inline-block mr-1">
          { title[0] }:
        </div>
        <div className="text-2xl inline-block">
          { title[1] }
        </div>
      </div>
      { !template ? null :
        <>
          <div className="flex items-center">
            <ThumbnailContainer>
              { !get(template, "thumbnail") ?
                  <ThumbnailPlaceholder /> :
                  <img src={ get(template, "thumbnail") }/>
              }
            </ThumbnailContainer>
            <div className="ml-1">
              <div>
                { get(template, "name") }
              </div>
              <div className="text-sm">
                { get(template, "description") }
              </div>
              <div className="text-sm italic">
                last updated: { new Date(get(template, "updated_at")).toLocaleString() }
              </div>
            </div>
          </div>

          { !selectedRoutes.length ? null :
            <>
              <div className="border-b border-current w-3/4 text-lg font-bold">
                Selected Route{ selectedRoutes.length > 1 ? "s" : "" }
              </div>
              <div className="w-3/4">
                { selectedRoutes.map(r => {
                    return (
                      <div key={ r.id }
                        onClick={ e => removeRoute(r) }
                        className="cursor-pointer"
                      >
                        <Stuff { ...r }/>
                      </div>
                    )
                  })
                }
              </div>
            </>
          }

          { !remaining ? null :
            <div className="w-3/4 cursor-pointer">
              <FolderSelector Folder={ Folder }
                OpenedFolders={ OpenedFolders }
                setOpenedFolders={ setOpenedFolders }
                foldersByType={ foldersByType }
                folders={ stuff.filter(s => s.type === "folder") }/>
            </div>
          }

          { !remaining ? null :
            !routes.length ?
            <div className="w-3/4 text-lg font-bold">
              No Routes in Selected Folder
            </div> :
            <>
              <div className="border-b border-current w-3/4 text-lg font-bold">
                Select { remaining } Route{ remaining > 1 ? "s" : "" }
              </div>
              <div>
                <input type="text" className="w-3/4 px-2 py-1 rounded"
                  value={ search }
                  onChange={ onChange }
                  placeholder="search for a route..."/>
              </div>
              <div className="w-3/4 max-h-96 overflow-auto">
                { fuse(search).map(r => {
                    return (
                      <div key={ r.id }
                        onClick={ e => addRoute(r) }
                        className="cursor-pointer"
                      >
                        <Stuff { ...r }/>
                      </div>
                    )
                  })
                }
              </div>
            </>
          }

          { !URL ? null :
            <>
              <div className="border-b-2 border-current"/>
              <div className="text-2xl text-center font-bold">
                <Link to={ URL }>
                  <span className="fa fa-arrow-right mr-2"/>
                  Click Here to Open Report
                  <span className="fa fa-arrow-left ml-2"/>
                </Link>
              </div>
            </>
          }
        </>
      }

    </div>
  )
}

const TemplateModal = ({ templateId, templateTitle = [], close }) => {
  return (
    <Modal close={ close }
      isOpen={ templateId !== null }
    >
      <div className="w-screen max-w-4xl">
        <TemplateLoader id={ templateId }
          title={ templateTitle }/>
      </div>
    </Modal>
  )
}

const config = {
  name:'Home',
  icon: 'fa fa-home',
  path: "/",
  exact: true,
  auth: true,
  mainNav: true,
  sideNav: {
    color: 'dark',
    size: 'compact'
  },
  component: Home
}

export default config;
