import React from "react"

import get from "lodash/get"
import { range as d3range } from "d3-array"
import { Link } from "react-router-dom"

import {
  useFalcor,
  ScalableLoading
} from "~/modules/avl-components/src"

import ConfirmModal from "./ConfirmModal"
import StuffDropdown from "./StuffDropdown"
import FolderIcon from "./FolderIcon"
import FolderModal from "./FolderModal"
import StuffInfoModal from "./StuffInfoModal"
import { Modal, MultiLevelDropdown, FuseWrapper } from "~/sites/npmrds/components"

const Folder = ({ id, openedFolders, setOpenedFolders, forFolder, ...props }) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get([
      "folders2", "id", id,
      ["name", "icon", "color", "id",
        "updated_at", "created_at",
        "type", "owner", "editable"
      ]
    ])
  }, [falcor, id]);

  const [folder, setFolder] = React.useState({});
  React.useEffect(() => {
    setFolder(get(falcorCache, ["folders2", "id", id], {}));
  }, [falcorCache, id]);

  const openFolder = React.useCallback(e => {
    e.stopPropagation();
    setOpenedFolders([...openedFolders.map(f => f.id), folder.id]);
  }, [openedFolders, setOpenedFolders, folder]);

  const [open, setOpen] = React.useState(false);
  const openModal = React.useCallback(e => {
    e.stopPropagation();
    setOpen(true);
  }, []);
  const closeModal = React.useCallback(e => {
    e.stopPropagation();
    setOpen(false);
  }, []);

  const folderItems = React.useMemo(() => {
    return [
      { item: (
          <ListItem onClick={ openModal }>
            <span className="fa fa-pen-to-square mr-1"/>Edit
          </ListItem>
        )
      }
    ]
  }, [openModal])

  const Container = forFolder ? FolderStuffContainer : StuffContainer;

  return (
    <div onClick={ openFolder }>
      <Container { ...props } { ...folder } id={ id } type="folder"
        items={ folderItems }
      >
        <div className="mr-1 inline-block">
          <FolderIcon size={ 1.25 }
            icon={ get(folder, "icon", "") }
            color={ get(folder, "color", "#000") }/>
        </div>
        <span className="pt-1">
          { get(folder, "name", "loading...") }
        </span>
      </Container>
      { !forFolder ? null :
        <FolderModal folder={ folder }
          isOpen={ open }
          close={ closeModal }/>
      }
    </div>
  )
}
const Route = ({ id, forFolder, ...props }) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get(["routes2", "id", id, ["name", "description", "updated_at", "id"]]);
  }, [falcor, id]);

  const [route, setRoute] = React.useState({});
  React.useEffect(() => {
    setRoute(get(falcorCache, ["routes2", "id", id], {}));
  }, [falcorCache, id]);

  const RouteItems = React.useMemo(() => {
    if (!forFolder) return null;
    return [
      { Item: (
          () => (
            <Link to={ `/report/new/route/${ id }` }>
              <ListItem>
                <span className="fa fa-eye mr-1"/>Open in Report
              </ListItem>
            </Link>
          )
        )
      },
      { Item: (
          () => (
            <Link to={ `/route/creation/${ id }` }>
              <ListItem>
                <span className="fa fa-pen-to-square mr-1"/>Edit
              </ListItem>
            </Link>
          )
        )
      }
    ]
  }, [forFolder, id]);

  const Container = forFolder ? FolderStuffContainer : StuffContainer;

  return (
    <Container { ...props } { ...route } id={ id } type="route"
      items={ RouteItems }
    >
      <span className="fad fa-road text-slate-500 text-sm px-2"/>
      <span className="pt-1">
        { get(route, "name", "loading...") }
      </span>
    </Container>
  )
}

