import React from 'react';
import { useLocation, Navigate } from "react-router";
import { withAuth } from "~/modules/dms/packages/dms/src"
import cloneDeep from 'lodash/cloneDeep'
import checkAuth from './checkAuth'
import Layout from './Layout'

const LayoutWrapper = withAuth(({
  element: Element,
  component: Comp,
  navItems = [],
  ...props
}) => {

  const Child = Element || Comp // support old react router routes

  const location = useLocation();

  const check = checkAuth(props);

  if (check === "sendToLogin") {
    return <Navigate to="/auth/login"
              state={ { from: location.pathname } }/>;
  }
  else if (check === "sendToHome") {
    return <Navigate to="/"/>
  }
  return (
    <Layout navItems={navItems} {...props}>
      <Child />
    </Layout>
  )
})

/**
 * Wraps routes with the Layout and LayoutWrapper components.
 * Filters routes with mainNav: true for the navigation menu.
 *
 * @param {Array} routes - Array of route configurations
 * @returns {Array} Routes wrapped with LayoutWrapper
 */
export default function DefaultLayoutWrapper(routes) {
  const navItems = routes.filter(r => r.mainNav)
  return routes.map(route => {
    let out = cloneDeep(route)
    out.element = <LayoutWrapper {...out} navItems={navItems} />
    return out
  })
}
