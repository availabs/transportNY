import React, { useCallback } from "react";
import { useNavigate } from "react-router";

import { ScalableLoading } from "~/modules/avl-components/src";
import { DAMA_HOST } from "~/config";

import {
  RAW_QCEW_PREFIX,
} from "./create";

const qcewPublish = async (props, navigate, pgEnv) => {
  props.setLoading(true);

  const publishData = {
    source_values: {
      name: props?.name,
      type: 'gis_dataset'
    },
    newVersion: props?.newVersion,
    source_id: props?.source_id || null,
    user_id: props?.user_id,
    email: props.email,
    name: props?.name,
    type: props?.type || "qcew_processed",
    pgEnv: pgEnv || props?.pgEnv,
    [`${RAW_QCEW_PREFIX}SourceId`]: props?.[`${RAW_QCEW_PREFIX}SourceId`],
    [`${RAW_QCEW_PREFIX}ViewId`]: props?.[`${RAW_QCEW_PREFIX}ViewId`],
  };
  console.log("qcew pub",{publishData})
  try {
    console.log("attempting to make qcew_processed source", publishData)
    const res = await fetch(
      `${DAMA_HOST}/dama-admin/${pgEnv}/qcew_processed/publish`,
      {
        method: "POST",
        body: JSON.stringify(publishData),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const publishFinalEvent = await res.json();
    console.log("publishFinalEvent: ", publishFinalEvent);
    const { source_id } = publishFinalEvent;

    console.log(source_id);
    props.setLoading(false);
    if (source_id) {
      navigate(`/datasources/source/${source_id}`);
    }
  } catch (err) {
    props.setLoading(false);
    console.log("error : ", err);
  }
};

export default function PublishQcew(props) {
  const navigate = useNavigate();
  const { loading, setLoading, pgEnv, ...restProps } = props;
  const handlePublishClick = useCallback(() => {
    qcewPublish({ ...restProps, setLoading }, navigate, pgEnv);
  }, [restProps, navigate, setLoading]);
  const buttonClass = props.disabled
      ? "cursor-not-allowed bg-gray-400 text-white font-bold py-2 px-4 rounded"
      : "cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded";

  return (
    <div className="flex flex-col">
      <div >
        <button
          className={buttonClass}
          disabled={props.disabled}
          onClick={handlePublishClick}
        >
          {loading ? (
            <div className="w-[40%] flex">
              <div className="mr-2">Publishing</div>
              <ScalableLoading scale={0.25} color={"#fefefe"} />
            </div>
          ) : (
            "New Publish"
          )}
        </button>
      </div>
    </div>
  );
}
