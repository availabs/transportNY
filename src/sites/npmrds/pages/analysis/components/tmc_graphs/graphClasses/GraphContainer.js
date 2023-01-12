import React from "react"

import classnames from "classnames"
import styled from "styled-components"
import debounce from "lodash.debounce"

// import onClickOutside from 'react-onclickoutside';

// import LoadingIndicator from "./LoadingIndicator"
// import LoadingIndicator from "components/loading/loadingPage"
import { ScalableLoading } from "modules/avl-components/src"

// import { VertDots } from "components/common/icons"
// import { Tooltip } from 'components/common/styled-components';
import { Tooltip, MultiLevelDropdown } from "sites/npmrds/components"

import { ControlBox, Control } from "sites/npmrds/pages/analysis/components/Sidebar/components/parts"

import ColorSelectorModal from "./components/ColorSelectorModal"
import SaveImageModal from "./components/SaveImageModal"

const WIDTH_BREAKPOINT = 800;
const NUM_ICONS = 7;

const IconContainer = styled.div`
	position: absolute;
	display: flex;
	top: 2px;
	right: 2px;
`

class GraphContainer extends React.Component {
	static defaultProps = {
		viewing: true,
		title: "",
		loading: false,
		headerData: [],
		updateTitle: () => {}
	}
	state = {
		width: 200,
		height: 100,
		showColorSelectorModal: false,
		showSaveImageModal: false
	}
	container = React.createRef();
	timeout = null;
	componentDidMount() {
		this.resize();
	}
	componentWillUnmount() {
		clearTimeout(this.timeout);
	}
	resize() {
		const { current } = this.container;
		if (current) {
			const width = current.scrollWidth,
				height = current.scrollHeight;
			if ((width !== this.state.width) || (height !== this.state.height)) {
				this.setState({ width, height });
			}
		}
		if (!this.props.viewing && this.props.headerData.length) {
			this.timeout = setTimeout(this.resize.bind(this), 50);
		}
	}

  saveImage(svg, title) {
    this.setState({ svgToSave: { svg, title } })
  }

