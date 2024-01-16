import React, { Component } from "react"

import PropTypes from 'prop-types';

import styled from 'styled-components';

// import Accessor from 'components/common/item-selector/accessor';
// // import ChickletedInput from 'components/common/item-selector/chickleted-input';
// import Typeahead from 'components/common/item-selector/typeahead';
// // import { Delete } from 'components/common/icons';
// import DropdownList, { ListItem, classList } from 'components/common/item-selector/dropdown-list';

const ControlBase = ({ children, className, ...props }) => {
	return (
		<button className={ `
				border-2 rounded border-current
				cursor-pointer ${ className }
			` }
			{ ...props }
		>
			{ children }
		</button>
	)
}

export const Control = styled(ControlBase)`
	:hover,
	&.isActive {
	}

	&.inactive {
		cursor: not-allowed;
	}
	&.inactive:hover {
	}

	:disabled {
		cursor: not-allowed;
	}
	:disabled:hover {
	}
`

const ControlBoxBase = ({ children, className, ...props }) => {
	return (
		<div className={ `
				grid grid-cols-2 gap-1 py-1
				${ className }
			` }
			{ ...props }
		>
			{ children }
		</div>
	)
}

export const ControlBox = styled(ControlBoxBase)`
	> ${Control}:nth-child(odd) {
		text-align: left;
	}
	> ${Control}:nth-child(even) {
		text-align: right;
	}
`
export const ControlContainer = styled.div`
	color: ${ props => props.theme.textColorHl };
	margin-top: 10px;
`

export const Row = styled.div`
	display: flex;
	flex-wrap: wrap;
	margin-bottom: 10px;
	align-items: center;
`
export const Label = styled.div`
	flex: 0 0 30%;
	max-width: 30%;
	white-space: normal;
`
export const InputBox = styled.div`
	flex: 0 0 55%;
	max-width: 55%;
`
const IconDiv = styled.div`
  display: flex;
  flex: 0 0 13%;
  max-width: 13%;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-left: 2%;
  transition: background-color 0.15s, color 0.15s;
	color: ${ props => props.active ? props.theme.textColorHl : props.theme.textColor };

  :hover {
    cursor: ${ props => props.active ? "pointer" : "not-allowed" };
    background-color: ${ props => props.active ? props.theme.inputBgdHover : "" };
  }
`
const noop = () => {}
export const CopyIcon = ({ isDifferent = {}, setting = "none", onClick = noop, ...props }) =>
  <IconDiv active={ isDifferent[setting] }
		onClick={ isDifferent[setting] ? (e => { e.stopPropagation(); onClick(setting); }) : null }>
		<span className="fa fa-copy" { ...props }/>
	</IconDiv>

export const OpenCloseButton = ({ open, onClick }) => {
	return (
		<div onClick={ onClick }
			style={ { width: "30px", height: "30px" } }
			className={ `
				hover:bg-gray-500 rounded cursor-pointer
				flex justify-center items-center
			` }
		>
			<span className={ `fa fa-${ open ? "minus" : "plus" }` }/>
		</div>
	)
}

export const CheckBox = ({ value, onChange }) => {
	const doOnChange = React.useCallback(e => {
		onChange(!Boolean(value));
	}, [onChange, value]);
	return (
		<div className="flex items-center justify-center cursor-pointer"
			onClick={ doOnChange }
		>
			{ value ?
				<span className="fa fa-square-check"/> :
				<span className="fa-regular fa-square"/>
			}
		</div>
	)
}
