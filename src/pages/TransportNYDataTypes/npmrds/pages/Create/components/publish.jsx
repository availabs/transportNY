import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { ScalableLoading } from "~/modules/avl-components/src";
import { DAMA_HOST } from "~/config";
import { MAX_NPMRDS_SOURCE_NAME_LENGTH } from "../"

const npmrdsPublish = async (props, navigate, pgEnv) => {
  props.setLoading(true);
  
  const publishData = {
    source_id: props?.source_id || null,
    user_id: props?.user_id,
    name: props?.name,
    type: props?.type || "npmrds",
    pgEnv: pgEnv || props?.pgEnv,
    tmcSpeedViewId: props?.selectedViewId,
    tmcSpeedSourceId: props?.selectedSourceId,
  };

  try {
    const res = await fetch(
      `${DAMA_HOST}/dama-admin/${pgEnv}/npmrds/publish`,
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

export default function PublishNpmrds(props) {
  const navigate = useNavigate();
  const { loading, setLoading, pgEnv, ...restProps } = props;
  
  const handlePublishClick = useCallback(() => {
    npmrdsPublish({ ...restProps, setLoading }, navigate, pgEnv);
  }, [restProps, navigate, setLoading]);
  const isNameTooLong = props?.name?.length >= MAX_NPMRDS_SOURCE_NAME_LENGTH;
  const isButtonDisabled = (!props.source_id && !props.name) || !props.selectedViewId || isNameTooLong;
  const buttonClass = isButtonDisabled
    ? "cursor-not-allowed bg-gray-400 text-white font-bold py-2 px-4 rounded"
    : "cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded";

  return (
    <div className="flex flex-col w-[20%]">
      {(props.source_id || props.name) && !props.selectedViewId && "A TMC Speed Limit Source and View must be selected."}
      <button
        className={buttonClass}
        disabled={isButtonDisabled}
        onClick={handlePublishClick}
      >
        {loading ? (
          <div style={{ display: "flex" }}>
            <div className="mr-2">Publishing</div>
            <ScalableLoading scale={0.25} color={"#fefefe"} />
          </div>
        ) : (
          "New Publish"
        )}
      </button>
    </div>
  );
}