	getNumIcons() {
		const {
				saveImage,
				hasMessageBox,
				setColorRange
			}= this.props;
		return NUM_ICONS - (saveImage ? 0 : 1) - (hasMessageBox ? 1 : 0) - (setColorRange ? 0 : 1)
	}
	getWidthBreakPoint() {
		const numIcons = this.getNumIcons();
		return WIDTH_BREAKPOINT + numIcons * 26 + 8;
	}
	getHeaderHeight() {
		const {
			viewing,
			previewing,
			title,
			headerData
		} = this.props,
		{ width } = this.state;
		const VIEW_MODE = viewing || previewing;
		if (VIEW_MODE && !title) {
			return 0;
		}
		if (VIEW_MODE && title) {
			return 30;
		}
		if (headerData.length && (width <= this.getWidthBreakPoint())) {
			return 60;
		}
		return 30;
	}
	render() {
		const {
				viewing,
				previewing,
				title,
				type,
				loading,
				children,
				headerData,
				updateTitle,
				add,
				remove,
				// id,
				saveImage,
				addMessageBox,
				hasMessageBox,
				setColorRange,
				colorRange,
				defaultColorRange,
				// clearColorRange
			}= this.props,
			{ width } = this.state,
			headerHeight = this.getHeaderHeight(),
			containerStyle = {
					height: `${ headerHeight }px`,
					display: "flex",
					alignItems: "center",
					flexWrap: "wrap",
					flexDirection: "row"
				},
			baseStyle = {
					height: "30px"
				},
			numIcons = this.getNumIcons(),
			widthBreakPoint = this.getWidthBreakPoint(),
			headerStyle = {
					width: width <= widthBreakPoint || !headerData.length ? `calc(100% - ${ numIcons * 26 + 8 }px)` : "calc(50% - 30px)",
					...baseStyle
				},
			menuStyle = {
					width: width <= widthBreakPoint || !headerData.length ? "100%" : "50%",
					display: "flex",
					alignItems: "center",
					flexWrap: "wrap",
					flexDirection: "row",
					padding: "0px 5px",
					...baseStyle
				};
		const VIEW_MODE = viewing || previewing;
		return (
			<div className="graph-container"
				style={ {
					border: '1px dashed rgba(0, 0, 0, 0.25)',
					borderRadius: "4px"
				} }
				ref={ this.container }>

				{ !(VIEW_MODE && title) ? null :
					<div className="comp-title">{ title }</div>
				}
				{ VIEW_MODE ? null :
					<div style={ containerStyle }>
						<GrabBox />
						<div style={ headerStyle }>
							<EditableTitleComp title={ title || type } updateTitle={ updateTitle }/>
						</div>
						{ !headerData.length ? null :
							<div style={ menuStyle }>
								<MenuBar data={ headerData }
									maxHeight={ this.state.height - headerHeight }/>
							</div>
						}
					</div>
				}

				<div style={ { height: `calc(100% - ${ headerHeight }px)`, width: "100%", maxWidth: "100%" } }>
					{ children }
				</div>

				{ !loading ? null :
					<div style={ {
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.25))",
							zIndex: 5000,
							borderRadius: "4px"
						} }>
						<ScalableLoading/>
					</div>
				}
				<IconContainer>
					{ VIEW_MODE ? null :
						<IconButton onClick={ this.props.showTableModal }
							id="view-data" icon="fa-eye" tooltip="View Graph Data"/>
					}
					{ VIEW_MODE || hasMessageBox ? null :
						<IconButton onClick={ addMessageBox }
							id="add-message" icon="fa-file" tooltip="Add Message Box"/>
					}
					{ VIEW_MODE || !saveImage ? null :
						<IconButton onClick={ e => this.setState({ showSaveImageModal: true }) }
							id="save-image" icon="fa-save" tooltip="Save as .png"/>
					}
					{ VIEW_MODE || !setColorRange ? null :
						<IconButton onClick={ e => this.setState({ showColorSelectorModal: true }) }
							id="color-range" icon="fa-paint-brush" tooltip="Select Graph Color"/>
					}
					{ VIEW_MODE ? null :
						<IconButton onClick={ add }
							id="add-graph" icon="fa-plus" tooltip="Add New Graph"/>
					}
					{ VIEW_MODE ? null :
						<IconButton onClick={ remove }
							id="remove-graph" icon="fa-minus" tooltip="Remove Graph"/>
					}
				</IconContainer>
				<ColorSelectorModal show={ this.state.showColorSelectorModal }
					onHide={ e => this.setState({ showColorSelectorModal: false }) }
					setColorRange={ setColorRange }
					colorRange={ colorRange }
					defaultColorRange={ defaultColorRange }/>

        <SaveImageModal show={ this.state.showSaveImageModal }
          onHide={ () => this.setState({ showSaveImageModal: false }) }
					title={ title || type }
					id={ this.props.id }/>

			</div>
		)
	}
}
export default GraphContainer

class GrabBox extends React.Component {
	state = {
		grabbing: false
	}
	onMouseDown(e) {
		this.setState({ grabbing: true });
	}
	onMouseUp(e) {
		this.setState({ grabbing: false });
	}
	render() {
		const { grabbing } = this.state;
		return (
			<div className={ classnames("my-drag-handle", { grabbing }) }
				onMouseDown={ e => this.onMouseDown(e) }
				onMouseUp={ e => this.onMouseUp(e) }>
				<span className="fa fa-ellipsis-vertical"/>
				<Tooltip id="grab-box"
					className="icon-tooltip"
					place="top"
					effect="solid">
					Drag Graph
				</Tooltip>
			</div>
		)
	}
}

const IconButton = ({ onClick, id, icon, tooltip }) =>
	<div className="graph-comp-icon" onClick={ onClick }
		data-tip data-for={ id }>
		<span className={ `fa ${ icon } fa-lg` }/>
		<Tooltip id={ id }
			className="icon-tooltip"
			place="top"
			effect="solid">
			{ tooltip }
		</Tooltip>
	</div>

