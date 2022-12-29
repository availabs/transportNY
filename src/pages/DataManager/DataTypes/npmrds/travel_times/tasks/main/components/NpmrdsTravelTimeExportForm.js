import { useContext } from "react";

import {
  useEtlContext,
  EtlContextReact,
} from "pages/DataManager/utils/EtlContext";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { stateNameToAbbreviation } from "pages/DataManager/DataTypes/constants/stateAbbreviations";

import RequestStatus from "../constants/RequestStatus";

const toDateObj = (s) => {
  const [year, month, date] = s.split(/[/-]/g);

  const d = new Date(year, month - 1, date);

  return d;
};

export function FormInputs() {
  const ctx = useContext(EtlContextReact);

  const {
    dataState,
    dataMinDate,
    dataMaxDate,
    dataStartDate,
    dataEndDate,
    expandedMap,
    requestStatus,
  } = useEtlContext(ctx);

  const {
    dispatch,
    actions: {
      updateDataState,
      updateDataStartDate,
      updateDataEndDate,
      updateExpandedMap,
    },
  } = ctx;

  if (requestStatus === RequestStatus.REQUESTING_CONFIGURATION) {
    return (
      <div>
        Requesting configuration from the server. This may take a few moments.
      </div>
    );
  }

  if (!(dataMinDate && dataMaxDate)) {
    return "";
  }

  const minDate = toDateObj(dataMinDate);
  const maxDate = toDateObj(dataMaxDate);

  const startDate = toDateObj(dataStartDate);
  const endDate = toDateObj(dataEndDate);

  // console.log({
  // dataState,
  // dataMinDate,
  // dataMaxDate,
  // dataStartDate,
  // dataEndDate,
  // expandedMap,

  // minDate,
  // maxDate,
  // startDate,
  // endDate,
  // });

  return (
    <div>
      <h2
        style={{
          fontSize: "25px",
          textAlign: "center",
          marginBottom: "15px",
          fontWeight: "bold",
        }}
      >
        NPMRDS Travel Time Data Request Form
      </h2>

      <table className="w-full">
        <tbody>
          <tr key="dataState" className="border-b">
            <td className="py-4 text-left">State</td>
            <td className="py-4 text-left">
              <select
                className="text-center w-1/2 bg-white p-2 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
                value={dataState}
                onChange={(e) => {
                  console.log("selected dataState", e.target.value);
                  dispatch(updateDataState(e.target.value));
                }}
              >
                {Object.entries(stateNameToAbbreviation).map(([k, v]) => (
                  <option key={k} value={v}>
                    {k}
                  </option>
                ))}
              </select>
            </td>
          </tr>

          <tr key="dataStartDate" className="border-b">
            <td className="py-4 text-left">Start Date</td>
            <td className="py-4 text-left">
              <DatePicker
                selected={startDate}
                onChange={(date) => {
                  const d = date.toISOString().replace(/T.*/, "");

                  dispatch(updateDataStartDate(d));

                  if (date > endDate) {
                    dispatch(updateDataEndDate(d));
                  }
                }}
                minDate={minDate}
                maxDate={maxDate}
              />
            </td>
          </tr>

          <tr key="dataEndDate" className="border-b">
            <td className="py-4 text-left">End Date</td>
            <td className="py-4 text-left">
              <DatePicker
                selected={endDate}
                onChange={(date) => {
                  const d = date.toISOString().replace(/T.*/, "");

                  dispatch(updateDataEndDate(d));
                  if (date < startDate) {
                    dispatch(updateDataStartDate(d));
                  }
                }}
                minDate={minDate}
                maxDate={maxDate}
              />
            </td>
          </tr>

          <tr key="expandedMap" className="border-b">
            <td className="py-4 text-left">Use Extended Map</td>
            <td>
              <input
                type="checkbox"
                checked={expandedMap}
                onChange={() => dispatch(updateExpandedMap(!expandedMap))}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function RequestButton() {
  const ctx = useContext(EtlContextReact);

  const { requestStatus } = useEtlContext(ctx);

  if (requestStatus === RequestStatus.INCOMPLETE) {
    return "";
  }

  const {
    operations: { requestNpmrdsTravelTimesData },
  } = ctx;

  let requestButtonText = "Submit";
  let requestButtonBgColor = "#3b82f680";

  if (requestStatus < RequestStatus.CONFIGURED) {
    return "";
  }

  if (requestStatus === RequestStatus.CONFIGURED) {
    requestButtonText = "Send";
    requestButtonBgColor = "#e5e7eb";
  }

  if (requestStatus === RequestStatus.SENT) {
    requestButtonText = "Sending...";
    requestButtonBgColor = "#e5e7eb";
  }

  if (requestStatus === RequestStatus.RECEIVED) {
    requestButtonText = "Received";
    requestButtonBgColor = "#e5e7eb";
  }

  if (requestStatus === RequestStatus.ERROR) {
    requestButtonText = "Error";
    requestButtonBgColor = "red";
  }

  return (
    <span
      style={{
        display: "inline-block",
        marginTop: "20px",
        textAlign: "center",
        padding: "10px",
        fontSize: "25px",
        border: "2px solid",
        borderRadius: "25px",
        backgroundColor: requestButtonBgColor,
      }}
      onClick={() => {
        if (requestStatus === RequestStatus.CONFIGURED) {
          requestNpmrdsTravelTimesData();
        }
      }}
    >
      {requestButtonText}
    </span>
  );
}

export default function NpmrdsTravelTimesExportRequestForm() {
  return (
    <div>
      <FormInputs />
      <RequestButton />
    </div>
  );
}
