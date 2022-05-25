import React from 'react';
import { Link } from 'react-router-dom'


function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const loremIpmsum = ['Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ','Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.']


const Home = () => {
  
  const transportNYItems = [
    {
      title: 'Incidents Dashboard',
      description: loremIpmsum[1],
      to: `/incidents`,
      icon: 'fa-duotone fa-truck-tow',
    },
    {
      title: 'Workzones Dashboard',
      description: loremIpmsum[0],
      to: `/workzones`,
      icon: 'fa-duotone fa-truck-container',
    },
    {
      title: 'Congestion Dashboard',
      description: loremIpmsum[0],
      to: `/congestion`,
      icon: 'fa-duotone fa-traffic-light',
    },
    {
      title: 'Reliability Dashboard',
      description: loremIpmsum[1],
      to: `Reliability`,
      icon: '',
    }
    
  ]

  return (
    <div className='max-w-6xl mx-auto'>
      <div className='mt-8 md:mt-32 mx-2 md:mx-0 '>
        <div className='text-lg'>TSMO Dashboards</div>
        <div className="rounded-lg overflow-hidden shadow divide-y divide-gray-200 sm:divide-y-0 sm:grid sm:grid-cols-2 sm:gap-px">
          {transportNYItems.map((action, actionIdx) => (
            <div
              key={action.title}
              className={classNames(
                actionIdx === 0 ? 'rounded-tl-lg rounded-tr-lg sm:rounded-tr-none' : '',
                actionIdx === 1 ? 'sm:rounded-tr-lg' : '',
                actionIdx === transportNYItems.length - 2 ? 'sm:rounded-bl-lg' : '',
                actionIdx === transportNYItems.length - 1 ? 'rounded-bl-lg rounded-br-lg sm:rounded-bl-none' : '',
                'relative z-0 group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 hover:bg-blue-50'
              )}
            >
              
              <div>
                <span
                  className={
                    'rounded text-2xl inline-flex  items-center justify-center h-10 w-10 sm:h-12 sm:w-12 ring-white text-white bg-blue-500'
                  }
                >
                  <i className={`${action.icon} fa-fw`}  aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4 pl-0.5">
                <h3 className=" font-medium">
                  <Link to={action.to} className="focus:outline-none">
                    {/* Extend touch target to entire panel */}
                    <span className="absolute inset-0" aria-hidden="true" />
                    {action.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                 {action.description}
                </p>
              </div>
              <span
                className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-blue-400"
                aria-hidden="true"
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


const config = {
  name:'Home',
  // title: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
  // icon: 'fa-duotone fa-home',
  path: "/",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Home
}

export default config;
