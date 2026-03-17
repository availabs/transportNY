import React, { Fragment, useEffect, useContext, useState, useMemo } from 'react';
import { get } from 'lodash';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import DatePicker from "react-datepicker";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";

import { getAttributes } from '~/pages/DataManager/Source/attributes';

import { useFalcor } from "@availabs/avl-falcor";
import { getExternalEnv } from "~/modules/dms/packages/dms/src/patterns/datasets/utils/datasources";
import { DatasetsContext } from '~/modules/dms/packages/dms/src/patterns/datasets/context.js';
import Publish from "./publish";

export const Select = ({ selectedOption, options, setSelecteOptions, visibleField, defaultText }) => {
    return (
        <div className="top-16 w-72">
            <Listbox value={selectedOption} onChange={setSelecteOptions}>
                <div className="relative mt-1">
                    <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                        <span className="block truncate">
                            {selectedOption?.[`${visibleField}`] || defaultText}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </span>
                    </ListboxButton>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {options?.map((opt, optIndex) => (
                                <ListboxOption
                                    key={optIndex}
                                    className={({ focus }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${focus ? "bg-cyan-100 text-cyan-900" : "text-gray-900"
                                        }`

                                    }
                                    value={opt}
                                >
                                    {({ selected }) => (
                                        <>
                                            <span
                                                className={`block truncate ${selected ? "font-medium" : "font-normal"
                                                    }`}
                                            >
                                                {opt?.[`${visibleField}`]}
                                            </span>
                                            {selected ? (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyan-600">
                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null}
                                        </>
                                    )}
                                </ListboxOption>
                            ))}
                        </ListboxOptions>
                    </Transition>
                </div>
            </Listbox>
        </div>
    );
};

const Create = ({ source }) => {
    const [loading, setLoading] = useState(false);
    const [selectedGeomSource, setselectedGeomSource] = useState(null);
    const [selectedTrasncomSource, setselectedTrasncomSource] = useState(null);
    const [startTime, setstartTime] = useState(null);
    const [endTime, setendTime] = useState(null);
    const { user, datasources } = useContext(DatasetsContext);
    const { falcor, falcorCache } = useFalcor();
    const pgEnv = getExternalEnv(datasources);

    useEffect(() => {
        async function fetchData() {
            const geomLengthPath = ["dama", pgEnv, "sources", "length"];
            const sourceLen = await falcor.get(geomLengthPath);

            await falcor.get([
                "dama", pgEnv, "sources", "byIndex",
                { from: 0, to: get(sourceLen.json, geomLengthPath, 0) - 1 },
                "attributes", ['source_id', 'metadata', 'categories', 'name', 'type']
            ]);
        }
        fetchData();
    }, [falcor, pgEnv]);

    const geomSources = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v?.value, { "attributes": {} })["attributes"]))
            .filter(s => s.type && (s.type === "NPMRDS" || s.type === "npmrds"))
    }, [falcorCache, pgEnv]);

    const transcomSources = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v?.value, { "attributes": {} })["attributes"]))
            .filter(s => s.type && (s.type === "TRANSCOM" || s.type === "transcom"))
    }, [falcorCache, pgEnv]);

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

    useEffect(() => {
        if (!selectedTrasncomSource) {
            setselectedTrasncomSource((transcomSources.length && transcomSources[0]));
        }
    }, [transcomSources]);

    const minTime = useMemo(() => {
        return moment(geomView?.metadata?.start_date).toDate();
    }, [geomView]);

    const maxTime = useMemo(() => {
        return moment(geomView?.metadata?.end_date).toDate();
    }, [geomView]);

    useEffect(() => {
        setstartTime(moment(geomView?.metadata?.start_date).toDate() || null);
        setendTime(moment(geomView?.metadata?.end_date).toDate() || null);
    }, [geomView]);

    return (
        <div className="w-full p-5 m-5">
            <div className="flex flex-row mt-4 mb-6">
                <div className="basis-1/4"></div>
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
                <div className="basis-1/3">
                    <div className="flex items-center justify-left mt-4">
                        <div className="w-full max-w-xs mx-auto">
                            <div className="block text-sm leading-5 font-medium text-gray-700">
                                TRANSCOM source:
                            </div>
                            <div className="relative">
                                <Select
                                    selectedOption={selectedTrasncomSource}
                                    options={transcomSources || []}
                                    setSelecteOptions={setselectedTrasncomSource}
                                    visibleField={"name"}
                                    defaultText={"Select Trasncom source..."}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="basis-1/4"></div>
            </div>

            {
                selectedGeomSource && geomView ? <div className="flex flex-row mt-4 mb-6">
                    <div className="basis-1/2">
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

            {source?.name && selectedGeomSource && geomView && startTime && endTime ? (
                <>
                    <Publish
                        pgEnv={pgEnv}
                        loading={loading}
                        user_id={user?.id}
                        type={source?.type}
                        name={source?.name}
                        setLoading={setLoading}
                        source_id={source?.source_id || null}
                        selectedGeomSourceId={selectedGeomSource?.source_id}
                        selectedTranscomSourceId={selectedTrasncomSource?.source_id}
                        start_date={moment(startTime).startOf('month').format('YYYY-MM-DD')}
                        end_date={moment(endTime).endOf('month').format('YYYY-MM-DD')}
                    />
                </>
            ) : null}
        </div>
    );
};

export default Create;