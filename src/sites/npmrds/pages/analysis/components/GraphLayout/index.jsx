import React, { Component } from 'react';
import GridLayout from './GridLayout'

import "/node_modules/react-grid-layout/css/styles.css"
import "/node_modules/react-resizable/css/styles.css"

class GraphLayout extends Component {
  render() {
      return <GridLayout { ...this.props }/>
  }
}
export default GraphLayout
