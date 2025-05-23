import React from 'react';

import get from "lodash/get"
import { Link } from "react-router"
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
      <div className="px-2 uppercase text-[12px] font-bold text-blue-500">
        { title }
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-1">
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
  // <img className="w-full" src={template?.thumbnail || ""}  alt="" /> :
  // console.log('template', template)
  return(

          <div
          key={id}
          onClick={ doOnClick }
           className={` cursor-pointer
          relative flex items-center space-x-2  rounded-sm border border-gray-300 shadow-sm px-2 py-2 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-b-blue-400
        `}
      >
        <div className="flex-shrink-0">
          <div className="h-16 w-16 bg-cover" style={{backgroundImage:`url(${template?.thumbnail})`}}  alt="" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="absolute inset-0" aria-hidden="true" />
          <p className="text-[14px] font-bold uppercase text-gray-500">{ title[1] }</p>
          <p className="h-12 overflow-hidden text-[12px] font-thin text-gray-500">{ template?.description }</p>
        </div>
      </div>
  )
  // return (
  //   <div
  //         key={id}
  //         onClick={ doOnClick }
  //         className="relative flex flex-col items-center space-x-2  rounded-sm border border-gray-300 shadow-sm px-2 py-2 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-b-blue-400"
  //       >
  //         <div className="">

  //             <img className="w-64 h-64 bg-blue-100 bg-cover" style={{backgroundImage:`url(${template?.thumbnail})`}}  alt="" />


  //         </div>
  //         <div className="min-w-0 flex-1">
  //           <a href="#" className="focus:outline-none">
  //             <span className="absolute inset-0" aria-hidden="true" />
  //             <p className="text-[12px] font-bold text-slate-600 uppercase">{title[1]}</p>
  //             <p className="h-14 font-thin overflow-hidden text-[12px] font-light text-slate-500">{template?.description || ''}</p>
  //           </a>
  //         </div>
  //   </div>
  // )


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
              <img className="h-16 w-16" src={thumbnail || ""}  alt="" /> :
              <img className="h-16 w-16 bg-blue-100"  alt="" />

            }
          </div>
          <div className="min-w-0 flex-1">
            <span className="absolute inset-0" aria-hidden="true" />
            <p className="text-[12px] font-bold uppercase text-gray-900">{name}</p>
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
      <div className={`
          relative flex items-center space-x-2  rounded-sm border border-gray-300 shadow-sm px-2 py-2 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-b-blue-400
        `}
      >
        <div className="flex-shrink-0">
          <div className="h-16 w-16 bg-cover bg-[url('/img/macroview.png')]"  alt="" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="absolute inset-0" aria-hidden="true" />
          <p className="text-[12px] font-bold uppercase text-gray-500">{ title }</p>
          <p className="h-14 truncate text-xs text-gray-500">{ description }</p>
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

  // const [recent, setRecent] = React.useState([]);

  // React.useEffect(() => {
  //   falcor.get([
  //     "reports2", "user", "recent", [0, 1, 2, 3, 4],
  //     ["name", "thumbnail", "description", "updated_at", "stuff_type", "id"]
  //   ])
  // }, [falcor]);

  // React.useEffect(() => {
  //   const recent = [];
  //   for (let i = 0; i < 5; ++i) {
  //     const ref = get(falcorCache, ["reports2", "user", "recent", i, "value"]);
  //     const stuff = get(falcorCache, ref);
  //     if (stuff) {
  //       recent.push(stuff);
  //     }
  //   }
  //   setRecent(recent);
  // }, [falcorCache]);

  const [region, setRegion] = React.useState("1");

  const tsmoHref = React.useMemo(() => {
    const href = window.location.href;
    return href.replace("npmrds", "tsmo");
  }, []);

  return (
    <div className="max-w-6xl mx-auto my-8">

{/*
      <div className="font-bold text-3xl text-center grid grid-cols-1 gap-2">
        <Link to="/template/edit/270/tmcs/120+05861_120P05861_120+05862_120P05862_120+05863/dates/2022-04-08T06:00:00|2022-04-08T21:00:00">
          { ">>>>> TESTING SYNTHETIC ROUTES WITH SECONDS <<<<<" }
        </Link>
        <Link to="/template/edit/270/tmcs/120+05861_120P05861_120+05862_120P05862_120+05863/dates/2022-04-08T06:00|2022-04-08T21:00">
          { ">>>>> TESTING SYNTHETIC ROUTES WITHOUT SECONDS <<<<<" }
        </Link>
        <Link to="/template/edit/270/tmcs/120+05861_120P05861_120+05862_120P05862_120+05863/dates/2022-04-08|2022-04-08">
          { ">>>>> TESTING SYNTHETIC ROUTES WITHOUT TIME <<<<<" }
        </Link>
      </div>
*/}

      <div className="grid grid-cols-2 gap-4 p-10">

        <div>

          <div className="mb-2 text-lg  px-2 font-medium text-gray-700 border-current">
            Choose a Route Analysis Template...
          </div>
          { FocusAnalysis.map(({ title, Templates }) => {
              return (
                <Section key={ title } title={ title }>
                  {
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
          {/*<Section title="Your Recent Reports">

            {
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
          </Section>*/}
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
              href={ `/map/${ region }/2023/speed_50pctl_total` }/>
            <LinkCard
              title="80th Percentile Speed"
              description=""
              href={ `/map/${ region }/2023/speed_80pctl_total` }/>
            <div className="col-span-2">
              <LinkCard
                title="Freeflow Speed"
                description="85th percentile of off-peak travel speeds"
                href={ `/map/${ region }/2023/freeflow` }/>
            </div>
          </Section>

          <Section title="Reliability">
            <LinkCard
              title="Car (LoTTR)"
              description="Level of Travel Time Realiability"
              href={ `/map/${ region }/2023/lottr` }/>
            <LinkCard
              title="Truck (TTTR)"
              description="Truck Travel Time Reliability"
              href={ `/map/${ region }/2023/tttr` }/>
          </Section>

          <Section title="Congestion">
            <LinkCard
              title="Total (TED)"
              description="Total Excessive Delay"
              href={ `/map/${ region }/2023/ted` }/>
            <LinkCard
              title="Per Mile (TED)"
              description="Excessive Delay Per Mile"
              href={ `/map/${ region }/2023/ted_per_mi` }/>
            <div className="col-span-2">
              <LinkCard
                title="Peak Hours (PHED)"
                description="Peak Hours Excessive Delay"
                href={ `/map/${ region }/2023/phed` }/>
            </div>
          </Section>

          <Section title="Emissions">
            <div className="col-span-2">
              <LinkCard
                title="Gasoline and Diesel"
                description="CO² Emissions for all vehicles"
                href={ `/map/${ region }/2023/emissions_co2` }/>
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
  }, [setOpenedFolders]);

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

const DateTimeRegex = /(\d{4}[-]\d{2}[-]\d{2})(?:T(\d{2}[:]\d{2}[:]\d{2}))?/;

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

  const [openedFolders, _setOpenedFolders] = React.useState([]);
  const setOpenedFolders = React.useCallback(f => {

console.log("SET OPENED FOLDERS:", f);

    _setOpenedFolders(f);
  }, [])
  const OpenedFolders = React.useMemo(() => {
    return openedFolders.map(fid => get(falcorCache, ["folders2", "id", fid]));
  }, [falcorCache, openedFolders]);

  React.useEffect(() => {
    falcor.get(
        ["folders2", "user", "length"],
        ["folders2", "user", "tree"]
      )
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
    const allFolders = refs.map(ref => get(falcorCache, ref, null)).filter(Boolean);
    const folderTree = get(falcorCache, ["folders2", "user", "tree", "value"], []);
    const topLevelFolders = new Set(folderTree.map(f => f.id));

    const folders = allFolders
      .filter(f => topLevelFolders.has(f.id))
      .sort((a, b) => a.name.localeCompare(b.name));

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

      const userFolders = folders.filter(f => f.type === "user");
      if (userFolders.length) {
        setOpenedFolders([userFolders[0].id]);
      }
      else {
        setOpenedFolders([folders[0].id]);
      }
    }
  }, [folders, openedFolders]);

  const [selectedRoutes, setSelectedRoutes] = React.useState([]);
  const [routeDates, _setRouteDates] = React.useState({});
  const [routeTimes, _setRouteTimes] = React.useState({});

  const addRoute = React.useCallback(rt => {
    setSelectedRoutes(prev => [...prev, rt]);
    const dates = get(rt, ["metadata", "value", "dates"], []);
    if (dates.length) {
      const [date1, date2] = dates;
      const [, startDate, startTime] = DateTimeRegex.exec(date1);
      const [, endDate, endTime] = DateTimeRegex.exec(date2);
      _setRouteDates(prev => ({ ...prev, [rt.id]: [startDate, endDate] }));
      if (startTime && endTime) {
        _setRouteTimes(prev => ({ ...prev, [rt.id]: [startTime, endTime] }));
      }
    }
  }, []);
  const removeRoute = React.useCallback(rt => {
    setSelectedRoutes(prev => prev.filter(r => r.id !== rt.id));
    _setRouteDates(prev => {
      delete prev[rt.id];
      return { ...prev };
    })
  }, []);

  React.useEffect(() => {
    if (!id && selectedRoutes.length) {
      setSelectedRoutes([]);
    }
  }, [id, selectedRoutes]);

  const totalRoutes = get(template, "routes", 0);
  const remaining = totalRoutes - selectedRoutes.length;

  const setRouteDates = React.useCallback((rid, dates) => {
    _setRouteDates(prev => ({ ...prev, [rid]: [...dates] }));
  }, []);
  const setRouteStartDate = React.useCallback((rid, date) => {
    _setRouteDates(prev => {
      if (!(rid in prev)) {
        return {
          ...prev,
          [rid]: [date, null]
        }
      }
      return {
        ...prev,
        [rid]: [date, prev[rid][1]]
      }
    })
  }, []);
  const setRouteEndDate = React.useCallback((rid, date) => {
    _setRouteDates(prev => {
      if (!(rid in prev)) {
        return {
          ...prev,
          [rid]: [null, date]
        }
      }
      return {
        ...prev,
        [rid]: [prev[rid][0], date]
      }
    })
  }, []);

  const setRouteTimes = React.useCallback((rid, times) => {
    _setRouteTimes(prev => ({ ...prev, [rid]: [...times] }));
  }, []);
  const setRouteStartTime = React.useCallback((rid, time) => {
    _setRouteTimes(prev => {
      if (!(rid in prev)) {
        return {
          ...prev,
          [rid]: [time, null]
        }
      }
      return {
        ...prev,
        [rid]: [time, prev[rid][1]]
      }
    })
  }, []);
  const setRouteEndTime = React.useCallback((rid, time) => {
    _setRouteTimes(prev => {
      if (!(rid in prev)) {
        return {
          ...prev,
          [rid]: [null, time]
        }
      }
      return {
        ...prev,
        [rid]: [prev[rid][0], time]
      }
    })
  }, []);

  const URL = React.useMemo(() => {
    if (!template) {
      return null;
    }
    if (totalRoutes > selectedRoutes.length) {
      return null;
    }

    const routeIds = selectedRoutes.reduce((a, c) => {
      const [date1, date2] = get(c, ["metadata", "value", "dates"], []);

      const [startDate, endDate] = get(routeDates, c.id, []);
      const [startTime, endTime] = get(routeTimes, c.id, []);

      const d1 = [startDate, startTime].filter(Boolean).join("T");
      const d2 = [endDate, endTime].filter(Boolean).join("T");

      let rid = `${ c.id }`;

      if (d1 && d2 && ((d1 !== date1) || (d2 !== date2))) {
        rid += `D${ d1 }|${ d2 }`;
      }
      return [...a, rid];
    }, []).join("_");

    return `/template/edit/${ template.id }/route/${ routeIds }`;
  }, [template, totalRoutes, selectedRoutes, routeDates, routeTimes]);

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

  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);

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
              <div className="border-b border-current w-full text-lg font-bold">
                Selected Route{ selectedRoutes.length > 1 ? "s" : "" }
              </div>
              <div className="w-full">
                { selectedRoutes.map(r => {
                    return (
                      <div key={ r.id }>
                        <Stuff { ...r }>
                          <div className="flex">
                            <button className="px-4 rounded bg-gray-200 hover:bg-gray-300 mx-2 flex-none"
                              onClick={ e => removeRoute(r) }
                            >
                              <span className="fa fa-remove"/>
                            </button>
                            <div className="font-normal grid grid-cols-1 gap-1"
                              onClick={ stopPropagation }
                            >
                              <div className="flex items-center">
                                <div className="flex items-center mr-1">
                                  <div className="w-20">Start&nbsp;Date</div>
                                  <input type="date"
                                    className="px-2 py-1 flex-1 ml-1"
                                    value={ get(routeDates, [r.id, 0], "") }
                                    onChange={ e => setRouteStartDate(r.id, e.target.value) }/>
                                </div>
                                <div className="flex items-center ml-1">
                                  <div className="w-20">Start&nbsp;Time</div>
                                  <input type="time" step={ 1 }
                                    className="px-2 py-1 flex-1 ml-1"
                                    value={ get(routeTimes, [r.id, 0], "") }
                                    onChange={ e => setRouteStartTime(r.id, e.target.value) }
                                    disabled={ !Boolean(get(routeDates, [r.id, 0], "")) }/>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="flex items-center mr-1">
                                  <div className="w-20">End&nbsp;Date</div>
                                  <input type="date"
                                    className="px-2 py-1 flex-1 ml-1"
                                    value={ get(routeDates, [r.id, 1], "") }
                                    onChange={ e => setRouteEndDate(r.id, e.target.value) }/>
                                </div>
                                <div className="flex items-center ml-1">
                                  <div className="w-20">End&nbsp;Time</div>
                                  <input type="time" step={ 1 }
                                    className="px-2 py-1 flex-1 ml-1"
                                    value={ get(routeTimes, [r.id, 1], "") }
                                    onChange={ e => setRouteEndTime(r.id, e.target.value) }
                                    disabled={ !Boolean(get(routeDates, [r.id, 1], "")) }/>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Stuff>
                      </div>
                    )
                  })
                }
              </div>
            </>
          }

          { !remaining ? null :
            <div className="w-full cursor-pointer">
              <FolderSelector Folder={ Folder }
                OpenedFolders={ OpenedFolders }
                setOpenedFolders={ setOpenedFolders }
                foldersByType={ foldersByType }
                folders={ stuff.filter(s => s.type === "folder") }/>
            </div>
          }

          { !remaining ? null :
            !routes.length ?
            <div className="w-full text-lg font-bold">
              No Routes in Selected Folder
            </div> :
            <>
              <div className="border-b border-current w-full text-lg font-bold">
                Select { remaining } Route{ remaining > 1 ? "s" : "" }
              </div>
              <div>
                <input type="text" className="w-full px-2 py-1 rounded"
                  value={ search }
                  onChange={ onChange }
                  placeholder="search for a route..."/>
              </div>
              <div className="w-full max-h-96 overflow-auto">
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

          { /*totalRoutes !== 1 ? null :
            <div>
              <div className="border-b border-current w-full text-lg font-bold mb-1">
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
            </div>*/
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
      <div className="w-screen max-w-6xl">
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
