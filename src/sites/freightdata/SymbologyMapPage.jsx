import React from "react"

import SymbologyMap from "./SymbologyMap"

const SymbologyMapPage = props => {
  return (
    <div className="w-full h-full relative">
      <SymbologyMap pgEnv="freight_data"/>
    </div>
  )
}
const config = {
  name: 'Freight Data Map',
  icon: 'fa-duotone fa-map',
  path: "/symbology-map",
  exact: true,
  auth: false,
  mainNav: true,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: SymbologyMapPage
}
export default config;