import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import "react-datepicker/dist/react-datepicker.css";
import get from "lodash/get";
import { DAMA_HOST } from "~/config";

import { DamaContext } from "~/pages/DataManager/store";

export const AnalysisPage =  (props) => {
  const { views } = props;
  const { pgEnv, user, falcor, falcorCache } = React.useContext(DamaContext);
  const { sourceId, viewId, vPage } = useParams();
  console.log("AnalysisPage props::", props)
  console.log({ sourceId, viewId, vPage } )
  useEffect(() => {
    const analysisVersion = viewId ? viewId : views[0].view_id;
    const getAnalysis = async () => {
      const analysisData = {
        source_id: sourceId,
        view_id: analysisVersion,
        user_id: user.id,
        email: user.email
      }
      console.log("analysisData",analysisData)
      const res = await fetch(
        `${DAMA_HOST}/dama-admin/${pgEnv}/pm3/analysis`,
        {
          method: "POST",
          body: JSON.stringify(analysisData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const publishFinalEvent = await res.json();
      console.log(publishFinalEvent);
    }

    getAnalysis();
  },[sourceId, viewId, pgEnv])

  return <>
    Hello World
  </>
};

export default AnalysisPage;