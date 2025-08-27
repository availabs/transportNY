import React, { useEffect, useMemo} from 'react';
import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from '~/layout/ppdaf-layout'
import LayoutWrapper from '~/layout/LayoutWrapper'
import get from 'lodash/get'

import { getSubdomain }  from '~/utils'

// import {
//   Messages
// } from "@availabs/ams"

import {
  Messages,
  withAuth,
  useAuth
} from "~/modules/ams/src"

import {
  DmsSite,
  registerDataType,
  Selector,
  adminConfig,
  registerComponents
} from "~/modules/dms/src/"

import DefaultRoutes from '~/Routes';

import transportNY from '~/sites/transportny'
import tsmo from '~/sites/tsmo'
import tsmonew from '~/sites/tsmo_new'
import freightatlas from '~/sites/freightatlas'
import fdi from '~/sites/fdi'

import npmrds from '~/sites/npmrds'
import transit from '~/sites/transit'
import demos from '~/sites/demos'
import sandbox from '~/sites/sandbox'
import themes from './dms_themes'

const Sites = {
  www: transportNY,
  tsmo: tsmonew,
  tsmo_old: tsmo,
  freightatlas,
  fdi,
  npmrds,
  //transit,
  demos,
  sandbox
}
//import AdditionalComponents from "./additional_components";
import { DamaMap, Map } from "./pages/DataManager/"



registerComponents({
  "Map: Dama Map": DamaMap,
  "Map": Map
})

registerDataType("selector", Selector)

const defaultPgEnv = 'npmrds2';
const adminBaseUrl = '/list'
const damaBaseUrl = '/datasources'



// console.log('just run', transportNY)
// const Routes = [...transportNY.Routes, ...DefaultRoutes]
// const WrappedRoutes = LayoutWrapper(Routes,Layout)

const App = (props) => {
  const SUBDOMAIN = getSubdomain(window.location.host)
  console.log('SUBDOMAIN')

  const site = useMemo(() => {
      let siteOutpt = SUBDOMAIN ? get(Sites, SUBDOMAIN, {Routes:[]}) : Sites['www']
      console.log('SUBDOMAIN', siteOutpt)
      return siteOutpt
  },[SUBDOMAIN])

  const WrappedRoutes =  useMemo(() => {
    const Routes = [...site.Routes, ...DefaultRoutes]
    //console.log('routes',SUBDOMAIN, Routes, )
    return LayoutWrapper(Routes, Layout)
  }, [site])

  return (
    <>
      {/*<RouterProvider
        router={createBrowserRouter(WrappedRoutes)}
      />*/}
      <DmsSite
        dmsConfig = {
          adminConfig[0]({
              app: 'npmrdsv5',
              type: 'dev2',
              baseUrl: adminBaseUrl
             // API_HOST
          })
        }
        adminPath={adminBaseUrl}
        pgEnvs={[defaultPgEnv]}

        authWrapper={withAuth}
        themes={themes}
        damaBaseUrl={damaBaseUrl}
        //API_HOST={API_HOST}

        routes={WrappedRoutes}
      />
      <Messages />
    </>
  )


}

export default App;
