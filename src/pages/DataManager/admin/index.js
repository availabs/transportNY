import React from 'react';
import AdminLayout from './components/AdminLayout'
import SourceView from '../Source'

const DataManager = () => {
  return (
    <div className='max-w-6xl mx-auto'>
      <AdminLayout />
    </div>
  )
}

const SourceList = {
  name:'Data Sources',
  path: "/datamanager",
  exact: true,
  auth: 5,
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
