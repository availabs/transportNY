import React from 'react';
import SourcesList from './components/SourcesList'
import SourceView from './Source'

const DataManager = () => {
  return (
    <div className='max-w-6xl mx-auto'>
      <h2>Data Sources</h2>
      <SourcesList />
    </div>
  )
}

const SourceList = {
  name:'Data Sources',
  path: "/datasources",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: DataManager
}
const config = [
  SourceList,
  ...SourceView
]

export default config;
