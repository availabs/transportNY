import React from "react";
import { useNavigate } from "react-router";

import { ScalableLoading } from "~/modules/avl-components/src";
import { DAMA_HOST } from "~/config";

const submitUpload = (props, navigate, pgEnv) => {
  props.setLoading(true);
  const runPublishNpmrdsRaw = async () => {
    try {
      const publishData = {
        source_id: props?.source_id || null,
        name: props?.name,
        type: props?.type,
        startDate: props?.startDate,
        endDate: props?.endDate,
        states: props?.states,
        user_id: props?.user_id,
        pgEnv: pgEnv || props?.pgEnv,
        email: props?.email,
        passUuid: props?.passUuid,
        truckUuid: props?.truckUuid,
        allUuid: props?.allUuid,
        numTmc: props?.numTmc
      };

      const res = await fetch(
        `${DAMA_HOST}/dama-admin/${pgEnv}/npmrds-raw/download-and-publish`,
        {
          method: "POST",
          body: JSON.stringify(publishData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const publishFinalEvent = await res.json();
      const { etl_context_id, source_id } = publishFinalEvent;

      console.log(etl_context_id, source_id);
      props.setLoading(false);
      if (source_id && etl_context_id) {
        navigate(`/datasources/source/${source_id}/uploads/${etl_context_id}`);
      } else {
        navigate(`/datasources/source/${source_id}`);
      }
    } catch (err) {
      props.setLoading(false);
      console.log("error : ", err);
    }
  };
  runPublishNpmrdsRaw();
};

export default function PublishNpmrdsRaw(props) {
  const navigate = useNavigate();
  const { loading, pgEnv } = props;

  const buttonClass = props.disabled
      ? "cursor-not-allowed bg-gray-400 text-white font-bold py-2 px-4 rounded"
      : "cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded";
  return (
    <>
      <button
        disabled={props.disabled}
        className={buttonClass}
        onClick={() => submitUpload(props, navigate, pgEnv)}
      >
        {" "}
        {loading ? (
          <div style={{ display: "flex" }}>
            <div className="mr-2">Publishing</div>
            <div>
              <ScalableLoading scale={0.25} color={"#fefefe"} />
            </div>
          </div>
        ) : (
          <>New Publish</>
        )}
      </button>
    </>
  );
}
