

const AuthConfig = {
  type: "ams-manager",
  props: {
    showHeaders: false
  },
  wrappers: [
    // "ams-manager",
    "ams-redux",
    "ams-router"
  ],
  children: [
    { type: "ams-login" },
    { type: "ams-reset-password" },
    { type: "ams-logout",
// @props.redirectTo
// Optional prop. Defaults to "/".
// Redirects user to URL after logging out.
      // props: { redirectTo: "/" }
    },

    { type: "ams-signup",
// @props.addToGroup
// Optional prop. Defaults to false.
// Adds user to group (must have auth level 0 in all projects) instead of creating a request that must be accepted by admin.
      props: { addToGroup: "TDS Public" }
    },
    { type: "ams-verify-request" }, // This is only required when addToGroup prop is included with ams-signup
    // { type: "ams-verify-email" }, // This is only required when addToGroup prop is not included with ams-signup

    { type: "ams-set-password" },

    { type: "ams-profile" },
    { type: "ams-accept-invite" },

    { type: "ams-directory" },

    { type: "ams-project-management"
// @props.authLevel
// Optional prop. This prop can be applied to any AMS child.
// If set, users must have equal or higher authLevel to view this page.
// Defaults to 5 for "ams-project-management."
      // props: { authLevel: 5 }
    }
  ]
}

const auth = {
  path: "/auth",
  mainNav: false,
  // layout: 'Simple',
  layoutSettings: {
    fixed: true,
    navBar: 'top',
    headerBar: false
  },
  component: AuthConfig
}
export default auth;
