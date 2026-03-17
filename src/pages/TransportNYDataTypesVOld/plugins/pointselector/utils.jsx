import React from "react"

import get from "lodash/get"

import {
  SourceAttributes,
  ViewAttributes,
  getAttributes
} from "~/pages/DataManager/Source/attributes";

export const useFetchSources = ({ falcor, falcorCache, pgEnv }) => {
  React.useEffect(() => {
    falcor.get(["dama", pgEnv, "sources", "length"]);

    const length = get(falcorCache, ["dama", pgEnv, "sources", "length"], 0);

    if (length) {
      falcor.get([
        "dama", pgEnv, "sources", "byIndex",
        { from: 0, to: length - 1 },
        "attributes", Object.values(SourceAttributes)
      ])
    }
  }, [falcor, falcorCache, pgEnv]);
}

export const useGetSources = ({ falcorCache, pgEnv, categories = [], columns = [] }) => {
  return React.useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]))
      .filter(src => {
        return categories.reduce((a, c) => {
          return a && src?.categories?.reduce((aa, cc) => {
            return cc.reduce((aaa, ccc) => aaa || (ccc === c), aa);
          }, false);
        }, true);
      })
      .filter(d => {
        const mdColumns = get(d, ["metadata", "columns"], get(d, "metadata", []));
        if (Array.isArray(mdColumns)) {
          const mdColumnsMap = mdColumns.reduce((a, c) => {
            a.add(c.name);
            return a;
          }, new Set());
          return columns.reduce((a, c) => {
            return a && mdColumnsMap.has(c);
          }, true);
        }
        return false;
      }).sort((a, b) => a.name.localeCompare(b.name));
  }, [falcorCache, pgEnv, categories, columns]);
}

export const useFetchSourceViews = ({ falcor, falcorCache, pgEnv, source_id }) => {
  React.useEffect(() => {
    if (!source_id) return;

    falcor.get(["dama", pgEnv, "sources", "byId", source_id, "views", "length"]);

    const length = get(falcorCache, ["dama", pgEnv, "sources", "byId", source_id, "views", "length"], 0);

    if (length) {
      falcor.get([
        "dama", pgEnv, "sources", "byId", source_id, "views", "byIndex",
        { from: 0, to: length - 1 },
        "attributes", Object.values(ViewAttributes)
      ]);
    }
  }, [falcor, falcorCache, pgEnv, source_id]);
}

export const useGetViews = ({ falcorCache, pgEnv, source_id }) => {
  return React.useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", source_id, "views", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]))
      .sort((a, b) => String(a.version || a.view_id).localeCompare(String(b.version || b.view_id)));
  }, [falcorCache, source_id, pgEnv]);
}

export const SourceAndViewSelectors = props => {
  const {
    label,
    sourceKey,
    sourceValue,
    viewKey,
    viewValue,
    setCreateState,
    sources = [],
    views = [],
    children
  } = props
  return (
    <>
      <SourceSelector
        label={ `Select ${ label } Source` }
        sourceKey={ sourceKey }
        viewKey={ viewKey }
        value={ sourceValue }
        setCreateState={ setCreateState }
        sources={ sources }/>

        { children }

        { sourceValue && (
            <ViewSelector
              label={ `Select ${ label } View` }
              viewKey={ viewKey }
              value={ viewValue }
              setCreateState={ setCreateState }
              views={ views }/>
          )
        }
    </>
  )
}

const SelectorContainer = ({ label, value, onChange, sources = [], views = [] }) => {
  return (
    <div className="text-sm flex items-center mb-1">
      <div className="font-medium mr-1 flex-1">
        { label }:
      </div>
      <select
          value={ value || "no-value" }
          onChange={ onChange }
          className='text-sm px-2 py-1 bg-white shadow w-3/5 cursor-pointer'
      >
        <option value="no-value">{ label }</option>
        { sources.map(s =>
            <option key={ s.source_id }
              value={ s.source_id }
              className="text-sm"
            >
              { s.name }
            </option>
          )
        }
        { views.map(v =>
            <option key={ v.view_id }
              value={ v.view_id }
              className="text-sm"
            >
              { v.version || `View ID: ${ v.view_id }` }
            </option>
          )
        }
      </select>
    </div>
  )
}

export const SourceSelector = ({ label, sourceKey, viewKey, value, setCreateState, sources = [] }) => {

  const onChange = React.useCallback(e => {
    if (e.target.value === "no-value") {
      setCreateState(prev => ({ ...prev, [sourceKey]: null, [viewKey]: null }));
    }
    else {
      setCreateState(prev => ({ ...prev, [sourceKey]: e.target.value, [viewKey]: null }));
    }
  }, [setCreateState, sourceKey, viewKey]);

  React.useEffect(() => {
    if ((value === null) && (sources.length === 1)) {
      setCreateState(prev => ({ ...prev, [sourceKey]: sources[0].source_id, [viewKey]: null }));
    }
  }, [value, setCreateState, sourceKey, viewKey, sources.length]);

  return (
    <SelectorContainer
      label={ label }
      value={ value }
      onChange={ onChange }
      sources={ sources }/>
  )
}
export const ViewSelector = ({ label, viewKey, value, setCreateState, views = [] }) => {

  const onChange = React.useCallback(e => {
    if (e.target.value === "no-value") {
      setCreateState(prev => ({ ...prev, [viewKey]: null }));
    }
    else {
      setCreateState(prev => ({ ...prev, [viewKey]: e.target.value }));
    }
  }, [setCreateState, viewKey]);

  React.useEffect(() => {
    if ((value === null) && (views.length === 1)) {
      setCreateState(prev => ({ ...prev, [viewKey]: views[0].view_id }));
    }
  }, [value, setCreateState, viewKey, views.length]);

  return (
    <SelectorContainer
      label={ label }
      value={ value }
      onChange={ onChange }
      views={ views }/>
  )
}