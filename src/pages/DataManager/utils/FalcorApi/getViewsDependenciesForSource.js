import _ from "lodash";

import { getAttributes } from "pages/DataManager/components/attributes";

import Falcor from "./FalcorWrapper";

export async function getViewsDependenciesForSource(
  pgEnv,
  sourceId,
  config = {}
) {
  sourceId = +sourceId;

  const { immediateDependenciesOnly = true, removeSelfFromDependents = true } =
    config;

  const viewsLenPath = [
    "dama",
    pgEnv,
    "sources",
    "byId",
    sourceId,
    "views",
    "length",
  ];

  await Falcor.get(viewsLenPath);

  const viewsLen = _.get(Falcor.cache, viewsLenPath);

  const viewsMetaPath = [
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

  await Falcor.get(viewsMetaPath);

  const viewsMeta = Object.values(
    _.get(
      Falcor.cache,
      ["dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex"],
      {}
    )
  ).map((refPath) =>
    getAttributes(
      _.get(Falcor.cache, refPath.value, { attributes: {} })["attributes"]
    )
  );

  const viewIds = viewsMeta.map(({ view_id }) => view_id);

  const viewsDepGraphsQuery = [
    "dama",
    pgEnv,
    "viewDependencySubgraphs",
    "byViewId",
    viewIds,
  ];

  await Falcor.get(viewsDepGraphsQuery);

  const viewsDepGraphsById = _.get(
    Falcor.cache,
    viewsDepGraphsQuery.slice(0, -1)
  );

  const seenSourceIds = new Set();

  const viewsMetaWithDeps = viewsMeta
    .map((meta) => {
      const { view_id } = meta;

      // FIXME: Why is this happening?
      if (!view_id) {
        return null;
      }

      // TODO: dependents and dependencies
      const { value: { dependencies = null, dependents = null } = {} } =
        viewsDepGraphsById[view_id] || {};

      let dependenciesData = null;
      let dependentsData = null;

      if (dependencies) {
        const immediateDependenciesSet = new Set(
          dependencies.find((d) => d.view_id === view_id).view_dependencies
        );

        dependenciesData = immediateDependenciesOnly
          ? dependencies.filter(
              ({ source_id, view_id: vid }) =>
                source_id !== sourceId && immediateDependenciesSet.has(vid)
            )
          : dependencies;

        if (removeSelfFromDependents) {
          dependenciesData = dependenciesData.filter(
            ({ source_id }) => source_id !== sourceId
          );
        }

        for (const { source_id } of dependenciesData) {
          seenSourceIds.add(source_id);
        }
      }

      if (dependents) {
        dependentsData = immediateDependenciesOnly
          ? dependents.filter(
              ({ source_id, view_dependencies }) =>
                source_id !== sourceId &&
                Array.isArray(view_dependencies) &&
                view_dependencies.includes(view_id)
            )
          : dependents;

        if (removeSelfFromDependents) {
          dependentsData = dependentsData.filter(
            ({ source_id }) => source_id !== sourceId
          );
        }

        for (const { source_id } of dependentsData) {
          seenSourceIds.add(source_id);
        }
      }

      return {
        attributes: meta,
        dependencies: dependenciesData,
        dependents: dependentsData,
      };
    })
    .filter(Boolean);

  const sourceNamePath = [
    "dama",
    pgEnv,
    "sources",
    "byId",
    [...seenSourceIds],
    "attributes",
    ["name", "display_name"],
  ];

  await Falcor.get(sourceNamePath);
  const sourceNamesById = _.get(Falcor.cache, sourceNamePath.slice(0, 4), {});

  viewsMetaWithDeps.forEach(({ dependencies, dependents }) => {
    if (dependencies) {
      dependencies.forEach((d) => {
        const { source_id } = d;
        const {
          [source_id]: {
            attributes: { name = source_id, display_name = null } = {},
          } = {},
        } = sourceNamesById;

        d.source_name = name;
        d.source_display_name = display_name;
      });
    }

    if (dependents) {
      dependents.forEach((d) => {
        const { source_id } = d;
        const {
          [source_id]: {
            attributes: { name = source_id, display_name = null } = {},
          } = {},
        } = sourceNamesById;

        d.source_name = name;
        d.source_display_name = display_name;
      });
    }
  });

  return viewsMetaWithDeps;
}
