import React, { useMemo } from 'react';
import LayoutWrapper from '~/layout/LayoutWrapper'
import get from 'lodash/get'

import { getSubdomain } from '~/utils'



import {
  DmsSite,
  adminConfig,
  registerComponents
} from "~/modules/dms/packages/dms/src/"

import DefaultRoutes from '~/Routes';

import transportNY from '~/sites/transportny'
import tsmo from '~/sites/tsmo'
import tsmonew from '~/sites/tsmo_new'

import npmrds from '~/sites/npmrds'
import themes from './dms_themes'
import {PROJECT_NAME, API_HOST, AUTH_HOST} from "./config.js";


const Sites = {
  www: transportNY,
  tsmo: tsmonew,
  tsmo_old: tsmo,
  npmrds
}
//import AdditionalComponents from "./additional_components";
import { DamaMap, Map } from "./pages/DataManager/"



registerComponents({
  "Map: Dama Map": DamaMap,
  "Map": Map
})

// registerDataType("selector", Selector)

const defaultPgEnv = 'npmrds2';
const adminBaseUrl = '/list'
const damaBaseUrl = '/datasources'



// console.log('just run', transportNY)
// const Routes = [...transportNY.Routes, ...DefaultRoutes]
// const WrappedRoutes = LayoutWrapper(Routes,Layout)

const App = (props) => {
  const SUBDOMAIN = getSubdomain(window.location.host)
  //console.log('SUBDOMAIN')

  const site = useMemo(() => {
      let siteOutpt = SUBDOMAIN ? get(Sites, SUBDOMAIN, {Routes:[]}) : Sites['www']
      //console.log('SUBDOMAIN', siteOutpt)
      return siteOutpt
  },[SUBDOMAIN])

  const WrappedRoutes = useMemo(() => {
    const Routes = [...site.Routes, ...DefaultRoutes]
    return LayoutWrapper(Routes)
  }, [site])

  return (
    <DmsSite
      dmsConfig = {
        adminConfig[0]({
            app: 'npmrdsv5',
            type: 'dev2',
            baseUrl: adminBaseUrl,
            API_HOST
        })
      }
      adminPath={adminBaseUrl}
      pgEnvs={[defaultPgEnv]}
      themes={themes}
      damaBaseUrl={damaBaseUrl}
      API_HOST={API_HOST}
      AUTH_HOST={AUTH_HOST}
      PROJECT_NAME={PROJECT_NAME}
      routes={WrappedRoutes}
    />
  )


}

export default App;
