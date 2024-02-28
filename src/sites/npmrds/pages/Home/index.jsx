import React from 'react';

import get from "lodash/get"
import { Link } from "react-router-dom"
import { range as d3range } from "d3-array"

import {
  Button,
  Select,
  // withAuth,
  useFalcor
} from "~/modules/avl-components/src"

import { Modal, FuseWrapper } from "~/sites/npmrds/components"

import FolderIcon from "../Folders/components/FolderIcon"
import {
  Stuff,
  ThumbnailContainer,
  ThumbnailPlaceholder,
  getStuffSorter
} from "../Folders/components/Stuff"

import FocusAnalysis from "./FocusAnalysis.config"

import REGIONS from "./Regions"

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
      <div className="px-2 uppercase text-sm font-medium text-blue-500">
        { title }
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        { children }
      </div>
    </div>
  )
}

const TemplateSelector = ({ id, title, onClick, children }) => {

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

  const doOnClick = React.useCallback(e => {
    onClick({ templateId: id, templateTitle: title });
  }, [id, title, onClick]);

  return (
    <div
          key={id}
          onClick={ doOnClick }
          className="relative flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-5 shadow-sm hover:bg-blue-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
        >
          <div className="flex-shrink-0">
            { template?.thumbnail ?
              <img className="h-12 w-12" src={template?.thumbnail || ""}  alt="" /> :
              <img className="h-12 w-12 bg-blue-100"  alt="" />

            }
          </div>
          <div className="min-w-0 flex-1">
            <a href="#" className="focus:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-lg font-medium text-gray-900">{title[1]}</p>
              <p className="truncate text-xs text-gray-500">{template?.description || ''}</p>
            </a>
          </div>
    </div>
  )


}
const ReportLink = ({ id, name, description, thumbnail  }) => {

  return(
    <Link
          key={id}
          to={ `/report/edit/${ id }`}
          className="relative flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-5 shadow-sm hover:bg-blue-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
        >
          <div className="flex-shrink-0">
            { thumbnail ?
              <img className="h-12 w-12" src={thumbnail || ""}  alt="" /> :
              <img className="h-12 w-12 bg-blue-100"  alt="" />

            }
          </div>
          <div className="min-w-0 flex-1">
            <span className="absolute inset-0" aria-hidden="true" />
            <p className="text-lg font-medium text-gray-900">{name}</p>
            <p className="truncate text-xs text-gray-500">{description || ''}</p>
          </div>
    </Link>
  )
}

const NoData = { templateId: null }

const regionAccessor = r => r.name;
const regionValueAccessor = r => r.region;

