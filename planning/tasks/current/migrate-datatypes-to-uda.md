# Migrate TransportNYDataTypes to UDA Routes

## Objective

Migrate all data type components in `TransportNYDataTypes/` in place to work with the new DMS datasets system (`DatasetsContext`, `"uda"` falcor routes, no `"attributes"` nesting). Move the old unmigrated copies to `TransportNYDataTypesVOld/` so `/datasourcesv1` keeps working.

## Background

The DMS module migrated source/view data access from `"dama"` to `"uda"`. Components rendered via the DMS datasets pattern (at `/datasources/source/:id/:page`) need to use:
- `DatasetsContext` instead of `DamaContext`
- `useFalcor` from `@availabs/avl-falcor` (not `~/modules/avl-components/src`)
- `"uda"` prefix for source/view falcor paths (ETL/events stay `"dama"`)
- Flat attribute access (no `"attributes"` nesting)
- `getExternalEnv(datasources)` for `pgEnv`

## Scope

### Included
- All data type components that are broken under the new DMS datasets system
- New `TransportNYDataTypesVOld/` directory with old unmigrated copies (for `/datasourcesv1`)
- In-place migration of `TransportNYDataTypes/` components
- Updated routing so `/datasourcesv1` imports from VOld

### Excluded
- Plugins (`plugins/`) — need separate investigation for rendering context
- Old DataManager (`src/pages/DataManager/`) — no changes

## Already Fixed (reference implementations)

These files already use the correct patterns and can serve as templates:
- `npmrds/pages/manage/index.jsx` — full manage page with uda routes
- `schedule/create.jsx` — create page with uda routes
- `schedule/publish.jsx` — publish page with uda routes

## Phase 1: Setup — DONE

- [x] Create `src/pages/TransportNYDataTypesVOld/` directory
- [x] Copy `src/pages/TransportNYDataTypes/` contents to `TransportNYDataTypesVOld/` (snapshot of old code)
- [x] Create `src/pages/TransportNYDataTypesVOld/index.js` (copy of original index)
- [x] Update `src/Routes.js` to import from `TransportNYDataTypesVOld/` for `/datasourcesv1`
- [x] Verify `src/App.jsx` still imports from `TransportNYDataTypes/` for DMS
- [x] Build passes

## Phase 2: High Priority — Manage Pages — DONE

These are user-facing pages most likely to be visited. Migrated in place in `TransportNYDataTypes/`.

- [x] `transcom/manage.jsx` — DamaContext → DatasetsContext, pgEnv fix
- [x] `transcom_congestion/manage.jsx` — useFalcor, DatasetsContext, "uda" routes, flat attributes
- [x] `excessive_delay/manage.jsx` — useFalcor, DatasetsContext, "uda" routes, flat attributes
- [x] `schedule/list.jsx` — useFalcor, DatasetsContext, pgEnv fix (schedule falcor routes kept as "dama")

## Phase 3: Create Pages — NOT STARTED

Migrate in place in `TransportNYDataTypes/`.

- [x] `map21/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `map21/analysis.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `pm3/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `pm3_aggregate/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `excessive_delay/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `transcom/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `transcom_congestion/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [ ] `freight_bottlenecks/create.jsx` — DamaContext, "dama" routes, "attributes" nesting (10+ falcor paths)
- [ ] `production_transfer/create.jsx` — DamaContext, pgEnv fix
- [ ] `analytics/create.jsx` — DamaContext, pgEnv fix
- [ ] `npmrds/pages/Create/index.jsx` — DamaContext, pgEnv fix
- [ ] `npmrds/pages/Create/components/selectMpoBoundariesSource.jsx` — wrong useFalcor, DamaContext, "dama" routes, "attributes" nesting
- [ ] `npmrds/pages/Create/components/selectSpeedLimitSource.jsx` — wrong useFalcor, DamaContext, "dama" routes, "attributes" nesting

## Phase 4: Special Cases — NOT STARTED

Migrate in place in `TransportNYDataTypes/`.

- [ ] `npmrds_meta/table.jsx` — uses `viewsbyId` which should stay `"dama"`, but DamaContext → DatasetsContext still needed
- [ ] `npmrds_raw/create.jsx` — DamaContext, pgEnv fix
- [ ] `osm/CreateComponent.jsx` — DamaContext
- [ ] `osm_pgr/CreateComponent.jsx` — DamaContext
- [ ] `osm_pgr/utils.jsx` — "dama" routes, "attributes" nesting

## Phase 5: Plugins Investigation — NOT STARTED

Plugins may be rendered outside the DMS datasets pattern. Need to verify before migrating.

- [ ] Determine where plugins are rendered (DMS context vs old DataManager vs standalone)
- [ ] `plugins/routing/` — routing.plugin.jsx, utils.jsx
- [ ] `plugins/rerouter/` — rerouter.plugin.jsx, utils.jsx
- [ ] `plugins/pointselector/` — pointselector.plugin.jsx, utils.jsx
- [ ] `plugins/macroview/` — internalPanel.jsx, comp.jsx, externalPanel.jsx

## Per-File Migration Checklist

For each file being migrated in `TransportNYDataTypes/`:
1. [ ] `DamaContext` → `DatasetsContext` import + usage
2. [ ] Add `getExternalEnv` import, use for `pgEnv`
3. [ ] `useFalcor` import → `@availabs/avl-falcor`
4. [ ] `"dama"` → `"uda"` for source/view falcor paths (NOT for ETL/events/viewsbyId)
5. [ ] Remove `"attributes"` nesting from cache access
6. [ ] Verify component renders without errors

## Testing Checklist

- [ ] `/datasources` pages load and render correctly (new DMS system, from `TransportNYDataTypes/`)
- [ ] `/datasourcesv1` pages still load and render correctly (old system, from `TransportNYDataTypesVOld/`)
- [ ] Each migrated manage page shows data
- [ ] Each migrated create page can initiate a create flow
- [ ] No console errors from wrong context or missing data
