import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { Listbox, Transition } from "@headlessui/react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);

  function isSelected(value) {
    return states.find((el) => el === value) ? true : false;
  }

  function handleSelect(value) {
    if (!isSelected(value)) {
      const selectedStateUpdated = [
        ...states,
        Object.keys(statesObj).find((el) => el === value),
      ];
      setStates(selectedStateUpdated);
    } else {
      handleDeselect(value);
    }
    setIsOpen(true);
  }

  function handleDeselect(value) {
    const selectedStateUpdated = (states || []).filter((el) => el !== value);
    setStates(selectedStateUpdated);
    setIsOpen(true);
  }

  return (
    <div className="w-full">
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
          <Listbox
            as="div"
            className="space-y-1"
            value={states}
            onChange={(value) => handleSelect(value)}
            // open={isOpen}
          >
            {() => (
              <>
                <Listbox.Label className="block text-sm leading-5 font-medium text-gray-700">
                  Select States
                </Listbox.Label>
                <div className="relative">
                  <span className="inline-block w-full rounded-md shadow-sm">
                    <Listbox.Button
                      className="cursor-default relative w-full rounded-md border border-gray-300 bg-white pl-3 pr-10 py-2 text-left focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                      onClick={() => setIsOpen(!isOpen)}
                      open={isOpen}
                    >
                      <span className="block truncate">
                        {(states || []).length < 1
                          ? "Select state"
                          : `Selected States (${states.length})`}
                      </span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </Listbox.Button>
                  </span>

                  <Transition
                    unmount={false}
                    show={isOpen}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    className="absolute mt-1 w-full rounded-md bg-white shadow-lg"
                  >
                    <Listbox.Options
                      static
                      className="max-h-60 rounded-md py-1 text-base leading-6 shadow-xs overflow-auto focus:outline-none sm:text-sm sm:leading-5"
                    >
                      {Object.keys(statesObj).map((state, index) => {
                        const selected = isSelected(state);
                        return (
                          <Listbox.Option key={index} value={state}>
                            {({ active }) => (
                              <div
                                className={`${
                                  active
                                    ? "text-white bg-blue-600"
                                    : "text-gray-900"
                                } cursor-default select-none relative py-2 pl-8 pr-4`}
                              >
                                <span
                                  className={`${
                                    selected ? "font-semibold" : "font-normal"
                                  } block truncate`}
                                >
                                  {statesObj[`${state}`]}
                                </span>
                                {selected && (
                                  <span
                                    className={`${
                                      active ? "text-white" : "text-blue-600"
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
                          </Listbox.Option>
                        );
                      })}
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>
        </div>
      </div>
      <PublishNpmrdsRaw
        loading={loading}
        setLoading={setLoading}
        source_id={source?.source_id || null}
        name={source?.name}
        type={source?.type}
        startDate={startDate}
        endDate={endDate}
        states={states}
      />
    </div>
  );
};

export default Create;
