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
  const [year, setYear] = useState(2024);
  const [loading, setLoading] = useState(false);

  const { pgEnv, user, falcor, falcorCache } = React.useContext(DamaContext);
  console.log("dama user", user);

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

  const currentDataSource = useMemo(() => {
    return sources.find(
      (dataSource) => dataSource.source_id === parseInt(npmrdsSourceId)
    );
  }, [sources, npmrdsSourceId]);

  const availableYears = useMemo(() => {
    return currentDataSource
      ? Object.keys(currentDataSource?.metadata?.npmrds_meta_layer_view_id).map(
          (yearString) => parseInt(yearString)
        )
      : Array.from(
          Array(9)
            .keys()
            .map((k) => k + 2017)
        );
  }, [currentDataSource]);

  useEffect(() => {
    if (!year || !availableYears.includes(year)) {
      setYear(availableYears[0]);
    }
  }, [availableYears]);
  
  const yearInputClass = !npmrdsSourceId
    ? `flex-0 w-full p-1 cursor-not-allowed bg-gray-200 hover:bg-gray-300 rounded-md`
    : `flex-0 w-full p-1 bg-blue-100 hover:bg-blue-300 border rounded-md`;
  
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
                  disabled={!npmrdsSourceId}
                  className={yearInputClass}
                  type="number"
                  max={availableYears[availableYears.length-1]}
                  min={availableYears[0]}
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
