import { useFalcor } from "~/modules/avl-components/src"

import { Link } from 'react-router'


import { dmsPageFactory, registerComponents } from "~/modules/dms/src"
import pageConfig from "~/modules/dms/src/patterns/page/siteConfig"
import { withAuth } from "~/modules/dms/src"

import checkAuth from "~/layout/checkAuth"
import { Logo } from '~/layout/ppdaf-layout'
import AuthMenu from "~/pages/Auth/AuthMenu"

import ComponentRegistry from '~/components'

import { DamaMap } from '~/pages/DataManager'

// import BuildingFootprintsDownload from "./buildings_download"

registerComponents({
  "Map: Dama Map": DamaMap,
})
//registerComponents(ComponentRegistry)
// registerDataType("selector", Selector)

//console.log('components', DamaMap)


const theme = {
  page: {
    wrapper1: 'w-full flex-1 flex flex-col  ', // first div inside Layout
    wrapper2: 'w-full h-full flex-1 flex flex-row', // inside page header, wraps sidebar
    wrapper3: 'flex flex-1 w-full flex-col border shadow bg-white relative text-md font-light leading-7 min-h-[calc(100vh_-_51px)]', // content wrapepr
  }
}

const Routes = [
  {
    ...dmsPageFactory(
      pageConfig[0]({
        app: "transportny",
        type: "cms-fdi",
        useFalcor: useFalcor,
        logo: <Logo />,
        authLevel: 1
        , rightMenu: (
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
        checkAuth,
        themes: { default: theme },
        pgEnv: 'freight_data'
      }),
      withAuth,

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
  }
]


export default Routes
