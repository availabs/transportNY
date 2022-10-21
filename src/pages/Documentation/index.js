import React from 'react';
import {getSubdomain} from "utils"

const FreightAtlasDocs = () => {
  return (
    <div className='w-full'>
     <iframe src="/docs/Freight Atlas User Guidance.pdf" width="100%" height="1000px"/>
    </div>
  )
}

const Documentation = () => {
    const SUBDOMAIN = getSubdomain(window.location.host)

  const renderSite = React.useMemo(() => {
    switch(SUBDOMAIN) {
      case 'freightatlas': 
        return <FreightAtlasDocs />
      default:
        return <div>{SUBDOMAIN}</div>
    }
  }, [SUBDOMAIN])

  return (
    <div className='max-w-6xl mx-auto'>
      <h2>Documentation</h2>
      {renderSite}
    </div>
  )
}



const config = [{
  name:'Documentation',
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
