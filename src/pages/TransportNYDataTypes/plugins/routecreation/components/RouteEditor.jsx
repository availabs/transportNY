import React, { useMemo } from "react";
import { Button } from "~/modules/avl-components/src";

export const RouteEditor = ({
  tmc_array,
  tmcData,
  searchInputTmc,
  setSearchInput,
  removeTmc,
  setModalOpen,
}) => {
  const tmcRows = useMemo(() => {
    if (tmc_array?.length > 0) {
      return tmc_array.map((tmc) => {
        const tData = tmcData.find((td) => td.tmc === tmc) || {
          tmc,
          miles: 0,
          intersection: "",
        };
        return (
          <div
            key={`tmc_${tData.tmc}`}
            className="border-b hover:bg-gray-200 px-1 "
          >
            <div className="flex items-center">
              <div className="font-bold text-sm flex-1">{tData.tmc}</div>
              <div className="text-xs">{tData.miles.toFixed(3)} miles</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs">{tData.intersection}</div>
              <div
                className="text-xs text-red-500 cursor-pointer hover:bg-gray-300 rounded p-1"
                onClick={() => removeTmc(tData.tmc)}
              >
                Remove
              </div>
            </div>
          </div>
        );
      });
    } else {
      return null;
    }
  }, [tmcData, tmc_array, removeTmc]);

  const totalMiles = tmcData.reduce((acc, curr) => acc + curr.miles, 0);

  return (
    <div
      className="grid grid-cols-1 gap-2 p-1 pointer-events-auto drop-shadow-lg p-4 bg-white/90"
      style={{
        position: "absolute",
        top: "25px",
        right: "-168px",
        color: "black",
        width: "318px",
        maxHeight: "350px",
      }}
    >
      <div>
        <div className="font-bold">TMC Search</div>
        <label className="flex w-full">
          <input
            className="w-full p-2 bg-white/40 rounded"
            value={searchInputTmc}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </label>
      </div>
      <div className="border-b-2 border-current mb-1 flex items-center">
        <div className="font-bold text-lg flex-1">TMC List</div>
        <div className="text-sm">Total Miles: {totalMiles.toFixed(3)}</div>
      </div>
      <div className="overflow-auto scrollbar-sm" style={{ maxHeight: "125px" }}>
        {tmcRows}
      </div>
      {tmc_array?.length > 0 && (
        <div className="mb-1 flex items-center">
          <Button
            themeOptions={{ color: "transparent" }}
            onClick={() => {console.log("this is onclick");setModalOpen(true)}}
            style={{ width: "100%", marginTop: "10px" }}
          >
            Save Route
          </Button>
        </div>
      )}
    </div>
  );
};
