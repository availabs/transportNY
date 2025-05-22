import React from "react";
import { useNavigate } from "react-router";

import { ScalableLoading } from "~/modules/avl-components/src";
import { DAMA_HOST } from "~/config";

const submitUpload = (props, navigate, pgEnv) => {
  props.setLoading(true);
  const runPublishNpmrdsRaw = async () => {
    try {
      const publishData = {
        source_values: {
          name: props?.name,
          type:  props?.type
        },
        source_id: props?.source_id,
        npmrdsSourceId: props?.npmrdsSourceId || null,
        percentTmc: props?.percentTmc || 100,
        name: props?.name,
        type: props?.type,
        year: props.year,
        user_id: props?.user_id,
        email: props?.email,
        pgEnv: pgEnv || props?.pgEnv,
      };
      console.log("publishData",publishData)
      const res = await fetch(
        `${DAMA_HOST}/dama-admin/${pgEnv}/pm3/publish`,
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
  return (
    <>
      <button
        className={`cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
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
