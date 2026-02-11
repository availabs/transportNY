import React from "react";
import UI from "~/modules/dms/packages/dms/src/ui";
import {
  ThemeContext,
  mergeTheme
} from "~/modules/dms/packages/dms/src/ui/useTheme";
import defaultTheme from "~/modules/dms/packages/dms/src/ui/defaultTheme";
import transportnyTheme from "~/dms_themes/transportny/theme";

const { Layout: DMSLayout } = UI;

// Merge the default DMS theme with the TransportNY theme
const theme = mergeTheme(defaultTheme, transportnyTheme);

/**
 * Layout component that wraps legacy pages with the DMS layout pattern.
 * Uses ThemeContext to provide the TransportNY theme to all child components.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {Array} props.navItems - Navigation menu items (filtered for mainNav)
 * @param {string} props.site - Site title (optional)
 */
const Layout = ({
  children,
  navItems = [],
  site,
  ...props
}) => {
  return (
    <ThemeContext.Provider value={{ theme, UI }}>
      <DMSLayout
        navItems={navItems}
        {...props}
      >
        {children}
      </DMSLayout>
    </ThemeContext.Provider>
  );
};

export default Layout;