class EditableTitleCompBase extends React.Component {
	ref = React.createRef();
	state = {
		editing: false,
		title: this.props.title
	}
	TIMEOUT = null;
	componentDidMount() {
		this.MOUNTED = true;
		this.ref.current.addEventListener("click", e => e.stopPropagation(), true)
	}
	componentDidUpdate(oldProps) {
		if (!this.state.editing && !this.state.title) {
			this.setState({ title: this.props.title });
		}
	}
	startEditing(e) {
		e.stopPropagation();
		e.preventDefault();
		if (this.state.editing === false) {
			this.setState({ editing: true });
		}
	}
	onChange(e) {
		this.setState({ title: e.target.value });
		// this.props.updateTitle(e.target.value);
	}
	sendUpdate() {
		clearTimeout(this.TIMEOUT);
		this.props.updateTitle(this.state.title);
	}
	finishEditing() {
		if (this.state.editing === true) {
			this.setState({ editing: false });
		}
	}
	// handleClickOutside(e) {
	// 	this.finishEditing();
	// }
	onClickOutside(e) {
		this.finishEditing();
	}
	render() {
		return (
			<input type="text" ref={ this.ref }
				value={ this.state.editing ? this.state.title : this.props.title }
				style={ { paddingBottom: "calc(0.25rem - 1px)" } }
				className="form-control form-control-sm"
				onFocus={ this.startEditing.bind(this) }
				onKeyUp={ this.sendUpdate.bind(this) }
				onChange={ this.onChange.bind(this) }/>
		)
	}
}
// const EditableTitleComp = onClickOutside(EditableTitleCompBase);

const EditableTitleComp = props => {
	const [ref, setRef] = React.useState(null);

	const [title, _setTitle] = React.useState(props.title);

	const sendUpdate = React.useCallback(debounce(title => {
		props.updateTitle(title);
	}, 1000), [props.updateTitle]);

	const setTitle = React.useCallback(e => {
		_setTitle(e.target.value);
		sendUpdate(e.target.value);
	}, [_setTitle, sendUpdate]);

	return (
		<input type="text" ref={ setRef }
			value={ title }
			className="px-2 py-1"
			onChange={ setTitle }/>
	)
}

class MenuBar extends React.Component {
	static defaultProps = {
		data: []
	}
	renderItem(data, i) {
		let comp = null;
		switch (data.type) {
			case "multi-select":
				comp = <MultiSelect key={ i } { ...data } multi={ true }
									maxHeight={ this.props.maxHeight }/>;
				break;
			case 'single-select':
				comp = <Select key={ i } { ...data }
									maxHeight={ this.props.maxHeight }/>;
				break;
			case "boolean-toggle":
				comp = <BooleanToggle key={ i } { ...data }/>
				break;
		}
		return comp;
		// return !comp ? null :
		// 	<div className="item" key={ i }>
		// 	 { comp }
		// 	</div>;
	}
	render() {
		return (
			<div className="menubar">
				{ this.props.data.map((data, i) => this.renderItem(data, i)) }
			</div>
		)
	}
}
const BooleanToggle = ({ title, value, onChange }) =>
	<button className="btn btn-sm btn-outline-primary"
		onClick={ e => onChange(!value) }>
		{ title }
	</button>

const DropdownMenu = styled.div`
	${ props => props.theme.dropdownScrollBar };
	background-color: ${ props => props.theme.dropdownListBgd };
`

