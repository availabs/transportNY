import React, { useState, useEffect, useMemo, useContext, Fragment } from "react";
import { useNavigate } from "react-router";
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    Input
} from "@headlessui/react";
import { get } from "lodash";
import DatePicker from "react-datepicker";
import moment from "moment";

import { DamaContext } from "~/pages/DataManager/store";
import { DAMA_HOST } from "~/config";
import { useFalcor, ScalableLoading } from "~/modules/avl-components/src";

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

function checkAndMergeDateRanges(
    currentStartDate,
    currentEndDate,
    startDate,
    endDate
) {
    const momentNewStart = moment(startDate);
    const momentNewEnd = moment(endDate);

    // Special case: If the current range is not defined (both null), approve the new range
    if (!currentStartDate && !currentEndDate) {
        return {
            msgString: `New range approved: from ${momentNewStart.format(
                "YYYY-MM-DD"
            )} to ${momentNewEnd.format("YYYY-MM-DD")}`,
            isValid: true,
            mergedRange: {
                start_date: momentNewStart.format("YYYY-MM-DD"),
                end_date: momentNewEnd.format("YYYY-MM-DD"),
            },
        };
    }

    // Validation 1: Ensure endDate is greater than startDate
    if (!momentNewEnd.isAfter(momentNewStart)) {
        return {
            msgString: "New end date must be greater than the new start date",
            isValid: false,
        };
    }

    // Validation 2: Ensure dates are valid month ranges
    if (
        !momentNewStart.isSame(momentNewStart.startOf("month")) ||
        !momentNewEnd.isSame(momentNewEnd.endOf("month"))
    ) {
        return {
            msgString: "Dates must be full month ranges (start: 1st, end: last day)",
            isValid: false,
        };
    }

    const momentCurrentStart = moment(currentStartDate);
    const momentCurrentEnd = moment(currentEndDate);

    // Validation 3: Ensure the current end date is greater than the current start date
    if (!momentCurrentEnd.isAfter(momentCurrentStart)) {
        return {
            msgString: "Current end date must be greater than the current start date",
            isValid: false,
        };
    }

    // Validation 4: Check if the new range overlaps with the current range
    if (
        momentNewStart.isBetween(momentCurrentStart, momentCurrentEnd, null, "[]") ||
        momentNewEnd.isBetween(momentCurrentStart, momentCurrentEnd, null, "[]") ||
        momentCurrentStart.isBetween(momentNewStart, momentNewEnd, null, "[]") ||
        momentCurrentEnd.isBetween(momentNewStart, momentNewEnd, null, "[]")
    ) {
        return {
            msgString: "New date range overlaps with the current range",
            isValid: false,
        };
    }

    // Validation 5: Check if the new range is contiguous with the current range
    const isContiguousAtStart = momentNewEnd.isSame(
        momentCurrentStart.clone().subtract(1, "month").endOf("month")
    );
    const isContiguousAtEnd = momentNewStart.isSame(
        momentCurrentEnd.clone().add(1, "month").startOf("month")
    );

    if (!isContiguousAtStart && !isContiguousAtEnd) {
        return {
            msgString: "New date range is not contiguous with the current range",
            isValid: false,
        };
    }

    // If all validations pass, merge the ranges
    const mergedStartDate = isContiguousAtStart
        ? momentNewStart.format("YYYY-MM-DD")
        : momentCurrentStart.format("YYYY-MM-DD");
    const mergedEndDate = isContiguousAtEnd
        ? momentNewEnd.format("YYYY-MM-DD")
        : momentCurrentEnd.format("YYYY-MM-DD");

    return {
        msgString: `Successfully merged range: from ${mergedStartDate} to ${mergedEndDate}`,
        isValid: true,
        mergedRange: { start_date: mergedStartDate, end_date: mergedEndDate },
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

    const { npmrds_production_source_id, npmrds_production_view_id, transcom_source_id } = useMemo(() => {
        return activeView?.metadata || {};
    }, [activeView]);

    const { startDate, endDate } = useMemo(() => ({
        startDate: activeView?.metadata?.start_date,
        endDate: activeView?.metadata?.end_date
    }), [activeView]);

    // -----------------------------------------------------------------------------------------------------------------------
    const geomSource = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v?.value, { "attributes": {} })["attributes"]))
            .find(f => Number(f?.source_id) === Number(npmrds_production_source_id))
    }, [falcorCache, pgEnv, npmrds_production_source_id]);

    useEffect(() => {
        async function fetchData() {
            const geomLengthPath = ["dama", pgEnv, "sources", "byId", npmrds_production_source_id, "views", "length"];
            const geomViewsLen = await falcor.get(geomLengthPath);

            await falcor.get([
                "dama", pgEnv, "sources", "byId", npmrds_production_source_id, "views", "byIndex",
                { from: 0, to: get(geomViewsLen.json, geomLengthPath, 0) - 1 },
                "attributes", ['view_id', 'version', 'metadata']
            ]);
        }
        fetchData();
    }, [falcor, pgEnv, npmrds_production_source_id]);

    const geomView = useMemo(() => {
        return npmrds_production_source_id && (Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", npmrds_production_source_id, "views", "byIndex"], {}))
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
            .find(f => Number(f?.view_id) === Number(npmrds_production_view_id));
    }, [falcorCache, pgEnv, npmrds_production_view_id]);

    const minTime = useMemo(() => {
        return moment(geomView?.metadata?.start_date).toDate();
    }, [geomView?.metadata?.start_date]);

    const maxTime = useMemo(() => {
        return moment(geomView?.metadata?.end_date).toDate();
    }, [geomView?.metadata?.end_date]);

    useEffect(() => {
        setstartTime(startDate ? moment(startDate).toDate() : geomView?.metadata?.start_date ? moment(geomView?.metadata?.start_date).toDate() : null);
        setendTime(endDate ? moment(endDate).toDate() : geomView?.metadata?.end_date ? moment(geomView?.metadata?.end_date).toDate() : null);
    }, [startDate, endDate, geomView?.metadata?.start_date, geomView?.metadata?.end_date]);

    // -----------------------------------------------------------------------------------------------------------------------
    const { msgString, isValid, mergedRange } = useMemo(() => {
        return { ...(checkAndMergeDateRanges(startDate, endDate, moment(startTime).startOf("month").format("YYYY-MM-DD"), moment(endTime).endOf("month").format("YYYY-MM-DD")) || {}) };
    }, [startDate, endDate, startTime, endTime]);

    const headers = [
        "Start Date",
        "End Date",
        "",
    ];

    const update = async () => {
        const publishData = {
            source_id: source?.source_id || null,
            view_id: activeView?.view_id,
            user_id: ctxUser?.user_id,
            pgEnv,
            start_date: mergedRange?.start_date,
            end_date: mergedRange?.end_date,
            selectedGeomSourceId: geomSource?.source_id,
            selectedGeomViewId: geomView?.view_id,
            transcom_source_id
        };
        setLoading(true);
        try {
            const res = await fetch(`${DAMA_HOST}/dama-admin/${pgEnv}/excessive_delay/add`, {
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

                            {!isValid && geomSource && geomView ? <>
                                <div className="flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-white dark:text-red-400 dark:border-red-800" role="alert">
                                    <div>
                                        <span className="font-medium">
                                            {msgString}
                                        </span>
                                    </div>
                                </div></> : <>
                                <div className="flex items-center p-4 mb-4 text-sm text-green-800 border border-green-300 rounded-lg bg-green-50 dark:bg-white dark:text-green-400 dark:border-green-800" role="alert">
                                    <div>
                                        <span className="font-medium">{msgString}</span>
                                    </div>
                                </div>
                            </>}
                            <div className="flex flex-row mt-4 mb-6">
                                <div className="basis-1/3"></div>
                                <div className="basis-1/3">
                                    <div className="flex items-center justify-left mt-4">
                                        <div className="w-full max-w-xs mx-auto">
                                            <div className="block text-sm leading-5 font-medium text-gray-700">
                                                NPMRDS source:
                                            </div>
                                            <div className="relative">

                                                <Input
                                                    className={
                                                        'cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm'}
                                                    value={geomSource ? geomSource?.name : 'Fetching source...'}
                                                    onChange={() => { }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="basis-1/3"></div>
                            </div>

                            {
                                geomSource && geomView ? <div className="flex flex-row mt-4 mb-6">
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
                                                        selected={startTime || minTime}
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
                                                        selected={endTime || maxTime}
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
                                {isValid ? <button
                                    className="ml-3 inline-flex justify-center px-4 py-2 text-sm text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 duration-300"
                                    type="button"
                                    onClick={update}
                                >
                                    {loading ? (
                                        <div style={{ display: "flex" }}>
                                            <div className="mr-2">Saving...</div>
                                            <ScalableLoading scale={0.25} color={"#fefefe"} />
                                        </div>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </button> : null}


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