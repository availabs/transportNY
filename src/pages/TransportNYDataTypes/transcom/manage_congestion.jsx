import React, { useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router";
import moment from "moment";
import {
    Dialog,
    DialogPanel,
    DialogTitle,
} from "@headlessui/react";

import { DamaContext } from "~/pages/DataManager/store";
import { DAMA_HOST } from "~/config";
import { ScalableLoading } from "~/modules/avl-components/src";


export default function ManageCongestion({
    source,
    views,
    activeViewId
}) {
    const { user: ctxUser, pgEnv } = useContext(DamaContext);
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState(false);
    const [processingStartDate, setProcessingStartDate] = useState(null);
    const [processingEndDate, setProcessingEndDate] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const activeView = useMemo(() => {
        return views.find((v) => Number(v.view_id) === Number(activeViewId));
    }, [activeViewId, views]);

    const update = async () => {
        const publishData = {
            source_id: source?.source_id || null,
            view_id: activeViewId,
            user_id: ctxUser?.id,
            email: ctxUser?.email,
            pgEnv,
            start_date: moment(processingStartDate).startOf("day").toDate(),
            end_date: moment(processingEndDate).endOf("day").toDate(),
        };

        setLoading(true);
        try {
            const res = await fetch(`${DAMA_HOST}/dama-admin/${pgEnv}/transcom/congestion/add`, {
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

    const headers = [
        "Start Date",
        "End Date",
        ""
    ];
    const intervals = useMemo(() => {
        return activeView?.metadata?.congestion;
    }, [activeView]);
    
    return (
        <div className="w-full p-5">
            <div className="flex m-3">
                <div className="justify-start w-full md:w-1/2 px-3 mb-6 md:mb-0">
                    <label className="block uppercase tracking-wide text-gray-700 text-xl font-bold mb-2">
                        Input Data
                    </label>
                </div>

                <div className="justify-right">
                </div>
            </div>
            <div className="w-full pr-5 mr-5">
                {(intervals || []).length ? (
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
                                {intervals.map((it, ind) => (
                                    <tr key={ind}>
                                        <td
                                            key={`${it?.start_date}.${activeView?.view_id}`}
                                            className="py-2 px-4 border-b"
                                        >
                                            {it?.start_date}
                                        </td>
                                        <td
                                            key={`${it?.end_date}.${activeView?.view_id}`}
                                            className="py-2 px-4 border-b"
                                        >
                                            {it?.end_date}
                                        </td>

                                        <td
                                            key={`add.${ind}`}
                                            className="py-2 px-4 border-b"
                                        >
                                            {!(it.is_congestion_data_available) ? 
                                            <button
                                                className="relative align-middle select-none font-sans font-medium text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none w-10 max-w-[40px] h-10 max-h-[40px] rounded-lg text-xs bg-green-500 text-white shadow-md shadow-green-900/10 hover:shadow-lg hover:shadow-green-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                                                type="button"
                                                onClick={() => {
                                                    setProcessingStartDate(it?.start_date);
                                                    setProcessingEndDate(it?.end_date);
                                                    setShowModal(true);
                                                }}
                                            >
                                                <span className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                                                    <i className="fas fa-save" aria-hidden="true"></i>
                                                </span>
                                            </button>: <><span className="top-1/2 left-1/2">
                                                    {" Congestion data available"}
                                                </span></>}

                                        </td>
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
                            No data available
                        </span>
                    </div>
                )}

            </div>

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
                        <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                            <DialogTitle
                                as="h3"
                                className="text-lg font-medium leading-6 text-gray-900"
                            >
                                Add Congestion Data
                            </DialogTitle>

                            <div className="relative p-6 flex-auto">
                                <div className="pr-2 mr-2 text-sm" role="alert">
                                    <span className="font-medium">
                                        Are you sure you want to add Congestion data from{' '}
                                        <span className="font-semibold text-base">{processingStartDate}</span> to{' '}
                                        <span className="font-semibold text-base">{processingEndDate}</span>?
                                    </span>

                                </div>
                            </div>
                            <div className="mt-4">
                                <button
                                    type="button"
                                    className="inline-flex justify-center px-4 py-2 text-sm text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 duration-300"
                                    onClick={() => setShowModal(false)}
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    className="ml-3 inline-flex justify-center px-4 py-2 text-sm text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 duration-300"
                                    onClick={async () => {
                                        await update();
                                        setShowModal(false);
                                    }}
                                >
                                    {loading ? (
                                        <div style={{ display: "flex" }}>
                                            <div className="mr-2">Processing...</div>
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