import React, { useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { get, uniqBy, groupBy, orderBy } from "lodash";
import moment from "moment";

import { DamaContext } from "~/pages/DataManager/store";
import { DAMA_HOST } from "~/config";
import { useFalcor, ScalableLoading, Select } from "~/modules/avl-components/src";

const OPEN_CTX_STATUSES = ["OPEN"];

const checkDateRanges = (dateRanges) => {
  if (dateRanges.length === 1) {
    return { msgString: null, isValidDateRage: true };
  }
  dateRanges.sort((a, b) => moment(a.start_date).diff(moment(b.start_date)));

  let isContinuous = true;
  let isOverlapped = false;

  for (let i = 1; i < dateRanges.length; i++) {
    const prevEndDate = moment(dateRanges[i - 1].end_date);
    const currentStartDate = moment(dateRanges[i].start_date);

    if (currentStartDate.isBefore(prevEndDate)) isOverlapped = true;
    if (!currentStartDate.isSame(prevEndDate.clone().add(1, "days")))
      isContinuous = false;
  }

  if (isContinuous && !isOverlapped) {
    return { msgString: null, isValidDateRage: true };
  } else if (!isContinuous && !isOverlapped) {
    return { msgString: "Dates are not continuous", isValidDateRage: false };
  } else if (!isContinuous && isOverlapped) {
    return {
      msgString: "Dates are not continuous and they are overlapped",
      isValidDateRage: false,
    };
  } else if (isContinuous && isOverlapped) {
    return {
      msgString: "Dates are continuous but they are overlapped",
      isValidDateRage: false,
    };
  }

  return { msgString: "Invalid date ranges", isValidDateRage: false };
};

const findMinMaxDates = (dateRanges) => {
  if (dateRanges.length === 0) {
    return {};
  }

  let minDate = new Date(dateRanges[0].start_date);
  let maxDate = new Date(dateRanges[0].end_date);

  for (const { start_date: start, end_date: end } of dateRanges) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate < minDate) minDate = startDate;
    if (endDate > maxDate) maxDate = endDate;
  }

  return (
    {
      startDate: minDate.toISOString().split("T")[0],
      endDate: maxDate.toISOString().split("T")[0],
    } || {}
  );
};

const SourceAttributes = {
  source_id: "source_id",
  name: "name",
  display_name: "display_name",
  type: "type",
  update_interval: "update_interval",
  category: "category",
  categories: "categories",
  description: "description",
  statistics: "statistics",
  metadata: "metadata",
};

const ViewAttributes = {
  view_id: "view_id",
  source_id: "source_id",
  data_type: "data_type",
  interval_version: "interval_version",
  geography_version: "geography_version",
  version: "version",
  source_url: "source_url",
  publisher: "publisher",
  table_schema: "table_schema",
  table_name: "table_name",
  data_table: "data_table",
  download_url: "download_url",
  tiles_url: "tiles_url",
  start_date: "start_date",
  end_date: "end_date",
  last_updated: "last_updated",
  statistics: "statistics",
  metadata: "metadata",
  user_id: "user_id",
  etl_context_id: "etl_context_id",
  view_dependencies: "view_dependencies",
  _created_timestamp: "_created_timestamp",
  _modified_timestamp: "_modified_timestamp",
};

const getAttributes = (data) =>
  Object.entries(data || {}).reduce((out, [k, v]) => {
    out[k] = v.value !== undefined ? v.value : v;
    return out;
  }, {});

const METADATA_EVENT_TYPE = 'metadata';
const ADD_EVENT_TYPE = 'npmrds-add';
const REPLACE_EVENT_TYPE = 'npmrds-replace';

