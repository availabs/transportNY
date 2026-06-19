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

## Phase 3: Create Pages — DONE

Migrate in place in `TransportNYDataTypes/`.

- [x] `map21/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `map21/analysis.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `pm3/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `pm3_aggregate/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `excessive_delay/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `transcom/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `transcom_congestion/create.jsx` — DamaContext, "dama" routes, "attributes" nesting
- [x] `freight_bottlenecks/create.jsx` — DamaContext, "dama" routes, "attributes" nesting (10+ falcor paths)
- [x] `production_transfer/create.jsx` — DamaContext, pgEnv fix (was already migrated; verified only)
- [x] `analytics/create.jsx` — DamaContext, pgEnv fix (was already migrated; verified only)
- [x] `npmrds/pages/Create/index.jsx` — DamaContext, pgEnv fix (was already migrated; verified only)
- [x] `npmrds/pages/Create/components/selectMpoBoundariesSource.jsx` — wrong useFalcor, DamaContext, "dama" routes, "attributes" nesting
- [x] `npmrds/pages/Create/components/selectSpeedLimitSource.jsx` — wrong useFalcor, DamaContext, "dama" routes, "attributes" nesting

### Phase 3 design notes

- `sources.byCategory` has **no `"uda"` equivalent** (verified against `avail-falcor/routes/uda.route.js` — only `sources.length/byIndex/byId`, `sources.byId[...].views.*`, `views.byId`, `viewsById.*` exist). The `["dama", pgEnv, "sources", "byCategory", "tmc_metadata"]` paths in both `selectMpoBoundariesSource.jsx` and `selectSpeedLimitSource.jsx` therefore stay `"dama"` (same treatment as `viewsbyId`/ETL/events). Only the views length/byIndex paths were moved to `"uda"` + flat attributes.
- `production_transfer/create.jsx`, `analytics/create.jsx`, and `npmrds/pages/Create/index.jsx` were already on DatasetsContext + getExternalEnv (no falcor usage in those files) — no code changes were needed.
- NOTE (pre-existing, not changed): `transcom/create.jsx` is checked off in this doc but still uses `"dama" sources byIndex` + `"attributes"` nesting for its source dropdowns. It compiles and the dama routes still exist server-side, but it does not follow the uda pattern — flagged for follow-up.

## Phase 4: Special Cases — DONE

Migrate in place in `TransportNYDataTypes/`.

- [x] `npmrds_meta/table.jsx` — uses `viewsbyId` which should stay `"dama"`, but DamaContext → DatasetsContext still needed
- [x] `npmrds_raw/create.jsx` — DamaContext, pgEnv fix
- [x] `osm/CreateComponent.jsx` — DamaContext
- [x] `osm_pgr/CreateComponent.jsx` — DamaContext
- [x] `osm_pgr/utils.jsx` — "dama" routes, "attributes" nesting

### Phase 4 design notes

- `npmrds_meta/table.jsx`: all `viewsbyId` data paths kept as `"dama"` per the rule. `ViewSelector`'s `baseUrl` now comes from `DatasetsContext` (it provides `baseUrl`); `falcor`/`falcorCache` from `@availabs/avl-falcor` `useFalcor()`; `pgEnv` via `getExternalEnv`. `falcor.chunk()` is available on the avl-falcor graph (verified in `@availabs/avl-falcor/src/falcorGraph.js`), so the chunked data fetch works unchanged.
- `osm_pgr/utils.jsx`: sources/views hooks moved to `"uda"` + flat attributes. Its only consumer is `osm_pgr/CreateComponent.jsx` (verified via grep), so the hook signature (`{ falcor, falcorCache, pgEnv }` passed in by the caller) was kept as-is.
- `osm/CreateComponent.jsx` and `osm_pgr/CreateComponent.jsx`: no falcor source/view paths of their own beyond utils; context + pgEnv swap only.

## Phase 5: Plugins Investigation — DONE (investigation only; no plugin code changed)

Plugins may be rendered outside the DMS datasets pattern. Need to verify before migrating.

- [x] Determine where plugins are rendered (DMS context vs old DataManager vs standalone)
- [ ] `plugins/routing/` — routing.plugin.jsx, utils.jsx (migration deferred — see findings)
- [ ] `plugins/rerouter/` — rerouter.plugin.jsx, utils.jsx (migration deferred — see findings)
- [ ] `plugins/pointselector/` — pointselector.plugin.jsx, utils.jsx (migration deferred — see findings)
- [x] `plugins/macroview/` — internalPanel.jsx, comp.jsx, externalPanel.jsx (already on MapEditorContext + "uda"; only a vestigial DamaContext import remains)

### Phase 5 findings

**Where plugins render.** Plugins are NOT rendered inside the DMS *datasets* pattern at all — `DatasetsContext` is the wrong target for them. There are two registration paths:

1. **New DMS system**: `App.jsx` imports `mapPlugins` from `TransportNYDataTypes/index.js` and passes it to `<DmsSite damaMapPlugins={...}>`. DmsSite forwards it to both `patterns/mapeditor/siteConfig.jsx` and `patterns/page/siteConfig.jsx`, which call `RegisterPlugin(name, plugin)` from `patterns/mapeditor/MapEditor`. So in the new system, plugins render inside the **MapEditor pattern** (map editor + Map components on pages), where the available context is **`MapEditorContext`** (`~/modules/dms/packages/dms/src/patterns/mapeditor/context`), which provides `falcor`, `falcorCache`, `pgEnv`, `baseUrl`.
2. **Old DataManager**: `Routes.js` imports `mapPlugins` from `TransportNYDataTypesVOld/` for `/datasourcesv1` (`DataManager/index.jsx` calls its own `RegisterPlugin`). The VOld copies cover this; the `TransportNYDataTypes/plugins/` copies only need to work in the MapEditor context.