const Select = props => {
	const {
		title,
		value,
		domain,
		keyAccessor = d => d.key,
		nameAccessor = d => d.name,
		onChange
	} = props;

	const Items = React.useMemo(() => {
		return domain.map(d => ({
			...d,
			Item: ({ children, ...props }) => (
				<div { ...props }
					className={ `
						pr-2 pl-6 hover:bg-gray-300 whitespace-nowrap relative
						${ value === keyAccessor(d) ? "bg-gray-200" : "" }
					` }
				>
					{ children }
					{ value !== keyAccessor(d) ? null :
						<div className="absolute left-0 top-0 bottom-0 px-1">
							<span className="fa fa-check"/>
						</div>
					}
				</div>
			)
		}))
	}, [domain, value, keyAccessor]);

	return (
		<MultiLevelDropdown
			searchable={ false }
			labelAccessor={ nameAccessor }
			valueAccessor={ keyAccessor }
			items={ Items }
			onClick={ onChange }
		>
			<Control>
				<div className="px-2">
					{ title }
				</div>
			</Control>
		</MultiLevelDropdown>
	)
}
const MultiSelect = props => {
	const {
		title,
		value,
		domain,
		keyAccessor = d => d.key,
		nameAccessor = d => d.name,
		onChange
	} = props;

	const Items = React.useMemo(() => {
		return domain.map(d => ({
			...d,
			Item: ({ children, ...props }) => (
				<div { ...props }
					className={ `
						pr-2 pl-6 hover:bg-gray-300 whitespace-nowrap relative
						${ value.includes(keyAccessor(d)) ? "bg-gray-200" : "" }
					` }
				>
					{ children }
					{ !value.includes(keyAccessor(d)) ? null :
						<div className="absolute left-0 top-0 bottom-0 px-1">
							<span className="fa fa-check"/>
						</div>
					}
				</div>
			)
		}))
	}, [domain, value, keyAccessor]);

	const doOnChange = React.useCallback(val => {
		if (value.includes(val)) {
			onChange(value.filter(v => v != val));
		}
		else {
			onChange([...value, val]);
		}
	}, [onChange, value]);

	return (
		<MultiLevelDropdown
			searchable={ false }
			labelAccessor={ nameAccessor }
			valueAccessor={ keyAccessor }
			items={ Items }
			onClick={ doOnChange }
		>
			<Control>
				<div className="px-2">
					{ title }
				</div>
			</Control>
		</MultiLevelDropdown>
	)
}

// class SelectBase extends React.Component {
// 	static defaultProps = {
// 		domain: [],
// 		onChange: () => {},
// 		keyAccessor: d => d.key,
// 		nameAccessor: d => d.name,
// 		multi: false
// 	}
// 	constructor(...args) {
// 		super(...args);
//
// 		this.state = {
// 			isOpen: false
// 		}
// 		this.onClickOutside = this.onClickOutside.bind(this);
// 	}
// 	toggle(e) {
// console.log("TOGGLE")
// 		// e.preventDefault();
// 		// e.stopPropagation();
// 		this.setState({ isOpen: !this.state.isOpen });
// 	}
// 	// handleClickOutside(e) {
// 	// 	this.setState({ isOpen: false });
// 	// }
// 	onClickOutside(e) {
// 		console.log("CLICKED OUTSIDE");
// 		this.setState({ isOpen: false });
// 	}
// 	singleSelect(value) {
// 		if (value !== this.props.value) {
// 			this.props.onChange(value);
// 		}
// 		this.setState({ isOpen: false });
// 	}
// 	multiSelect(value) {
// 		const values = new Set(this.props.value);
// 		if (values.has(value)) {
// 			values.delete(value);
// 		}
// 		else {
// 			values.add(value);
// 		}
// 		this.props.onChange([...values]);
// 	}
// 	render() {
// 		const { isOpen } = this.state,
// 			{ title,
// 				value,
// 				domain,
// 				keyAccessor,
// 				nameAccessor,
// 				multi,
// 				maxHeight
// 			} = this.props,
// 			onClick = multi ? this.multiSelect.bind(this) : this.singleSelect.bind(this),
// 			values = multi ? value : [value],
// 			domainHeight = domain.length * 27,
// 			height = isOpen ? Math.min(maxHeight, domainHeight) - 1 : 0;
// 		return (
// 			<div className="relative dropdown">
// 				<button className="btn btn-sm btn-outline-primary"
// 					onClick={ this.toggle.bind(this) }>
// 					{ title } <span className={ `fa fa-chevron-${ isOpen ? 'up' : 'down' }` }/>
// 				</button>
//
// 				<DropdownMenu className="menu" style={ { height: `${ height }px`, overflow: `${ maxHeight < domainHeight ? "auto" : "hidden" }` } }>
// 					{
// 						domain.map((d, i) =>
// 							<div key={ keyAccessor(d, i) } className={ `item${ values.includes(keyAccessor(d, i)) ? ' active' : '' }` }
// 								onClick={ e => onClick(keyAccessor(d, i)) }>
// 								{ nameAccessor(d, i) }
// 							</div>
// 						)
// 					}
// 				</DropdownMenu>
//
// 			</div>
// 		)
// 	}
// }
// const Select = onClickOutside(SelectBase);
// const Select = SelectBase;