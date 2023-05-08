import React from 'react';
import { useNavigate } from "react-router-dom";
import { withAuth } from '@availabs/ams'
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
  const navigate = useNavigate()
  React.useEffect(() => {
    checkAuth(props,navigate)
  },[])
  
  // console.log('LayoutWrapper props', props)
  // console.log('LayoutWrapper comp',  typeof Comp, Comp )
  // console.log('LayoutWrapper Element',  typeof Element, Element )
  console.log('LayoutWrapper child', props, typeof Child, Child )
  // console.log('LayoutWrapper layout', typeof Layout, Layout)
  // -------------------------------------
  // we may want to restore this ??
  // -------------------------------------
  // if(authLevel > -1 && props?.user?.isAuthenticating) {
  //   return <Layout {...props}>Loading</Layout>
  // }
 
  return (
    <Layout {...props}>
      <Child />
    </Layout>
  )
})

export default function  DefaultLayoutWrapper ( routes, layout ) {
  //console.log('routes', routes)
  return routes.map(route => {
    let out = cloneDeep(route)
    out.element = <LayoutWrapper {...out} Layout={layout} />
    return out
  })
}




