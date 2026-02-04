# Planning Directory Structure

This document describes the structure and conventions for the TransportNY planning directory.

## Directory Structure

```
planning/
├── roadmap.md           # High-level roadmap and vision
├── todo.md              # Active tasks organized by topic
├── completed.md         # Completed tasks organized by topic
├── planning-rules.md    # This file - structure documentation
└── tasks/
    ├── current/         # Detailed task documents for work in progress
    └── completed/       # Archived task documents for completed work
```

## File Conventions

### todo.md

Active tasks organized by topic hierarchy:

```markdown
# TransportNY Todo

## Topic Name

### Subtopic Name (if applicable)

- [ ] Task description
- [ ] Another task
```

### completed.md

Completed tasks organized by the same topic hierarchy, with dates:

```markdown
# TransportNY Completed Tasks

## Topic Name

### Subtopic Name (if applicable)

- [task-name.md](./tasks/completed/task-name.md) - Brief description (YYYY-MM-DD)
```

### Task Files (tasks/current/ and tasks/completed/)

Detailed task documents should include:
- **Objective** - What the task accomplishes
- **Scope** - What's included/excluded
- **Current State** - How things work now
- **Proposed Changes** - What will change
- **Files Requiring Changes** - Specific files and modifications
- **Testing Checklist** - How to verify the changes work

## Topic Hierarchy

Tasks are organized under these high-level topics:

### api
Backend API changes, Falcor routes, data fetching

### ui
Shared UI components, styling, theme changes

### sites
Changes to site-specific pages, organized by site:

- **sites/transportny** - Main www site
- **sites/tsmo** - TSMO dashboards and incident tracking
- **sites/npmrds** - NPMRDS analysis and batch reports
- **sites/freightatlas** - Freight atlas functionality

### data-types
Changes to TransportNYDataTypes, organized by data type:

- **data-types/npmrds** - NPMRDS data type
- **data-types/map21** - MAP21 metrics
- **data-types/pm3** - PM3 metrics
- **data-types/transcom** - TransCom incidents
- **data-types/schedule** - Scheduling

### maps
Map-related changes, plugins, layers

### data-manager
DataManager UI and functionality

### auth
Authentication and authorization

### build
Build configuration, Vite, deployment

## Workflow

1. New tasks are added to `todo.md` under the appropriate topic
2. When starting work on a task, create a detailed task file in `tasks/current/`
3. When work is completed:
   - Move the task file to `tasks/completed/`
   - Move the task entry from `todo.md` to `completed.md` with the completion date
   - Link to the task file in `completed.md`