const Report = ({ id, forFolder, ...props }) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get([
      "reports2", "id", id,
      ["name", "description", "thumbnail", "updated_at", "id"]
    ]);
  }, [falcor, id]);

  const [report, setReport] = React.useState({});
  React.useEffect(() => {
    setReport(get(falcorCache, ["reports2", "id", id], {}));
  }, [falcorCache, id]);

  const ReportItems = React.useMemo(() => {
    return [
      { Item: (
          () => (
            <Link to={ `/report/view/${ id }` }>
              <ListItem>
                <span className="fa fa-eye mr-1"/>View
              </ListItem>
            </Link>
          )
        )
      },
      { Item: (
          () => (
            <Link to={ `/report/edit/${ id }` }>
              <ListItem>
                <span className="fa fa-pen-to-square mr-1"/>Edit
              </ListItem>
            </Link>
          )
        )
      }
    ]
  }, [id]);

  const Container = forFolder ? FolderStuffContainer : StuffContainer;

  return (
    <Container { ...props } { ...report } id={ id } type="report"
      items={ ReportItems } showThumbnail
    >
      <span className="fad fa-file-chart-line text-blue-500 text-sm px-2"/>
      <span className="pt-1">
        { get(report, "name", "loading...") }
      </span>
    </Container>
  )
}

const Template = ({ id, forFolder = false, ...props }) => {

  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get(
      ["templates2", "id", id,
        ["name", "description", "thumbnail", "updated_at", "routes", "stations", "id"]
      ]
    );
  }, [falcor, id]);

  const [template, setTemplate] = React.useState({});
  React.useEffect(() => {
    setTemplate(get(falcorCache, ["templates2", "id", id], {}));
  }, [falcorCache, id]);

  const [show, setShow] = React.useState("hide");
  const showViewModal = React.useCallback(() => {
    setShow("view");
  }, []);
  const showEditModal = React.useCallback(() => {
    setShow("edit");
  }, []);
  const hideModal = React.useCallback(() => {
    setShow("hide");
  }, []);

  const TemplateItems = React.useMemo(() => {
    return [
      { Item: (
          () => (
            <div onClick={ showViewModal }>
              <ListItem>
                <span className="fa fa-eye mr-1"/>View
              </ListItem>
            </div>
          )
        )
      },
      { Item: (
          () => (
            <div onClick={ showEditModal }>
              <ListItem>
                <span className="fa fa-pen-to-square mr-1"/>Edit
              </ListItem>
            </div>
          )
        )
      }
    ]
  }, [showViewModal, showEditModal]);

  const Container = forFolder ? FolderStuffContainer : StuffContainer;

  return (
    <Container { ...props } { ...template } id={ id } type="template"
      items={ TemplateItems } showThumbnail
    >
      <span className="fad fa-file-invoice text-lime-500 text-sm px-2"/>
      <span className="pt-1">
        { get(template, "name", "loading...") }
      </span>

      { !forFolder ? null :
        <RouteSelectModal { ...props }
          isOpen={ show !== "hide" }
          close={ hideModal }
          template={ template }
          action={ show }/>
      }
    </Container>
  )
}

