import React from 'react';


const NoMatch = () =>
    <div className='h-full flex-1 flex flex-col text-gray-900 bg-gray-100'>
        <div className="flex-1 flex items-center justify-center flex-col">
          <div className="text-8xl font-bold">1</div>
          <div className="text-2xl">Loading</div>
          <div className="text-2xl">Checking credentials...</div>
        </div>
    </div>


const config = {
  mainNav: false,
  component: NoMatch,
  path: '*',
  layoutSettings: {
    fixed: true,
    headerBar: true
  }
}

export default config;
