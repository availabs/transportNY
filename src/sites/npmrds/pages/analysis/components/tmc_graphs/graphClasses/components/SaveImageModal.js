import React from "react"

// import AvlModal from "components/AvlStuff/AvlModal"
import {
  Modal, Input, Button
} from "modules/avl-components/src"

import get from "lodash.get"
import { saveSvgAsPng } from "save-svg-as-png"
import * as d3 from "d3-selection"
import styled from "styled-components"

class SaveImageModalOld extends React.Component {
  state = {
    title: this.props.title.replace(/\s/g, "_")
  }
  componentDidUpdate(oldProps) {
    if (oldProps.title !== this.props.title) {
      this.setState({ title: this.props.title.replace(/\s/g, "_") });
    }
  }
  saveImage() {
    const svg = d3.select(`div#${ this.props.id } svg`).node();
    return new Promise((resolve, reject) => {
      if (!svg) return reject();
      saveSvgAsPng(svg, this.state.title, { backgroundColor: "#ddd" })
        .then(resolve)
    })
  }
  render() {
    return (
      <Modal show={ this.props.show }
        onHide={ this.props.onHide }
        actions={ [
          { label: "Save Image",
            action: () => this.saveImage(),
            type: "success"
          }
        ]	}>
        <div className="px-10 py-8">
          <div className="font-bold text-2xl">Save Graph as...</div>
          <div className="input-group">
            <input type="text" className="form-control"
              onChange={ e => this.setState({ title: e.target.value }) }
              value={ get(this.state, "title", "") }/>
            <div className="input-group-append">
              <span className="input-group-text">.png</span>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
}

const SaveImageModal = props => {
  const { show, onHide } = props;

  const close = React.useCallback(e => {
    e.stopPropagation();
    onHide();
  }, [onHide]);

  const [title, setTitle] = React.useState(props.title.replace(/\s/g, "_"))

  const saveImage = React.useCallback(e => {
    e.stopPropagation();
    const svg = d3.select(`div#${ props.id } svg`).node();

console.log("SVG:", svg)

    if (!svg) return;
    saveSvgAsPng(svg, title, { backgroundColor: "#ddd" })
      .then(() => onHide());
  }, [onHide, title]);

  return (
    <Modal open={ show }>
      <div className="relative p-4">
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
        <div className="font-bold text-2xl">Save Graph as...</div>
        <div className="flex">
          <Input type="text"
            onChange={ setTitle }
            value={ title }/>
          <span>.png</span>
        </div>
        <div className="flex justify-end">
          <Button onClick={ saveImage }>
            Save Image
          </Button>
        </div>
      </div>
    </Modal>
  )
}
export default SaveImageModal
