import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import "react-datepicker/dist/react-datepicker.css";
import get from "lodash/get";
import { DAMA_HOST } from "~/config";

import { DamaContext } from "~/pages/DataManager/store";

export const AnalysisPage = (props) => {
  const { views } = props;
  const { pgEnv, user, falcor, falcorCache } = React.useContext(DamaContext);
  const { sourceId, viewId, vPage } = useParams();
  // console.log("AnalysisPage views::", views)

  const headers = [
    "version",
    "year",
    "num_tmcs",
    "total_miles",
    "vmt",
    "phed",
    "lottrinterstate",
    "lottrnon_interstate",
    "tttrinterstate",
    "raw_view_id",
    "meta_view_id",
    "npmrds_prod_source_id",
    "npmrds_prod_source_name"
  ];

  const sourceNames = useMemo(() => {
    const sources = get(falcorCache, ["dama", pgEnv, "sources", "byId"]);
    const sourceNames = Object.keys(sources).reduce((acc, sId) => {
      const curSource = sources[sId];
      acc[sId] =
        typeof curSource?.attributes?.display_name === "string"
          ? curSource?.attributes?.display_name
          : curSource?.attributes?.name;
      return acc;
    }, {});

    return sourceNames;
  }, [falcorCache]);

  const flatViews = useMemo(() => {
    return views.map((view) => ({
      ...view,
      ...view?.metadata,
      ...view?.metadata.stateAnalysis,
      npmrds_prod_source_name: sourceNames[view?.metadata?.npmrds_prod_source_id],
    }));
  }, [sourceNames, views]);

  flatViews.sort((a, b) => b.year - a.year);
  useEffect(() => {
    const getSourceNames = async () => {
      const prodSourceIds = flatViews.map(
        (fView) => fView.npmrds_prod_source_id
      );
      await falcor.get([
        "dama",
        pgEnv,
        "sources",
        "byId",
        prodSourceIds,
        "attributes",
        ["type", "name", "display_name"],
      ]);
    };

    if (flatViews.length > 0) {
      getSourceNames();
    }
  }, [flatViews]);

  return (
    <>
      {
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
              {flatViews.map((view) => (
                <tr key={`${view.view_id}`}>
                  {headers.map((key) => {
                    const isNum = key !== 'year' && !!parseFloat(view[key]);
                    return (
                      <td
                        key={`${view.view_id}.${key}`}
                        className="py-2 px-4 bg-gray-200 text-left border-b"
                      >
                        {key === "version"
                          ? view[key] || view.view_id
                          : isNum ? parseFloat(view[key]).toLocaleString() : view[key]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </>
  );
};

export default AnalysisPage;
