import React, { Fragment, useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const AdvancedCronEditor = ({ cron = "* * * * *", onCronChange }) => {
  const [cronString, setCronString] = useState(cron);
  const [minute, setMinute] = useState("*");
  const [hour, setHour] = useState("*");
  const [day, setDay] = useState("*");
  const [month, setMonth] = useState("*");
  const [weekday, setWeekday] = useState("*");

  // Function to parse cron string
  useEffect(() => {
    const parts = (cronString || "").split(" ");
    if (parts.length === 5) {
      setMinute(parts[0]);
      setHour(parts[1]);
      setDay(parts[2]);
      setMonth(parts[3]);
      setWeekday(parts[4]);
    }
  }, [cronString]);

  // Function to update cron string when any dropdown changes
  useEffect(() => {
    const newCron = `${minute} ${hour} ${day} ${month} ${weekday}`;
    setCronString(newCron);
    onCronChange(newCron);
  }, [minute, hour, day, month, weekday]);

  // Handle manual cron input changes
  const handleCronInputChange = (e) => {
    setCronString(e.target.value);
  };

  return (
    <div className="p-6 border border-gray-300 rounded-lg w-100">

      {/* Manual Input Field */}
      <div className="mb-4">
        <input
          type="text"
          value={cronString}
          onChange={handleCronInputChange}
          className="w-full border p-2 rounded-md"
        />
      </div>

      <div className="space-y-3">
        {/* Minute Selector */}
        <div className="flex justify-between items-center">
          <label className="font-medium">Minute:</label>
          <select
            className="border p-2 rounded-md"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
          >
            <option value="*">Every Minute</option>
            {[...Array(60).keys()].map((min) => (
              <option key={min} value={min}>
                {min}
              </option>
            ))}
          </select>
        </div>

        {/* Hour Selector */}
        <div className="flex justify-between items-center">
          <label className="font-medium">Hour:</label>
          <select
            className="border p-2 rounded-md"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
          >
            <option value="*">Every Hour</option>
            {[...Array(24).keys()].map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        {/* Day Selector */}
        <div className="flex justify-between items-center">
          <label className="font-medium">Day of Month:</label>
          <select
            className="border p-2 rounded-md"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            <option value="*">Every Day</option>
            {[...Array(31).keys()].map((d) => (
              <option key={d + 1} value={d + 1}>
                {d + 1}
              </option>
            ))}
          </select>
        </div>

        {/* Month Selector */}
        <div className="flex justify-between items-center">
          <label className="font-medium">Month:</label>
          <select
            className="border p-2 rounded-md"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="*">Every Month</option>
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
              (name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              )
            )}
          </select>
        </div>

        {/* Weekday Selector */}
        <div className="flex justify-between items-center">
          <label className="font-medium">Day of Week:</label>
          <select
            className="border p-2 rounded-md"
            value={weekday}
            onChange={(e) => setWeekday(e.target.value)}
          >
            <option value="*">Every Day</option>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export const Select = ({ selectedOption, options, setSelecteOptions, defaultText }) => {
  return (
    <div className="top-16 min-w-[100px]">
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
function Cron({ cron, onCronChange }) {
  const [frequency, setFrequency] = useState("day");
  const [selectedTime, setSelectedTime] = useState(new Date());

  const frequencyOptions = ["day", "week", "month", "year"];
  // Function to generate a cron expression
  const generateCronExpression = (freq, time) => {
    const [hour, minute] = time.split(":");
    switch (freq) {
      case "day":
        return `${minute} ${hour} * * *`; // Every day at HH:mm
      case "week":
        return `${minute} ${hour} * * 1`; // Every Monday at HH:mm
      case "month":
        return `${minute} ${hour} 1 * *`; // First of every month at HH:mm
      case "year":
        return `${minute} ${hour} 1 1 *`; // First of January every year at HH:mm
      default:
        return `${minute} ${hour} * * *`; // Default to daily
    }
  };

  useEffect(() => {
    const newCron = generateCronExpression(frequency, moment(selectedTime).format("HH:mm"));
    onCronChange(newCron);
  }, [frequency, selectedTime, onCronChange]);

  return (
    <div className="p-4 rounded-md flex items-center gap-5">
      <span className="text-lg whitespace-nowrap">In every</span>
      <Select
        selectedOption={frequency}
        options={frequencyOptions || []}
        setSelecteOptions={setFrequency}
        defaultText={`Select frequency.`} />
      <span className="text-lg">at</span>
      <DatePicker
        className="w-[75px] cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm"
        selected={selectedTime}
        onChange={(date) => setSelectedTime(date)}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={15}
        timeCaption="Time"
        dateFormat="HH:mm"
        showIcon
        toggleCalendarOnIconClick
      />
    </div>
  );
}

export default Cron;

