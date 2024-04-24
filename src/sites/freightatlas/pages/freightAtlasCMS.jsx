import { useFalcor } from "~/modules/avl-components/src"
import { useAuth } from "~/modules/ams/src";

import { dmsPageFactory, registerDataType } from "~/modules/dms/src"
import { withAuth } from "~/modules/ams/src" 
import checkAuth  from "~/layout/checkAuth"
import {Logo} from '~/layout/ppdaf-layout'
import AuthMenu from "~/pages/Auth/AuthMenu"

import siteConfig from '~/modules/dms/src/patterns/page/siteConfig'
import ComponentRegistry from '~/components'
import Selector, { registerComponents } from "~/modules/dms/src/patterns/page/selector"
import { DamaMap } from '~/pages/DataManager'

// import BuildingFootprintsDownload from "./buildings_download"

registerComponents({
  "Map: Dama Map": DamaMap,
})
//registerComponents(ComponentRegistry)
registerDataType("selector", Selector)

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
      siteConfig({ 
        app: "transportny",
        type: "cms-freightatlas",
        useFalcor: useFalcor,
        logo: <Logo />, 
        rightMenu: <AuthMenu />,
        baseUrl: "",
        checkAuth,
        theme,
        pgEnv:'freight_data'
      }), 
      "/",
      withAuth,
      
    ),
    authLevel: -1,
    name: "CMS",
    sideNav: {
      color: 'dark',
      size: 'none'
    },
    topNav: {
      size: "none"
    }
  }
]


export default Routes