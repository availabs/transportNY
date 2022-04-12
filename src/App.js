import React, {useMemo} from 'react';
import { BrowserRouter, Switch } from 'react-router-dom';
import ScrollToTop from 'utils/ScrollToTop'
import DefaultRoutes from 'Routes';
import Layout from 'layout/ppdaf-layout'
import get from 'lodash.get'

import {
  DefaultLayout,
  Messages
} from "modules/avl-components/src"

import transportNY from 'sites/transportny'
import tsmo from 'sites/tsmo'
import freightatlas from 'sites/freightatlas'

const Sites = {
  'transportNY': transportNY,
  'tsmo': tsmo,
  'freightatlas' : freightatlas

}

const App = (props) => {
  const SUBDOMAIN = window.location.hostname.split('.').length > 1?
    window.location.hostname.split('.')[0].toLowerCase() : 'www'

  // const PROJECT_HOST = window.location.host.split('.').length > 1 ?
  //   window.location.host.split('.')[1].toLowerCase() : window.location.host.split('.')[0].toLowerCase()

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
            <DefaultLayout site={site.title} layout={Layout} key={ i } { ...route } { ...props }
              menus={ Routes.filter(r => r.mainNav) }/>
          )
        }
      </Switch>
      <Messages />
    </BrowserRouter>
  );
}

export default App;
