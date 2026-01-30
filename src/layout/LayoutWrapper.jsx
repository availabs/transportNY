import React from 'react';
import { useNavigate, useLocation, Navigate } from "react-router";
// import { withAuth } from '~/modules/ams/src'
import { withAuth } from "~/modules/dms/packages/dms/src"
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'
import checkAuth from './checkAuth'


const LayoutWrapper = withAuth(({
  element: Element,
  component: Comp,
  Layout=({children}) => <>{children}</>,
  ...props
}) => {

  const Child = Element || Comp // support old react router routes

  // const navigate = useNavigate();
  const location = useLocation();

  // const { auth, authLevel, user } = props;

  // React.useEffect(() => {
  //   checkAuth({ auth, authLevel, user }, navigate, location);
  // }, [auth, authLevel, user, navigate, location]);

  const check = checkAuth(props);

  if (check === "sendToLogin") {
    return <Navigate to="/auth/login"
              state={ { from: location.pathname } }/>;
  }
  else if (check === "sendToHome") {
    return <Navigate to="/"/>
  }
  return (
    <Layout { ...props }>
      <Child />
    </Layout>
  )
})

export default function  DefaultLayoutWrapper ( routes, layout ) {
  //console.log('routes', routes)
  const menus = routes.filter(r => r.mainNav)
  return routes.map(route => {
    let out = cloneDeep(route)
    out.element = <LayoutWrapper {...out} Layout={layout} menus={menus} />
    return out
  })
}
