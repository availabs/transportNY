import React from "react"
import { 
  registerDataType,
  dmsPageFactory
} from "~/modules/dms/src"

//import DmsLexical from "~/modules/dms-custom/lexical"
import { withAuth } from "@availabs/ams" 
import Layout from "./components/layout"
import { PageView, PageEdit } from "./components/page"

import docsFormat from "./docs.format.js"

import checkAuth  from "~/layout/checkAuth"

//registerDataType("lexical", DmsLexical)



const siteConfig = {
  format: docsFormat,
  check: ({user}, activeConfig, navigate) =>  {

    const getReqAuth = (configs) => {
      return configs.reduce((out,config) => {
        let authLevel = config.authLevel || -1
        if(config.children) {
          authLevel = Math.max(authLevel, getReqAuth(config.children))
        }
        return Math.max(out, authLevel)
      },-1)
    } 

    let requiredAuth = getReqAuth(activeConfig)
    checkAuth({user, authLevel:requiredAuth}, navigate)
    
  },
  children: [
    { 
      type: Layout,
      action: "list",
      path: "/*",
      children: [
        { 
          type: PageView,
          path: "/*",
          action: "view"
        },
      ]
    },
    { 
      type: (props) => <Layout {...props} edit={true}/>,
      action: "list",
      path: "/edit/*",
      authLevel: 5,
      children: [
        { 
          type: PageEdit,
          action: "edit",
          path: "/edit/*"
        },
      ]
    }
  ]
}

export default [{ 
  ...dmsPageFactory(siteConfig,"/docs/", withAuth),
  name: "Home",
  mainNav: false,
  sideNav: {
    size: "none"
  },
  topNav: {
    position: "fixed"
  }
}]