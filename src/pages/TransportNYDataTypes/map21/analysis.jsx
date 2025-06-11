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
  ];

  const flatViews = views.map((view) => ({
    ...view,
    ...view?.metadata,
    ...view?.metadata.stateAnalysis,
  }));

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
                  {headers.map((key) => (
                    <td
                      key={`${view.view_id}.${key}`}
                      className="py-2 px-4 bg-gray-200 text-left border-b"
                    >
                      {key === 'version' ? view[key] || view.view_id :view[key]}
                    </td>
                  ))}
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
