import React, { Fragment, useEffect, useContext, useState, useMemo } from 'react';
import { get } from 'lodash';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import DatePicker from "react-datepicker";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";

import { getAttributes } from '~/pages/DataManager/Source/attributes';

import { DamaContext } from "~/pages/DataManager/store";
// import Publish from "./publish";

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
    const [selectedTranscomSource, setselectedTranscomSource] = useState(null);
    const [selectedConflationSource, setselectedConflationSource] = useState(null);
    const [startTime, setstartTime] = useState(null);
    const [endTime, setendTime] = useState(null);
    const { pgEnv, falcor, falcorCache, user } = useContext(DamaContext);

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

    const [transcomSources, conflationSources] = useMemo(() => {
        const sources = Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v?.value, { "attributes": {} })["attributes"]))
            .filter(s => s.categories);

        const filterByCategory = (sources, category) =>
            sources.filter(s => s.categories.some(cat => cat.includes(category)));

        return [
            filterByCategory(sources, "Transcom") || filterByCategory(sources, "TRANSCOM"),
            filterByCategory(sources, "Conflation") || filterByCategory(sources, "CONFLATION")
        ];
    }, [falcorCache, pgEnv]);

    useEffect(() => {
        if (!selectedTranscomSource) {
            setselectedTranscomSource((transcomSources.length && transcomSources[0]));
        }
    }, [transcomSources]);

    useEffect(() => {
        if (!selectedConflationSource) {
            setselectedConflationSource((conflationSources.length && conflationSources[0]));
        }
    }, [conflationSources]);

    return (
        <div className="w-full p-5 m-5">
            <div className="flex flex-row mt-4 mb-6">

                <div className="basis-1/2">
                    <div className="flex items-center justify-left mt-4">
                        <div className="w-full max-w-xs mx-auto">
                            <div className="block text-sm leading-5 font-medium text-gray-700">
                                Transcom source:
                            </div>
                            <div className="relative">
                                <Select
                                    selectedOption={selectedTranscomSource}
                                    options={transcomSources || []}
                                    setSelecteOptions={setselectedTranscomSource}
                                    visibleField={"name"}
                                    defaultText={"Select Transcom source..."}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="basis-1/2">
                    <div className="flex items-center justify-left mt-4">
                        <div className="w-full max-w-xs mx-auto">
                            <div className="block text-sm leading-5 font-medium text-gray-700">
                                Conflation source:
                            </div>
                            <div className="relative">
                                <Select
                                    selectedOption={selectedConflationSource}
                                    options={conflationSources || []}
                                    setSelecteOptions={setselectedConflationSource}
                                    visibleField={"name"}
                                    defaultText={"Select Conflation source..."}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-row mt-4 mb-6">
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
                                        // minDate={minTime}
                                        // maxDate={maxTime}
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
                                        // minDate={minTime}
                                        // maxDate={maxTime}
                                        isClearable
                                        showMonthYearPicker
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div> 
            {/* 
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
                        start_date={moment(startTime).startOf('month').format('YYYY-MM-DD')}
                        end_date={moment(endTime).endOf('month').format('YYYY-MM-DD')}
                    />
                </>
            ) : null} */}
        </div>
    );
};

export default Create;