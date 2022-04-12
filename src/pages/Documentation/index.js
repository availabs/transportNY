import React from 'react';

const Documentation = () => {
  return (
    <div className='max-w-6xl mx-auto'>
      <h2>Documentation</h2>
    </div>
  )
}


const config = [{
  name:'Documentation',
  // title: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
  // icon: 'fa-duotone fa-Documentation',
  path: "/docs",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'none'
  },
  component: Documentation
}]

export default config;
