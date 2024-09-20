import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  Listbox,
  ListboxOption,
  ListboxOptions,
  ListboxButton,
  Transition,
} from "@headlessui/react";

import { DamaContext } from "~/pages/DataManager/store";
import PublishNpmrdsRaw from "./publish";

const statesObj = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  PR: "Puerto Rico",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  VI: "Virgin Islands",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};
const Create = ({ source }) => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);

  const { pgEnv, user } = React.useContext(DamaContext);
  function isSelected(val) {
    return (states || []).find((el) => el === val) ? true : false;
  }

  function handleSelection(val) {
    const selectedResult = (states || []).filter(
      (selected) => selected === val
    );

    if ((selectedResult || []).length > 0) {
      removeSelect(val);
    } else {
      setStates((currents) => [...currents, val]);
    }
  }

  function removeSelect(val) {
    const removedSelection = (states || []).filter(
      (selected) => selected !== val
    );
    setStates(removedSelection);
  }

  return (
    <div className="w-full p-5 m-5">
      <div className="flex flex-row mt-4">
        <div className="basis-1/2">
          <div className="flex items-center justify-left mt-4">
            <div className="w-full max-w-xs mx-auto">
              <div className="block text-sm leading-5 font-medium text-gray-700">
                Start Date
              </div>
              <div className="relative">
                <DatePicker
                  required
                  showIcon
                  toggleCalendarOnIconClick
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  maxDate={endDate}
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
                End Date
              </div>
              <div className="relative">
                <DatePicker
                  required
                  showIcon
                  toggleCalendarOnIconClick
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  minDate={startDate}
                  isClearable
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-12">
        <div className="w-full max-w-xs mx-auto">
          <div className="flex items-center justify-center">
            <div className="w-full max-w-xl mx-auto">
              <Listbox
                as="div"
                className="space-y-1"
                value={states}
                onChange={handleSelection}
              >
                {({ open }) => (
                  <>
                    <span className="block text-sm leading-5 font-medium text-gray-700">
                      States
                    </span>
                    <div className="relative">
                      <span className="inline-block w-full rounded-md shadow-sm">
                        <ListboxButton className="cursor-default relative w-full rounded-md border border-gray-300 bg-white pl-3 pr-10 py-2 text-left focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition ease-in-out duration-150 sm:text-sm sm:leading-5">
                          {!(states || []).length && "select states"}
                          {(states || []).map((val) => (
                            <div
                              key={val}
                              className="inline-flex items-center p-2 mr-1 mt-1 rounded text-white bg-blue-400"
                            >
                              {statesObj[`${val}`]}
                              <div
                                className="ml-1 bg-blue-100 rounded-full cursor-pointer"
                                onClick={() => removeSelect(val)}
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M4.29289 4.29289C4.68342 3.90237 5.31658 3.90237 5.70711 4.29289L10 8.58579L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L11.4142 10L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L10 11.4142L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L8.58579 10L4.29289 5.70711C3.90237 5.31658 3.90237 4.68342 4.29289 4.29289Z"
                                    fill="#4A5568"
                                  />
                                </svg>
                              </div>
                            </div>
                          ))}
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg
                              className="h-5 w-5 text-black-400"
                              viewBox="0 0 20 20"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path
                                d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </ListboxButton>
                      </span>

                      <Transition
                        show={open}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        className="absolute mt-1 w-full rounded-md bg-white shadow-lg"
                      >
                        <ListboxOptions
                          static
                          className="max-h-60 rounded-md py-1 text-base leading-6 shadow-xs overflow-auto focus:outline-none sm:text-sm sm:leading-5"
                        >
                          {(Object.keys(statesObj) || []).map((opt) => {
                            const selected = isSelected(opt);
                            return (
                              <ListboxOption key={opt} value={opt}>
                                {({ active }) => (
                                  <div
                                    className={`${
                                      active
                                        ? "text-white bg-blue-600"
                                        : "text-black-900"
                                    } cursor-default select-none relative py-2 pl-8 pr-4`}
                                  >
                                    <span
                                      className={`${
                                        selected
                                          ? "font-semibold"
                                          : "font-normal"
                                      } block truncate`}
                                    >
                                      {statesObj[`${opt}`]}
                                    </span>
                                    {selected && (
                                      <span
                                        className={`${
                                          active
                                            ? "text-white"
                                            : "text-blue-600"
                                        } absolute inset-y-0 left-0 flex items-center pl-1.5`}
                                      >
                                        <svg
                                          className="h-5 w-5"
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </ListboxOption>
                            );
                          })}
                        </ListboxOptions>
                      </Transition>
                    </div>
                  </>
                )}
              </Listbox>
            </div>
          </div>
        </div>
      </div>
      {source?.name && startDate && endDate && states.length ? (
        <>
          <PublishNpmrdsRaw
            loading={loading}
            setLoading={setLoading}
            source_id={source?.source_id || null}
            name={source?.name}
            type={source?.type}
            startDate={startDate}
            endDate={endDate}
            states={states}
            user_id={user?.id}
            pgEnv={pgEnv}
          />
        </>
      ) : null}
    </div>
  );
};

export default Create;
