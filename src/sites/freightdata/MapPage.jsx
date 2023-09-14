import React from "react"

import DamaMap from "./DamaMap"

const MapPage = props => {
  return (
    <div className="w-full h-full relative">
      <DamaMap pgEnv="freight_data"/>
    </div>
  )
}
const config = {
  name: 'Freight Data Map',
  icon: 'fa-duotone fa-map',
  path: "/map",
  exact: true,
  auth: false,
  mainNav: true,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: MapPage,
}
export default config;