const LinkCard = ({ title, description, href }) => {
  return (
    <Link to={ href }>
      <div className={ `
          relative flex items-center space-x-2 rounded-lg
          border border-gray-300 bg-white px-4 py-5
          shadow-sm focus-within:ring-2
          focus-within:ring-indigo-500 focus-within:ring-offset-2
          hover:bg-blue-50 hover:border-gray-400
        ` }
      >
        <div className="flex-shrink-0">
          <div className="h-12 w-12 bg-gray-300"  alt="" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="absolute inset-0" aria-hidden="true" />
          <p className="text-lg font-medium text-gray-900">{ title }</p>
          <p className="truncate text-xs text-gray-500">{ description }</p>
        </div>
      </div>
    </Link>
  )
}

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
      ["name", "thumbnail", "description", "updated_at", "stuff_type", "id"]
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

  const [region, setRegion] = React.useState("1");

  const tsmoHref = React.useMemo(() => {
    const href = window.location.href;
    return href.replace("npmrds", "tsmo");
  }, []);

  return (
    <div className="max-w-6xl mx-auto my-8">
      <div className="grid grid-cols-2 gap-4 p-10">

        <div>
          <Title>
            Route Analysis
          </Title>
          { FocusAnalysis.map(({ title, Templates }) => {
              return (
                <Section key={ title } title={ title }>
                  { Templates.length % 2 === 1 ?
                    <>
                      { Templates.slice(0, -1).map((t,i) => {
                          return (
                            <TemplateSelector
                              key={ t.title }
                              onClick={ setTemplateData }
                              title={ [title, t.title] }
                              id={ t.id }/>
                          )
                        })
                      }
                      { Templates.slice(-1).map((t,i) => {
                          return (
                            <div key={ t.title } className="col-span-2">
                              <TemplateSelector
                                onClick={ setTemplateData }
                                title={ [title, t.title] }
                                id={ t.id }/>
                            </div>
                          )
                        })
                      }
                    </> :
                    Templates.map((t,i) => {
                      return (
                        <TemplateSelector
                          key={ t.title }
                          onClick={ setTemplateData }
                          title={ [title, t.title] }
                          id={ t.id }/>
                      )
                    })
                  }
                </Section>
              )
            })
          }
          <Section title="Your Recent Reports">

            { recent.length % 2 === 1 ?
              <>
                { recent.slice(0, -1).map(r => {
                    return r.stuff_type === "report" ?
                      <ReportLink key={ r.id }  { ...r }/> :
                      <TemplateSelector key={ r.id }
                        onClick={ setTemplateData }
                        title={ ["Custom Reports", r.name] }
                        id={ r.id }
                      />
                  })
                }
                { recent.slice(-1).map(r => {
                    return (
                      <div key={ r.id } className="col-span-2">
                        { r.stuff_type === "report" ?
                            <ReportLink key={ r.id }  { ...r }/> :
                            <TemplateSelector key={ r.id }
                              onClick={ setTemplateData }
                              title={ ["Custom Reports", r.name] }
                              id={ r.id }
                            />
                        }
                      </div>
                    )
                  })
                }
              </> :
              recent.map(r => {
                return r.stuff_type === "report" ?
                  <ReportLink key={ r.id }  { ...r }/> :
                  <TemplateSelector key={ r.id }
                    onClick={ setTemplateData }
                    title={ ["Custom Reports", r.name] }
                    id={ r.id }
                  />
              })
            }
          </Section>
        </div>

        <div className="flex flex-col">
          <Title>
            Regional Analysis
          </Title>

          <Section title="Region">
            <div className="col-span-2">
              <Select options={ REGIONS }
                value={ region }
                onChange={ setRegion }
                accessor={ regionAccessor }
                valueAccessor={ regionValueAccessor }/>
            </div>
          </Section>

          <Section title="Floating Car">
            <LinkCard
              title="50th Percentile Speed"
              description=""
              href={ `/map/${ region }/2021/speed_50pctl_total` }/>
            <LinkCard
              title="80th Percentile Speed"
              description=""
              href={ `/map/${ region }/2021/speed_80pctl_total` }/>
            <div className="col-span-2">
              <LinkCard
                title="Freeflow Speed"
                description="85th percentile of off-peak travel speeds"
                href={ `/map/${ region }/2021/freeflow` }/>
            </div>
          </Section>

          <Section title="Reliability">
            <LinkCard
              title="Car (LoTTR)"
              description="Level of Travel Time Realiability"
              href={ `/map/${ region }/2021/lottr` }/>
            <LinkCard
              title="Truck (TTTR)"
              description="Truck Travel Time Reliability"
              href={ `/map/${ region }/2021/tttr` }/>
          </Section>

          <Section title="Congestion">
            <LinkCard
              title="Total (TED)"
              description="Total Excessive Delay"
              href={ `/map/${ region }/2021/ted` }/>
            <LinkCard
              title="Per Mile (TED)"
              description="Excessive Delay Per Mile"
              href={ `/map/${ region }/2021/ted_per_mi` }/>
            <div className="col-span-2">
              <LinkCard
                title="Peak Hours (PHED)"
                description="Peak Hours Excessive Delay"
                href={ `/map/${ region }/2021/phed` }/>
            </div>
          </Section>

          <Section title="Emissions">
            <div className="col-span-2">
              <LinkCard
                title="Gasoline and Diesel"
                description="CO² Emissions for all vehicles"
                href={ `/map/${ region }/2021/emissions_co2` }/>
            </div>
          </Section>

          <Section title="PM3">
            <div className="col-span-2">
              <LinkCard
                title="PM3 Measures"
                description="PM3 mesures over time"
                href="/map21"/>
            </div>
          </Section>

          <Section title="TSMO">
            <div className="col-span-2">
              <LinkCard
                title="TSMO"
                description="Transportation Systems Management and Operations Data"
                href={ tsmoHref }/>
            </div>
          </Section>

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
      requests.push(["routes2", "id", routes, ["name", "description", "updated_at", "id", "metadata"]]);
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
      setOpenedFolders([folders.filter(f => f.type === "user")?.[0]?.id]);
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

  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  React.useEffect(() => {
    if (totalRoutes !== 1) {
      setStartDate("");
      setEndDate("");
    }
  }, [totalRoutes]);

  React.useEffect(() => {
    if ((totalRoutes === 1) && (selectedRoutes.length === 1) && !startDate && !endDate) {
      const dates = get(selectedRoutes, [0, "metadata", "value", "dates"], []);
      if (dates.length) {
        setStartDate(dates[0]);
        setEndDate(dates[1]);
      }
    }
  }, [totalRoutes, selectedRoutes]);

  const doSetStartDate = React.useCallback(e => {
    setStartDate(e.target.value);
  }, []);
  const doSetEndDate = React.useCallback(e => {
    setEndDate(e.target.value);
  }, []);

  const URL = React.useMemo(() => {
    if (totalRoutes > selectedRoutes.length) {
      return null;
    }
    if (!template) {
      return null;
    }
    const routeId = selectedRoutes.map(r => r.id).join("_");

    if (startDate && endDate) {
      return `/template/edit/${ template.id }/route/${ routeId }/dates/${ startDate.replaceAll("-", "") }|${ endDate.replaceAll("-", "") }`;
    }

    return `/template/edit/${ template.id }/route/${ routeId }`;

  }, [template, totalRoutes, selectedRoutes, startDate, endDate]);

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

          { totalRoutes !== 1 ? null :
            <div>
              <div className="border-b border-current w-3/4 text-lg font-bold mb-1">
                Add Dates (optional)
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex items-center mb-1">
                  <span className="font-bold">Start Date:</span>
                  <input type="date"
                    className="px-2 py-1 rounded ml-1"
                    value={ startDate }
                    onChange={ doSetStartDate }/>
                </div>
                <div className="flex items-center">
                  <span className="font-bold">End Date:</span>
                  <input type="date"
                    className="px-2 py-1 rounded ml-1"
                    value={ endDate }
                    onChange={ doSetEndDate }/>
                </div>
              </div>
            </div>
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
