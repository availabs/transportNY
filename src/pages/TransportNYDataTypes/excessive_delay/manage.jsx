import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogPanel,
    DialogTitle,
} from "@headlessui/react";
import { get } from "lodash";
import DatePicker from "react-datepicker";
import moment from "moment";

import { DamaContext } from "~/pages/DataManager/store";
import { DAMA_HOST } from "~/config";
import { useFalcor, ScalableLoading } from "~/modules/avl-components/src";
import { Select } from './create';

function getMonthlyDateRanges(startDate, endDate) {
    const ranges = [];
    let current = moment(startDate);

    while (current.isSameOrBefore(endDate, 'month')) {
        ranges.push({
            startDate: current.startOf('month').format('YYYY-MM-DD'),
            endDate: current.endOf('month').isAfter(endDate)
                ? moment(endDate).format('YYYY-MM-DD')
                : current.endOf('month').format('YYYY-MM-DD')
        });

        current.add(1, 'month');
    }

    return ranges;
}

function checkAndMergeDateRanges(currentStartDate, currentEndDate, startTime, endTime) {
    const currentStart = new Date(currentStartDate);
    const currentEnd = new Date(currentEndDate);
    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);
  
    if (isNaN(currentStart) || isNaN(currentEnd) || isNaN(newStart) || isNaN(newEnd)) {
      return {
        msgString: "One or more dates are invalid.",
        isValidDateRange: false
      };
    }

    if ((newStart < currentStart && newEnd < currentStart) || (newStart > currentEnd && newEnd > currentEnd)) {
      return {
        msgString: `The new date range (${newStart.toISOString()} to ${newEnd.toISOString()}) is valid and continuous.`,
        isValidDateRange: true
      };
    }

    return {
      msgString: "The new date range is not valid. It overlaps or touches the current range.",
      isValidDateRange: false
    };
  }

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


export default function NpmrdsManage({
    source,
    views,
    activeViewId
}) {
    const { user: ctxUser, pgEnv } = useContext(DamaContext);
    const { falcor, falcorCache } = useFalcor();
    const navigate = useNavigate();

    const [showModal, setShowModal] = React.useState(false);
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [selectedGeomSource, setselectedGeomSource] = useState(null);
    const [removeStartDate, setRemoveStartDate] = React.useState(null);
    const [removeEndDate, setRemoveEndDate] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [startTime, setstartTime] = useState(null);
    const [endTime, setendTime] = useState(null);

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

    const activeView = useMemo(() => {
        return views.find((v) => Number(v.view_id) === Number(activeViewId));
    }, [activeViewId, views]);

    const { startDate, endDate } = useMemo(() => ({
        startDate: activeView?.metadata?.start_date,
        endDate: activeView?.metadata?.end_date
    }), [activeView]);

    // -----------------------------------------------------------------------------------------------------------------------
    const geomSources = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v?.value, { "attributes": {} })["attributes"]))
            .filter(s => s.type && (s.type === "NPMRDS" || s.type === "npmrds"))
    }, [falcorCache, pgEnv]);

    console.log();


    useEffect(() => {
        async function fetchData() {
            const geomLengthPath = ["dama", pgEnv, "sources", "byId", selectedGeomSource?.source_id, "views", "length"];
            const geomViewsLen = await falcor.get(geomLengthPath);

            await falcor.get([
                "dama", pgEnv, "sources", "byId", selectedGeomSource?.source_id, "views", "byIndex",
                { from: 0, to: get(geomViewsLen.json, geomLengthPath, 0) - 1 },
                "attributes", ['view_id', 'version', 'metadata']
            ]);
        }
        fetchData();
    }, [falcor, pgEnv, selectedGeomSource]);

    const geomView = useMemo(() => {
        return selectedGeomSource?.source_id && (Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", selectedGeomSource?.source_id, "views", "byIndex"], {}))
            .map(v =>
                Object.entries(get(falcorCache, v?.value, { "attributes": {} })["attributes"])
                    .reduce((out, attr) => {
                        const [k, v] = attr
                        typeof v.value !== 'undefined' ?
                            out[k] = v?.value :
                            out[k] = v
                        return out
                    }, {})
            ))
            .filter(f => f.metadata?.start_date && f?.metadata?.end_date)
            .find(f => f.metadata?.is_clickhouse_table === 1);
    }, [falcorCache, selectedGeomSource, pgEnv]);

    useEffect(() => {
        if (!selectedGeomSource) {
            setselectedGeomSource((geomSources.length && geomSources[0]));
        }
    }, [geomSources]);

    const minTime = useMemo(() => {
        return moment(geomView?.metadata?.start_date).toDate();
    }, [geomView]);

    const maxTime = useMemo(() => {
        return moment(geomView?.metadata?.end_date).toDate();
    }, [geomView]);

    useEffect(() => {
        setstartTime(moment(startDate).toDate() || null);
        setendTime(moment(endDate).toDate() || null);
    }, [startDate, endDate]);

    // -----------------------------------------------------------------------------------------------------------------------

    const { msgString, isValidDateRage } = useMemo(() => {
        return { ...(checkAndMergeDateRanges(startDate, endDate, startTime, endTime) || {}) };
    }, [startDate, endDate, startTime, endTime]);

