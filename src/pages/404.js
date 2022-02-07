import React from 'react';
import TigLayout from 'components/tig/TigLayout'

const NoMatch = () =>
  <TigLayout>
    <div className='h-screen -mt-24 flex-1 flex flex-col text-gray-900 bg-white'>
        <div className="flex-1 flex items-center justify-center flex-col">
          <div className="text-6xl font-bold">404</div>
          <div className="text-xl">Page not Found</div>
          <div className="text-xl">Oops, Something went missing...</div>
        </div>
    </div>
  </TigLayout>

const config = {
  mainNav: false,
  component: NoMatch,
  layout: "Simple",
  layoutSettings: {
    fixed: true,
    headerBar: true
  }
}

export default config;
