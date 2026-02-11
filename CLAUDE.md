# TransportNY

A web-based data visualization and management platform for New York State transportation data, developed by AVAILabs.

## Tech Stack

- **React 19** with React Router v7
- **Vite 7** for build and dev server
- **Tailwind CSS 4** for styling (also uses styled-components)
- **Redux Toolkit** for state management
- **Falcor** for data fetching
- **Mapbox GL / Maplibre GL** for maps
- **D3.js** for data visualization

## Project Structure

```
src/
├── index.jsx              # Entry point, creates Falcor instance
├── App.jsx                # Root component with routing
├── config.json            # API_HOST, MAPBOX_TOKEN (create from .template)
├── theme/                 # Global theme configuration
├── store/                 # Redux store (dashboard, report slices)
├── utils/                 # Utilities (subdomain parsing)
├── layout/                # Layout wrappers, auth checking
├── components/            # Shared components
├── pages/
│   ├── Auth/              # Authentication pages
│   ├── DataManager/       # Data management UI
│   └── TransportNYDataTypes/  # Data type definitions
│       ├── npmrds/        # NPMRDS data
│       ├── map21/         # MAP21 metrics
│       ├── pm3/           # PM3 metrics
│       ├── transcom/      # TransCom incidents
│       ├── schedule/      # Scheduling
│       └── plugins/       # Map plugins (macroview, routing, etc.)
├── sites/                 # Multi-site configurations (subdomain-based)
│   ├── transportny/       # www subdomain
│   ├── tsmo_new/          # tsmo subdomain (dashboards, incidents)
│   ├── npmrds/            # npmrds subdomain
│   ├── freightatlas/      # freightatlas subdomain
│   └── ...
└── modules/               # Git submodules
    ├── avl-components/    # Core component library
    ├── avl-map-2/         # Map utilities
    ├── avl-maplibre/      # Maplibre integration
    ├── dms/               # Data Management System
    └── ...
```

## Setup

```bash
# Node 22.17.1 required (see .nvmrc)
nvm use

# Initialize submodules
git submodule init && git submodule update

# Install dependencies
npm install

# Create config file
cp src/config.json.template src/config.json
# Add your MAPBOX_TOKEN to config.json
```

## Development

```bash
npm start          # Start dev server (Vite)
npm run build      # Production build (outputs to ./build)
npm run preview    # Preview production build
npm run analyze    # Bundle analysis
```

## Code Conventions

### Imports
- Use `~` alias for src imports: `import X from '~/components/X'`
- Submodules: `import { Component } from '~/modules/avl-components'`

### Components
- Functional components with hooks
- JSX extension for React components
- Tailwind utility classes preferred for styling

### Multi-Site Routing
Sites are selected by subdomain via `getSubdomain()` in `src/utils/index.js`. Each site has its own route configuration in `src/sites/`.

### Data Types
Data types in `TransportNYDataTypes/` export:
- `sourceCreate`: Component for creating/uploading data
- Manage pages for viewing/analyzing data
- Optional map plugins

### Authentication
- DMS module handles auth
- `withAuth` HOC for protected routes
- Auth levels: -1 (no auth), 0 (basic auth required)

### State Management
- Redux Toolkit for global state
- Falcor for server data fetching
- React hooks for local state

## Falcor: Two Providers and the dama → uda Migration

There are **two separate FalcorProvider instances** in the component tree with different React contexts:

1. **Outer provider** (`src/index.jsx`): imports from `~/modules/avl-components/src`
2. **DMS provider** (`dmsPageFactory.jsx`): imports from `@availabs/avl-falcor` (npm package)

These are different React contexts. `useFalcor()` will connect to whichever provider matches its import source.

### Custom data type pages (TransportNYDataTypes)

Pages rendered via the DMS datasets pattern (at `/datasources/source/:id/:page`) must:

- **Import `useFalcor` from `@availabs/avl-falcor`** (not `~/modules/avl-components/src`) to get the correct `falcor` and `falcorCache`
- **Get `pgEnv` via `getExternalEnv(datasources)`**, not from context directly:
  ```js
  import { getExternalEnv } from "~/modules/dms/packages/dms/src/patterns/datasets/utils/datasources";
  const { datasources } = useContext(DatasetsContext);
  const pgEnv = getExternalEnv(datasources);
  ```