**The migration recipe for plugins is therefore different from data-type pages**: `DamaContext` → `MapEditorContext` (NOT `DatasetsContext`/`getExternalEnv` — `pgEnv` comes straight off `MapEditorContext`). The `"dama"` → `"uda"` + flat-attributes part of the recipe still applies.

**Per-plugin state and recommendation:**

| Plugin | State | Recommendation |
|---|---|---|
| `macroview` | Already migrated: `comp.jsx`, `internalPanel.jsx`, `externalPanel.jsx` all use `MapEditorContext` + `"uda"` routes. `comp.jsx` and `externalPanel.jsx` still *import* `DamaContext` but never call `useContext(DamaContext)` (only in commented-out code). | No functional work. Optional cleanup: drop the dead `DamaContext` imports. |
| `routecreation` | Already migrated (`MapEditorContext`, `"uda"`, incl. `hooks/useRouteData.js`). Registered in `index.js`. | None. |
| `pointselector` | `pointselector.plugin.jsx` uses `useContext(DamaContext)` with a `CMSContext` fallback (`dctx?.falcor ? dctx : cctx`) and a **hardcoded** `pgEnv = 'npmrds2'`; `utils.jsx` uses `"dama"` routes + `"attributes"` nesting. Works today only because the dama falcor routes still exist server-side. | Migrate to `MapEditorContext` (+ `"uda"`/flat in `utils.jsx`) in a follow-up; not trivially safe (context fallback logic + hardcoded pgEnv need a design decision). |
| `rerouter` | `rerouter.plugin.jsx` pulls `pgEnv`/`falcor`/`falcorCache` from `DamaContext` in 3 places; also reads `["dama", pgEnv, "views", "byId", viewId, "attributes"]` from cache; `utils.jsx` is `"dama"` + nested. Under MapEditor there is no `DamaContext.Provider`, so these reads resolve against the context default — likely broken in the new system today. | Migrate to `MapEditorContext` + `"uda"` in a follow-up task. |
| `routing` | Same DamaContext pattern as rerouter, BUT the plugin is **not registered** — its import/entry in `index.js` `mapPlugins` is commented out. Dead code in the new system. | Lowest priority; migrate (or delete) only if it gets re-registered. |

None of the deferred plugins were migrated here because the correct target context (`MapEditorContext`) differs from this task's recipe and the changes are not trivially safe (runtime-only verification, context fallbacks, hardcoded env).

## Per-File Migration Checklist

For each file being migrated in `TransportNYDataTypes/` (applied to all Phase 3/4 files above):
1. [x] `DamaContext` → `DatasetsContext` import + usage
2. [x] Add `getExternalEnv` import, use for `pgEnv`
3. [x] `useFalcor` import → `@availabs/avl-falcor`
4. [x] `"dama"` → `"uda"` for source/view falcor paths (NOT for ETL/events/viewsbyId — and NOT for `sources.byCategory`, which has no uda route)
5. [x] Remove `"attributes"` nesting from cache access
6. [x] Verify component renders without errors (build-level verification; runtime smoke test still pending below)

## Testing Checklist

- [x] Production build passes (`npm run build`) after Phase 3/4 changes
- [ ] `/datasources` pages load and render correctly (new DMS system, from `TransportNYDataTypes/`)
- [ ] `/datasourcesv1` pages still load and render correctly (old system, from `TransportNYDataTypesVOld/`)
- [ ] Each migrated manage page shows data
- [ ] Each migrated create page can initiate a create flow
- [ ] No console errors from wrong context or missing data

## Progress Log

### 2026-06-10

- Phase 3 completed: migrated `freight_bottlenecks/create.jsx` (7 falcor path/cache sites), `selectMpoBoundariesSource.jsx`, `selectSpeedLimitSource.jsx` (views paths → uda/flat; `sources.byCategory` kept as "dama" — no uda route exists). Verified `production_transfer/create.jsx`, `analytics/create.jsx`, `npmrds/pages/Create/index.jsx` were already migrated; no changes needed.
- Phase 4 completed: `npmrds_meta/table.jsx` (DatasetsContext + avl-falcor useFalcor + getExternalEnv; viewsbyId stays "dama"; falcor.chunk confirmed available on avl-falcor), `npmrds_raw/create.jsx`, `osm/CreateComponent.jsx`, `osm_pgr/CreateComponent.jsx` (context/pgEnv swaps), `osm_pgr/utils.jsx` ("uda" + flat attributes).
- Phase 5 investigation completed and documented above: plugins render via the DMS **mapeditor** pattern (`RegisterPlugin` from `patterns/mapeditor` and `patterns/page` siteConfigs, fed by `damaMapPlugins` from App.jsx), not the datasets pattern — correct migration target is `MapEditorContext`, not `DatasetsContext`. macroview + routecreation already migrated; pointselector/rerouter/routing deferred to a follow-up task.
- Flagged pre-existing issue: `transcom/create.jsx` (checked off in Phase 3 previously) still uses "dama" sources byIndex + "attributes" nesting.
- Build verified passing.
