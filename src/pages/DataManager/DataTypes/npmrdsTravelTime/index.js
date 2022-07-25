import React/*, { useEffect, useMemo, useState, useRef }*/ from 'react';
import {useFalcor} from 'modules/avl-components/src'
import { LineGraph } from 'modules/avl-graph/src'


const Stats = ({source}) => {
  //const {falcor, falcorCache} = useFalcor()
  // React.useEffect(() => {

  // },[falcor])


  return (
    <div> 
      <pre>{JSON.stringify(source, null ,3)}</pre>
      Stats View 
    </div>
  )
}

const NpmrdsTravelTimeConfig = {
  
  stats: {
    name: 'Stats',
    path: '/stats',
    component: Stats
  }
}

export default NpmrdsTravelTimeConfig