export default function NpmrdsManage({
  source,
  views,
  activeViewId
}) {
  const { user: ctxUser, pgEnv } = useContext(DamaContext);
  const { falcor, falcorCache } = useFalcor();
  const navigate = useNavigate();

  const [showModal, setShowModal] = React.useState(false);
  const [showReplaceModal, setShowReplaceModal] = React.useState(false);
  const [replaceYear, setReplaceYear] = React.useState();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showReRunModal, setShowReRunModal] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState();
  const [metaViews, setMetaViews] = React.useState([]);
  const [removeViewId, setRemoveViewId] = React.useState(null);
  const [removeStateKey, setRemoveStateKey] = React.useState(null);
  const [rerunViewId, setRerunViewId] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [polling, setPolling ] = React.useState(false);
  const [pollingInterval, setPollingInterval] = React.useState(false);


  useEffect(() => {
    const fetchData = async () => {
      const lengthPath = ["dama", pgEnv, "sources", "length"];
      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama",
        pgEnv,
        "sources",
        "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes",
        Object.values(SourceAttributes),
      ]);
    };

    fetchData();
  }, [falcor]);

  const npmrdsRawSourcesId = useMemo(() => {
    return Object.values(
      get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {})
    )
      .map((v) =>
        getAttributes(
          get(falcorCache, v.value, { attributes: {} })["attributes"]
        )
      )
      .filter((source) => source?.type === "npmrds_raw")
      .map((rawS) => rawS.source_id);
  }, [falcorCache]);

  useEffect(() => {
    const getData = async () => {
      const lengthPath = [
        "dama",
        pgEnv,
        "sources",
        "byId",
        npmrdsRawSourcesId,
        "views",
        "length",
      ];

      const resp = await falcor.get(lengthPath);

      const requests = npmrdsRawSourcesId.map((s_id) => [
        "dama",
        pgEnv,
        "sources",
        "byId",
        s_id,
        "views",
        "byIndex",
        {
          from: 0,
          to:
            get(
              resp.json,
              ["dama", pgEnv, "sources", "byId", s_id, "views", "length"],
              0
            ) - 1,
        },
        "attributes",
        Object.values(ViewAttributes),
      ]);
      falcor.get(...requests);
    };

    getData();
  }, [falcor, npmrdsRawSourcesId]);

  const npmrdsRawViews = useMemo(() => {
    return npmrdsRawSourcesId
      .reduce((out, source_id) => {
        const views = Object.values(
          get(
            falcorCache,
            [
              "dama",
              pgEnv,
              "sources",
              "byId",
              source_id,
              "views",
              "byIndex",
            ],
            {}
          )
        ).map((v) =>
          getAttributes(
            get(falcorCache, v.value, { attributes: {} })["attributes"]
          )
        );

        if (views.length) {
          out = uniqBy([...out, ...views], "view_id");
        }
        return out;
      }, [])
      .filter(
        (v) =>
          v &&
          v.view_id &&
          v.metadata &&
          Object.keys(v.metadata || {}).length > 0
      );
  }, [falcorCache, npmrdsRawSourcesId]);

  const activeView = useMemo(() => {
    return views.find((v) => Number(v.view_id) === Number(activeViewId));
  }, [activeViewId, views]);

  const [availableViews, dependentViews] = useMemo(() => {
    return [
      (npmrdsRawViews || []).filter(
        (v) =>
          (activeView?.view_dependencies || []).indexOf(Number(v.view_id)) ===
          -1
      ),
      (npmrdsRawViews || []).filter(
        (v) =>
          (activeView?.view_dependencies || []).indexOf(Number(v.view_id)) >= 0
      ),
    ];
  }, [npmrdsRawViews, activeViewId, activeView, activeView?.view_dependencies]);

  const groupbyState = useMemo(() => {
    return groupBy(
      orderBy(
        dependentViews.filter(v => v && v.metadata),
        ["metadata.start_date", "metadata.end_date"],
        ["asc", "asc"]
      ),
      (v) => {
        if (typeof v?.metadata?.state_code === "object") {
          //updated format
          return Object.keys(v?.metadata?.state_code).join(", ");
        } else {
          //legacy format
          return v?.metadata?.state_code;
        }
      }
    );
  }, [dependentViews]);

  const availableViewOptions = useMemo(
    () =>
      availableViews.map((availableView) => (
        <option
          className="max-h-60 rounded-md py-1 text-base leading-6 shadow-xs overflow-auto focus:outline-none sm:text-sm sm:leading-5"
          value={{
            value: availableView?.view_id,
            metadata: availableView?.metadata,
          }}
        >
          {`${
            availableView?.metadata?.name ||
            availableView?.metadata?.dama_source_name ||
            `s${availableView?.source_id} v${availableView?.view_id}`
          } From ${availableView?.metadata?.start_date} to ${
            availableView?.metadata?.end_date
          }`}
        </option>
      )),
    [availableViews]
  );

  const allSourceYears = Object.keys(source?.metadata?.npmrds_meta_layer_view_id ?? {}).reverse();

  /**
   * Sets default year in "replace entire year of data" modal 
   */
  useEffect(() => {
    if(!replaceYear) { 
      setReplaceYear(allSourceYears[0])
    }
  },[allSourceYears]);

  const availableReplaceViewOptions = useMemo(
    () =>
      availableViews
        .filter((v) => {
          const isFullRange =
            v.metadata.start_date.endsWith("-01-01") &&
            v.metadata.end_date.endsWith("-12-31");
          const isSameYear =
            v.metadata.start_date.substring(0, 4) ===
            v.metadata.end_date.substring(0, 4);

          return isFullRange && isSameYear;
        })
        .filter(
          (v) =>
            new Date(v.metadata.end_date).getFullYear().toString() ===
            replaceYear,
        )
        .map((availableView) => (
          <option
            className="max-h-60 rounded-md py-1 text-base leading-6 shadow-xs overflow-auto focus:outline-none sm:text-sm sm:leading-5"
            value={{
              value: availableView?.view_id,
              metadata: availableView?.metadata,
            }}
          >
            {`${
              availableView?.metadata?.name ||
              availableView?.metadata?.dama_source_name ||
              `s${availableView?.source_id} v${availableView?.view_id}`
            } From ${availableView?.metadata?.start_date} to ${
              availableView?.metadata?.end_date
            }`}
          </option>
        )),
    [dependentViews, replaceYear],
  );


  //get info about tmc_meta
  //source.npmrds_meta_layer_view_id[year]
  useEffect(() => {
    const getMetaViews = async () => {
      const metaViewIds = Object.values(source.metadata.npmrds_meta_layer_view_id)
      const metaViewPath = ["dama", pgEnv, "views", "byId", metaViewIds, "attributes", Object.values(ViewAttributes)];

      const metaViewResp = await falcor.get(metaViewPath)
      const metaViews = get(metaViewResp, ["json", "dama", pgEnv, "views", "byId"])

      let metadataLength;
      try {
        const metadataLengthPath = ["dama", pgEnv, "viewsbyId", metaViewIds, "data", "length"];
        const lengthResp = await falcor.get(metadataLengthPath);
        metadataLength = get(lengthResp, ["json", "dama", pgEnv, "viewsbyId"]);
      } catch (e) {
        console.error("error fetching metadata table length" ,e)
      }
      const metaYearLength = metaViewIds.map((mViewId) => {
        return {
          meta_view_id: mViewId,
          num_tmc: metadataLength?.[mViewId]?.data?.length,
          year: metaViews[mViewId].attributes.metadata.year
        };
      });

      setMetaViews(metaYearLength)
    }

    if(source?.metadata?.npmrds_meta_layer_view_id && Object.values(source?.metadata?.npmrds_meta_layer_view_id).length) {
      getMetaViews();
    }
  }, [source, falcor, pgEnv]);

  const dateRanges = useMemo(() => {
    return ([selectedView, activeView] || [])
      .map(dateView => {
        if(!!dateView?.props) {
          return dateView?.props?.value;
        } else {
          return dateView;
        }
      })
      .filter(
        (v) => (v && v.metadata && v.metadata.start_date && v.metadata.end_date)
      )
      .map((dr) => ({
        start_date: dr?.metadata?.start_date,
        end_date: dr?.metadata?.end_date,
      }));
  }, [selectedView, activeView]);

  const { msgString, isValidDateRage } = useMemo(() => {
    return { ...(checkDateRanges(dateRanges) || {}) };
  }, [dateRanges]);

  const headers = [
    "State",
    "Raw Data View Id",
    "Meta View Id",
    "Version",
    "Start Date",
    "End Date",
    "Tmcs in Metadata",
    "Tmcs in data",
    "Total Percentage",
    "Interstate Percent",
    "Non Interstate Percent",
    "Extended TMC Percent",
    "Delete",
    "Re-run metadata",
  ];

  const updateNpmrds = async () => {
    const publishData = {
      source_id: source?.source_id || null,
      view_id: activeView?.view_id,
      user_id: ctxUser?.id,
      email: ctxUser?.email,
      npmrds_raw_view_ids: [selectedView?.props?.value?.value],
      name: source?.name,
      type: "npmrds",
      ...findMinMaxDates(dateRanges),
      pgEnv,
    };
    console.log("update, publishData::", publishData)
    setLoading(true);
    try {
      const res = await fetch(`${DAMA_HOST}/dama-admin/${pgEnv}/npmrds/add`, {
        method: "POST",
        body: JSON.stringify(publishData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const publishFinalEvent = await res.json();
      const { source_id } = publishFinalEvent;

      setLoading(false);
      navigate(`/datasources/source/${source_id}`);
    } catch (err) {
      setLoading(false);
    }
  };
  const replaceNpmrds = async () => {
    const raw_remove_view_ids = Object.keys(
      activeView?.metadata.npmrds_raw_view_id_to_year,
    ).filter(
      (rViewId) =>
        activeView?.metadata.npmrds_raw_view_id_to_year[rViewId].toString() ===
        replaceYear,
    );

    const publishData = {
      source_id: source?.source_id || null,
      view_id: activeView?.view_id,
      user_id: ctxUser?.id,
      email: ctxUser?.email,
      npmrds_raw_add_view_ids: [selectedView?.props?.value?.value],
      npmrds_raw_remove_view_ids:raw_remove_view_ids.map(id => parseInt(id)),
      name: source?.name,
      type: "npmrds",
      ...findMinMaxDates(dateRanges),
      replace_year: replaceYear,
      pgEnv,
    };
    setLoading(true);
    try {
      const res = await fetch(`${DAMA_HOST}/dama-admin/${pgEnv}/npmrds/replace`, {
        method: "POST",
        body: JSON.stringify(publishData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const publishFinalEvent = await res.json();
      const { source_id } = publishFinalEvent;

      setLoading(false);
      navigate(`/datasources/source/${source_id}`);
    } catch (err) {
      setLoading(false);
    }
  };
  const rerunMetadata = async (rerunViewId) => {
    const publishData = {
      source_id: source?.source_id || null,
      view_id: activeView?.view_id,
      npmrds_raw_view_ids: [rerunViewId.raw_view_id],
      user_id: ctxUser?.id,
      email: ctxUser?.email,
      year: rerunViewId.start_date.substring(0,4),
      pgEnv,
    };
    const res = await fetch(
      `${DAMA_HOST}/dama-admin/${pgEnv}/npmrds/metadata`,
      {
        method: "POST",
        body: JSON.stringify(publishData),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    await res.json();
  }
  const lengthPath = [
    "dama",
    pgEnv,
    "latest",
    "events",
    "for",
    "source",
    [source?.source_id],
    "length",
  ];
  useEffect(() => {
    async function getCtxs() {
      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama",
        pgEnv,
        "latest",
        "events",
        "for",
        "source",
        [source?.source_id],
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        [
          "etl_status",
          "etl_context_id",
          "created_at",
          "terminated_at",
          "source_id",
          "parent_context_id",
          "type",
          "payload",
          "user",
        ],
      ]);
    }
    getCtxs();
  }, [falcor, pgEnv, source?.source_id]);

  const ctxs = useMemo(
    () =>
      get(falcorCache, [
        "dama",
        pgEnv,
        "latest",
        "events",
        "for",
        "source",
        [source?.source_id],
      ]),
    [falcorCache, source?.source_id]
  );

  useEffect(() => {
    const getEvents = async () => {
      const ctxIds = Object.values(ctxs)
        .map((ctx) => ctx.etl_context_id)
        .filter((ctxId) => !!ctxId);

      ctxIds.forEach(async (ctxId) => {
        await falcor.get([
          "dama",
          pgEnv,
          "etlContexts",
          "byEtlContextId",
          ctxId,
        ]);
      });
    };
    if (ctxs) {
      getEvents();
    }
  }, [ctxs]);

  const ctxsWithEvent = useMemo(
    () => get(falcorCache, ["dama", pgEnv, "etlContexts", "byEtlContextId"]),
    [falcorCache, pgEnv]
  );

  /**
   * KINDA TODO BUG:
   * 
   * Metadata worker is called from add worker
   * add worker returns done. It is the only one that is in the `ctxsWithEvent` resp
   * IDK why the child event is not also in the list.
   * But that means, after data is added, metadata button will be enabled even though its already running!! 
   */
  const openMetadataCtxs = useMemo(() => {
    if (ctxsWithEvent) {
      return Object.values(ctxsWithEvent)
        .map((item) => item?.value)
        .filter((ctx) => OPEN_CTX_STATUSES.includes(ctx.meta.etl_status))
        .filter((ctx) =>
          ctx.events.some((ctxEvent) => ctxEvent.type.includes(METADATA_EVENT_TYPE) || ctxEvent.type.includes(ADD_EVENT_TYPE) || ctxEvent.type.includes(REPLACE_EVENT_TYPE))
        )
        .map((ctx) => ({
          ...ctx,
          raw_view_id: ctx?.events?.[0]?.payload.npmrds_raw_view_ids?.[0],
        }))
        .filter((ctx => ctx.meta._created_timestamp >= moment().subtract(2, 'days').toISOString()));
    }
  }, [falcorCache, falcor, source?.source_id, ctxsWithEvent]);

  useEffect(() => {
    if ((openMetadataCtxs && openMetadataCtxs.length > 0) || (polling && !ctxsWithEvent)) {
      setPolling(true);
    } else {
      setPolling(false);
    }
  }, [openMetadataCtxs, falcorCache]);

  const contextLength = get(falcorCache, lengthPath);
  const doPolling = async () => {
    const fetchContextsPath = [
      "dama",
      pgEnv,
      "latest",
      "events",
      "for",
      "source",
      [source?.source_id],
      { from: 0, to: contextLength - 1 },
      [
        "etl_status",
        "etl_context_id",
        "created_at",
        "terminated_at",
        "source_id",
        "parent_context_id",
        "type",
        "payload",
        "user",
      ],
    ];
    falcor.invalidate(["dama", pgEnv, "etlContexts", "byEtlContextId"]);
    falcor.invalidate(fetchContextsPath);
    await falcor.get(fetchContextsPath);
  };

  //TODO this could be used to show that an `add` is in process as well
  useEffect(() => {
    // -- start polling
    if (polling && !pollingInterval) {
      let id = setInterval(doPolling, 10000);
      setPollingInterval(id);
    }
    // -- stop polling
    else if (pollingInterval && !polling) {
      clearInterval(pollingInterval);
      // run polling one last time in case it never finished
      doPolling();
      setPolling(false);
      setPollingInterval(null);

    }
  }, [polling, pollingInterval]);  

  const removeNpmrds = async (viewId, stateGroup) => {
    const publishData = {
      source_id: source?.source_id || null,
      view_id: activeView?.view_id,
      user_id: ctxUser?.id,
      email: ctxUser?.email,
      npmrds_raw_removed_view_ids: [viewId],
      name: source?.name,
      type: "npmrds",
      ...findMinMaxDates(
        groupbyState[`${stateGroup}`]
          .filter(
            (v) =>
              v &&
              v.metadata &&
              v.metadata.start_date &&
              v.metadata.end_date &&
              v.view_id !== viewId
          )
          .map((dr) => ({
            start_date: dr?.metadata?.start_date,
            end_date: dr?.metadata?.end_date,
          }))
      ),
      pgEnv,
    };

    setLoading(true);
    try {
      const res = await fetch(
        `${DAMA_HOST}/dama-admin/${pgEnv}/npmrds/remove`,
        {
          method: "POST",
          body: JSON.stringify(publishData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const publishFinalEvent = await res.json();
      const { source_id } = publishFinalEvent;

      setLoading(false);
      navigate(`/datasources/source/${source_id}`);
    } catch (err) {
      setLoading(false);
    }
  };

  const buttonDisabledText = useMemo(() => {
    if(openMetadataCtxs && openMetadataCtxs.length > 0){
      const openCtxType = openMetadataCtxs[0]?.events?.[0]?.type.split(":")[0];
      console.log({openCtxType})

      switch(openCtxType) {
        case METADATA_EVENT_TYPE:
          return "Metadata operation in progress..."
        case ADD_EVENT_TYPE:
          return "Add operation in progress..."
        case REPLACE_EVENT_TYPE:
          return "Replace operation in progress..."
        default:
          return "Data operation in progress..."
      }
    }
  }, [openMetadataCtxs]);

  return (
    <div className="w-full p-5">
      <div className="flex m-3">
        <div className="justify-start w-full md:w-1/2 px-3 mb-6 md:mb-0">
          <label className="block uppercase tracking-wide text-gray-700 text-xl font-bold mb-2">
            Input Data
          </label>
        </div>

        <div className="justify-right">
          <button
            className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold mr-3 py-2 px-4 rounded disabled:hover:cursor-not-allowed disabled:opacity-50"
            onClick={() => setShowReplaceModal(true)}
            disabled={(openMetadataCtxs && openMetadataCtxs.length > 0)}
            title={(openMetadataCtxs && openMetadataCtxs.length > 0) ? buttonDisabledText : ""}
          >
            <div style={{ display: "flex" }}>
              <span className="mr-2">Replace</span>
            </div>
          </button>
          <button
            className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:hover:cursor-not-allowed disabled:opacity-50"
            onClick={() => setShowModal(true)}
            disabled={(openMetadataCtxs && openMetadataCtxs.length > 0)}
            title={(openMetadataCtxs && openMetadataCtxs.length > 0) ? buttonDisabledText : ""}
          >
            <div style={{ display: "flex" }}>
              <span className="mr-2">Add</span>
            </div>
          </button>
        </div>
      </div>

      {Object.keys(groupbyState).length ? (
        <div className="overflow-x-auto px-5 py-3">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                {headers.map((key) => (
                  <th
                    key={key}
                    className="py-2 px-4 bg-gray-200 text-left border-b"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupbyState).map((group) => (
                <React.Fragment key={group}>
                  {groupbyState[group].map((item, index) => { 
                    const metaView = metaViews.length ? metaViews?.find(mView => parseInt(mView.year) === parseInt(item?.metadata?.start_date.substring(0, 4))) : {};
                    const openEvents = metaViews.length && openMetadataCtxs ? openMetadataCtxs.filter(ctx => ctx.raw_view_id === item.view_id) : [];
                    const hasOpenMetadataEvent = openEvents.length > 0;
                    return (
                      <tr key={index}>
                        {index === 0 && (
                          <td
                            rowSpan={groupbyState[group].length}
                            className="py-2 px-4 border-b font-bold"
                          >
                            {group}
                          </td>
                        )}
                        <td
                          key={`${group}.${item?.view_id}`}
                          className="py-2 px-4 border-b"
                        >
                          {item?.view_id}
                        </td>
                        <td
                          key={`${group}.${item?.view_id}_meta_view_id`}
                          className="py-2 px-4 border-b"
                        >
                          {metaViews.length && (metaView?.meta_view_id)}
                        </td>
                        <td
                          key={`npmrds_version_${group}.${item?.metadata?.npmrds_version}`}
                          className="py-2 px-4 border-b"
                        >
                          {item?.metadata?.npmrds_version}
                        </td>
                        <td
                          key={`start_date_${group}.${item?.metadata?.start_date}`}
                          className="py-2 px-4 border-b"
                        >
                          {item?.metadata?.start_date}
                        </td>
                        <td
                          key={`end_date_${group}.${item?.metadata?.end_date}`}
                          className="py-2 px-4 border-b"
                        >
                          {item?.metadata?.end_date}
                        </td>
                        <td
                          key={`${group}.${item?.metadata?.no_of_tmc_metadata}`}
                          className="py-2 px-4 border-b"
                        >
                          {metaViews.length  && metaViews.find(mView => parseInt(mView.year) === parseInt(item.metadata.start_date.substring(0, 4)))?.num_tmc}
                        </td>
                        <td
                          key={`${group}.${item?.metadata?.no_of_tmc}`}
                          className="py-2 px-4 border-b"
                        >
                          {item?.metadata?.no_of_tmc}
                        </td>
                        <td
                          key={`${group}.${item?.statistics?.total}`}
                          className="py-2 px-4 border-b"
                        >
                          {Math.round(item?.statistics?.total * 100) / 100}
                        </td>
                        <td
                          key={`${group}.${item?.statistics?.interstate_percentage}`}
                          className="py-2 px-4 border-b"
                        >
                          {Math.round(item?.statistics?.interstate_percentage * 100) / 100}
                        </td>
                        <td
                          key={`${group}.${item?.statistics?.non_interstate_percentage}`}
                          className="py-2 px-4 border-b"
                        >
                          {Math.round(item?.statistics?.non_interstate_percentage * 100) / 100}
                        </td>
                        <td
                          key={`${group}.${item?.statistics?.extended_tmc_percentage}`}
                          className="py-2 px-4 border-b"
                        >
                          {Math.round(item?.statistics?.extended_tmc_percentage * 100) / 100}
                        </td>
                        {index === 0 ||
                        index === groupbyState[group].length - 1 ? (
                          <>
                            <td
                              key={`${group}.${index}`}
                              className="py-2 px-4 border-b"
                            >
                              <button
                                className="relative align-middle select-none font-sans font-medium text-center uppercase transition-all disabled:hover:cursor-not-allowed disabled:opacity-50 w-10 max-w-[40px] h-10 max-h-[40px] rounded-lg text-xs bg-red-500 text-white shadow-md shadow-red-900/10 hover:shadow-lg hover:shadow-red-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                                type="button"
                                disabled={polling}
                                title={polling ? buttonDisabledText : ""}
                                onClick={() => {
                                  setRemoveViewId(item?.view_id);
                                  setRemoveStateKey(group);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <span className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                                  <i
                                    className="fad fa-trash"
                                    aria-hidden="true"
                                  ></i>
                                </span>
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td
                              key={`${group}.${index}`}
                              className="py-2 px-4 border-b"
                            ></td>
                          </>
                        )}
                        <td
                          key={`${group}.${index}`}
                          className="py-2 px-4 border-b"
                        >
                          <button
                            className="relative cursor-pointer align-middle select-none font-sans font-medium text-center uppercase transition-all disabled:hover:cursor-not-allowed disabled:opacity-50 w-10 max-w-[40px] h-10 max-h-[40px] rounded-lg text-xs bg-blue-500 text-white shadow-md shadow-blue-900/10 hover:shadow-lg hover:shadow-blue-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                            type="button"
                            disabled={polling}
                            title={polling ? buttonDisabledText : ""}
                            onClick={() => {
                              console.log("RERRUN -- ITEM::", item)
                              setRerunViewId({raw_view_id: item?.view_id, start_date: item.metadata.start_date, end_date:item.metadata.end_date, year: item.metadata.start_date.substring(0, 4)  });
                              setShowReRunModal(true);
                            }}
                          >
                            <span className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                              <i
                                className={hasOpenMetadataEvent ? "fa-solid fa-spin fa-spinner" : "fad fa-rotate"}
                                aria-hidden="true"
                              ></i>
                            </span>
                          </button>
                        </td>
                      </tr>)
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-red-400"
          role="alert"
        >
          <span className="font-medium">
            Please! Add npmrds by clicking Add button
          </span>
        </div>
      )}

      <Dialog
        as="div"
        className="relative z-50"
        open={showModal}
        onClose={() => setShowModal(false)}
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <DialogPanel>
            <div className="inline-block w-full min-w-xl max-w-xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <DialogTitle
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Add Npmrds
              </DialogTitle>

              {availableViewOptions && availableViewOptions.length > 0 ? (
                <div className="relative p-6 flex-auto">
                  {msgString ? (
                    <>
                      <div
                        className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                        role="alert"
                      >
                        <span className="font-medium">{msgString}</span>
                      </div>
                    </>
                  ) : null}
                  <Select
                    options={availableViewOptions}
                    onChange={setSelectedView}
                    value={selectedView}
                    themeOptions={{color: 'white'}}
                    className = 'min-w-[479px] border border-gray-300 rounded-md'
                  />
                </div>
              ) : (
                <>
                  <div
                    className="p-4 m-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                    role="alert"
                  >
                    <span className="font-medium">
                      {"Npmrds Data for the Addition is not available."}
                    </span>
                  </div>
                </>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 duration-300"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                {selectedView && isValidDateRage ? (
                  <button
                    className="ml-3 inline-flex justify-center px-4 py-2 text-sm text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 duration-300"
                    type="button"
                    onClick={updateNpmrds}
                  >
                    {loading ? (
                      <div style={{ display: "flex" }}>
                        <div className="mr-2">Saving...</div>
                        <ScalableLoading scale={0.25} color={"#fefefe"} />
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        as="div"
        className="relative z-50"
        open={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <DialogPanel>
            <div className="inline-block w-full min-w-xl max-w-xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <DialogTitle
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Replace full year of NPMRDS data
              </DialogTitle>
                <div className="relative p-6 flex-auto">
                  <div className="text-sm">Year to replace</div>
                  <Select
                    options={allSourceYears}
                    onChange={setReplaceYear}
                    value={replaceYear}
                    themeOptions={{color: 'white'}}
                    className = 'min-w-[479px] border border-gray-300 rounded-md'
                  />
                </div>
              {availableReplaceViewOptions && availableReplaceViewOptions.length > 0 ? (
                <div className="relative p-6 flex-auto">
                  <div className="text-sm">Raw data view to insert</div>
                  <Select
                    options={availableReplaceViewOptions}
                    onChange={setSelectedView}
                    value={selectedView}
                    themeOptions={{color: 'white'}}
                    className = 'min-w-[479px] border border-gray-300 rounded-md'
                  />
                </div>
              ) : (
                <>
                  <div
                    className="p-4 m-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                    role="alert"
                  >
                    <span className="font-medium">
                      {"Npmrds Data for the replace is not available."}
                    </span>
                  </div>
                </>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 duration-300"
                  onClick={() => setShowReplaceModal(false)}
                >
                  Close
                </button>
                {selectedView ? (
                  <button
                    className="ml-3 inline-flex justify-center px-4 py-2 text-sm text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 duration-300"
                    type="button"
                    onClick={replaceNpmrds}
                  >
                    {loading ? (
                      <div style={{ display: "flex" }}>
                        <div className="mr-2">Saving...</div>
                        <ScalableLoading scale={0.25} color={"#fefefe"} />
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        as="div"
        className="relative z-50"
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <DialogPanel>
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <DialogTitle
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Remove Npmrds
              </DialogTitle>

              <div className="relative p-6 flex-auto">
                <div className="p-4 m-2 text-sm" role="alert">
                  <span className="font-medium">
                    Are you sure you want to Remove?
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 duration-300"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="ml-3 inline-flex justify-center px-4 py-2 text-sm text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 duration-300"
                  onClick={async () => {
                    await removeNpmrds(removeViewId, removeStateKey);
                    setShowDeleteModal(false);
                  }}
                >
                  {loading ? (
                    <div style={{ display: "flex" }}>
                      <div className="mr-2">Deleting...</div>
                      <ScalableLoading scale={0.25} color={"#fefefe"} />
                    </div>
                  ) : (
                    "Yes"
                  )}
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        as="div"
        className="relative z-50"
        open={showReRunModal}
        onClose={() => setShowReRunModal(false)}
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <DialogPanel>
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <DialogTitle
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Re-run Metadata Processing Npmrds
              </DialogTitle>

              <div className="relative p-6 flex-auto">
                <div className="p-4 m-2 text-sm" role="alert">
                  <span className="font-medium">
                    Are you sure you want to re-run metadata for dates <b>{rerunViewId?.start_date} thru {rerunViewId?.end_date} </b> ( raw view id { rerunViewId?.raw_view_id } ) ?
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 duration-300"
                  onClick={() => setShowReRunModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="ml-3 inline-flex justify-center px-4 py-2 text-sm text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 duration-300"
                  onClick={async () => {
                    rerunMetadata(rerunViewId);
                    setPolling(true);
                    doPolling();
                    setShowReRunModal(false);
                  }}
                >
                  Re-Run
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
