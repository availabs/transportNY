import React from 'react'
// import WidthProvider from 'pages/auth/NetworkView/components/utils/WidthProvider'
import { WidthProvider, Responsive } from 'react-grid-layout'
import GraphFactory from './GraphFactory'

import { GRAPH_TYPES } from "../tmc_graphs"

// import { hideable as hideableHoC } from 'pages/auth/NetworkView/components/HoCs/hideable'
// import PdfHeader from 'pages/auth/NetworkView/containers/workingpane/ReportTitleContainer'
const Layout = WidthProvider(Responsive)

const DEFAULT_LAYOUT = {
  h: 8,
  w: 12,
  maxH: 20,
  maxW: 12,
  minH: 5,
  minW: 4,
  x: 0,
  y: 0
}
const getDefaultLayout = (i, viewing) =>
  ({ ...DEFAULT_LAYOUT, i, static: viewing });

class GridLayout extends React.Component {
  loadComps() {
    const { graphs, viewing, ...rest } = this.props;
    return graphs
      .filter(g => GRAPH_TYPES.reduce((a, c) => a || c.type === g.type, false))
      .map((graph, i) => {
        let layout = { ...getDefaultLayout(graph.id, viewing) };

        if (graph.layout) {
          layout = {
            ...layout,
            ...graph.layout,
            i: graph.id,
            static: viewing
          };
        }

        delete layout.isDraggable;
        delete layout.isResizable;

        return (
          <div key={ graph.id }
            data-grid={ layout }>
            <GraphFactory
              viewing={ viewing }
              graph={ graph }
              index={ i }
              { ...rest }/>
          </div>
        )
      })
  }
// //
  render() {
    return (
      <Layout rowHeight={ 30 }
        useCSSTransforms={ false }
        breakpoints={ { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 } }
        cols={ { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 } }
        onLayoutChange={ this.props.onLayoutChange }
        draggableHandle=".my-drag-handle">

        { this.loadComps() }

      </Layout>
    )
  }
}
export default GridLayout
