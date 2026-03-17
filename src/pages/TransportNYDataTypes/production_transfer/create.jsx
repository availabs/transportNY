import React, { Fragment, useState, useContext } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

import { getExternalEnv } from "~/modules/dms/packages/dms/src/patterns/datasets/utils/datasources";
import { DatasetsContext } from '~/modules/dms/packages/dms/src/patterns/datasets/context.js';
import Publish from "./publish";

const Select = ({ selectedOption, options, setSelecteOptions, defaultText }) => {
    return (
        <div className="top-16 w-72">
            <Listbox value={selectedOption} onChange={setSelecteOptions}>
                <div className="relative mt-1">
                    <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                        <span className="block truncate">
                            {selectedOption || defaultText}
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
                                                {opt}
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
    const [formData, setFormData] = useState(null);
    const [errors, setErrors] = useState([]);
    const [pgConnectionError, setPgConnectionError] = useState(null);
    const [warnings, setWarnings] = useState([]);
    const [schemaToTables, setSchemaToTables] = useState(null);
    const [schema, setSchema] = useState(null);
    const [table, setTable] = useState(null);
    const { user, datasources, DAMA_HOST } = useContext(DatasetsContext);
    const pgEnv = getExternalEnv(datasources);

    const checkValidateInfo = (formData) => {
        const requiredFields = [
            { key: "host", type: "string", message: "Host is required" },
            { key: "port", type: "number", message: "Port is required and must be a valid number" },
            { key: "user", type: "string", message: "User is required" },
            { key: "password", type: "string", message: "Password is required" },
            { key: "database", type: "string", message: "Database name is required" },
        ];

        const errors = [];
        const warnings = [];

        requiredFields.forEach((field) => {
            const value = formData?.[field.key];

            if (!value) {
                errors.push(field.message);
            } else if (field.type === "number" && isNaN(value)) {
                errors.push(`${field.key} must be a valid number`);
            } else if (field.type === "string" && typeof value !== "string") {
                errors.push(`${field.key} must be a valid string`);
            }

            if (field.key === "port" && value && !isNaN(value) && value < 1024) {
                warnings.push("Using ports below 1024 may require elevated permissions.");
            }
        });

        return { errors, warnings };
    };

    const update = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    async function getPgInfo() {
        const { errors, warnings } = checkValidateInfo(formData);
        setErrors(errors);
        setWarnings(warnings);

        if (errors.length > 0) {
            console.warn("Validation errors:", errors);
            return;
        }

        try {
            const res = await fetch(
                `${DAMA_HOST}/dama-admin/${pgEnv}/npmrds/production_transfer/pginfo`,
                {
                    method: "POST",
                    body: JSON.stringify(formData),
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const pgInfo = await res.json();
            if (pgInfo && Object.keys(pgInfo).length && res.status === 200) {
                setSchemaToTables(pgInfo);
                setPgConnectionError(null);
            } else if (res.status >= 400 ) {
                setPgConnectionError(pgInfo?.error);
            }
        } catch (error) {
            console.error("Error fetching PG info:", error);
        }
    }

    return (
        <div className="w-full p-5 m-5">
            {pgConnectionError ? <>
                <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {pgConnectionError}
                </div></>: null}
            {errors.length > 0 && (
                <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    <strong>Errors:</strong>
                    <ul className="list-disc list-inside">
                        {errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}
            {warnings.length > 0 && (
                <div className="p-3 mb-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                    <strong>Warnings:</strong>
                    <ul className="list-disc list-inside">
                        {warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-row mt-4 mb-6">
                <div className="basis-1/2">
                    <div className="flex items-center justify-left mt-4">
                        <div className="w-full max-w-xs mx-auto">
                            <div className="block text-sm font-medium text-gray-700">Host:</div>
                            <div className="relative">
                                <input
                                    id="host"
                                    name="host"
                                    type="text"
                                    required
                                    value={formData?.host || ""}
                                    onChange={e => update(e)}
                                    autoComplete="host"
                                    className="block w-full rounded-md px-3 py-1.5 text-base outline outline-1 -outline-offset-1 outline-gray/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="basis-1/2">
                    <div className="flex items-center justify-left mt-4">
                        <div className="w-full max-w-xs mx-auto">
                            <div className="block text-sm font-medium text-gray-700">Port:</div>
                            <div className="relative">
                                <input
                                    id="port"
                                    name="port"
                                    type="number"
                                    required
                                    value={formData?.port || ""}
                                    onChange={e => update(e)}
                                    autoComplete="port"
                                    className="block w-full rounded-md px-3 py-1.5 text-base outline outline-1 -outline-offset-1 outline-gray/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-row mt-4 mb-6">
                {["user", "password", "database"].map((field) => (
                    <div key={field} className="basis-1/3">
                        <div className="flex items-center justify-left mt-4">
                            <div className="w-full max-w-xs mx-auto">
                                <div className="block text-sm font-medium text-gray-700">
                                    {field.charAt(0).toUpperCase() + field.slice(1)}:
                                </div>
                                <div className="relative">
                                    <input
                                        id={field}
                                        name={field}
                                        type="text"
                                        required
                                        value={formData?.[field] || ""}
                                        onChange={e => update(e)}
                                        autoComplete={field}
                                        className="block w-full rounded-md px-3 py-1.5 text-base outline outline-1 -outline-offset-1 outline-gray/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!schemaToTables ?
                <button
                    className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={getPgInfo}
                >
                    {"Make Connection"}
                </button> : null}

            {schemaToTables && Object.keys(schemaToTables).length > 0 ?
                <>
                    <div className="flex flex-row mt-4 mb-6">
                        <div className="basis-1/3">
                            <div className="flex items-center justify-left mt-4">
                                <div className="w-full max-w-xs mx-auto">
                                    <div className="block text-sm font-medium text-gray-700">Schema:</div>
                                    <div className="relative">
                                        <Select
                                            selectedOption={schema}
                                            options={Object.keys(schemaToTables)}
                                            setSelecteOptions={(selectedOption) => {
                                                setTable(null); // Reset table state
                                                setSchema(selectedOption); // Update schema state
                                            }}
                                            defaultText={"Select Schema..."}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {
                            schema ? <><div className="basis-2/3">
                                <div className="flex items-center justify-left mt-4">
                                    <div className="w-full max-w-xs mx-auto">
                                        <div className="block text-sm font-medium text-gray-700">Table:</div>
                                        <div className="relative">
                                            <Select
                                                selectedOption={table}
                                                options={schemaToTables[schema]}
                                                setSelecteOptions={setTable}
                                                defaultText={"Select Table..."}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div></> : null
                        }
                    </div>
                </> : null}


                {source?.name && schema && table ? (
                <>
                    <Publish
                        pgEnv={pgEnv}
                        loading={loading}
                        user_id={user?.id}
                        type={source?.type}
                        name={source?.name}
                        setLoading={setLoading}
                        schema={schema}
                        table={table}
                        formData={formData}
                        source_id={source?.source_id}
                    />
                </>
            ) : null}
        </div>
    );
};

export default Create;