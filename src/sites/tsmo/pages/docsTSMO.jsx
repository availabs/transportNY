import { useFalcor } from "~/modules/avl-components/src"
import { useAuth } from "~/modules/ams/src";

import { dmsPageFactory, registerComponents } from "~/modules/dms/src"
import pageConfig from "~/modules/dms/src/patterns/page/siteConfig"
import { withAuth } from "~/modules/ams/src" 
import checkAuth  from "~/layout/checkAuth"
import {Logo} from '~/layout/ppdaf-layout'
import AuthMenu from "~/pages/Auth/AuthMenu"

// registerComponents(ComponentRegistry)
// registerDataType("selector", Selector)

const Routes = [
  {
    ...dmsPageFactory(
      pageConfig[0]({
        app: "dms-site",
        type: "docs-tsmo",
        useFalcor: useFalcor,
        logo: <Logo />,
        rightMenu: <AuthMenu />,
        baseUrl: "/docs",
        checkAuth
      }),
      withAuth
    ),
    authLevel: 5,
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
