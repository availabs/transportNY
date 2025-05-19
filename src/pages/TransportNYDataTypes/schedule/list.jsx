import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router";
import { get } from "lodash";

import { DamaContext } from "~/pages/DataManager/store";
import { useFalcor } from "~/modules/avl-components/src";

const scheduleAttributes = {
    name: "name",
    cron: "cron",
    timezone: "timezone",
    data: "data",
    options: "options",
    created_on: "created_on",
    updated_on: "updated_on",
};

export default function ListSchedules({
}) {
    const { user: ctxUser, pgEnv } = useContext(DamaContext);
    const { falcor, falcorCache } = useFalcor();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const lengthPath = ["dama", pgEnv, "schedule", "type", ["npmrds_raw", "transcom"], "length"];
            const resp = await falcor.get(lengthPath);
            await falcor.get([
                "dama",
                pgEnv,
                "schedule",
                "byIndex",
                { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
                "attributes",
                Object.values(scheduleAttributes),
            ]);
        };

        fetchData();
    }, [falcor]);

    const headers = [
        "Start Date",
        "End Date",
        "",
    ];

    return (
        <div className="w-full p-5">
            <div className="flex m-3">
                <div className="justify-start w-full md:w-1/2 px-3 mb-6 md:mb-0">
                    <label className="block uppercase tracking-wide text-gray-700 text-xl font-bold mb-2">
                        Input Data
                    </label>
                </div>

                <div className="mr-0">
                </div>
            </div>

            {[].length ? (
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

                            {[].map((item, index) => (
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
                                    <td
                                        key={`${index}`}
                                        className="py-2 px-4 border-b"
                                    ></td>
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
                        No Schedules available
                    </span>
                </div>
            )}
        </div>
    );
}