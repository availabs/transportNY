import React, { useContext, useEffect } from "react";
import { ComponentContext } from "../../../modules/dms/packages/dms/src/patterns/page/context";

const isJson = (str) => {
  try {
    JSON.parse(str);
  } catch {
    return false;
  }
  return true;
};

const Edit = ({ value, onChange }) => {
  const { state, setState } = useContext(ComponentContext);

  const cachedData =
    value && isJson(value) ? JSON.parse(value) : {};

  useEffect(() => {
    if (cachedData) {
      setState((draft) => {
        if (!draft.display) draft.display = {};
        draft.display.header = cachedData.header || "Header";
        draft.display.sub_header = cachedData.sub_header || "Sub-Header";
        draft.display.description =
          cachedData.description || "Description";
      });
    }
  }, []);

  const display = state?.display || {};

  const updateField = (key, val) => {
    setState((draft) => {
      if (!draft.display) draft.display = {};
      draft.display[key] = val;
    });

    const updated = {
      header: key === "header" ? val : display.header,
      sub_header: key === "sub_header" ? val : display.sub_header,
      description: key === "description" ? val : display.description,
    };

    onChange(JSON.stringify(updated));
  };

  return (
    <div className="px-12 py-10">
      <div className="max-w-4xl">

        <input
          className="text-4xl font-bold bg-transparent outline-none w-full text-gray-900"
          value={display.header || ""}
          onChange={(e) => updateField("header", e.target.value)}
        />

        <input
          className="text-2xl mt-2 bg-transparent outline-none w-full text-gray-700"
          value={display.sub_header || ""}
          onChange={(e) => updateField("sub_header", e.target.value)}
        />

        <textarea
          className="mt-4 w-full bg-transparent outline-none text-gray-600 leading-relaxed"
          rows={3}
          value={display.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
        />
      </div>
    </div>
  );
};

const View = ({ value }) => {
  const cachedData =
    value && isJson(value) ? JSON.parse(value) : {};

  return (
    <div className="px-12 py-10">
      <div className="max-w-4xl">
        
        <h1 className="text-4xl font-bold text-gray-900">
          {cachedData.header || ""}
        </h1>

        <h2 className="text-2xl mt-2 text-gray-700">
          {cachedData.sub_header || ""}
        </h2>

        <p className="mt-4 text-gray-600 leading-relaxed">
          {cachedData.description || ""}
        </p>
      </div>
    </div>
  );
};

export default {
  name: "TransportNY header",
  EditComp: Edit,
  ViewComp: View,
  defaultState: {
    display: {
      header: "Header",
      sub_header: "Sub-Header",
      description: "Description",
    },
  },
  controls: {
    default: [
      { type: "input", inputType: "text", label: "Header", key: "header" },
      { type: "input", inputType: "text", label: "Sub-Header", key: "sub_header" },
      { type: "input", inputType: "textarea", label: "Description", key: "description" },
    ],
  },
};