import React from "react"

// import AvlModal from "components/AvlStuff/AvlModal"

import {
  Modal
  // getColorRange,
  // ScalableLoading,
  // Select
} from "~/modules/avl-components/src"

// import get from "lodash.get"
// import styled from "styled-components"

// import ColorRangeSelector from "pages/auth/Routes/analysis/components/Sidebar/ColorRangeSelector"
import ColorRangeSelector from "~/sites/npmrds/pages/analysis/components/Sidebar/ColorRangeSelector"

// class ColorSelectorModalOld extends React.Component {
//   render() {
//     return (
//       <Modal show={ this.props.show }
//         onHide={ this.props.onHide }
//         usePositioned={ true }>
//         <div style={ { width: "350px" } }>
//           <ColorRangeSelector
//             colorRange={ this.props.colorRange }
//             selectColorRange={ this.props.setColorRange }
//             defaultColorRange={ this.props.defaultColorRange }/>
//         </div>
//       </Modal>
//     )
//   }
// }

const ColorSelectorModal = props => {
  const { show, onHide } = props;
  const close = React.useCallback(e => {
    e.stopPropagation();
    onHide();
  }, [onHide]);
  return (
    <Modal open={ show }>
      <div style={ { width: "350px" } }
        className="relative"
      >
        <div onClick={ close }
          className={ `
            absolute top-1 right-1 h-6 w-6
            rounded hover:bg-gray-400
            flex items-center justify-center
            cursor-pointer
          ` }
        >
          <span className="fa fa-close"/>
        </div>
        <ColorRangeSelector
          colorRange={ props.colorRange }
          selectColorRange={ props.setColorRange }
          defaultColorRange={ props.defaultColorRange }/>
      </div>
    </Modal>
  )
}
export default ColorSelectorModal;
