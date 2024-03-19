import React from "react"
// import get from "lodash/get";
import Map from './components/FreightMap'
import { DamaContext } from "~/pages/DataManager/store"
import { useFalcor } from "~/modules/avl-components/src"
// import { useAuth } from "@availabs/ams"
import { useAuth } from "~/modules/ams/src"

const baseUrl = '/datasources';
const defaultPgEnv = 'npmrds';

const FreightMap = props => {
  const { falcor, falcorCache } = useFalcor();
  const user = useAuth();

  return (
    <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl, falcor, falcorCache, user}}>
      <div className='h-full'>

        <Map />
      </div>
    </DamaContext.Provider>
  )
}

const FreightMapConfig = [{
  name:'Freight Map',
  icon: 'fa-duotone fa-map-location-dot',
  path: "/old",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: FreightMap,
},
{
  name:'Freight Map',
  icon: 'fa-duotone fa-map-location-dot',
  path: "/map",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: FreightMap,
}];

export default FreightMapConfig
