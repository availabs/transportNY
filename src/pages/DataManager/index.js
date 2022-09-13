import React from 'react';
import SourcesLayout, { DataManagerHeader } from './components/SourcesLayout'
import SourceView from './Source'
import SourceCreate from './Source/create'

const DataManager = () => {
  return (
    <div className='max-w-6xl mx-auto'>
      <SourcesLayout />
    </div>
  )
}

const SourceList = [{
  name:'Data Sources',
  path: "/datasources",
  exact: true,
  auth: false,
  mainNav: false,
  title: <DataManagerHeader />,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: DataManager
}]

const config = [
  ...SourceList,
  ...SourceView,
  ...SourceCreate

]

export default config;
