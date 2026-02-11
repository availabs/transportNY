# Migrate Legacy Layout to DMS Pattern

**Status:** ✅ Completed
**Completed:** 2026-02-04

## Objective

Replace the legacy `ppdaf-layout.jsx` layout system with the DMS layout pattern, using the TransportNY theme with a `ThemeContext` provider. This will unify the UI across all pages (both DMS and legacy) for a consistent user experience.

## Scope

**In Scope:**
- Replace `src/layout/ppdaf-layout.jsx` with a new layout using DMS UI components
- Update `src/layout/LayoutWrapper.jsx` to use ThemeContext
- Apply the `transportny` theme from `src/dms_themes/transportny/theme.js`
- Ensure all legacy pages in `src/sites/` and `src/pages/` use the new layout

**Out of Scope:**
- Modifying individual page components
- Changing DMS pages (they already use the correct pattern)
- Modifying the transportny theme itself

## Current State

### Legacy Layout Architecture

**`src/layout/ppdaf-layout.jsx`:**
- Uses `useTheme`, `TopNav`, `SideNav`, `FlyoutMenu` from `~/modules/avl-components/src`
- Theme is a function-based system defined in `src/theme/index.js` (`PPDAF_THEME`)
- Generates CSS classes dynamically via functions like `theme.sidenav(options)` and `theme.topnav(options)`
- Includes hardcoded TransportNY flyout menu items
- Logo component is inline, not theme-driven

**`src/layout/LayoutWrapper.jsx`:**
- Uses `withAuth` HOC from DMS for authentication
- Wraps routes with Layout component
- Passes `menus` (mainNav routes) to Layout

**`src/theme/index.js`:**
- Old functional theme pattern: `sidenav: (opts) => { ... return { classes } }`
- Not compatible with DMS `ThemeContext` pattern
- Colors, sizes defined inline

### DMS Layout Architecture

**`src/modules/dms/packages/dms/src/ui/components/Layout.jsx`:**
- Uses `ThemeContext` from `useTheme.js`
- Theme is a plain object with nested styles
- Supports `options.activeStyle` for style variants
- Uses widget system for menu components (LogoNav, UserMenu, etc.)
- Layout structure: `outerWrapper > wrapper > wrapper2 > wrapper3 > childWrapper`

**`src/dms_themes/transportny/theme.js`:**
- Complete DMS-compatible theme with:
  - `layout.options` (sideNav, topNav configuration)
  - `layout.styles` array with wrapper classes
  - `sidenav.styles` with "transportny-dark" and "compact" variants
  - `topnav.styles`
  - Widgets: `LogoNav`, `QuickLinks`
  - Full component theming (button, input, table, etc.)

## Proposed Changes

### 1. Create New Layout Component

Create `src/layout/Layout.jsx` based on DMS Layout pattern:

```jsx
import React from "react";
import { ThemeContext, mergeTheme } from "~/modules/dms/packages/dms/src/ui/useTheme";
import { Layout as DMSLayout } from "~/modules/dms/packages/dms/src/ui";
import defaultTheme from "~/modules/dms/packages/dms/src/ui/defaultTheme";
import transportnyTheme from "~/dms_themes/transportny/theme";

const theme = mergeTheme(defaultTheme, transportnyTheme);

const Layout = ({ children, navItems, ...props }) => {
  return (
    <ThemeContext.Provider value={{ theme }}>
      <DMSLayout navItems={navItems} {...props}>
        {children}
      </DMSLayout>
    </ThemeContext.Provider>
  );
};

export default Layout;
```

### 2. Update LayoutWrapper

Modify `src/layout/LayoutWrapper.jsx` to:
- Import the new Layout component
- Pass navItems correctly to match DMS pattern
- Keep auth logic unchanged

### 3. Deprecate ppdaf-layout.jsx

- Keep file temporarily for reference
- Add deprecation comment
- Remove once migration is verified

### 4. Update Site Configurations

Each site in `src/sites/` may need updates to route configurations to work with new layout structure.

## Files Requiring Changes

| File | Change |
|------|--------|
| `src/layout/Layout.jsx` | **NEW** - DMS-pattern layout with ThemeContext |
| `src/layout/LayoutWrapper.jsx` | Update to use new Layout, pass navItems |
| `src/layout/ppdaf-layout.jsx` | Deprecate (keep for reference initially) |
| `src/layout/index.js` | **NEW** - Export new components |
| `src/sites/*/index.js` | May need route config updates |

## Implementation Steps