const RouteSelectModal = ({ folders, template, action, ...props }) => {

  const { falcor, falcorCache } = useFalcor();

  const [stations, setStations] = React.useState([]);

  React.useEffect(() => {
    falcor.get(['hds', 'continuous', 'stations', 'length'])
      .then(res => {
        const length = get(res, ['json', 'hds', 'continuous', 'stations', 'length'], 0);
        if (length) {
          return falcor.get(
            ['hds', 'continuous', 'stations', 'byIndex', { from: 0, to: length - 1 },
              ['stationId', 'muni', 'data_type']
            ]
          )
        }
      });
  }, [falcor]);

  React.useEffect(() => {
    const length = get(falcorCache, ['hds', 'continuous', 'stations', 'length'], 0);
    const refs = d3range(length).reduce((a, c) => {
      const ref = get(falcorCache,
        ['hds', 'continuous', 'stations', 'byIndex', c, "value"],
      )
      if (ref) {
        a.push(ref);
      }
      return a;
    }, []);
    const stations = refs.reduce((a, c) => {
      const st = get(falcorCache, c, null);
      if (st) {
        a.push({
          ...st,
          name: `${ st.stationId } (${ st.muni }) (${ st.data_type.split(",").map(dt => dt[0]).join(", ") })`
        });
      }
      return a;
    }, []);
    setStations(stations.sort((a, b) => a.muni.localeCompare(b.muni)));
  }, [falcorCache]);

  const numRoutes = get(template, "routes", 0);
  const numStations = get(template, "stations", 0);

  const [selectedRoutes, setSelectedRoutes] = React.useState([]);
  const addRoute = React.useCallback(rt => {
    setSelectedRoutes(prev => [...prev, rt]);
  }, []);
  const removeRoute = React.useCallback(rt => {
    setSelectedRoutes(prev => {
      return prev.filter(p => p.id !== rt.id);
    });
  }, []);

  const [selectedStations, setSelectedStations] = React.useState([]);
  const addStation = React.useCallback(st => {
    setSelectedStations(prev => [...prev, st]);
  }, []);
  const removeStation = React.useCallback(st => {
    setSelectedStations(prev => {
      return prev.filter(p => p.stationId !== st.stationId);
    });
  }, []);

  const remainingRoutes = numRoutes - selectedRoutes.length;
  const remainingStations = numStations - selectedStations.length;

  const URL = React.useMemo(() => {
    if ((numRoutes > selectedRoutes.length) || (numStations > selectedStations.length)) {
      return null;
    }
    const routeId = selectedRoutes.map(r => r.id).join("_");
    const stationId = selectedStations.map(r => r.stationId).join("_");

    if (numRoutes && numStations) {
      return `/template/${ action }/${ template.id }/route/${ routeId }/station/${ stationId }`
    }
    if (numRoutes) {
      return `/template/${ action }/${ template.id }/route/${ routeId }`
    }
    if (numStations) {
      return `/template/${ action }/${ template.id }/station/${ stationId }`
    }
  }, [template, action, numRoutes, selectedRoutes, numStations, selectedStations])

  const stationList = React.useMemo(() => {
    return stations.filter(st => {
      return selectedStations.reduce((a, c) => {
        return a && (st.stationId !== c.stationId);
      }, true);
    });
  }, [stations, selectedStations]);

  return (
    <Modal { ...props }>
      <div className="w-screen max-w-lg">

        <div className="font-bold text-2xl border-b-2 border-current">
          { template.name }
        </div>

{ /* ROUTE SELECTOR */ }
        { !numRoutes ? null :
          <div className="mt-4">
            { !selectedRoutes.length ? null :
              <div>
                <div className="text-lg font-bold border-b border-current">
                  Selected Routes
                </div>
                <div>
                  { selectedRoutes.map(rt => {
                      return (
                        <div key={ rt.id } className="flex">
                          <div className="flex-1">{ rt.name }</div>
                          <div onClick={ e => removeRoute(rt) }
                            className="px-2 rounded hover:bg-gray-300 cursor-pointer"
                          >
                            <span className="fa fa-close"/>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            }

            { !remainingRoutes ? null :
              <div className="mt-2">
                <RouteSelector onClick={ addRoute }
                  selectedRoutes={ selectedRoutes }
                >
                  Select { remainingRoutes } Route{ remainingRoutes > 1 ? "s" : "" }
                </RouteSelector>
              </div>
            }
          </div>
        }

{ /* STATION SELECTOR */ }
        { !numStations ? null :
          <div className="mt-4">
            { !selectedStations.length ? null :
              <div>
                <div className="text-lg font-bold border-b border-current">
                  Selected Stations
                </div>
                <div>
                  { selectedStations.map(st => {
                      return (
                        <div key={ st.stationId } className="flex">
                          <div className="flex-1">{ st.name }</div>
                          <div onClick={ e => removeStation(st) }
                            className="px-2 rounded hover:bg-gray-300 cursor-pointer"
                          >
                            <span className="fa fa-close"/>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            }

            { !remainingStations ? null :
              <div className="mt-2">
                <MultiLevelDropdown items={ stationList }
                  labelAccessor={ s => s.name }
                  valueAccessor={ v => v }
                  onClick={ addStation }
                  searchable={ true }
                >
                  <div className="text-lg font-bold px-2 border rounded">
                    Select { remainingStations } Station{ remainingStations > 1 ? "s" : "" }
                  </div>
                </MultiLevelDropdown>
              </div>
            }

          </div>
        }

        { !URL ? null :
          <div className="mt-4">
            <div className="text-lg font-bold border-b border-current">
              URL
            </div>
            <div>
              <Link to={ URL }>
                { URL }
              </Link>
            </div>
          </div>
        }
      </div>
    </Modal>
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

const FolderStuff = ({ type, ...props }) => {
  return (
    type === "folder" ? <Folder { ...props } forFolder={ true }/> :
    type === "route" ? <Route { ...props } forFolder={ true }/> :
    type === "report" ? <Report { ...props } forFolder={ true }/> :
    type === "template" ? <Template { ...props } forFolder={ true }/> : null
  )
}

const StuffOrder = {
  folder: 0,
  report: 1,
  template: 1,
  route: 2
}

const getStuffSorter = ({ type }) => {
  if (type === "AVAIL") {
    return (a, b) => {
      if (a.stuff_type === b.stuff_type) {
        return get(a, "name", "").localeCompare(get(b, "name", ""));
      }
      return StuffOrder[a.stuff_type] - StuffOrder[b.stuff_type];
    }
  }
  return (a, b) => {
    const aOrder = StuffOrder[a.stuff_type];
    const bOrder = StuffOrder[b.stuff_type];
    if (aOrder === bOrder) {
      const aDate = new Date(a.updated_at);
      const bDate = new Date(b.updated_at);
      return bDate - aDate;
    }
    return aOrder - bOrder;
  }
}

export { Stuff, FolderStuff, getStuffSorter }

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

const RouteSelector = ({ onClick, selectedRoutes, children }) => {
  const { falcor, falcorCache } = useFalcor();

  const [folders, setFolders] = React.useState([]);
  const [foldersByType, setFoldersByType] = React.useState(DefaultFoldersByType);

  const [openedFolders, setOpenedFolders] = React.useState([]);
  const OpenedFolders = React.useMemo(() => {
    return openedFolders.map(fid => get(falcorCache, ["folders2", "id", fid]));
  }, [falcorCache, openedFolders]);

  const Folder = React.useMemo(() => {
    return OpenedFolders[OpenedFolders.length - 1];
  }, [OpenedFolders]);

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

  const [search, setSearch] = React.useState("");
  const onChange = React.useCallback(e => {
    setSearch(e.target.value);
  }, []);

  const getRouteName = React.useCallback(r => {
    return r.name;
  }, []);

  const routes = React.useMemo(() => {
    return stuff.filter(({ type }) => type === "route")
        .filter(({ id }) => selectedRoutes.reduce((a, c) => {
          return a && (+c.id !== +id);
        }, true))
  }, [stuff, selectedRoutes]);

  const fuse = React.useMemo(() => {
    return FuseWrapper(
      routes,
      { keys: [{ name: "label", getFn: getRouteName }],
        threshold: 0.25
      }
    );
  }, [routes, getRouteName]);

  React.useEffect(() => {
    if (folders.length && !openedFolders.length) {
      setOpenedFolders([folders.filter(f => f.type === "user")[0].id]);
    }
  }, [folders, openedFolders]);

  return (
    <div>
      <FolderSelector
        folder={ OpenedFolders[0] }
        openedFolders={ OpenedFolders }
        foldersByType={ foldersByType }
        setOpenedFolders={ setOpenedFolders }/>

      <div>
        { stuff.filter(({ type }) => type === "folder")
            .map(s => {
              return (
                <div key={ `${ s.type }-${ s.id }` }
                  className="cursor-pointer hover:bg-gray-200"
                >
                  <Stuff { ...s }
                    openedFolders={ OpenedFolders }
                    setOpenedFolders={ setOpenedFolders }/>
                </div>
              )
            })
        }
      </div>
      <div className="overflow-auto"
        style={ { maxHeight: "20rem" } }
      >
        <div className="pt-2 font-bold border-b border-current mb-2">
          { children }
        </div>
        <div>
          <input type="text" className="w-full px-2 py-1 rounded"
            value={ search }
            onChange={ onChange }
            placeholder="search for a route..."/>
        </div>
        { fuse(search).map(s => {
            return (
              <div key={ `${ s.type }-${ s.id }` }
                onClick={ e => onClick(s) }
                className="cursor-pointer hover:bg-gray-200"
              >
                <Stuff { ...s }/>
              </div>
            )
          })
        }
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
const FolderPath = ({ openedFolders, setOpenedFolders }) => {
  return (
    <div className="text-2xl font-medium flex relative">
      <div className="flex-1 flex items-end">
        { openedFolders.map((f, i) => (
            <div key={ f.id }>
              <PathItem name={ f.name }
                openPath={ openedFolders.slice(0, i + 1) }
                setOpenedFolders={ setOpenedFolders }
              />
            </div>
          ))
        }
      </div>
    </div>
  )
}
const FolderSelector = ({ folder = {}, openedFolders, setOpenedFolders, foldersByType }) => {

  const [show, setShow] = React.useState(false);
  const showSelector = React.useCallback(e => {
    setShow(true);
  }, []);
  const hideSelector = React.useCallback(e => {
    setShow(false);
  }, []);

  const openFolder = React.useCallback((e, fid) => {
    e.stopPropagation();
    if (fid !== folder.id) {
      setOpenedFolders([fid]);
      setShow(false);
    }
  }, [setOpenedFolders, folder]);

  return (
    <div className="relative"
      onMouseLeave={ hideSelector }
    >
      <div className="border-b border-current mb-2">
        <div className="whitespace-nowrap flex items-end cursor-pointer"
          onMouseOver={ showSelector }
        >
          <div className="mr-1">
            <FolderIcon { ...folder } size={ 1.75 }/>
          </div>
          <div className="text-xl">
            <FolderPath openedFolders={ openedFolders }
              setOpenedFolders={ setOpenedFolders }/>
          </div>
        </div>
      </div>

{ /* FOLDER SELECTOR */ }
      <div style={ { top: "100%" } }
        className={ `
          absolute left-0 text-base bg-gray-50 font-normal
          ${ show ? "block" : "hidden" }
          grid grid-cols-2 gap-1 shadow-lg w-screen max-w-4xl z-50
        ` }
      >

        <div>
          { foldersByType.slice(0, 2).map(({ type, folders }) => (
              <div key={ type }>
                <div className="font-medium border-b border-gray-100 px-2 mt-1">
                  { type }
                </div>
                { folders.map(f => (
                    <div key={ f.id }
                      onClick={ e => openFolder(e, f.id) }
                      className={ `
                        whitespace-nowrap px-2 py-1 hover:bg-blue-100 flex
                        ${ f.id === folder.id ?
                          "bg-blue-300 cursor-not-allowed" : "cursor-pointer"
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
                <div className="font-medium border-b border-gray-100 px-2 mt-1">
                  { type }
                </div>
                { folders.map(f => (
                    <div key={ f.id }
                      onClick={ e => openFolder(e, f.id) }
                      className={ `
                        whitespace-nowrap px-2 py-1 hover:bg-blue-100 flex
                        ${ f.id === folder.id ?
                          "bg-blue-300 cursor-not-allowed" : "cursor-pointer"
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
{ /* FOLDER SELECTOR */ }

    </div>
  )
}

const StuffContainer = ({ description, updated_at, children, ...rest }) => {
  return (
    <div className="flex items-center border-b px-1">
      <div className="flex-1">
        <div className="flex items-center font-bold">
          { children }
        </div>
        <div className="text-sm">
          { new Date(updated_at).toLocaleString() }
        </div>
        <div className="text-sm italic">
          { description }
        </div>
      </div>
    </div>
  )
}

export const ThumbnailPlaceholder = () => {
  return (
    <span className="fa fa-notdef text-2xl"/>
  )
}
export const ThumbnailContainer = ({ children }) => {
  return (
    <div className="flex items-center justify-center bg-gray-200"
      style={ {
        width: "50px", height: "50px",
        minWidth: "50px", minHeight: "50px"
      } }
    >
      { children }
    </div>
  )
}

const FolderStuffContainer = props => {
  const {
    description,
    parent,
    updated_at,
    id,
    type,
    name,
    selected,
    select,
    deselect,
    items = [],
    showThumbnail = false,
    thumbnail = null,
    children
  } = props;

  const onChecked = React.useCallback(e => {
    e.stopPropagation();
    const checked = e.target.checked;
    if (checked) {
      select({ type, id });
    }
    else {
      deselect({ type, id });
    }
  }, [id, type, select, deselect]);

  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);

  const [confirm, setConfirm] = React.useState({});
  const clearConfirm = React.useCallback(e => {
    e.stopPropagation();
    e.preventDefault();
    setConfirm({});
  }, []);

  const { falcor, falcorCache } = useFalcor();

  const [folders, setFolders] = React.useState([]);

  React.useEffect(() => {
    falcor.get(
        ["folders2", "user", "length"],
        ["folders2", "stuff", parent]
      )
      .then(res => {
        const requests = [];

        const length = get(res, ["json", "folders2", "user", "length"], 0);
        if (length) {
          requests.push([
            "folders2", "user", "index", d3range(length),
            ["name", "icon", "color", "id", "updated_at", "created_at", "type", "owner", "editable"]
          ])
        }
        const folders = get(res, ["json", "folders2", "stuff", parent], [])
          .filter(s => s.stuff_type === "folder")
          .map(s => s.stuff_id);
        if (folders.length) {
          requests.push([
            "folders2", "id", folders,
            ["name", "icon", "color", "id", "updated_at", "created_at", "type", "owner", "editable"]
          ])
        }
        if (requests.length) {
          return falcor.get(...requests);
        }
      })
  }, [falcor, parent]);

  React.useEffect(() => {
    const length = get(falcorCache, ["folders2", "user", "length"], 0);
    const refs = d3range(length).map(i => get(falcorCache, ["folders2", "user", "index", i, "value"]));
    const folders = refs.map(ref => get(falcorCache, ref, null))
      .filter(Boolean)
      .filter(f => f.id != parent)
      .filter(f => f.type !== "AVAIL");

    folders.sort((a, b) => {
      if (a.type === b.type) {
        const aDate = new Date(a.updated_at);
        const bDate = new Date(b.updated_at);
        return bDate.getTime() - aDate.getTime();
      }
      return (a.type === "user") ? -1 : 1;
    });

    const subFolders = get(falcorCache, ["folders2", "stuff", parent, "value"], [])
      .filter(s => s.stuff_type === "folder")
      .filter(s => type === "folder" ? s.stuff_id != id : true)
      .map(f => {
        return get(falcorCache, ["folders2", "id", f.stuff_id], null)
      }).filter(Boolean);

    setFolders([...folders, ...subFolders]);
  }, [falcorCache, parent, type, id]);

  const deleteStuff = React.useCallback(() => {
    switch (type) {
      case "folder":
        falcor.call(["folders2", "delete"], [id])
        break;
      case "route":
        falcor.call(["routes2", "delete"], [id])
        break;
      case "report":
        falcor.call(["reports2", "delete"], [id])
        break;
      case "template":
        falcor.call(["templates2", "delete"], [id])
        break;
    }
  }, [falcor, type, id]);

  const confirmDelete = React.useCallback(e => {
    e.stopPropagation();
    e.preventDefault();
    setConfirm({
      action: `delete this ${ type }`,
      onConfirm: () => { deleteStuff(); setConfirm({}); }
    });
  }, [deleteStuff, type]);

  const [loading, setLoading] = React.useState(false);

  const copyToFolder = React.useCallback((e, dst) => {
    setLoading(true);
    e.stopPropagation();
    falcor.call(["folders2", "copy"], [[{ id, type }], dst])
      .then(() => setLoading(false));
  }, [falcor, id, type]);

  const moveToFolder = React.useCallback((e, dst) => {
    e.stopPropagation();
    falcor.call(["folders2", "move"], [[{ id, type }], parent, dst]);
  }, [falcor, id, type]);

  const StuffItems = React.useMemo(() => {
    return [
      ...items,
      { Item: (
          () => (
            <ListItem>
              <span className="fa fa-copy mr-1"/>Copy to folder
            </ListItem>
          )
        ),
        children: (
          folders.map(f => ({
            Item: (
              () => (
                <ListItem key={ f.id } onClick={ e => copyToFolder(e, f.id) }>
                  <div className="flex items-center">
                    <div className="mr-1">
                      <FolderIcon size={ 1.25 }
                        icon={ get(f, "icon", "") }
                        color={ get(f, "color", "#000") }/>
                    </div>
                    <span className="pt-1">
                      { get(f, "name", "loading...") }
                    </span>
                  </div>
                </ListItem>
              )
            )
          }))
        )
      },
      { Item: (
          () => (
            <ListItem>
              <span className="fa fa-arrow-up-from-bracket mr-1"/>Move to folder
            </ListItem>
          )
        ),
        children: (
          folders.map(f => ({
            Item: (
              () => (
                <ListItem key={ f.id } onClick={ e => moveToFolder(e, f.id) }>
                  <div className="flex items-center">
                    <div className="mr-1">
                      <FolderIcon size={ 1.25 }
                        icon={ get(f, "icon", "") }
                        color={ get(f, "color", "#000") }/>
                    </div>
                    <span className="pt-1">
                      { get(f, "name", "loading...") }
                    </span>
                  </div>
                </ListItem>
              )
            )
          }))
        )
      },
      { Item: (
          () => (
            <ListItem onClick={ confirmDelete }>
              <span className="fa fa-trash text-red-400 mr-1"/>Delete { type }
            </ListItem>
          )
        )
      },
    ]
  }, [items, confirmDelete, moveToFolder, copyToFolder, type, folders]);

  const [imOpen, setImOpen] = React.useState(false);
  const openInfoModal = React.useCallback(e => {
    e.stopPropagation();
    setImOpen(true);
  }, []);
  const closeInfoModal = React.useCallback(e => {
    e.stopPropagation();
    setImOpen(false);
  }, []);

  return (
    <div className="flex items-center border-b px-1 hover:bg-blue-50 py-1">
      { !showThumbnail ? null :
        <ThumbnailContainer>
          { ! thumbnail ?
              <ThumbnailPlaceholder /> :
              <img src={ thumbnail }/>
          }
        </ThumbnailContainer>
      }
      <div className="flex-1">
        <div className="font-medium text-gray-600">
          { children }
        </div>
        <div className="text-sm px-2">
          { description }
        </div>
        <div className="text-xs italic text-slate-500 px-2">
          <span className='text-xs'>last updated: </span>
          { new Date(updated_at).toLocaleString() }
        </div>
      </div>
      <div className="flex-0 flex items-center px-1">
        <span onClick={ openInfoModal }
          className="fa-regular fa-circle-info mr-4 cursor-pointer text-gray-600"
        />
        <input type="checkbox"
          className="cursor-pointer"
          onChange={ onChecked }
          checked={ selected }
          onClick={ stopPropagation }/>
        <div className="w-10 flex justify-end"
          onClick={ stopPropagation }>
          <div className="flex-0"
            onClick={ stopPropagation }>
            <StuffDropdown items={ StuffItems }>
              <span className="fa text-lg fa-list mr-1"/>
            </StuffDropdown>
          </div>
        </div>
      </div>
      <div className="pointer-events-none">
        <StuffInfoModal type={ type } id={ id }
          isOpen={ imOpen }
          close={ closeInfoModal }/>
        <ConfirmModal
          isOpen={ Boolean(confirm.action) }
          close={ clearConfirm }
          stuff={ [{ type, id }] }
          { ...confirm }/>
      </div>
      <div className={ `
          fixed inset-0 items-center justify-center
          bg-black bg-opacity-50
          ${ loading ? "flex" : "hidden" }
        ` }
      >
        <ScalableLoading loading={ loading }/>
      </div>
    </div>
  )
}

const ListItem = ({ children, onClick = null }) => {
  return (
    <div onClick={ onClick }
      className="w-52 px-2 py-1 hover:bg-blue-100"
    >
      { children }
    </div>
  )
}
