import React from "react"

const Test3 = () => {
  return (
    <div>TEST 3!!!!!!!!!</div>
  )
}

const config = {
  name:'Test 3',
  path: "/test3",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Test3
}

export default config