console.log("msgString, isValidDateRage", msgString, isValidDateRage);

    const headers = [
        "Start Date",
        "End Date",
        "",
    ];

    // const updateNpmrds = async () => {
    //     const publishData = {
    //         source_id: source?.source_id || null,
    //         view_id: activeView?.view_id,
    //         user_id: ctxUser?.user_id,
    //         npmrds_raw_view_ids: selectedViews.map((svs) => svs.value),
    //         name: source?.name,
    //         type: "npmrds",
    //         ...findMinMaxDates(dateRanges),
    //         pgEnv,
    //     };
    //     setLoading(true);
    //     try {
    //         const res = await fetch(`${DAMA_HOST}/dama-admin/${pgEnv}/npmrds/add`, {
    //             method: "POST",
    //             body: JSON.stringify(publishData),
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //         });
    //         const publishFinalEvent = await res.json();
    //         const { source_id } = publishFinalEvent;

    //         setLoading(false);
    //         navigate(`/datasources/source/${source_id}`);
    //     } catch (err) {
    //         setLoading(false);
    //     }
    // };

    const remove = async (view_id, startDate, endDate) => {
        const publishData = {
            pgEnv,
            view_id,
            startDate,
            endDate,
            user_id: ctxUser?.user_id,
            source_id: source?.source_id || null,
        };

        setLoading(true);
        try {
            const res = await fetch(
                `${DAMA_HOST}/dama-admin/${pgEnv}/excessive_delay/remove`,
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

    const monthlyDateRange = getMonthlyDateRanges(startDate, endDate);

    console.log("monthlyDateRange", monthlyDateRange);

    return (
        <div className="w-full p-5">
            <div className="flex m-3">
                <div className="justify-start w-full md:w-1/2 px-3 mb-6 md:mb-0">
                    <label className="block uppercase tracking-wide text-gray-700 text-xl font-bold mb-2">
                        Input Data
                    </label>
                </div>

                <div className="mr-0">
                    <button
                        className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => setShowModal(true)}
                    >
                        <div style={{ display: "flex" }}>
                            <span className="mr-2">Add</span>
                        </div>
                    </button>
                </div>
            </div>

            {monthlyDateRange.length ? (
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

                            {monthlyDateRange.map((item, index) => (
                                <tr key={index}>
                                    <td
                                        key={`${item?.startDate}`}
                                        className="py-2 px-4 border-b"
                                    >
                                        {item?.startDate}
                                    </td>
                                    <td
                                        key={`${item?.endDate}`}
                                        className="py-2 px-4 border-b"
                                    >
                                        {item?.endDate}
                                    </td>

                                    {index === 0 ||
                                        index === monthlyDateRange.length - 1 ? (
                                        <>
                                            <td
                                                key={`${index}`}
                                                className="py-2 px-4 border-b"
                                            >
                                                <button
                                                    className="relative align-middle select-none font-sans font-medium text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none w-10 max-w-[40px] h-10 max-h-[40px] rounded-lg text-xs bg-red-500 text-white shadow-md shadow-red-900/10 hover:shadow-lg hover:shadow-red-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                                                    type="button"
                                                    onClick={() => {
                                                        setRemoveStartDate(item?.startDate);
                                                        setRemoveEndDate(item?.endDate);
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
                                                key={`${index}`}
                                                className="py-2 px-4 border-b"
                                            ></td>
                                        </>
                                    )}
                                </tr>
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
                        Please! Add interval by clicking Add button
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
                                Add Intervals
                            </DialogTitle>

                            <div className="flex flex-row mt-4 mb-6">
                                <div className="basis-1/3"></div>
                                <div className="basis-1/3">
                                    <div className="flex items-center justify-left mt-4">
                                        <div className="w-full max-w-xs mx-auto">
                                            <div className="block text-sm leading-5 font-medium text-gray-700">
                                                NPMRDS source:
                                            </div>
                                            <div className="relative">
                                                <Select
                                                    selectedOption={selectedGeomSource}
                                                    options={geomSources || []}
                                                    setSelecteOptions={setselectedGeomSource}
                                                    visibleField={"name"}
                                                    defaultText={"Select Tmc meta source..."}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="basis-1/3"></div>
                            </div>

                            {
                                selectedGeomSource && geomView ? <div className="flex flex-row mt-4 mb-6">
                                    <div className="basis-1/2 mr-4">
                                        <div className="flex items-center justify-left mt-4">
                                            <div className="w-full max-w-xs mx-auto">
                                                <div className="block text-sm leading-5 font-medium text-gray-700">
                                                    Start Time:
                                                </div>
                                                <div className="relative">
                                                    <DatePicker
                                                        className={"w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm"}
                                                        dateFormat="MM/yyyy"
                                                        required
                                                        showIcon
                                                        toggleCalendarOnIconClick
                                                        selected={startTime}
                                                        onChange={(date) => setstartTime(date)}
                                                        minDate={minTime}
                                                        maxDate={maxTime}
                                                        isClearable
                                                        showMonthYearPicker
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="basis-1/2">
                                        <div className="flex items-center justify-left mt-4">
                                            <div className="w-full max-w-xs mx-auto">
                                                <div className="block text-sm leading-5 font-medium text-gray-700">
                                                    End Time:
                                                </div>
                                                <div className="relative">
                                                    <DatePicker
                                                        className={"w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm"}
                                                        dateFormat="MM/yyyy"
                                                        required
                                                        showIcon
                                                        toggleCalendarOnIconClick
                                                        selected={endTime}
                                                        onChange={(date) => setendTime(date)}
                                                        minDate={minTime}
                                                        maxDate={maxTime}
                                                        isClearable
                                                        showMonthYearPicker
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div> : <>
                                    <span>
                                        Npmrds source is not used for excessive delay calculation
                                    </span></>
                            }
                            <div className="mt-4">
                                <button
                                    type="button"
                                    className="inline-flex justify-center px-4 py-2 text-sm text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 duration-300"
                                    onClick={() => setShowModal(false)}
                                >
                                    Close
                                </button>

                                <button
                                    className="ml-3 inline-flex justify-center px-4 py-2 text-sm text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 duration-300"
                                    type="button"
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
                                Remove Month
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
                                        await remove(activeViewId, removeStartDate, removeEndDate);
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
        </div>
    );
}