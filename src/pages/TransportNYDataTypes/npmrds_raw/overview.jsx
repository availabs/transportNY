import React, { useMemo } from "react";
import { groupBy, orderBy } from "lodash";

export default function NpmrdsRawOverview({
  views,
}) {
  const groupbyState = useMemo(() => {
    return groupBy(
      orderBy(
        views.filter(v => v && v.metadata),
        ["metadata.start_date", "metadata.end_date"],
        ["asc", "asc"]
      ),
      (v) => v?.metadata?.state_code
    );
  }, [views]);

  const headers = [
    "State",
    "View Id",
    "Version",
    "Start Date",
    "End Date",
    "Total Percent",
    "Interstate Percent",
    "Non Interstate Percent",
    "Extended TMC Percent",
    "Tmcs",
  ];

  return (
    <div className="w-full p-5">
      <div className="flex m-3">
        <div className="justify-start w-full md:w-1/2 px-3 mb-6 md:mb-0">
          <label className="block uppercase tracking-wide text-gray-700 text-xl font-bold mb-2">
            View Data
          </label>
        </div>
      </div>

      {Object.keys(groupbyState).length ? (
        <div className="overflow-x-auto px-5 py-3">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                {headers.map((key) => (
                  <th
                    key={key}
                    className="py-2 px-4 bg-gray-200 text-left border-b"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupbyState).map((group) => (
                <React.Fragment key={group}>
                  {groupbyState[group].map((item, index) => (
                    <tr key={index}>
                      {index === 0 && (
                        <td
                          rowSpan={groupbyState[group].length}
                          className="py-2 px-4 border-b font-bold"
                        >
                          {group}
                        </td>
                      )}
                      <td
                        key={`${group}.${item?.view_id}`}
                        className="py-2 px-4 border-b"
                      >
                        {item?.view_id}
                      </td>
                      <td
                        key={`${group}.npmrds_version.${index}`}
                        className="py-2 px-4 border-b"
                      >
                        {item?.metadata?.npmrds_version}
                      </td>
                      <td
                        key={`${group}.start_date.${index}`}
                        className="py-2 px-4 border-b"
                      >
                        {item?.metadata?.start_date}
                      </td>
                      <td
                        key={`${group}.end_date.${index}`}
                        className="py-2 px-4 border-b"
                      >
                        {item?.metadata?.end_date}
                      </td>
                      <td
                        key={`${group}.total.${index}`}
                        className="py-2 px-4 border-b"
                      >
                        {item?.statistics?.total && Math.round(item?.statistics?.total * 100) / 100}
                      </td>
                      <td
                        key={`${group}.interstate_percentage.${index}`}
                        className="py-2 px-4 border-b"
                      >
                        {item?.statistics?.interstate_percentage && Math.round(item?.statistics?.interstate_percentage * 100) / 100}
                      </td>
                      <td
                        key={`${group}.non_interstate_percentage.${index}`}
                        className="py-2 px-4 border-b"
                      >
                        {item?.statistics?.non_interstate_percentage && Math.round(item?.statistics?.non_interstate_percentage * 100) / 100}
                      </td>
                      <td
                        key={`${group}.extended_tmc_percentage.${index}`}
                        className="py-2 px-4 border-b"
                      >
                        {item?.statistics?.extended_tmc_percentage && Math.round(item?.statistics?.extended_tmc_percentage * 100) / 100}
                      </td>
                      <td
                        key={`${group}.${item?.metadata?.no_of_tmc}`}
                        className="py-2 px-4 border-b"
                      >
                        {item?.metadata?.no_of_tmc}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-red-400"
          role="alert"
        >
          <span className="font-medium">No Views available</span>
        </div>
      )}
    </div>
  );
}
