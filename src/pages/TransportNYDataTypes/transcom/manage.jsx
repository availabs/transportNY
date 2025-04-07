import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { get } from "lodash";
import DatePicker from "react-datepicker";
import moment from "moment";

import { DamaContext } from "~/pages/DataManager/store";
import { DAMA_HOST } from "~/config";
import { useFalcor, ScalableLoading } from "~/modules/avl-components/src";

function checkAndMergeDateRanges(
    currentStartDate,
    currentEndDate,
    startDate,
    endDate
) {
    if (!currentStartDate || !currentEndDate || !startDate || !endDate) {
        return {
            msgString: "Invalid Dates",
            isValid: false,
        };
    }
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
        !momentNewStart.isSame(momentNewStart.startOf("day")) ||
        !momentNewEnd.isSame(momentNewEnd.endOf("day"))
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
        momentCurrentStart.clone().subtract(1, "day").endOf("day")
    );
    const isContiguousAtEnd = momentNewStart.isSame(
        momentCurrentEnd.clone().add(1, "day").startOf("day")
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
        mergedRange: { start_date: mergedStartDate, end_date: mergedEndDate }
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

export default function Manage({
    source,
    views,
    activeViewId
}) {
    const { user: ctxUser, pgEnv } = useContext(DamaContext);
    const navigate = useNavigate();
    
    const [loading, setLoading] = React.useState(false);
    const [startTime, setstartTime] = useState(null);
    const [endTime, setendTime] = useState(null);

    const activeView = useMemo(() => {
        return views.find((v) => Number(v.view_id) === Number(activeViewId));
    }, [activeViewId, views]);

    const { startDate, endDate } = useMemo(() => ({
        startDate: source?.metadata?.start_date,
        endDate: source?.metadata?.end_date
    }), [source]);


    // -----------------------------------------------------------------------------------------------------------------------
    useEffect(() => {
        setstartTime(startDate ? moment(startDate).toDate() : activeView?.metadata?.start_date ? moment(geomView?.metadata?.start_date).toDate() : null);
        setendTime(endDate ? moment(endDate).toDate() : activeView?.metadata?.end_date ? moment(geomView?.metadata?.end_date).toDate() : null);
    }, []);
    // -----------------------------------------------------------------------------------------------------------------------
    
    const { msgString, isValid } = useMemo(() => {
        return { ...(checkAndMergeDateRanges(moment(startDate).startOf('day').toDate(), moment(endDate).endOf('day').toDate(), moment(startTime).startOf("day").toDate(), moment(endTime).endOf("day").toDate()) || {}) };
    }, [startTime, endTime]);

    const update = async () => {
        const publishData = {
            source_id: source?.source_id || null,
            view_id: activeViewId,
            user_id: ctxUser?.id,
            email: ctxUser?.email,
            pgEnv,
            start_date: moment(startTime).startOf("day").toDate(),
            end_date: moment(endTime).endOf("day").toDate(),
        };
        
        setLoading(true);
        try {
            const res = await fetch(`${DAMA_HOST}/dama-admin/${pgEnv}/transcom/add`, {
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

    return (
        <div className="w-full p-5">
            <div className="flex m-3">
                <div className="justify-start w-full md:w-1/2 px-3 mb-6 md:mb-0">
                    <label className="block uppercase tracking-wide text-gray-700 text-xl font-bold mb-2">
                        Input Data
                    </label>
                </div>
            </div>
            <div className="w-full p-5 m-5">
                <div className="flex flex-row mt-4 mb-6">
                    <div className="basis-1/4"></div>
                    {!isValid ? <>
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
                    <div className="basis-1/4"></div>
                </div>
                <div className="flex flex-row mt-4 mb-6">
                    <div className="basis-1/2">
                        <div className="flex items-center justify-left mt-4">
                            <div className="w-full max-w-xs mx-auto">
                                <div className="block text-sm leading-5 font-medium text-gray-700">
                                    Start Time:
                                </div>
                                <div className="relative w-full max-w-sm">
                                    <DatePicker
                                        className={"w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm"}
                                        dateFormat="MM/dd/yyyy"
                                        required
                                        showIcon
                                        toggleCalendarOnIconClick
                                        selected={startTime}
                                        onChange={(date) => setstartTime(date)}
                                        isClearable
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
                                        dateFormat="MM/dd/yyyy"
                                        required
                                        showIcon
                                        toggleCalendarOnIconClick
                                        selected={endTime}
                                        onChange={(date) => setendTime(date)}
                                        isClearable
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
    );
}