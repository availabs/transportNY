import React from "react"

const Test4 = () => {
  return (
    <div>TEST 4!!!!!!!!!</div>
  )
}

const config = {
  name:'Test 4',
  path: "/test4",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Test4
}

export default config
