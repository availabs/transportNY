import React from "react"

import styled from "styled-components"

const EditableTitleContainer = styled.div`
	border-bottom: 2px solid ${ props => props.theme.textColorHl };
	margin-top: -2px;
	cursor: pointer;

	.fa {
		opacity: 0.5;
		transition: opacity 0.15s;
	}
	:hover span.fa,
	&.editing span.fa {
		opacity: 1.0;
	}
	input {
		border: none;
		font-size: 1.25rem;
		font-weight: bold;
		padding: 0px;
		background-color: ${ props => props.theme.sidePanelBg };
		width: 100%;
		cursor: pointer;
	}
`
const EditLabel = styled.div`
	width: 20px;
	display: inline-block;
	color: ${ props => props.theme.textColor };
`

export default class EditableTitle extends React.Component {
	ref = React.createRef();
	state = {
		editing: false,
		title: this.props.title
	}
	componentDidUpdate(oldProps) {
		if (!this.state.editing && (this.state.title !== this.props.title)) {
			this.setState({ title: this.props.title });
		}
	}
	onChange(title) {
		this.setState({ title });
		this.props.onChange(title);
	}
	startEditing(e) {
		e.stopPropagation();
		e.preventDefault();
		if (this.state.editing === false) {
			this.ref.current.select();
			this.setState({ editing: true });
		}
	}
	finishEditing() {
		if (this.state.editing === true) {
			this.setState({ editing: false });
		}
	}
	handleClickOutside(e) {
		this.finishEditing();
	}
	onKeyUp(e) {
		if (e.keyCode === 13) {
			this.finishEditing();
		}
	}
	render() {
		const {
			editing,
			title
		} = this.state;
		return (
			<EditableTitleContainer onClick={ e => this.startEditing(e) }
				className={ editing ? "editing" : null }>
				<EditLabel>
					<span className="fa fa-edit" style={ { fontSize :"1.25rem" } }/>
				</EditLabel>
				<div style={ { width: "calc(100% - 20px)", display: "inline-block", paddingLeft: "5px" } }>
					<input type="text"
						style={ { color: this.props.color } }
						value={ editing ? title : this.props.title }
						color={ this.props.color }
						placeholder="enter a title..."
						ref={ this.ref }
						onFocus={ e => this.startEditing(e) }
						onBlur={ e => this.finishEditing() }
						onChange={ e => this.onChange(e.target.value) }/>
				</div>
			</EditableTitleContainer>
		)
	}
}
