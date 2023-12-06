import React from "react"

import { BarGraph, generateTestBarData } from "./modules/avl-graph/src"

const GraphTest = props => {
  const [orientation, setOrinetation] = React.useState("vertical")
  const toggleOrientation = React.useCallback(e => {
    setOrinetation(o => o === "vertical" ? "horizontal" : "vertical");
  }, []);

  const [data, setData] = React.useState(generateTestBarData());
  const generate = React.useCallback(e => {
    setData(generateTestBarData());
  }, []);
  const clear = React.useCallback(e => {
    setData({ data: [], keys: [] });
  }, []);

  const [groupMode, setGroupMode] = React.useState("stacked")
  const toggleGroupMode = React.useCallback(e => {
    setGroupMode(gm => gm === "stacked" ? "grouped" : "stacked");
  }, []);
  return (
    <div>
      <div className="flex justify-center py-2">
        <button onClick={ toggleOrientation }
          className={ `
            px-4 py-1 rounded bg-gray-300 cursor-pointer mr-1
          ` }
        >
          toggle orientation
        </button>
        <button onClick={ toggleGroupMode }
          className={ `
            px-4 py-1 rounded bg-gray-300 cursor-pointer ml-1 mr-1
          ` }
        >
          toggle group mode
        </button>
        <button onClick={ generate }
          className={ `
            px-4 py-1 rounded bg-gray-300 cursor-pointer ml-1 mr-1
          ` }
        >
          generate data
        </button>
        <button onClick={ clear }
          className={ `
            px-4 py-1 rounded bg-gray-300 cursor-pointer ml-1
          ` }
        >
          clear data
        </button>
      </div>
      <div style={ { height: "800px" } }>
        <BarGraph { ...data }
          axisBottom={ true }
          axisLeft={ true }
          orientation={ orientation }
          groupMode={ groupMode }
          margin={ {
            left: 70,
            top: 20,
            right: 70,
            bottom: 30
          } }/>
      </div>
    </div>
  )
}

const config = {
  mainNav: false,
  path: "/graph-test",
  sideNav: { size: "none" },
  topNav: { position: "fixed" },
  component: GraphTest
}
export default config;
