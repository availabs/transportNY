import React from "react"

const Test1 = () => {
  return (
    <div>TEST 1!!!!!!!!!</div>
  )
}

const config = {
  name:'Test 1',
  path: "/test1",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Test1
}

export default config
