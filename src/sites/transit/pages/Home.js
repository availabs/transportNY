import React from 'react';


const Home = () => 
  <div className='min-h-screen flex-1 flex flex-col text-gray-900 bg-gray-100'>
      <div className="flex-1 flex items-center justify-center flex-col">
        <div className="text-6xl font-bold">Transit</div>
        <div className="text-xl">Coming soon</div>
        <div className="text-xl">Check Back Later...</div>
      </div>
  </div>

const config = {
  name:'TransportNY',
  // title: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
  // icon: 'fa-duotone fa-home',
  path: "/",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'none'
  },
  component: Home
}

export default config;