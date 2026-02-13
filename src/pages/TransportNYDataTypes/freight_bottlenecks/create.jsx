import React, { Fragment, useEffect, useContext, useState, useMemo } from 'react';
import { get } from 'lodash';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

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
    const [selectedpm3Source, setSelectedpm3Source] = useState(null);
    const [selectedGeomView, setSelectedGeomView] = useState(null);
    const [selectedpm3View, setSelectedpm3View] = useState(null);
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
                "attributes", ['source_id', 'metadata', 'categories', 'name']
            ]);
        }
        fetchData();
    }, [falcor, pgEnv]);

    const geomSources = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v?.value, { "attributes": {} })["attributes"]))
            .filter(s => s.categories &&
                s.categories.some(categoryGroup =>
                    categoryGroup.includes("TMC META")
                ))
    }, [falcorCache, pgEnv]);

    const pm3Sources = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v?.value, { "attributes": {} })["attributes"]))
            .filter(s => s.categories &&
                s.categories.some(categoryGroup =>
                    categoryGroup.includes("MAP21")
                ))
    }, [falcorCache, pgEnv]);

    useEffect(() => {
        async function fetchData() {
            const pm3LengthPath = ["dama", pgEnv, "sources", "byId", selectedpm3Source?.source_id, "views", "length"];
            const pm3ViewsLen = await falcor.get(pm3LengthPath);

            await falcor.get([
                "dama", pgEnv, "sources", "byId", selectedpm3Source?.source_id, "views", "byIndex",
                { from: 0, to: get(pm3ViewsLen.json, pm3LengthPath, 0) - 1 },
                "attributes", ['view_id', 'version', 'metadata']
            ]);
        }
        fetchData();
    }, [falcor, pgEnv, selectedpm3Source]);

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

    const geomViews = useMemo(() => {
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
            .filter(f => f.metadata?.is_clickhouse_table === 0);
    }, [falcorCache, selectedGeomSource, pgEnv]);

    const pm3Views = useMemo(() => {
        return selectedpm3Source?.source_id && Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", selectedpm3Source?.source_id, "views", "byIndex"], {}))
            .map(v =>
                Object.entries(get(falcorCache, v?.value, { "attributes": {} })["attributes"])
                    .reduce((out, attr) => {
                        const [k, v] = attr;
                        typeof v.value !== 'undefined' ?
                            out[k] = v?.value :
                            out[k] = v
                        return out
                    }, {})
            );
    }, [falcorCache, selectedpm3Source, pgEnv]);

    useEffect(() => {
        if (!selectedGeomSource) {
            setselectedGeomSource((geomSources.length && geomSources[0]));
        }
    }, [geomSources]);

    useEffect(() => {
        if (!selectedpm3Source) {
            setSelectedpm3Source((pm3Sources.length && pm3Sources[0]));
        }
    }, [pm3Sources]);

    return (
        <div className="w-full p-5 m-5">
            <div className="flex flex-row mt-4 mb-6">
                <div className="basis-1/2">
                    <div className="flex items-center justify-left mt-4">
                        <div className="w-full max-w-xs mx-auto">
                            <div className="block text-sm leading-5 font-medium text-gray-700">
                                Map21 source:
                            </div>
                            <div className="relative">
                                <Select
                                    selectedOption={selectedpm3Source}
                                    options={pm3Sources || []}
                                    setSelecteOptions={setSelectedpm3Source}
                                    visibleField={"name"}
                                    defaultText={"Select Map21 source..."}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="basis-1/2">
                    <div className="flex items-center justify-left mt-4">
                        <div className="w-full max-w-xs mx-auto">
                            <div className="block text-sm leading-5 font-medium text-gray-700">
                                TMC Meta source:
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
            </div>
            {
                selectedpm3Source && selectedpm3Source ?
                    <>
                        <div className="flex flex-row mt-4 mb-6">
                            <div className="basis-1/2">
                                <div className="flex items-center justify-left mt-4">
                                    <div className="w-full max-w-xs mx-auto">
                                        <div className="block text-sm leading-5 font-medium text-gray-700">
                                            Map21 view:
                                        </div>
                                        <div className="relative">
                                            <Select
                                                selectedOption={selectedpm3View}
                                                options={pm3Views}
                                                setSelecteOptions={setSelectedpm3View}
                                                visibleField={"version"}
                                                defaultText={"Select Map21 view..."}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="basis-1/2">
                                <div className="flex items-center justify-left mt-4">
                                    <div className="w-full max-w-xs mx-auto">
                                        <div className="block text-sm leading-5 font-medium text-gray-700">
                                            TMC Meta view:
                                        </div>
                                        <div className="relative">
                                            <Select
                                                selectedOption={selectedGeomView}
                                                options={geomViews}
                                                setSelecteOptions={setSelectedGeomView}
                                                visibleField={"version"}
                                                defaultText={"Select Tmc meta view..."}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </> : null
            }

            {source?.name && selectedGeomSource && selectedpm3Source && selectedGeomView && selectedpm3View ? (
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
                        selectedpm3SourceId={selectedpm3Source?.source_id}
                        selectedGeomViewId={selectedGeomView?.view_id}
                        selectedpm3ViewId={selectedpm3View?.view_id}
                    />
                </>
            ) : null}
        </div>
    );
};

export default Create;