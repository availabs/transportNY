import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";

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

function Cron({ cron, onCronChange }) {
  const [frequency, setFrequency] = useState("day");
  const [selectedTime, setSelectedTime] = useState(new Date());

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
      <select
        value={frequency}
        onChange={(e) => setFrequency(e.target.value)}
        className="p-2 border rounded-md bg-white"
      >
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
      </select>
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

