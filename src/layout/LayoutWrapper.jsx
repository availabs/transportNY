import React from "react";
import { useLocation, Navigate } from "react-router";
import { withAuth } from "~/modules/dms/packages/dms/src";
import { useFalcor, ScalableLoading } from "~/modules/avl-components/src";
import cloneDeep from "lodash/cloneDeep";
import checkAuth from "./checkAuth";
import Layout from "./Layout";
import { falcorGraph as reportsFalcor } from "~/store/falcorGraph";

// Both falcor models are module-level singletons that outlive signing in and
// out, and falcor caches error nodes alongside values. Anything fetched — or
// rejected — under a previous session therefore sticks around for the whole tab,
// and a later get() replays it instead of asking the server: the next user sees
// the previous user's folders, and a path that once came back "No Authorization"
// never recovers. Drop both caches on the way to the login page, the one moment
// we know there is no session and no page component is mounted to read from them.
// Navigating only once the reset has run keeps that ordering guaranteed.
const SendToLogin = ({ from }) => {
  const { falcor } = useFalcor();

  const [cleared, setCleared] = React.useState(false);

  React.useEffect(() => {
    falcor.setCache({});
    reportsFalcor.setCache({});
    setCleared(true);
  }, [falcor]);

  return cleared ? <Navigate to="/auth/login" state={{ from }} /> : null;
};

const LayoutWrapper = withAuth(
  ({ element: Element, component: Comp, navItems = [], ...props }) => {
    const Child = Element || Comp; // support old react router routes

    const location = useLocation();

    const check = checkAuth(props);

    if (check === "authenticating") {
      // A token is present but hasn't been validated yet. Render the chrome but
      // hold the page, so it can't fire API calls with a token that is about to
      // be rejected (see checkAuth).
      return (
        <Layout navItems={navItems} {...props}>
          <div className="w-full h-[50vh] flex items-center justify-center">
            <ScalableLoading scale={0.5} />
          </div>
        </Layout>
      );
    } else if (check === "sendToLogin") {
      return <SendToLogin from={location.pathname} />;
    } else if (check === "sendToHome") {
      return <Navigate to="/" />;
    }

    // console.log("navitemns", navItems);
    return (
      <Layout navItems={navItems} {...props}>
        <Child />
      </Layout>
    );
  },
);

/**
 * Wraps routes with the Layout and LayoutWrapper components.
 * Filters routes with mainNav: true for the navigation menu.
 *
 * @param {Array} routes - Array of route configurations
 * @returns {Array} Routes wrapped with LayoutWrapper
 */
export default function DefaultLayoutWrapper(routes) {
  const navItems = routes.filter((r) => r.mainNav);
  return routes.map((route) => {
    let out = cloneDeep(route);
    out.element = <LayoutWrapper {...out} navItems={navItems} />;
    return out;
  });
}