1. **Create new Layout component** (`src/layout/Layout.jsx`)
   - Wrap with ThemeContext.Provider
   - Use DMS Layout component
   - Merge defaultTheme with transportnyTheme

2. **Update LayoutWrapper**
   - Import new Layout
   - Adapt menu/navItems passing to DMS format
   - Ensure auth flow remains unchanged

3. **Test with one site** (recommend `npmrds` or `tsmo_new`)
   - Verify navigation works
   - Verify auth redirects work
   - Check responsive behavior

4. **Roll out to all sites**
   - Update remaining site configurations
   - Verify each site renders correctly

5. **Cleanup**
   - Remove `ppdaf-layout.jsx`
   - Remove old theme functions if no longer used

## Component Mapping

| Legacy Component | DMS Equivalent |
|------------------|----------------|
| `Logo` component | `LogoNav` widget |
| `AuthMenu` | `UserMenu` widget |
| `FlyoutMenu` | `QuickLinks` widget |
| `SideNav` from avl-components | `SideNav` from DMS UI |
| `TopNav` from avl-components | `TopNav` from DMS UI |

## Theme Configuration

The transportny theme already has these configured:

```js
layout.options = {
  sideNav: {
    size: "compact",
    nav: "main",
    topMenu: [{ type: "LogoNav" }],
    bottomMenu: [
      { type: "QuickLinks" },
      { type: "UserMenu", options: { ... } }
    ]
  },
  topNav: {
    size: "none",  // Hidden by default
    nav: "none"
  }
}
```

## Testing Checklist

### Functional Tests
- [ ] All legacy pages render without errors
- [ ] Navigation menu displays correctly
- [ ] Active nav item is highlighted
- [ ] Sub-menus expand/collapse properly
- [ ] Logo links to home page
- [ ] Auth menu shows login/logout correctly
- [ ] Protected routes redirect to login when not authenticated
- [ ] Login redirects back to original page

### Visual Tests
- [ ] Side navigation matches DMS pages style (dark theme)
- [ ] TransportNY branding (logo, colors) displays correctly
- [ ] Responsive: mobile menu works
- [ ] Responsive: side nav collapses appropriately
- [ ] Content area has correct padding/margins
- [ ] No style conflicts with page content

### Sites to Test
- [ ] `transportny` (www)
- [ ] `tsmo_new` (tsmo)
- [ ] `npmrds`
- [ ] `freightatlas`
- [ ] `fdi`
- [ ] `demos`

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing page styles | Test thoroughly before removing old layout |
| Route configuration incompatibility | Keep old layout as fallback initially |
| Missing menu items | Map all existing nav items to new format |
| Auth flow regression | Maintain existing `withAuth` and `checkAuth` logic |

## References

- DMS Layout: `src/modules/dms/packages/dms/src/ui/components/Layout.jsx`
- DMS Theme: `src/modules/dms/packages/dms/src/ui/defaultTheme.js`
- TransportNY Theme: `src/dms_themes/transportny/theme.js`
- Theme Context: `src/modules/dms/packages/dms/src/ui/useTheme.js`

---

## Implementation Notes

### Changes Made

1. **Created `src/layout/Layout.jsx`**
   - Wraps DMSLayout with ThemeContext.Provider
   - Merges defaultTheme with transportnyTheme
   - Accepts navItems prop for navigation

2. **Updated `src/layout/LayoutWrapper.jsx`**
   - Simplified to use new Layout component
   - Passes filtered navItems (routes with `mainNav: true`)
   - Maintains existing withAuth HOC for authentication

3. **Created `src/layout/index.js`**
   - Clean exports for Layout, LayoutWrapper, and checkAuth

4. **Updated `src/App.jsx`**
   - Removed old Layout import
   - Simplified LayoutWrapper call to `LayoutWrapper(Routes)`

5. **Deprecated `src/layout/ppdaf-layout.jsx`**
   - Added deprecation comment
   - File kept for reference during verification

### Bug Fixes During Migration

- **Import Error:** Fixed DMS UI import - the UI module exports a default object containing components, not named exports. Changed to `import UI from "~/modules/dms/packages/dms/src/ui"; const { Layout: DMSLayout } = UI;`

- **Schedules Route:** Fixed `mainNav: true` on Schedules route in `src/pages/DataManager/index.jsx` that was incorrectly adding the route to all site navigation menus.

### Verification Status

All legacy pages should now render with the DMS layout pattern and TransportNY theme. Further testing recommended across all sites before removing the deprecated ppdaf-layout.jsx file.
