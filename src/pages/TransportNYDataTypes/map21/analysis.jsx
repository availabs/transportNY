import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import "react-datepicker/dist/react-datepicker.css";
import get from "lodash/get";
import { useFalcor } from "@availabs/avl-falcor";
import { getExternalEnv } from "~/modules/dms/packages/dms/src/patterns/datasets/utils/datasources";
import { DatasetsContext } from '~/modules/dms/packages/dms/src/patterns/datasets/context.js';

export const AnalysisPage = ({source}) => {
  const { views } = source;
  const { datasources } = React.useContext(DatasetsContext);
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = getExternalEnv(datasources);
  const { sourceId, viewId, vPage } = useParams();

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
    const sources = get(falcorCache, ["uda", pgEnv, "sources", "byId"]);
    const sourceNames = Object.keys(sources || {}).reduce((acc, sId) => {
      const curSource = sources[sId];
      acc[sId] =
        typeof curSource?.display_name === "string"
          ? curSource?.display_name
          : curSource?.name;
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
        "uda",
        pgEnv,
        "sources",
        "byId",
        prodSourceIds,
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
                    let dataKey = key;
                    if(key === "raw_view_id" && view["rawViewIdsForYear"]) {
                      dataKey = "rawViewIdsForYear";
                    }
                    const isNum = dataKey !== 'year' && !!parseFloat(view[dataKey]);
                    const isArray = Array.isArray(view[dataKey]);
                    return (
                      <td
                        key={`${view.view_id}.${dataKey}`}
                        className="py-2 px-4 bg-gray-200 text-left border-b"
                      >
                        {dataKey === "version"
                          ? view[dataKey] || view.view_id
                          : isArray ? view[dataKey].join(", "): isNum ? parseFloat(view[dataKey]).toLocaleString() : view[dataKey]}
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
