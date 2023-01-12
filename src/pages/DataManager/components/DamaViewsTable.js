// https://docs.mapbox.com/mapbox-gl-js/style-spec/
// https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#tiled-sources

import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import { DAMA_HOST } from "config";

import _ from "lodash";

import { useFalcor } from "modules/avl-components/src";

import { selectPgEnv } from "pages/DataManager/store";
import { getAttributes } from "pages/DataManager/components/attributes";

export default function DamaViewsTable() {
  const history = useHistory();
  const { sourceId } = useParams();
  const { falcor, falcorCache } = useFalcor();
  const [viewsMetaWithDeps, setViewsMetaWithDeps] = React.useState(null);

  const pgEnv = useSelector(selectPgEnv);

  React.useEffect(() => {
    (async () => {
      // dama[{keys:pgEnvs}].sources.byId[{keys:sourceIds}].views.length
      const viewsLenQuery = [
        "dama",
        pgEnv,
        "sources",
        "byId",
        sourceId,
        "views",
        "length",
      ];

      const viewsLenResp = await falcor.get(viewsLenQuery);

      const viewsLen = _.get(viewsLenResp, ["json", ...viewsLenQuery]);

      const viewsMetaQuery = [
        "dama",
        pgEnv,
        "sources",
        "byId",
        sourceId,
        "views",
        "byIndex",
        `0..${viewsLen - 1}`,
        "attributes",
        ["view_id", "metadata"],
      ];

      const viewsMetaResp = await falcor.get(viewsMetaQuery);

      console.log({ viewsLenResp, viewsMetaResp });
    })();
  }, [falcor, pgEnv, sourceId]);

  const viewMeta = React.useMemo(() => {
    return Object.values(
      _.get(
        falcorCache,
        ["dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex"],
        {}
      )
    ).map((v) =>
      getAttributes(
        _.get(falcorCache, v.value, { attributes: {} })["attributes"]
      )
    );
  }, [falcorCache, sourceId, pgEnv]);

  React.useEffect(() => {
    (async () => {
      if (!viewMeta) {
        return;
      }

      const viewIds = viewMeta.map(({ view_id }) => view_id);

      // ["dama", "dama_dev_1", "viewDependencySubgraphs", "byViewId", 593]
      const viewsDepGraphsQuery = [
        "dama",
        pgEnv,
        "viewDependencySubgraphs",
        "byViewId",
        viewIds,
      ];

      const viewsDepGraphsResp = await falcor.get(viewsDepGraphsQuery);

      const viewsDepGraphsById = _.get(viewsDepGraphsResp, [
        "json",
        ...viewsDepGraphsQuery.slice(0, -1),
      ]);

      const viewsMetaWithDeps = viewMeta
        .map((meta) => {
          const { view_id } = meta;

          // FIXME: Why is this happening?
          if (!view_id) {
            return null;
          }

          const { dependencies = null } = viewsDepGraphsById[view_id] || {};

          if (!dependencies) {
            return { attributes: meta, dependencies };
          }

          const immediateDepsSet = new Set(
            dependencies.find((d) => d.view_id === view_id).view_dependencies
          );

          const immediateDepsData = dependencies.filter(({ view_id: vid }) =>
            immediateDepsSet.has(vid)
          );

          return {
            attributes: meta,
            dependencies: immediateDepsData,
          };
        })
        .filter(Boolean);

      setViewsMetaWithDeps(viewsMetaWithDeps);
    })();
  }, [falcor, pgEnv, viewMeta, setViewsMetaWithDeps]);

  if (!viewsMetaWithDeps) {
    return "";
  }

  const tableRows = viewsMetaWithDeps
    .sort((a, b) => +b.attributes.view_id - +a.attributes.view_id)
    .map((meta) => {
      const {
        attributes: { view_id, version, last_updated, metadata = {} },
        dependencies,
      } = meta;

      const { filelocation: { path = null } = {} } = metadata;
      const downloadLink = path ? (
        <a href={`${DAMA_HOST}/files${path}`}>link</a>
      ) : (
        ""
      );

      const dependenciesList = Array.isArray(dependencies) ? (
        <ul>
          {dependencies.map(({ source_id: depSrcId, view_id: depViewId }) => {
            return (
              <li
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(
                    `/datasources/source/${depSrcId}/view/${depViewId}`
                  );
                }}
              >{`s${depSrcId}: v${depViewId}`}</li>
            );
          })}
        </ul>
      ) : (
        ""
      );

      return (
        <tr key={view_id} style={{ border: "1px solid" }}>
          <td
            style={{
              border: "1px solid",
              padding: "10px",
              backgroundColor: "white",
            }}
          >
            {view_id}
          </td>
          <td
            style={{
              border: "1px solid",
              padding: "10px",
              backgroundColor: "white",
            }}
          >
            {version}
          </td>
          <td
            style={{
              border: "1px solid",
              backgroundColor: "white",
              color: "blue",
            }}
          >
            {dependenciesList}
          </td>
          <td
            style={{
              border: "1px solid",
              backgroundColor: "white",
              color: "blue",
            }}
          >
            {downloadLink}
          </td>
        </tr>
      );
    });

  return (
    <table
      className="w-2/3"
      style={{
        margin: "40px auto",
        textAlign: "center",
        border: "1px solid",
        borderColor: "back",
      }}
    >
      <thead
        style={{
          color: "black",
          backgroundColor: "#d5e7ff",
          fontWeight: "bolder",
          textAlign: "center",
          marginTop: "40px",
          fontSize: "20px",
          border: "1px solid",
          borderColor: "black",
        }}
      >
        <tr>
          <th
            style={{
              border: "1px solid",
              borderColor: "black",
              paddingLeft: "10px",
              paddingRight: "10px",
            }}
          >
            {" "}
            View ID
          </th>
          <th
            style={{
              border: "1px solid",
              borderColor: "black",
              paddingLeft: "10px",
              paddingRight: "10px",
            }}
          >
            {" "}
            Version Name
          </th>
          <th
            style={{
              border: "1px solid",
              borderColor: "black",
              paddingLeft: "10px",
              paddingRight: "10px",
            }}
          >
            {" "}
            Dependencies
          </th>
          <th
            style={{
              border: "1px solid",
              borderColor: "black",
              paddingLeft: "10px",
              paddingRight: "10px",
            }}
          >
            {" "}
            Download
          </th>
        </tr>
      </thead>
      <tbody style={{ border: "1px solid" }}>{tableRows}</tbody>
    </table>
  );
}
