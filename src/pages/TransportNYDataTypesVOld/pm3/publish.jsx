import React, { useCallback } from "react";
import { useNavigate } from "react-router";

import { ScalableLoading } from "~/modules/avl-components/src";
import { DAMA_HOST } from "~/config";

const pm3Publish = async (props, navigate, pgEnv) => {
  props.setLoading(true);
  let years = props.years;
  if(props.startDate && props.endDate) {
    years = [props.startDate.getFullYear()]
  }

  const publishData = {
    source_values: {
      name: props?.name,
      type:  props?.type
    },
    newVersion: props?.newVersion,
    source_id: props?.source_id || null,
    user_id: props?.user_id,
    email: props.email,
    name: props?.name,
    type: props?.type || "pm3",
    pgEnv: pgEnv || props?.pgEnv,
    dates:[props.startDate, props.endDate],
    years,
    npmrdsSourceId: props.npmrdsSourceId,
    view_id: props.view_id
  };

  try {
    console.log("attempting to make pm3 source", publishData)
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

export default function PublishPm3(props) {
  const navigate = useNavigate();
  const { loading, setLoading, pgEnv, ...restProps } = props;
  
  const handlePublishClick = useCallback(() => {
    pm3Publish({ ...restProps, setLoading }, navigate, pgEnv);
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