- **`DatasetsContext` provides**: `datasources`, `falcor`, `user`, `UI`, `baseUrl`, `damaDataTypes`, `DAMA_HOST`, `API_HOST`
- **`DatasetsContext` does NOT provide**: `pgEnv`, `falcorCache`

### Falcor route prefixes: "uda" vs "dama"

The DMS module migrated source/view data access from `"dama"` to `"uda"`:

| Route type | Prefix | Example |
|---|---|---|
| Sources (list, byId, byIndex) | `"uda"` | `["uda", pgEnv, "sources", "byIndex", ...]` |
| Views (via source or direct) | `"uda"` | `["uda", pgEnv, "views", "byId", ...]` |
| ETL contexts | `"dama"` | `["dama", pgEnv, "etlContexts", ...]` |
| Events | `"dama"` | `["dama", pgEnv, "latest", "events", ...]` |
| View data access | `"dama"` | `["dama", pgEnv, "viewsbyId", ...]` |

### "uda" routes have no "attributes" nesting

The `"uda"` routes return attributes flat on the object. The `"dama"` routes nested them under `"attributes"`:

```js
// OLD (dama): attributes nested
["dama", pgEnv, "sources", "byIndex", range, "attributes", ["name", "type", ...]]
// cache: falcorCache[ref]["attributes"]["name"]

// NEW (uda): attributes flat
["uda", pgEnv, "sources", "byIndex", range, ["name", "type", ...]]
// cache: falcorCache[ref]["name"]
```

### Old DataManager system

The old DataManager (`src/pages/DataManager/`) at `/datasourcesv1` still uses `DamaContext` with `"dama"` routes and `"attributes"` nesting. It is separate from the DMS datasets pattern.

## Deployment

Deployed via Netlify. See `netlify.toml` for configuration.

```bash
npm run deploy       # Deploy to staging
npm run deploy-prod  # Deploy to production
```

## Task Management

All tasks are tracked in the `planning/` directory following a consistent workflow.

### Directory Structure

```
planning/
├── roadmap.md           # High-level roadmap and vision
├── todo.md              # Active tasks organized by topic
├── completed.md         # Completed tasks with dates
├── planning-rules.md    # Full documentation of structure
└── tasks/
    ├── current/         # Detailed task documents for work in progress
    └── completed/       # Archived task documents
```

### Workflow

When creating a new task:

1. **Add to todo.md** - Add a checkbox entry under the appropriate topic:
   ```markdown
   ## sites/npmrds

   - [ ] Fix batch report export bug
   ```

2. **Create task file** - Create a detailed task document in `planning/tasks/current/`:
   ```
   planning/tasks/current/fix-batch-report-export.md
   ```

   Task files should include:
   - Objective
   - Root cause analysis
   - Proposed fix
   - Files requiring changes
   - Testing checklist

3. **Work on the task** - Update the task file as you progress

4. **Complete the task**:
   - Move the task file to `planning/tasks/completed/`
   - Update `todo.md` - change `[ ]` to `[x]`
   - Add entry to `completed.md` with date and link to task file

### Topic Hierarchy

Tasks are organized under these topics in todo.md:

- **api** - Backend API changes, Falcor routes
- **ui** - Shared UI components, styling
- **sites** - Site-specific pages
  - sites/transportny
  - sites/tsmo
  - sites/npmrds
  - sites/freightatlas
- **data-types** - TransportNYDataTypes
  - data-types/npmrds
  - data-types/map21
  - data-types/pm3
  - data-types/transcom
  - data-types/schedule
- **maps** - Map plugins, layers
- **data-manager** - DataManager UI
- **auth** - Authentication
- **build** - Build config, deployment

### Important

When asked to create a task or plan work:
1. Always create the task file in `planning/tasks/current/`
2. Always add a todo entry to `planning/todo.md`
3. Keep the todo list updated as work progresses
4. Move completed tasks to `planning/tasks/completed/` and update `completed.md`
