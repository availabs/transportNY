import React, { useState, useMemo, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import get from "lodash/get";
import {
  Listbox,
  ListboxOption,
  ListboxOptions,
  ListboxButton,
  Transition,
} from "@headlessui/react";

import { DamaContext } from "~/pages/DataManager/store";
import PublishNpmrdsRaw from "./publish";
import {
  SourceAttributes,
  ViewAttributes,
  getAttributes,
} from "~/pages/DataManager/Source/attributes";
const Create = ({ source }) => {
  const [npmrdsSourceId, setNpmrdsSourceId] = useState("");
  const [percentTmc, setPercentTmc] = useState(100);
  const [year, setYear] = useState(2023);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);

  const { pgEnv, user, falcor, falcorCache } = React.useContext(DamaContext);
  console.log("dama user", user);
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

  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "sources", "length"];
      const resp = await falcor.get(lengthPath);

      await falcor.get(
        [
          "dama",
          pgEnv,
          "sources",
          "byIndex",
          { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
          "attributes",
          Object.values(SourceAttributes),
        ],
        ["dama-info", pgEnv, "settings"]
      );
    }

    fetchData();
  }, [falcor, pgEnv]);

  const sources = useMemo(() => {
    return Object.values(
      get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {})
    )
      .map((v) =>
        getAttributes(
          get(falcorCache, v.value, { attributes: {} })["attributes"]
        )
      )
      .filter((source) => source.type === "npmrds");
  }, [falcorCache, pgEnv]);
  console.log(source);
  return (
    <div className="w-full m-5">
      <div className="flex items-center justify-center p-2">
        <div className="w-full max-w-xs mx-auto">
          <div className="flex flex-col pt-2">
            <div className="flex px-2 text-sm text-gray-600 capitalize">
              NPMRDS Production Source
            </div>
            <div className="flex pl-1">
              <select
                className={
                  "flex-0 w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md"
                }
                onChange={(e) => {
                  setNpmrdsSourceId(e.target.value);
                }}
                value={npmrdsSourceId}
              >
                <option value="">--</option>
                {sources.map((source) => (
                  <option
                    value={source.source_id}
                    key={`map21_source_select_${source.source_id}`}
                  >
                    {source.name} -- {source.source_id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-2">
        <div className="w-full max-w-xs mx-auto">
          <div className="flex items-center justify-center">
            <div className="w-[50%]">
              <div className="flex px-2 pb-1 text-sm text-gray-600 capitalize">
                Year
              </div>
              <div className="flex pl-1">
                <input
                  className={
                    "flex-0 w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md"
                  }
                  type="number"
                  max={2025}
                  min={2017}
                  step={1}
                  onChange={(e) => {
                    setYear(e.target.value);
                  }}
                  value={year}
                />
              </div>
            </div>
            <div className="w-[50%]">
              <div className="flex px-2 pb-1 text-sm text-gray-600 capitalize">
                % of tmc
              </div>
              <div className="flex pl-1">
                <input
                  type="number"
                  min={.1}
                  max={100}
                  className={
                    "flex-0 w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md"
                  }
                  step={.1}
                  onChange={(e) => {
                    setPercentTmc(parseFloat(e.target.value));
                  }}
                  value={percentTmc}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {npmrdsSourceId && year && source?.name ? (
        <>
          <PublishNpmrdsRaw
            source_id={source?.source_id || null}
            year={year}
            npmrdsSourceId={npmrdsSourceId}
            loading={loading}
            setLoading={setLoading}
            name={source?.name}
            type={source?.type}
            user_id={user?.id}
            email={user?.email}
            pgEnv={pgEnv}
            percentTmc={percentTmc}
          />
        </>
      ) : null}
    </div>
  );
};

export default Create;
