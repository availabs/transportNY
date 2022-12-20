import React from 'react'
import TmcGraphs from '../tmc_graphs'

export default ({ graph, ...rest }) => {
  const graphType = graph.type.split(' ').join(''),
    Graph = TmcGraphs[graphType] || TmcGraphs['NA'];
  return (
    <Graph { ...rest } { ...graph }/>
  )
}
