import React from "react"

import styled from "styled-components"

export default class MessageBox extends React.Component {
  state = {
   hovering: false,
   editing: false,
   text: this.props.text
  }
  MOUNTED = false;
  timeout = null;
  componentDidMount() {
   this.MOUNTED = true;
  }
  componentWillUnmount() {
   this.MOUNTED = false;
  }
  componentDidUpdate(oldProps, oldState) {
   if (!oldState.editing && this.state.editing) {

   }
  }
  onChange(e) {
   this.setState({ text: e.target.value });
   clearTimeout(this.timeout);
   this.timeout = setTimeout(() => this.doUpdate(), 2500)
  }
  doUpdate() {
   this.MOUNTED && (this.state.text !== this.props.text) && this.props.onChange(this.state.text);
   this.setState({ editing: false });
  }
  render() {
    const {
     location,
     width,
     height,
     text,
     resizing,
     viewing
    } = this.props;
    return (
      <TextAreaDiv
       onMouseEnter={ e => this.setState({ hovering: true })}
       onMouseLeave={ e => this.setState({ hovering: false })}
       style={ {
         height: location === "bottom" ? `${ height }px` : "100%",
         width: location === "bottom" ? "100%" : `${ width }px`,
       } }>
       <TextArea onChange={ viewing ? null : e => this.onChange(e) }
         readOnly={ viewing }
         value={ viewing ? this.props.text : this.state.text }
         onBlur={ viewing ? null : e => this.doUpdate() }
         style={ {
           height: "calc(100% - 20px)", width: "calc(100% - 20px)",
           backgroundColor: "#fff"
         } }
         className="form-control"
         placeholder="Enter text here..."/>
       { !(this.state.hovering || resizing) || viewing || (location !== "bottom") ? null :
         <HeightHandle onMouseDown={ e => this.props.startResize("vertical", e) }/>
       }
       { !(this.state.hovering || resizing) || viewing || (location !== "right") ? null :
         <WidthHandle onMouseDown={ e => this.props.startResize("horizontal", e) }/>
       }
       { !(this.state.hovering || resizing) || viewing || (location !== "bottom") ? null :
         <DockRight onClick={ e => this.props.dockMessageBoxRight() }/>
       }
       { !(this.state.hovering || resizing) || viewing || (location !== "right") ? null :
         <DockBottom onClick={ e => this.props.dockMessageBoxBottom() }/>
       }
       { !this.state.hovering || viewing ? null :
         <RemoveButton onClick={ e => this.props.removeMessageBox() }>
           <span className="fa fa-lg fa-minus"/>
         </RemoveButton>
       }
      </TextAreaDiv>
    )
  }
}
const RemoveButton = styled.div`
  position: absolute;
  right: 0px;
  top: 0px;
  color: #f2f4f8;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 26px;
  height: 26px;
  padding: 3px;
  border-radius: 4px;
  background-color: #999;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
  :hover {
   background-color: #666;
  }
`
const MBHandle = styled.div`
  position: absolute;
  border-radius: 4px;
  background-color: #999;
  :hover {
   background-color: #666;
  }
`
const HeightHandle = styled(MBHandle)`
  width: 25%;
  height: 12px;
  left: 50%;
  transform: translateX(-50%);
  top: 4px;
  cursor: row-resize;
`
const WidthHandle = styled(MBHandle)`
  width: 12px;
  height: 25%;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: col-resize;
`
const DockRight = styled(MBHandle)`
  width: 12px;
  height: 25%;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: e-resize;
`
const DockBottom = styled(MBHandle)`
  width: 25%;
  height: 12px;
  left: 50%;
  transform: translateX(-50%);
  bottom: 4px;
  cursor: s-resize;
`
const TextAreaDiv = styled.div`
  position: relative;
`
const TextArea = styled.textarea`
  ${ props => props.theme.scrollBarLight };
  margin: 10px;
  padding: 10px;
  resize: none;
`
