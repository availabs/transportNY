import React, { Component } from "react"

import PropTypes from 'prop-types';
import listensToClickOutside from 'react-onclickoutside';

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

function _toArray(item) {
  if (Array.isArray(item)) {
    return item;
  }

  if (typeof item === 'undefined' || item === null) {
    return [];
  }

  return [item];
}

// const DropdownWrapper = styled.div`
//   background: ${props => props.theme.dropdownBgd};
//   border: 0;
//   left: 0;
//   z-index: 100;
//   position: absolute;
//   bottom: ${props =>
//     props.placement === 'top' ? props.theme.inputBoxHeight : 'auto'};
//   margin-top: ${props => (props.placement === 'bottom' ? '4px' : 'auto')};
//   margin-bottom: ${props => (props.placement === 'top' ? '4px' : 'auto')};
// 	min-width: 50%;
// `;
//
// const DropdownContainer = styled.div`
// 	position: relative;
//
// 	&.control {
// 		width: 48%;
// 		margin-bottom: 5px;
//
// 		:first-child {
// 			margin-top: 5px;
// 		}
// 		:nth-child(2) {
// 			margin-top: 5px;
// 		}
// 		:nth-child(odd) {
// 			margin-right: 2%;
// 			.control {
// 				text-align: left;
// 			}
// 		}
// 		:nth-child(even) {
// 			margin-left: 2%;
// 			.control {
// 				text-align: right;
// 			}
// 		}
//
// 		span:nth-child(2) {
// 			padding-left: 10px;
// 		}
// 	}
// `
//
// class DropDownBase extends Component {
//   static propTypes = {
//     // required properties
//     selectedItems: PropTypes.oneOfType([
//       PropTypes.array,
//       PropTypes.string,
//       PropTypes.number,
//       PropTypes.bool,
//       PropTypes.object
//     ]),
//     onChange: PropTypes.func.isRequired,
//     options: PropTypes.arrayOf(PropTypes.any).isRequired,
//
//     // optional properties
//     fixedOptions: PropTypes.arrayOf(PropTypes.any),
//     erasable: PropTypes.bool,
//     displayOption: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
//     getOptionValue: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
//     filterOption: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
//     placement: PropTypes.string,
//     disabled: PropTypes.bool,
//     isError: PropTypes.bool,
//     multiSelect: PropTypes.bool,
//     inputTheme: PropTypes.string,
//     onBlur: PropTypes.func,
//     placeholder: PropTypes.string,
//     closeOnSelect: PropTypes.bool,
//     DropdownHeaderComponent: PropTypes.func,
//     DropDownRenderComponent: PropTypes.func,
//     DropDownLineItemRenderComponent: PropTypes.func
//   };
//
//   static defaultProps = {
//     placement: 'bottom',
//     selectedItems: [],
//     displayOption: null,
//     getOptionValue: null,
//     filterOption: null,
//     fixedOptions: null,
//     inputTheme: 'primary',
//     multiSelect: true,
//     placeholder: 'Enter a value',
//     closeOnSelect: true,
//     searchable: true,
//     dropdownHeader: null,
//     DropdownHeaderComponent: null,
//     DropDownRenderComponent: DropdownList,
//     DropDownLineItemRenderComponent: ListItem,
//     className: ""
//   };
//
//   state = {
//     showTypeahead: false
//   };
//
//   handleClickOutside = () => {
//     this._hideTypeahead();
//   };
//
//   _hideTypeahead() {
//     this.setState({showTypeahead: false});
//     this._onBlur();
//   }
//
//   _onBlur = () => {
//     if (this.props.onBlur) {
//       this.props.onBlur();
//     }
//   };
//
//   _selectItem = item => {
//     const getValue = Accessor.generateOptionToStringFor(
//       this.props.getOptionValue || this.props.displayOption
//     );
//
//     this.props.onChange(getValue(item));
//
//     if (this.props.closeOnSelect) {
//       this.setState({showTypeahead: false});
//       this._onBlur();
//     }
//   };
//
//   _onErase = e => {
//     e.stopPropagation();
//     this.props.onChange(null);
//   };
//
//   _showTypeahead = () => {
//     if (!this.props.disabled) {
//       this.setState({
//         showTypeahead: !this.state.showTypeahead
//       });
//     }
//   };
//
//   _renderDropdown() {
//     return (
//       <DropdownWrapper placement={ this.props.placement }>
//         <Typeahead
//           customClasses={{
//             results: 'list-selector',
//             input: 'typeahead__input',
//             listItem: 'list__item',
//             listAnchor: 'list__item__anchor'
//           }}
//           options={this.props.options}
//           filterOption={this.props.filterOption}
//           fixedOptions={this.props.fixedOptions}
//           placeholder="Search"
//           onOptionSelected={this._selectItem}
//           customListComponent={this.props.DropDownRenderComponent}
//           customListHeaderComponent={this.props.DropdownHeaderComponent}
//           customListItemComponent={this.props.DropDownLineItemRenderComponent}
//           displayOption={Accessor.generateOptionToStringFor(
//             this.props.displayOption
//           )}
//           searchable={this.props.searchable}
//           showOptionsWhenEmpty
//           selectedItems={_toArray(this.props.selectedItems)}
//         />
//       </DropdownWrapper>
//     );
//   }
//
//   render() {
//     return (
//       <DropdownContainer className={ this.props.className }>
//
//       	<Control className={ `control${ this.state.showTypeahead ? " isActive" : "" }` }
// 					disabled={ this.props.disabled }
//       		onClick={ this._showTypeahead }>
//       	 { this.props.children }
//       	</Control>
//
//         { this.state.showTypeahead && this._renderDropdown() }
//       </DropdownContainer>
//     );
//   }
// };
//
// export const DropDown = listensToClickOutside(DropDownBase);
//
// const DoubleDropdownWrapper = styled(DropdownWrapper)`
// 	.${ classList.listItem } {
// 		position: relative;
// 	}
// 	.${ classList.listItem } .drop-right {
// 		display: none;
// 		position: absolute;
// 		left: 100%;
// 		top: 0px;
// 	}
// 	.${ classList.listItem }:hover .drop-right {
// 		display: block;
// 	}
// `
//
// const StyledDropdown = styled.div`
//  display: flex;
//  flex-direction: column;
//  background-color: ${props => props.theme.dropdownListBgd};
//  box-shadow: ${props => props.theme.dropdownListShadow};
//
//  :focus {
// 	 outline: 0;
//  }
// `;
//
// const DropdownListWrapper = styled.div`
//   background-color: ${props => props.theme.dropdownListBgd};
//   border-top: 1px solid ${props => props.theme.dropdownListBorderTop};
//   ${props => props.theme.dropdownList};
// `;
//
// export class DoubleDropdownBase extends React.Component {
// 	static defaultProps = {
// 		data: [
// 			["TEST 1", ["TEST 1.1", "TEST 1.2", "TEST 1.3"]],
// 			["TEST 2", ["TEST 2.1", "TEST 2.2", "TEST 2.3"]],
// 			["TEST 3", ["TEST 3.1", "TEST 3.2", "TEST 3.3"]]
// 		],
// 		onSelect: d => console.log("SELECTED:", d)
// 	}
// 	state = {
// 		showDropdown: false
// 	}
// 	showDropdown() {
// 		this.setState({ showDropdown: true });
// 	}
// 	hideDropdown() {
// 		this.setState({ showDropdown: false });
// 	}
// 	handleClickOutside() {
// 		this.hideDropdown();
// 	}
// 	makeSelection(selection) {
// 		this.setState({ showDropdown: false });
// 		this.props.onSelect(selection);
// 	}
// 	renderDropdown() {
// 		return (
// 			<DoubleDropdownWrapper placement={ "bottom" }
// 				style={ { minWidth: "150px" } }>
// 				<StyledDropdown className="item-selector__dropdown">
// 					<DropdownListWrapper className={ classList.list }
// 						style={ { overflow: "visible" } }>
// 						{
// 							this.props.data.map(([d, right], i) =>
// 								<div className={ classList.listItem } key={ i }
// 									onClick={ e => this.makeSelection(right.map(d => d.id)) }>
// 									<ListItem key={ d } value={ d }/>
// 									<DropdownWrapper className="drop-right"
// 										style={ { minWidth: "150px" } }>
// 										<StyledDropdown className="item-selector__dropdown">
// 											<DropdownListWrapper className={ classList.list }>
// 												{
// 													right.map((d, i) =>
// 														<div className={ classList.listItem } key={ i }
// 															onClick={ e => { e.stopPropagation(); this.makeSelection([d.id]); } }>
// 															<ListItem value={ d.name }/>
// 														</div>
// 													)
// 												}
// 											</DropdownListWrapper>
// 										</StyledDropdown>
// 									</DropdownWrapper>
// 								</div>
// 							)
// 						}
// 					</DropdownListWrapper>
// 				</StyledDropdown>
// 			</DoubleDropdownWrapper>
// 		)
// 	}
// 	render() {
// 		return (
//       <DropdownContainer className={ this.props.className }>
//
//       	<Control className={ `control${ this.state.showTypeahead ? " isActive" : "" }` }
//       		onClick={ e => this.showDropdown() }>
//       	 { this.props.children }
//       	</Control>
//
//         { this.state.showDropdown && this.renderDropdown() }
//
//       </DropdownContainer>
//     );
// 	}
// }
// export const DoubleDropdown = listensToClickOutside(DoubleDropdownBase)
