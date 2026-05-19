import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  createContext,
  useRef,
} from "react";
import { srcAttr, SHAPEFILE_LAYER_KEY, INTERNAL_ROUTES_VIEW_ID,INTERNAL_ROUTES_APP_AND_TYPE, INTERNAL_DATASETS_ENV, INTERNAL_ROUTES_SOURCE_ID } from "./constants";
import { CMSContext } from "~/modules/dms/packages/dms/src";
import { Button } from "~/modules/avl-components/src";
import { MapEditorContext } from "~/modules/dms/packages/dms/src/patterns/mapeditor/context";
import { PageContext } from "~/modules/dms/packages/dms/src/patterns/page/context";
import { fetchBoundsForFilter } from "~/modules/dms/packages/dms/src/patterns/mapeditor/MapEditor/stateUtils";
import { nameToSlug } from "~/modules/dms/packages/dms/src/utils/type-utils";
import { get, set, isEqual } from "lodash-es";
import mapboxgl from "maplibre-gl";


const INITIAL_MODAL_STATE = {
  open: false,
  name: "",
  description: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
};

const Comp = ({ state, setState, map }) => {
  const [routesSource, setRoutesSource] = useState({})
  const [modalState, setModalState] = useState(INITIAL_MODAL_STATE);
  const mctx = React.useContext(MapEditorContext);
  const cctx = React.useContext(CMSContext);
  const ctx = mctx?.falcor ? mctx : cctx;
  let { falcor, pgEnv, falcorCache } = ctx;
  if (!falcorCache) {
    falcorCache = falcor.getCache();
  }

  const pContext = React.useContext(PageContext) || {};
  const { apiUpdate } = pContext;

  let pluginDataPath = "";
  let symbologyLayerPath = "";
  let symbPath = "";
  let pathBase = "";
  //state.symbologies indicates that the map context is DMS
  if (state.symbologies) {
    const symbName = Object.keys(state.symbologies)[0];
    pathBase = `symbologies['${symbName}']`;
    pluginDataPath = `${pathBase}.symbology.pluginData.routecreation`;
    symbologyLayerPath = `${pathBase}.symbology.layers`;
    symbPath = `${pathBase}.symbology`;
  } else {
    pluginDataPath = `symbology.pluginData.routecreation`;
    symbologyLayerPath = `symbology.layers`;
    symbPath = `symbology`;
  }

  const [tmcData, setTmcData] = useState([]);

  const { shapefileLayerId, tmc_array, view_id, searchInputTmc } =
    useMemo(() => {
      const shapefileLayerId = get(
        state,
        `${pluginDataPath}['active-layers'][${SHAPEFILE_LAYER_KEY}]`,
      );
      return {
        tmc_array: get(state, `${pluginDataPath}['tmc_array']`, null),
        shapefileLayerId,
        view_id: get(
          state,
          `${symbologyLayerPath}['${shapefileLayerId}']['view_id']`,
          null,
        ),
        searchInputTmc: get(state, `${pluginDataPath}['search_input_tmc']`, ""),
      };
    }, [pluginDataPath, state]);

  // const geomOptions = JSON.stringify({
  //   groupBy: ["urban_code", "region_code", "mpo_name", "county"],
  // });

  const newOptions = JSON.stringify({
    filter: { tmc: tmc_array },
  });

  const fetchGeomPath = [
    "uda",
    pgEnv,
    "viewsById",
    view_id,
    "options",
    newOptions,
    "dataByIndex",
    { from: 0, to: 200 },
    ["tmc", "miles", "intersection"],
  ];

  useEffect(() => {
    if (tmc_array && tmc_array.length > 0) {
      falcor.get(fetchGeomPath).then((res) => {
        const geomDataPath = fetchGeomPath.slice(0, -2);
        const geomDataRes = get(res, ["json", ...geomDataPath]);
        const filteredTmcData = Object.values(geomDataRes || {}).filter(
          (tData) => typeof tData?.miles === "number",
        );
        setTmcData(filteredTmcData);
      });
    }
  }, [tmc_array]);

  useEffect(() => {
    const MAP_CLICK = (data1) => {
      const features = map.queryRenderedFeatures(data1.point, {
        layers: [shapefileLayerId],
      });
      const featId = features?.[0]?.properties?.tmc;

      if (featId) {
        setState((draft) => {
          const currentTmcArray = get(
            draft,
            `${pluginDataPath}['tmc_array']`,
            [],
          );
          if (currentTmcArray.includes(featId)) {
            set(
              draft,
              `${pluginDataPath}['tmc_array']`,
              currentTmcArray.filter((d) => d !== featId),
            );
          } else {
            currentTmcArray.push(featId);
            set(draft, `${pluginDataPath}['tmc_array']`, currentTmcArray);
          }
        });
      }
    };
    map.on("click", MAP_CLICK);

    return () => {
      map.off("click", MAP_CLICK);
    };
  }, [shapefileLayerId, tmc_array]);

  const removeTmc = useCallback((tmc) => {
    setState((draft) => {
      const currentTmcArray = get(draft, `${pluginDataPath}['tmc_array']`, []);
      set(
        draft,
        `${pluginDataPath}['tmc_array']`,
        currentTmcArray.filter((d) => d !== tmc),
      );
    });
  });

  useEffect(() => {
    const setGeoBounds = async ({ filter, setState }) => {
      const newExtent = await fetchBoundsForFilter(
        get(state, pathBase, state),
        falcor,
        pgEnv,
        filter,
      );
      const parsedExtent =
        typeof newExtent === "string" ? JSON.parse(newExtent) : newExtent;
      const coordinates = parsedExtent?.coordinates[0];
      const mapGeom = coordinates?.reduce(
        (bounds, coord) => {
          return bounds.extend(coord);
        },
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
      );

      if (mapGeom && Object.keys(mapGeom).length > 0) {
        setState((draft) => {
          set(draft, `${symbPath}.zoomToFilterBounds`, [
            mapGeom["_sw"],
            mapGeom["_ne"],
          ]);
        });
      }
    };

    if (searchInputTmc && searchInputTmc.length === 9) {
      const geographyFilter = [
        {
          display_name: "tmc",
          column_name: "tmc",
          values: [searchInputTmc],
          zoomToFilterBounds: true,
        },
      ];

      setGeoBounds({ filter: geographyFilter, setState });
    } else {
      setState((draft) => {
        set(draft, `${symbPath}.zoomToFilterBounds`, []);
      });
    }
  }, [searchInputTmc]);

    const addItem = async () => {
      const { open, startDate, startTime, endDate, endTime, ...rest } = modalState;
      const sourceType =
        routesSource.type ||
        (routesSource.name
          ? nameToSlug(routesSource.name)
          : undefined);
      
      const payload = {
        ...rest,
        metadata: JSON.stringify({
          dates: [
            `${startDate}T${startTime || "00:00:00"}`,
            `${endDate}T${endTime || "23:59:59"}`
          ]
        }),
        tmc_array: JSON.stringify(tmc_array || [])
      };

      const res = await apiUpdate({
        data: payload,
        config: {
          format: {
            ...routesSource,
            type: `${sourceType}|${INTERNAL_ROUTES_VIEW_ID}:data`,
          },
        },
      });
      //TODO -- AFTER SUCCESSFUL addition of route, clear out local state
      //OR -- stretch goal -- update the URL with the ID, and user can now edit the "current" route
      return res;
    };

  const sourcePath = [
    "uda",
    INTERNAL_DATASETS_ENV,
    "sources",
    "byId",
    [INTERNAL_ROUTES_SOURCE_ID],
    srcAttr,
  ];

  useEffect(() => {
    const getRouteSource = async () => {
      const r = await falcor.get(sourcePath);
      const valueGetter = (attr) =>
        get(r, [
          "json",
          "uda",
          INTERNAL_DATASETS_ENV,
          "sources",
          "byId",
          INTERNAL_ROUTES_SOURCE_ID,
          attr,
        ]);

      const app = valueGetter("app");
      const name = valueGetter("name");
      // For DMS sources, build env from source name slug (matches how data types are stored)
      const sourceSlug = name ? nameToSlug(name) : null;
      const env =
        sourceSlug && app ? `${app}+${sourceSlug}` : INTERNAL_DATASETS_ENV;
      const routeSource = {
        ...srcAttr.reduce((acc, attr) => {
          let value = valueGetter(attr);

          if (attr === "metadata") {
            return { ...acc, columns: value?.columns || [] };
          }
          if (attr === "config") {
            return {
              ...acc,
              columns: JSON.parse(value || "{}")?.attributes || [],
            };
          }
          return { ...acc, [attr]: value };
        }, {}),
        source_id: get(r, [
          "json",
          "uda",
          INTERNAL_DATASETS_ENV,
          "sources",
          "byId",
          INTERNAL_ROUTES_SOURCE_ID,
          "$__path",
          4,
        ]),
        env,
        srcEnv: INTERNAL_DATASETS_ENV,
        isDms: true,
      };
      setRoutesSource(routeSource);
    };

    getRouteSource();
  }, []);

  const tmcRows = useMemo(() => {
    if (tmc_array?.length > 0) {
      return (
        <div>
          {tmc_array.map((tmc) => {
            const tData = tmcData.find((td) => td.tmc === tmc) || {
              tmc,
              miles: 0,
              intersection: "",
            };
            return (
              <div
                key={`tmc_${tData.tmc}`}
                className="border-b hover:bg-gray-200 px-1 "
              >
                <div className="flex items-center">
                  <div className="font-bold text-sm flex-1">{tData.tmc}</div>
                  <div className="text-xs">{tData.miles.toFixed(3)} miles</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs">{tData.intersection}</div>
                  <div
                    className="text-xs text-red-500 cursor-pointer hover:bg-gray-300 rounded p-1"
                    onClick={() => removeTmc(tData.tmc)}
                  >
                    Remove
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      return [];
    }
  }, [tmcData, tmc_array]);

  const totalMiles =
    tmc_array?.length > 0
      ? tmcData.reduce((acc, curr) => {
          return acc + curr.miles;
        }, 0)
      : 0;

  const modalStyle = {
    display: "none",
    position: "fixed",
    top: "0",
    left: "-55vw",
    width: "50vw",
    height: "60vh",
    padding: "20px",
    borderRadius: "5px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
    zIndex: 1001,
    opacity: ".9",
  };

  if (modalState.open) {
    modalStyle.display = "block";
  }

  const setModalOpen = (newModalOpenVal) =>
    setModalState({ ...modalState, open: newModalOpenVal });

  const setRouteMeta = (routeMeta) => {
    console.log({ modalState, routeMeta });
    setModalState({ ...modalState, ...routeMeta });
  };

  return (
    <div
      className="grid grid-cols-1 gap-2 p-1 pointer-events-auto drop-shadow-lg p-4 bg-white/90"
      style={{
        position: "absolute",
        top: "25px",
        right: "-168px",
        color: "black",
        width: "318px",
        maxHeight: "350px",
      }}
    >
      <div>
        <div className="font-bold">TMC Search</div>
        <label className="flex w-full">
          <div className="flex w-full items-center">
            <input
              className="w-full p-2 bg-white/40 rounded"
              value={searchInputTmc}
              onChange={(e) => {
                setState((draft) => {
                  set(
                    draft,
                    `${pluginDataPath}['search_input_tmc']`,
                    e.target.value,
                  );
                });
              }}
            />
          </div>
        </label>
      </div>
      <div className="border-b-2 border-current mb-1 flex items-center">
        <div className="font-bold text-lg flex-1">TMC List</div>
        <div className="text-sm">Total Miles: {totalMiles.toFixed(3)}</div>
      </div>
      <div
        className="overflow-auto scrollbar-sm"
        style={{ maxHeight: "125px" }}
      >
        {tmcRows}
      </div>
      {tmc_array?.length > 0 && (
        <div className="mb-1 flex items-center">
          <Button
            // disabled={(downloadFileName && !viewDownloads[downloadFileName])}
            themeOptions={{ color: "transparent" }}
            //className='bg-white hover:bg-cool-gray-700 font-sans text-sm text-npmrds-100 font-medium'
            onClick={(e) => {
              setModalState({ ...modalState, open: true });
            }}
            style={{ width: "100%", marginTop: "10px" }}
          >
            Save Route
          </Button>
        </div>
      )}
      <SaveRouteModal
        modalStyle={modalStyle}
        setModalOpen={setModalOpen}
        modalState={modalState}
        setRouteMeta={setRouteMeta}
        addItem={addItem}
      />
    </div>
  );
};

export { Comp };

const SaveRouteModal = ({
  modalState,
  modalStyle,
  setModalOpen,
  setRouteMeta,
  addItem
}) => {
  return (
    <div style={modalStyle} className="bg-white/[95%]">
      <div className="flex flex-col h-[100%]">
        <div className="flex items-center m-1">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
            <i
              className="fad fa-layer-group text-blue-600"
              aria-hidden="true"
            />
          </div>
          <div className="mt-3 text-center sm:ml-2 sm:mt-0 sm:text-left w-full">
            <div className="text-lg align-center font-semibold leading-6 text-gray-900">
              Save Route
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <ModalInputField 
            label="Name"
            value={modalState.name}
            path={'name'}
            onChange={setRouteMeta}
            type="text"
          />
        </div>
        <div className="flex gap-4 border-b-2 py-4 mb-4">
        <ModalInputField 
            label="Description"
            value={modalState.description}
            path={'description'}
            onChange={setRouteMeta}
            type="textarea"
          />
        </div>
        <div className="flex gap-4 my-4">
          <ModalInputField 
            label="Start Date"
            value={modalState.startDate}
            path={'startDate'}
            onChange={setRouteMeta}
            type="date"
          />
          <ModalInputField 
            label="End Date"
            value={modalState.endDate}
            path={'endDate'}
            onChange={setRouteMeta}
            type="date"
          />
        </div>
        <div className="flex gap-4 my-4">
          <ModalInputField 
            label="Start Time"
            value={modalState.startTime}
            path={'startTime'}
            onChange={setRouteMeta}
            type="time"
          />
          <ModalInputField 
            label="End Time"
            value={modalState.endTime}
            path={'endTime'}
            onChange={setRouteMeta}
            type="time"
          />
        </div>
        <div className="absolute" style={{ bottom: "20px", right: "20px" }}>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button 
              onClick={addItem}
              className="disabled:bg-slate-300 disabled:cursor-warning inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
            >
              Save
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModalInputField = ({ label, path, value, onChange, type = "text" }) => {
  return (
    <div>
      <div className="font-bold">{label}</div>
      <label className="flex w-full">
        <div className="flex w-full items-center">
          <input
            type={type}
            className="w-full p-2 bg-white rounded"
            value={value}
            onChange={(e) => {
              console.log(e.target.value);
              onChange({ [path]: e.target.value });
            }}
          />
        </div>
      </label>
    </div>
  );
};