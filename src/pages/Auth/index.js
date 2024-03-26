//import Login from "./components/login"
// import { amsFactory } from "@availabs/ams"
import { amsFactory } from "~/modules/ams/src"

const AuthConfig = {
  children: [
    { type: "ams-login" ,
      path: "login",
      props: {title: "TransportNY"}
    },
    { ype: "ams-reset-password",
      path: "reset-password",
      props: {title: "TransportNY"}
    },
    { type: "ams-logout",
      path: "logout"

    // @props.redirectTo
    // Optional prop. Defaults to "/".
    // Redirects user to URL after logging out.
    // props: { redirectTo: "/" }
    },

    { type: "ams-signup",
      path: "register",
      // props: { addToGroup: "123" },
      props: {title: "TransportNY"}
    },
    // { type: "ams-profile",
    //   path: "profile"
    // },
    // { type: "ams-verify-request" ,
    //   path: "verify-request"
    // },
    { type: "ams-verify-email",
      path: "verify-email"
    },
    { type: "ams-set-password",
      path: "set-password"
    },
    { type: "ams-accept-invite",
      path: "accept-invite"
    },

    { type: "ams-project-management", path: "project-management",
    // @props.authLevel
    // Optional prop. This prop can be applied to any AMS child.
    // If set, users must have equal or higher authLevel to view this page.
      props: { authLevel: 5 }
    }
  ]
}


export default amsFactory(AuthConfig, "/auth/")
