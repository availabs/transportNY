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
import { Tooltip, MultiLevelSelect } from "sites/npmrds/components"

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

const NAME_REGEX = /{name}/g;
const YEAR_REGEX = /{year}/g;
const MONTH_REGEX = /{month}/g;
const DATE_REGEX = /{date}/g;
const DATA_REGEX = /{data}/g;
const TYPE_REGEX = /{type}/g;

const getRouteCompsNames = routeComps => {
	const names = new Set(routeComps.map(rc => rc.name));
	return [...names].join(", ")
}
const getDisplayDataNames = displayData => {
	const names = new Set(displayData.map(dd => dd.name));
	return [...names].filter(n => n !== "None").join(", ");
}

const getDisplayTitle = ({ title, type, routeComps = [], displayData = [] }) => {
	if (!title) return type;
	return title.replace(NAME_REGEX, getRouteCompsNames(routeComps))
							.replace(DATA_REGEX, getDisplayDataNames(displayData))
							.replace(TYPE_REGEX, type)
}

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
				savingImage,
				setSavingImage,
				saveImage,
				addMessageBox,
				hasMessageBox,
				setColorRange,
				colorRange,
				defaultColorRange,
				// clearColorRange
			} = this.props,
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

		const VIEW_MODE = viewing || previewing || savingImage;

		return (
			<div id={ `${ this.props.id }-graph-container`}
				className="graph-container"
				style={ {
					border: '1px dashed rgba(0, 0, 0, 0.25)',
					borderRadius: "4px"
				} }
				ref={ this.container }>

				{ !(VIEW_MODE && title) ? null :
					<div className="comp-title">{ getDisplayTitle(this.props) }</div>
				}
				{ VIEW_MODE ? null :
					<div style={ containerStyle }>
						<GrabBox />
						<div style={ headerStyle }>
							<EditableTitleComp
								title={ title }
								displayTitle={ getDisplayTitle(this.props) }
								updateTitle={ updateTitle }/>
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
					<div className="absolute inset-0 z-30 flex items-center justify-center"
						style={ {
							backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.25))",
							borderRadius: "4px",
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
					title={ getDisplayTitle(this.props) }
					id={ this.props.id }
					setSavingImage={ setSavingImage }/>

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
			<div
				className={
					classnames("my-drag-handle flex items-center justify-center", { grabbing })
				}
				onMouseDown={ e => this.onMouseDown(e) }
				onMouseUp={ e => this.onMouseUp(e) }
			>
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

const EditableTitleComp = props => {
	const { updateTitle, title: propsTitle, displayTitle } = props;

	const [title, _setTitle] = React.useState(propsTitle);
	const [editing, setEditing] = React.useState(false);

	const startEditing = React.useCallback(e => {
		setEditing(true);
	}, []);
	const stopEditing = React.useCallback(e => {
		setEditing(false);
	}, []);

	const sendUpdate = React.useCallback(
		debounce(title => {
			updateTitle(title);
		}, 1000), [updateTitle]);

	const setTitle = React.useCallback(e => {
		_setTitle(e.target.value);
		setEditing(true);
		sendUpdate(e.target.value);
	}, [_setTitle, sendUpdate]);

	React.useEffect(() => {
		if (!title && propsTitle && !editing) {
			_setTitle(propsTitle);
		}
	}, [title, propsTitle, editing]);

	return (
		<input type="text"
			value={ editing ? title : displayTitle }
			className="px-2 py-1 w-full"
			onChange={ setTitle }
			onFocus={ startEditing }
			onBlur={ stopEditing }/>
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

const getLabel = o => o.label;
const getValue = o => o.value;

const DisplayItem = ({ children, active, hasChildren }) => {
	return (
		<div
			className={ `
				pr-2 pl-6 hover:bg-gray-300 whitespace-nowrap relative
				${ active ? "bg-gray-200" : "bg-white" }
			` }
		>
			{ children }
			{ !active ? null :
				<div className="absolute left-0 top-0 bottom-0 px-1">
					<span className="fa fa-check"/>
				</div>
			}
		</div>
	)
}

const Select = props => {
	const {
		title,
		value,
		domain,
		keyAccessor = d => d.key,
		nameAccessor = d => d.name,
		onChange
	} = props;

	return (
		<MultiLevelSelect isDropdown
			options={ domain }
			onChange={ onChange }
			value={ value }
			displayAccessor={ nameAccessor }
			valueAccessor={ keyAccessor }
			DisplayItem={ DisplayItem }
		>
			<Control>
				<div className="px-2">
					{ title }
				</div>
			</Control>
		</MultiLevelSelect>
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

	return (
		<MultiLevelSelect isDropdown isMulti
			options={ domain }
			onChange={ onChange }
			value={ value }
			displayAccessor={ nameAccessor }
			valueAccessor={ keyAccessor }
			DisplayItem={ DisplayItem }
		>
			<Control>
				<div className="px-2">
					{ title }
				</div>
			</Control>
		</MultiLevelSelect>
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
