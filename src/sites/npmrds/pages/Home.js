import React from 'react';

import { Link } from "react-router-dom"

const Home = () => (
  <div className="max-w-6xl mx-auto my-8">
    <div className="text-3xl font-bold">
      Welcome to NPMRDS
    </div>
    <div className="flex flex-col text-lg">
      <Link to="/folders">My Stuff</Link>
      <Link to="/folders/routes">My Routes</Link>
      <Link to="/folders/reports">My Reports</Link>
      <Link to="/folders/templates">My Templates</Link>
    </div>
  </div>
)
const config = {
  name:'TransportNY',
  // title: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
  // icon: 'fa-duotone fa-home',
  path: "/",
  exact: true,
  auth: true,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'none'
  },
  component: Home
}

export default config;
