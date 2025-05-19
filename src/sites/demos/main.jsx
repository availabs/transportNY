import React from "react"

import { Link } from "react-router"

import Demos from "./demos"

const Main = () => {
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8 py-8">
      <div className="text-4xl font-bold">
        Demos
      </div>
      <div className="grid grid-cols-4 gap-4">
        { Demos.filter(({ showInBlocks = true }) => showInBlocks)
            .map(d => (
              <DemoBlock key={ d.name } { ...d }/>
            ))
        }
      </div>
    </div>
  )
}

const regex = /[:]\w+[?]/
const trimPath = path => {
  return path.split("/")
    .filter(p => !regex.test(p))
    .join("/");
}

const DemoBlock = ({ name, path }) => {
  return (
    <Link to={ trimPath(path) }>
      <div className={ `
        h-60 col-span-1 p-2
        border-4 rounded-lg border-current
        hover:bg-gray-300
      ` }>
        <div className="text-center font-bold text-lg border-b-2 border-current">
          { name }
        </div>
      </div>
    </Link>
  )
}

const config = {
  name:'Demo Main',
  path: "/",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Main
}

export default config
