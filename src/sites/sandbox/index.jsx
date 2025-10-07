import DataManager from "~/pages/DataManager"
import { useFalcor } from "~/modules/avl-components/src"
import { useAuth } from "~/modules/ams/src";
import {Link} from 'react-router'

import { dmsPageFactory, registerComponents } from "~/modules/dms/src"
import pageConfig from "~/modules/dms/src/patterns/page/siteConfig"
import { withAuth } from "~/modules/ams/src"

import checkAuth  from "~/layout/checkAuth"
import {Logo} from '~/layout/ppdaf-layout'
import AuthMenu from "~/pages/Auth/AuthMenu"

import ComponentRegistry from '~/components'

import { DamaMap, Map } from '~/pages/DataManager'

// import BuildingFootprintsDownload from "./buildings_download"

registerComponents({
  "Map: Dama Map": DamaMap,
  Map
})
//registerComponents(ComponentRegistry)
// registerDataType("selector", Selector)

//console.log('components', DamaMap)


const theme = {
  navOptions: {
    logo: <Logo />,//'',//<Link to='/' className='h-12 flex px-4 items-center'><div className='rounded-full h-8 w-8 bg-blue-500 border-2 border-blue-300 hover:bg-blue-600' /></Link>, //<Link to='/' className='h-12 flex px-4 items-center'>LOGO</Link>,
    sideNav: {
      size: 'compact',
      search: 'none',
      logo: 'none',
      position: 'fixed',
      dropdown: 'none',
      nav: 'main'
    },
    topNav: {
      size: 'compact',
      dropdown: 'right',
      search: 'right',
      logo: 'left',
      position: 'fixed',

      nav: 'none'
    }
  },
  page: {
    wrapper1: 'w-full flex-1 flex flex-col  ', // first div inside Layout
    wrapper2: 'w-full h-full flex-1 flex flex-row', // inside page header, wraps sidebar
    wrapper3: 'flex flex-1 w-full flex-col border shadow bg-white relative text-md font-light leading-7 min-h-[calc(100vh_-_51px)]', // content wrapepr
  }
}


const DAMA_ARGS = {
  baseUrl: '/datasources',
  defaultPgEnv: 'npmrds2',
  useFalcor,
  useAuth,
  authLevel:1,
  navSettings: {
    topNav: {
      position: 'fixed',
      size: 'compact',
    },
  }
}



const Routes = [
  {
    ...dmsPageFactory(
      pageConfig[0]({
        app: "npmrdsv5",
        type: "test_123",
        useFalcor: useFalcor,
        logo: <Logo />,
        rightMenu: (
          <div className='flex'>
            <Link to='/datasources' className='w-fit group font-display whitespace-nowrap
        flex font-medium tracking-widest items-center text-[14px] px-4 h-12 text-slate-700 border-slate-100
        hover:bg-white hover:text-blue-500
        focus:outline-none focus:text-gray-800 focus:bg-gray-50 focus:border-gray-300
        transition cursor-pointer'>Data Manager</Link>
            <AuthMenu />
          </div>
        ),
        baseUrl: "",
        authLevel: 1,
        checkAuth,
        themes: {default:theme},
        pgEnv:'npmrds2',
        damaBaseUrl: '/datasources'
      }),

    ),
    authLevel: 1,
    name: "CMS",
    sideNav: {
      color: 'white',
      size: 'none'
    },
    topNav: {
      size: "none",
      color: "white"
    }
  },
  ...DataManager(DAMA_ARGS),
  // ...FreightDocs
]

const site = {
	title: "TransportNY",
	Routes
}

export default site
