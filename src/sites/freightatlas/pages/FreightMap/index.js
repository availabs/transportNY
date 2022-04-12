import React from "react"
// import get from "lodash.get";
import Map from './components/FreightMap'

const FreightMap = props => {
  return (
    <div className='h-full'>
      <Map />
    </div>
  )
}

const FreightMapConfig = [{
  name:'Freight Map',
  icon: 'fa-duotone fa-map-location-dot',
  path: "/",
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
  mainNav: true,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: FreightMap,
}];

export default FreightMapConfig
