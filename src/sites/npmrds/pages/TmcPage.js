import React from "react"

import { useParams } from "react-router-dom"

const TmcPage = props => {

  const { tmc } = useParams();

  return (
    <div className="container mx-auto py-8">
      TMC: { tmc }
    </div>
  )
}

const config = {
  name: 'TMC',
  path: "/tmc/:tmc",
  exact: true,
  auth: true,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'compact'
  },
  component: TmcPage
}

export default config;
