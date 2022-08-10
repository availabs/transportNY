import React from "react"

const Test2 = () => {
  return (
    <div>TEST 2!!!!!!!!!</div>
  )
}

const config = {
  name:'Test 2',
  path: "/test2",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Test2
}

export default config
