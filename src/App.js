import React, { useEffect, useMemo} from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from 'layout/ppdaf-layout'
import LayoutWrapper from 'layout/LayoutWrapper'
import get from 'lodash/get'

import { getSubdomain }  from 'utils'

import {
  Messages
} from "@availabs/ams"

import DefaultRoutes from 'Routes';

import transportNY from 'sites/transportny'
import tsmo from 'sites/tsmo'
import freightatlas from 'sites/freightatlas'
import npmrds from 'sites/npmrds'
import transit from 'sites/transit'
import demos from 'sites/demos'

const Sites = {
  'transportNY': transportNY,
  'tsmo': tsmo,
  'freightatlas' : freightatlas,
  'npmrds': npmrds,
  'transit': transit,
  'demos': demos
}


console.log('just run', transportNY)
//const Routes = [...transportNY.Routes, ...DefaultRoutes]
// const WrappedRoutes = LayoutWrapper(Routes,Layout)

const App = (props) => {
  const SUBDOMAIN = getSubdomain(window.location.host)
  // const PROJECT_HOST = getDomain(window.location.host)

  const site = useMemo(() => {
      return get(Sites, SUBDOMAIN, Sites['transportNY'])
  },[SUBDOMAIN])

  const WrappedRoutes =  useMemo(() => {
    const Routes = [...site.Routes, ...DefaultRoutes]
    return LayoutWrapper(Routes, Layout)
  }, [site])
  //console.log('Wrapped', WrappedRoutes)


  return (
    <>
      <RouterProvider 
        router={createBrowserRouter(WrappedRoutes)} 
      />
      <Messages />
    </>
  )

  
}

export default App;
