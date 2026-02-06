import React, { useEffect, useMemo, useContext, useState, Fragment } from 'react';
import { get } from 'lodash';
import "react-datepicker/dist/react-datepicker.css";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

import { getAttributes } from '~/pages/DataManager/Source/attributes';

import { DamaContext } from "~/pages/DataManager/store";
import Publish from "./publish";
import Cron from "./cron";

export const Select = ({ selectedOption, options, setSelecteOptions, visibleField, defaultText }) => {
    return (
        <div className="top-16 w-72">
            <Listbox value={selectedOption} onChange={setSelecteOptions}>
                <div className="relative mt-1">
                    <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                        <span className="block truncate">
                            {visibleField ? selectedOption?.[`${visibleField}`] : selectedOption || defaultText}
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
                        <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 z-40 focus:outline-none sm:text-sm">
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
                                                {visibleField ? opt?.[`${visibleField}`] : opt}
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
const NPMRDS_RAW_TYPE = 'npmrds_raw';
const TRANSCOM_TYPE = 'transcom';
const types = [NPMRDS_RAW_TYPE, TRANSCOM_TYPE];
const Create = ({ source }) => {
    const [loading, setLoading] = useState(false);
    const { pgEnv, falcor, falcorCache, user } = useContext(DamaContext);
    const [type, setType] = useState(null);
    const [cron, setCron] = useState(null);
    const [selectedView, setSelectView] = useState(null);
    const [selectedSource, setSelectSource] = useState(null);
    const [selectedNpmrdsSource, setSelectedNpmrdsSource] = useState(null);

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

    const typeSources = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v?.value, { "attributes": {} })["attributes"]))
            .filter(s => s.type === type)
    }, [falcorCache, pgEnv, type]);

    const npmrdsSources = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v?.value, { "attributes": {} })["attributes"]))
            .filter(s => s.type.toLowerCase() === "npmrds")   
    }, [falcorCache, type, pgEnv])

    useEffect(() => {
        async function fetchData() {
            const geomLengthPath = ["dama", pgEnv, "sources", "byId", selectedSource?.source_id, "views", "length"];
            const geomViewsLen = await falcor.get(geomLengthPath);

            await falcor.get([
                "dama", pgEnv, "sources", "byId", selectedSource?.source_id, "views", "byIndex",
                { from: 0, to: get(geomViewsLen.json, geomLengthPath, 0) - 1 },
                "attributes", ['view_id', 'version', 'metadata']
            ]);
        }
        fetchData();
    }, [falcor, pgEnv, selectedSource]);

    const typeViews = useMemo(() => {
        return selectedSource?.source_id && (Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", selectedSource?.source_id, "views", "byIndex"], {}))
            .map(v =>
                Object.entries(get(falcorCache, v?.value, { "attributes": {} })["attributes"])
                    .reduce((out, attr) => {
                        const [k, v] = attr
                        typeof v.value !== 'undefined' ?
                            out[k] = v?.value :
                            out[k] = v
                        return out
                    }, {})
            ));
    }, [falcorCache, selectedSource, pgEnv]);

    //TODO CANNOT FIGURE OUT THIS BUG
    //But, when npmrds_Raw is selected, after source is chosen, it auto-resets the source
    //it always only happens once...
    //Maybe because when I select source, the views change. But, that should only change the view??
    //Maybe if I just grab all views for all sources (for these types) ASAP?
    useEffect(() => {
        if (typeSources && typeSources.length) {
            setSelectSource(typeSources[0]);
        }
    }, [type, typeSources]);

    useEffect(() => {
        if (typeViews && typeViews.length) {
            setSelectView(typeViews[0]);
        }
    }, [type, typeViews]);

    const typeInputs = [
      {
        label: "Raw Source:",
        control: (
          <Select
            selectedOption={selectedSource}
            options={typeSources || []}
            setSelecteOptions={setSelectSource}
            visibleField={"name"}
            defaultText={`Select ${type} source.`}
          />
        ),
      },
    ];

    if (type === TRANSCOM_TYPE) {
      typeInputs.push({
        label: "View:",
        control: (
          <Select
            selectedOption={selectedView}
            options={typeViews || []}
            setSelecteOptions={setSelectView}
            visibleField={"view_id"}
            defaultText={`Select ${type} view.`}
          />
        ),
      });
    } else if (type === NPMRDS_RAW_TYPE){
      typeInputs.push({
        label: "Production Source:",
        control: (
          <Select
            selectedOption={selectedNpmrdsSource}
            options={npmrdsSources || []}
            setSelecteOptions={setSelectedNpmrdsSource}
            visibleField={"name"}
            defaultText={`Select a production NPMRDS source.`}
          />
        ),
      });
    }

    //NPMRDS always gets pulled at 6pm on Tuesday
    useEffect(() => {
        if(type === NPMRDS_RAW_TYPE) {
            setCron("0 18 * * 2");
        }
    }, [type])


    return (
        <div className="w-full p-5 m-5">
            <InputRow 
                inputs={[{
                    label:"SourceType:",
                    control: <Select
                        selectedOption={type}
                        options={types || []}
                        setSelecteOptions={setType}
                        visibleField={null}
                        defaultText={"Select dama type..."}
                    />
                }]}
            />
            {type && <InputRow inputs={typeInputs} /> }
            {(type && type !== NPMRDS_RAW_TYPE) && <InputRow 
                inputs={[{
                    label:"Select Cron:",
                    control: <Cron cron={cron} onCronChange={setCron} />}]}
            />}
            {type === NPMRDS_RAW_TYPE && <div className="flex flex-col items-center justify-center w-full">
                <div>
                    Raw NPMRDS data will be requested/downloaded <b>every Tuesday night</b>
                </div>
                <div>
                    Up to one month of data will be requested. The starting date will be one day after the latest date in the raw source. 
                </div>
                <div>
                    After downloading, the data will be automatically loaded into the specified production source
                </div>
            </div>}
            {selectedSource && type && cron ? (
                <div className="flex w-full mt-1 items-center justify-center">
                    <Publish
                        type={type}
                        pgEnv={pgEnv}
                        loading={loading}
                        user_id={user?.id}
                        email={user?.email}
                        setLoading={setLoading}
                        view_id={selectedView?.view_id || null}
                        source_id={selectedSource?.source_id || null}
                        npmrds_prod_id={selectedNpmrdsSource?.source_id || null}
                        cron={cron}
                        name={source?.name}
                    />
                </div>
            ) : null}
        </div>
    );
};

const InputRow = ({ inputs }) => {
  return (
    <div className="flex flex-row mt-4 mb-6">
      <div className="basis-1/4" />
      {inputs.map((input) => {
        return <InputContainer label={input.label} input={input.control} />;
      })}
      <div className="basis-1/4" />
    </div>
  );
};

const InputContainer = ({label, input}) => {
  return (
    <div className="basis-1/2">
      <div className="flex items-center justify-left mt-4">
        <div className="w-full max-w-xs mx-auto">
          <div className="block text-sm leading-5 font-medium text-gray-700">
            {label}
          </div>
          <div className="relative w-full max-w-sm">{input}</div>
        </div>
      </div>
    </div>
  );
};


export default Create;