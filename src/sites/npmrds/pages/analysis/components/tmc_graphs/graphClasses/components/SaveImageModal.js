import React from "react"

// import AvlModal from "components/AvlStuff/AvlModal"
import {
  Modal, Input, Button
} from "modules/avl-components/src"

import get from "lodash.get"
import { saveSvgAsPng } from "save-svg-as-png"
import * as d3 from "d3-selection"
import styled from "styled-components"
import { toPng } from "html-to-image"
import download from "downloadjs"

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
  const { show, onHide, setSavingImage } = props;

  const close = React.useCallback(e => {
    e.stopPropagation();
    onHide();
  }, [onHide]);

  const [title, _setTitle] = React.useState(props.title.replace(/\s/g, "_"))
  const setTitle = React.useCallback(e => {
    e.stopPropagation();
    _setTitle(e.target.value);
  }, []);

  const saveImage = React.useCallback(e => {
    e.stopPropagation();
    const div = d3.select(`div#${ props.id }-graph-container`).node();
    setSavingImage(true);
    onHide();
    toPng(div)
      .then(dataUrl => {
        download(dataUrl, title);
      })
      .then(() => {
        setSavingImage(false);
      })
//     const svg = d3.select(`div#${ props.id } svg`).node();
//     if (!svg) {
//       const canvas = d3.select(`div#${ props.id } canvas.mapboxgl-canvas`).node();
// console.log("CANVAS:", canvas.toDataURL());
//       return;
//     }
//     saveSvgAsPng(svg, title, { backgroundColor: "#ddd" })
//       .then(() => onHide());
}, [onHide, title, setSavingImage]);

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
        <div>
          <input type="text"
            className="w-full max-w-lg px-2 py-1 border-2 rounded mr-1"
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
