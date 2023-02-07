import React from "react"

import deepequal from "deep-equal"
import styled from "styled-components"
import { range } from "d3-array"

import { Control, DropDown } from "./components/parts"

// import COLOR_RANGES from "constants/color-ranges"

import {
  ColorRanges
} from "modules/avl-components/src"

import {
	FuseWrapper,
	MultiLevelDropdown
} from "sites/npmrds/components"

export const COLORS = {
  Diverging: {
    name: "Diverging",
    colors: {}
  },
  Sequential: {
    name: "Sequential",
    colors: {}
  },
  Singlehue: {
    name: "Single Hue",
    colors: {}
  }
};
const MIN_LENGTH = 3, MAX_LENGTH = 9;

for (let i = MIN_LENGTH; i <= MAX_LENGTH; ++i) {
  for (const type in COLORS) {
    const range = ColorRanges[i].filter(c => type === c.type);
    if (!(i in COLORS[type].colors)) {
      COLORS[type].colors[i] = [];
    }
    COLORS[type].colors[i].push(...range.map(c => ({ ...c, reversed: c.colors.slice().reverse() })));
  }
}
export const COLOR_TYPES = ["Diverging", "Sequential", "Singlehue"];

const StyledColorRange = styled.div`
  display: flex;
  margin: 2px;
  padding: 2px;
  overflow: hidden;
  cursor: pointer;

  border: 2px solid transparent;
  border-radius: 7px;
  :hover {
    border-color: ${ props => props.theme.textColor };
  }
  &.inactive {
    pointer-events: none;
  }
  &.selected {
    border-color: #fff;
  }

  > div {
    height: 10px;
  }
  > div:first-child {
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
  }
  > div:last-child {
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
  }
`
export const ColorRange = ({ colors, isSelected, onClick, inactive=false }) =>
  <StyledColorRange className={ (isSelected ? "selected" : "") + (inactive ? " inactive" : "") }
    onClick={ onClick }>
    { colors.map(color =>
        <div key={ color }
          style={ {
            width: `${ 100 / colors.length }%`,
            backgroundColor: color
          } }/>
      )
    }
  </StyledColorRange>

const StyledColorType = styled.div`
  color: ${ props => props.theme.textColor };
  margin-bottom: 10px;

  > h5 {
    cursor: pointer;
    margin-bottom: 0px;
    border-bottom: 2px solid transparent;
		font-size: 1.25rem;
		font-weight: bold;

    :hover {
      border-color: ${ props => props.theme.textColorHl };
    }
    &.isOpen {
      border-color: transparent;
      cursor: default;
    }
  }
  > div {
    background-color: #445;
    padding: 10px;
    border-radius: 4px;
  }
`
export const ColorType = ({ name, colors, isOpen, colorRange, selectType, selectRange, reversed }) =>
  <StyledColorType>
    <h5 className={ isOpen ? "isOpen" : "" }
      onClick={ selectType }>{ name }</h5>
    { !isOpen ? null :
      <div>
        { colors.map(c =>
            <ColorRange key={ c.name } colors={ reversed ? c.reversed : c.colors }
              isSelected={ deepequal(reversed ? c.reversed : c.colors, colorRange) }
              onClick={ () => selectRange(reversed ? c.reversed : c.colors) }/>
          )
        }
      </div>
    }
  </StyledColorType>

const StyledColorSelector = styled.div`
  padding: 10px;
  color: ${ props => props.theme.textColor };

  div.heading {
    border-bottom: 2px solid ${ props => props.theme.textColorHl };
    margin-bottom: 5px;
  }

  h4, h5 {
    color: ${ props => props.theme.textColorHl };
		font-size: 1.5rem;
		font-weight: bold;
  }
  > ${ Control } {
    margin-bottom: 5px;
  }
`

export default class ColorRangeSelector extends React.Component {
  static defaultProps = {
    colorRange: [],
    selectColorRange: () => {},
    defaultColorRange: []
  }
  state = {
    size: this.props.colorRange.length || MIN_LENGTH,
    type: "diverging",
    reversed: false
  }
  componentDidMount() {
    for (const type in COLORS) {
      for (const range of COLORS[type].colors[this.state.size]) {
        if (deepequal(range.colors, this.props.colorRange)) {
          return this.setState({ type, reversed: false });
        }
        else if (deepequal(range.reversed, this.props.colorRange)) {
          return this.setState({ type, reversed: true });
        }
      }
    }
  }
  componentDidUpdate(oldProps) {
    if (!deepequal(oldProps.colorRange, this.props.colorRange)) {
      this.componentDidMount();
    }
  }
  render() {
    const usingDefault = this.props.defaultColorRange.length && deepequal(this.props.colorRange, this.props.defaultColorRange)
    return (
      <StyledColorSelector>
        <div className="heading">
          <h4>Color Selector</h4>
          { !this.props.defaultColorRange.length || usingDefault ? null :
            <>
              Default Color Range
              <div style={ {
                  backgroundColor: "#445",
                  padding: "5px",
                  borderRadius: "4px",
                  marginBottom: "10px"
                } }>
                <ColorRange
                  colors={ this.props.defaultColorRange }
                  onClick={ e => this.props.selectColorRange(this.props.defaultColorRange) }/>
              </div>
            </>
          }
          <>
            Current Color Range{ usingDefault ? " (Default)" : ""}
            <div style={ {
                backgroundColor: "#445",
                padding: "5px",
                borderRadius: "4px",
                marginBottom: "10px"
              } }>
              <ColorRange inactive={ true }
                colors={ this.props.colorRange }/>
            </div>
          </>
        </div>

        <Control onClick={ e => this.setState({ reversed: !this.state.reversed }) }>
          <span className={ `fa ${ this.state.reversed ? 'fa-toggle-on' : 'fa-toggle-off' }` }/>
          <span>{ this.state.reversed ? "Normalize" : "Reverse" } Colors</span>
        </Control>
        <MultiLevelDropdown
          xDirection={ 0 }
          labelAccessor={ d => d.name }
          valueAccessor={ d => d.value }
          onClick={ size => this.setState({ size }) }
          items={
            range(MIN_LENGTH, MAX_LENGTH + 1)
              .map(l => ({
                Item: ({ children }) => (
                  <div
                    className={ `
                        w-40 px-2 hover:bg-gray-300
                        ${ this.state.size === l ? "bg-gray-300" : "" }
                      `
                    }
                  >
                    { children }
                  </div>
                ),
                name: `Length ${ l }`,
                value: l
              }))
          }>
          Color Range Length
        </MultiLevelDropdown>
        <div style={ { marginTop: "10px" } }>
          {
            COLOR_TYPES.map(type =>
              <ColorType key={ type }
                { ...COLORS[type] }
                isOpen={ type === this.state.type }
                colors={ COLORS[type].colors[this.state.size] }
                selectType={ () => this.setState({ type }) }
                colorRange={ this.props.colorRange }
                selectRange={ colors => this.props.selectColorRange(colors) }
                reversed={ this.state.reversed }
                reverseColors={ () => this.setState({ reversed: !this.state.reversed }) }/>
            )
          }
        </div>
      </StyledColorSelector>
    )
  }
}
