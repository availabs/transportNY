import React, { Fragment, useEffect, useContext, useState, useMemo } from 'react';
import { get } from 'lodash';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

import { DamaContext } from "~/pages/DataManager/store";

export const Select = ({ selectedOption, options, setSelecteOptions }) => {
    return (
        <div className="top-16 w-72">
            <Listbox value={selectedOption} onChange={setSelecteOptions}>
                <div className="relative mt-1">
                    <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                        <span className="block truncate">{selectedOption?.version}</span>
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
                                                {opt?.version}
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
    const [selectedGeomViewId, setSelectedGeomViewId] = useState(null);
    const [selectedpm3ViewId, setSelectedpm3ViewId] = useState(null);
    const geomSource = 119, pm3Source = 103;
    const { pgEnv, falcor, falcorCache, user } = useContext(DamaContext);

    useEffect(() => {
        async function fetchData() {
            const geomLengthPath = ["dama", pgEnv, "sources", "byId", geomSource, "views", "length"];
            const pm3LengthPath = ["dama", pgEnv, "sources", "byId", pm3Source, "views", "length"];
            const [geomViewsLen, pm3ViewsLen] = [await falcor.get(geomLengthPath), await falcor.get(pm3LengthPath)];

            await falcor.get([
                "dama", pgEnv, "sources", "byId", geomSource, "views", "byIndex",
                { from: 0, to: get(geomViewsLen.json, geomLengthPath, 0) - 1 },
                "attributes", ['view_id', 'version']
            ]);
            await falcor.get([
                "dama", pgEnv, "sources", "byId", pm3Source, "views", "byIndex",
                { from: 0, to: get(pm3ViewsLen.json, pm3LengthPath, 0) - 1 },
                "attributes", ['view_id', 'version']
            ]);
        }
        fetchData();
    }, [falcor, pgEnv, geomSource, pm3Source]);

    const geomViews = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", geomSource, "views", "byIndex"], {}))
            .map(v =>
                Object.entries(get(falcorCache, v.value, { "attributes": {} })["attributes"])
                    .reduce((out, attr) => {
                        const [k, v] = attr
                        typeof v.value !== 'undefined' ?
                            out[k] = v.value :
                            out[k] = v
                        return out
                    }, {})
            );
    }, [falcorCache, geomSource, pgEnv]);

    const pm3Views = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", pm3Source, "views", "byIndex"], {}))
            .map(v =>
                Object.entries(get(falcorCache, v.value, { "attributes": {} })["attributes"])
                    .reduce((out, attr) => {
                        const [k, v] = attr
                        typeof v.value !== 'undefined' ?
                            out[k] = v.value :
                            out[k] = v
                        return out
                    }, {})
            );
    }, [falcorCache, pm3Source, pgEnv]);

    useEffect(() => {
        if (!selectedpm3ViewId) {
            setSelectedpm3ViewId((pm3Views.length && pm3Views[0]));
        }
    }, [pm3Views]);

    useEffect(() => {
        if (!selectedGeomViewId) {
            setSelectedGeomViewId((geomViews.length && geomViews[0]));
        }
    }, [geomViews]);

    return (
        <div className="w-full p-5 m-5">
            <div className="flex flex-row mt-4">
                <div className="basis-1/2">
                    <div className="flex items-center justify-left mt-4">
                        <div className="w-full max-w-xs mx-auto">
                            <div className="block text-sm leading-5 font-medium text-gray-700">
                                Pm3 View
                            </div>
                            <div className="relative">
                                <Select
                                    selectedOption={selectedpm3ViewId}
                                    options={pm3Views}
                                    setSelecteOptions={setSelectedpm3ViewId}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="basis-1/2">
                    <div className="flex items-center justify-left mt-4">
                        <div className="w-full max-w-xs mx-auto">
                            <div className="block text-sm leading-5 font-medium text-gray-700">
                                Gis View
                            </div>
                            <div className="relative">
                                <Select
                                    selectedOption={selectedGeomViewId}
                                    options={geomViews}
                                    setSelecteOptions={setSelectedGeomViewId}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {source?.name ? (
                <>
                    {/* <PublishNpmrdsRaw
                        loading={loading}
                        setLoading={setLoading}
                        source_id={source?.source_id || null}
                        name={source?.name}
                        type={source?.type}
                        user_id={user?.id}
                        pgEnv={pgEnv}
                    /> */}
                </>
            ) : null}
        </div>
    );
};

export default Create;