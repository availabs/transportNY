import React, {useMemo} from 'react';
import { BrowserRouter, Switch } from 'react-router-dom';
import ScrollToTop from 'utils/ScrollToTop'
import DefaultRoutes from 'Routes';
import Layout from 'layout/ppdaf-layout'
import get from 'lodash.get'
import {/*getDomain,*/getSubdomain} from 'utils'


import {
  DefaultLayout,
  Messages
} from "modules/avl-components/src"

import transportNY from 'sites/transportny'
import tsmo from 'sites/tsmo'
import freightatlas from 'sites/freightatlas'
import npmrds from 'sites/npmrds'
import transit from 'sites/transit'

const Sites = {
  'transportNY': transportNY,
  'tsmo': tsmo,
  'freightatlas' : freightatlas,
  'npmrds': npmrds,
  'transit': transit
}

const App = (props) => {
  const SUBDOMAIN = getSubdomain(window.location.host)
  // const PROJECT_HOST = getDomain(window.location.host)

  const site = useMemo(() => {
      return get(Sites, SUBDOMAIN, Sites['transportNY'])
  },[SUBDOMAIN])

  const Routes =  useMemo(() => {
    return [...site.Routes, ...DefaultRoutes ]
  }, [site])

  return (
    <BrowserRouter basename={process.env.REACT_APP_PUBLIC_URL}>
      <ScrollToTop />
      {/*<div>{SUBDOMAIN} {site.title} {PROJECT_HOST}</div>*/}
      <Switch>
        { Routes.map((route, i) =>
            <DefaultLayout 
              site={site.title} 
              layout={Layout} 
              key={ i } 
              { ...route } 
              { ...props }
              menus={ Routes.filter(r => r.mainNav) }/>
          )
        }
      </Switch>
      <Messages />
    </BrowserRouter>
  );
}

export default App;
