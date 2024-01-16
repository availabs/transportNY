import React from "react"
import { connect } from "react-redux"

import get from "lodash/get"

import styled from "styled-components"

import { hexColorToRgb } from "../tmc_graphs/utils"

import {
	ControlBox,
	Control,
	OpenCloseButton
} from "./components/parts"

import {
	DragDropContext,
	Droppable,
	Draggable
} from '@hello-pangea/dnd'// 'react-beautiful-dnd';

import {
	FuseWrapper,
	MultiLevelSelect
} from "~/sites/npmrds/components"

import { useFalcor } from "~/modules/avl-components/src"

export const Header = styled.div`
	flex-grow: 1;
	display: flex;
	border-bottom: 2px solid ${ props => props.theme.textColorHl };
	h4 {
		margin-bottom: 0px;
		color: ${ props => props.theme.textColorHl };
		font-size: 1.5rem;
		font-weight: bold;
		flex-grow: 1;
	}
	span.fa {
		color: ${ props => props.theme.textColorHl };
		font-size: 18px;
		border-radius: 4px;
		padding: 5px 4px 3px 5px;
		transition: background-color 0.15s;
	}
`

export const DropdownItem = ({ children, hasChildren }) => {
  return (
    <div style={ { minWidth: "15rem" } }
      className={ `
        px-2 flex items-center text-left
        hover:bg-gray-300 bg-gray-200
      ` }
    >
      <div className="flex-1">{ children }</div>
      { !hasChildren ? null :
        <span className="fa fa-caret-right ml-2"/>
      }
    </div>
  )
}
export const InputContainer = ({ children }) => {
  return (
    <div className="bg-gray-200 px-2 pt-2 rounded-t pb-1">
      { children }
    </div>
  )
}

const ActiveRouteComponents = ({ folders = [], ...props }) => {
	const [state, _setState] = React.useState({ openCompId: null, open: true });
	const setState = React.useCallback(update => {
		_setState(prev => ({ ...prev, ...update }));
	}, []);

	const extendSidebar = React.useCallback(openCompId => {
		props.extendSidebar(openCompId);
		setState({ openCompId });
	}, [props.extendSidebar, setState]);

	const add = React.useCallback((e, route, groupId) => {
		e.stopPropagation();
		props.add(route.routeId, route.settings, groupId);
	}, [props.add]);
	const remove = React.useCallback((e, compId) => {
		e.stopPropagation();
		if (compId === state.openCompId) {
			setState({ openCompId: null });
		}
		props.remove(compId);
	}, [props.remove, setState]);

	const onDragEnd = React.useCallback(({ source, destination, combine, draggableId }) => {

		if (combine) {
			props.combineRouteComps(draggableId, combine.draggableId);
			return;
		}

		if (destination === null) return;
		if (source.index === destination.index) return;

		props.reorderRouteComps(source.index, destination.index);
	}, [props.reorderRouteComps]);

	const toggle = React.useCallback(e => {
		e.stopPropagation();
		_setState(prev => ({ ...prev, open: !prev.open }))
	}, []);

	const { falcorCache } = useFalcor();

	const foldersWithRoutes = folders.filter(f =>
		get(f, "stuff", []).reduce((a, c) => a || c.stuff_type === "route", false)
	)

	const folderData = foldersWithRoutes.map(f => {
		const routes = get(f, "stuff", []).filter(s => s.stuff_type === "route");
		return {
			label: f.name,
			value: routes.length > 10 ? [] : routes.map(r => r.stuff_id),
			children: routes.map(r => ({
				label: get(falcorCache, ["routes2", "id", r.stuff_id, "name"], ""),
				value: r.stuff_id
			}))
		}
	})

	const availableRoutes = React.useMemo(() => {
		return props.availableRoutes.slice()
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [props.availableRoutes]);

	const [headerRef, setHeaderRef] = React.useState();
	const height = React.useMemo(() => {
		if (!headerRef) return "100%";
		const headerHeight = get(headerRef, "clientHeight", 0);
		return `calc(100% - ${ headerHeight }px)`;
	}, [headerRef]);

	return (
		<div style={ {
			padding: "0px 10px",
			whiteSpace: "nowrap",
			position: "relative",
			height: "100%",
			maxHeight: "100%"
		} }>

			<div id="route-comps-header"
				ref={ setHeaderRef }
			>

				<Header>
					<OpenCloseButton open={ state.open } onClick={ toggle }/>
					<h4 className="">Routes</h4>
					{ !state.open ? null :
						<div className="flex-0 flex items-center text-sm"
							onClick={ e => props.createNewRouteGroup() }
						>
							<Control>
								<span className="px-1">Add New Group</span>
							</Control>
						</div>
					}
				</Header>

				<div style={ {
					borderBottom: `2px solid currentColor`,
					display: state.open ? "block" : "none"
				} }>
					<ControlBox>
						<Control>
							<MultiLevelSelect isDropdown
								xDirection={ 0 }
								searchable={ true }
								displayAccessor={ d => d.name }
								valueAccessor={ d => d.id }
								onChange={ id => props.add(id) }
								options={ availableRoutes }
								DisplayItem={ DropdownItem }
								InputContainer={ InputContainer }
							>
								<div className="px-1">
									<span className="fa fa-road"/>
									<span className="px-1">Routes</span>
								</div>
							</MultiLevelSelect>
						</Control>
						<Control>
							<MultiLevelSelect isDropdown
								xDirection={ 0 }
								searchable={ true }
								displayAccessor={ d => d.label }
								valueAccessor={ d => d.value }
								options={ folderData }
								onChange={ ids => props.add(ids) }
								DisplayItem={ DropdownItem }
								InputContainer={ InputContainer }
							>
								<div className="px-1">
									<span className="px-1">Folders</span>
									<span className="fa fa-folder"/>
								</div>
							</MultiLevelSelect>
						</Control>
					</ControlBox>
				</div>
			</div>

			<div
				style={ {
					height: state.open ? height : "0px",
					maxHeight: height,
					overflow: state.open ? "auto" : "hidden"
				} }
			>
				<div id="route-comps-container">
					<DragDropContext onDragEnd={ onDragEnd }>

						<Droppable droppableId="route-comp-drop-area" isCombineEnabled={ true }>
							{ (provided, snapshot) => (
								<div ref={ provided.innerRef }
									{ ...provided.droppableProps }
									style={ {
										background: snapshot.isDraggingOver ? "#555" : "none"
									} }
								>
									{ props.route_comps.map((comp, i) =>
											<Draggable key={ comp.compId } index={ i }
												draggableId={ comp.compId }
											>
												{ (provided, snapshot) => (
													<div ref={ provided.innerRef }
														{ ...provided.draggableProps }
													>
														{ get(comp, "type", "route") === "route" ?
															<RouteComp route={ comp }
																extendSidebar={ extendSidebar }
																dragHandleProps={ provided.dragHandleProps }
																isDragging={ snapshot.isDragging }
																add={ add }
															 	remove={ remove }/>
															:
															<RouteGroup group={ comp }
																updateName={ props.updateRouteGroupName }
																extendSidebar={ extendSidebar }
																dragHandleProps={ provided.dragHandleProps }
																isDragging={ snapshot.isDragging }
																add={ add }
															 	remove={ remove }
															 	removeComp={ props.removeFromGroup }
																reorderRouteComps={ props.reorderRouteComps }/>
														}
													</div>
												) }
											</Draggable>
										)
									}

									{ provided.placeholder }

								</div>
							) }
						</Droppable>

					</DragDropContext>
				</div>

			</div>
		</div>
	)
}

const ActiveRouteItem = styled.div`
	color: ${ props => props.color };
	padding: 3px;
	border-radius: 4px;
	cursor: pointer;
	height: 30px;
	line-height: 30px;
	flex-grow: 1;
	transition: background-color 0.15s;
	position: relative;

	:hover {
		background-color: ${ props => props.hoverColor };
		font-weight: bold;
	}
`

const CompContainerDiv = styled.div`
	color: ${ props => props.color };

	:hover {
		background-color: ${ props => props.hoverColor };
	}
`

const DragHandle = styled.div`
	width: 26px;
	padding: 0.25rem 0rem;
	display: flex;
	justify-content: center;
	align-items: center;
	color: ${ props => props.color };
	border-radius: 4px;
	transition: color 0.15s, background-color 0.15s;

	:hover,
	&.isDragging {
		background-color: ${ props => props.color };
		color: white;
	}
`

const CompContainer = props => {
	const {
		color = "#666666",
		dragHandleProps,
		isDragging,
		onClick = null,
		children
	} = props;

	const hoverColor = React.useMemo(() => {
		return hexColorToRgb(color, 0.5)
	}, [color]);

	return (
		<CompContainerDiv
			className="flex cursor-pointer items-center"
			color={ color }
			hoverColor={ hoverColor }
			onClick={ onClick }
		>
			<DragHandle { ...dragHandleProps }
				className={ isDragging ? "isDragging" : "" }
				color={ color }
			>
				<span className="fa fa-ellipsis-vertical"/>
			</DragHandle>
			<div className="flex-1 ml-1 overflow-hidden">
				{ children }
			</div>
		</CompContainerDiv>
	)
}

const RouteGroup = props => {

	const {
		group,
		dragHandleProps,
		isDragging,
		extendSidebar,
		add,
		remove,
		removeComp,
		reorderRouteComps,
		updateName
	} = props;

	const [open, setOpen] = React.useState(false);
	const openGroup = React.useCallback(e => {
		setOpen(true);
	}, []);
	const closeGroup = React.useCallback(e => {
		setOpen(false);
	}, []);
	const toggleOpen = React.useCallback(e => {
		setOpen(open => !open);
	}, []);

	const onDragEnd = React.useCallback(({ source, destination }) => {
		if (destination === null) return;
		if (source.index === destination.index) return;
		reorderRouteComps(source.index, destination.index, group.compId);
	}, [reorderRouteComps, group.compId]);

	const doAdd = React.useCallback((e, route) => {
		add(e, route, group.compId);
	}, [add, group.compId]);

	const doRemove = React.useCallback(e => {
		remove(e, group.compId);
	}, [group.compId, remove]);

	const doRemoveComp = React.useCallback((e, compId) => {
		e.stopPropagation();
		removeComp(group.compId, compId);
	}, [removeComp, group.compId]);

	const [name, _setName] = React.useState(group.name);
	const setName = React.useCallback(e => {
		_setName(e.target.value);
	}, [])

	const [editing, setEditing] = React.useState(false);
	const prev = React.useRef(false);
	const startEditing = React.useCallback(e => {
		e.stopPropagation();
		setEditing(true);
	}, []);
	const stopEditing = React.useCallback(e => {
		e.stopPropagation();
		setEditing(false);
		if (group.name !== name) {
			updateName(group.compId, name);
		}
	}, [group.compId, group.name, name, updateName]);

	const [ref, _setRef] = React.useState(null);
	const setRef = React.useCallback(ref => {
		_setRef(ref);
		ref && ref.focus();
	}, []);

	const onFocus = React.useCallback(e => {
		e.target.select();
	}, []);
	const onKeyUp = React.useCallback(e => {
		if ((e.key === "Enter") || (e.keyCode === 13)) {
			stopEditing(e);
		}
	}, [stopEditing]);

	const stopPropagation = React.useCallback(e => {
		e.stopPropagation();
	}, []);

	return (
		<div>
			<CompContainer color={ group.color }
				dragHandleProps={ dragHandleProps }
				isDragging={ isDragging }
				onClick={ toggleOpen }
			>
				<div className="relative flex">
					{ editing ?
						<input ref={ setRef }
							className="flex-1 overflow-hidden"
							value={ name } onChange={ setName }
							onClick={ stopPropagation }
							onFocus={ onFocus }
							onKeyUp={ onKeyUp }
						/> :
						<div className="overflow-hidden flex-1 text-ellipsis">
							{ group.name }
						</div>
					}
					<div className="grid grid-cols-2 gap-1 flex-0">
						{ editing ?
							<div style={ { width: "26px" } }
								className={ `
									fa fa-floppy-disk hover:bg-gray-500 hover:text-white
									rounded flex justify-center items-center cursor-pointer
								` }
								onClick={ stopEditing }/> :
							<div style={ { width: "26px" } }
								className={ `
									fa fa-edit hover:bg-gray-500 hover:text-white
									rounded flex justify-center items-center cursor-pointer
								` }
								onClick={ startEditing }/>
						}
						<div style={ { width: "26px" } }
							className={ `
								fa fa-minus hover:bg-gray-500 hover:text-white
								rounded flex justify-center items-center cursor-pointer
							` }
							onClick={ doRemove }/>
					</div>
				</div>
			</CompContainer>
			<div className="ml-2">
				{ !open ? null :

					<DragDropContext onDragEnd={ onDragEnd }>

						<Droppable droppableId={ group.compId }>
							{ (provided, snapshot) => (
									<div ref={ provided.innerRef }
										{ ...provided.droppableProps }
										style={ {
											background: snapshot.isDraggingOver ? "#555" : "none"
										} }
									>
										{ group.route_comps.map((comp, i) =>
												<Draggable key={ comp.compId } index={ i }
													draggableId={ comp.compId }
												>
													{ (provided, snapshot) => (
															<div ref={ provided.innerRef }
																{ ...provided.draggableProps }
															>
																<RouteComp route={ comp }
																	extendSidebar={ extendSidebar }
																	dragHandleProps={ provided.dragHandleProps }
																	isDragging={ snapshot.isDragging }
																	add={ doAdd }
																 	remove={ doRemoveComp }
																	inGroup/>
															</div>
														)
													}
												</Draggable>
											)
										}

										{ provided.placeholder }
									</div>
								)
							}
						</Droppable>

					</DragDropContext>
				}
			</div>
		</div>
	)
}

const RouteComp = props => {

	const {
		route,
		extendSidebar,
		dragHandleProps,
		isDragging,
		add,
	 	remove,
		inGroup = false
	} = props;

	const extend = React.useCallback(e => {
		extendSidebar(route.compId);
	}, [extendSidebar, route.compId]);

	const doAdd = React.useCallback(e => {
		if (route.isValid) {
			add(e, route);
		}
	}, [route, add]);
	const doRemove = React.useCallback(e => {
		remove(e, route.compId);
	}, [route.compId, remove]);

	return (
		<CompContainer color={ route.color }
			dragHandleProps={ dragHandleProps }
			isDragging={ isDragging }
			onClick={ extend }
		>
			<div className="relative flex">
				<div className="overflow-hidden text-ellipsis flex-1">
					{ route.name }
				</div>
				<div className="grid grid-cols-2 gap-1 flex-0">
					<div style={ { width: "26px" } }
						className={ `
							fa fa-plus hover:bg-gray-500 hover:text-white
							rounded flex justify-center items-center cursor-pointer
						` }
						onClick={ doAdd }/>
					<div style={ { width: "26px" } }
						className={ `
							${ inGroup ? "fa-regular fa-delete-right" : "fa fa-minus" }
							hover:bg-gray-500 hover:text-white
							rounded flex justify-center items-center cursor-pointer
						` }
						onClick={ doRemove }/>
				</div>
			</div>
		</CompContainer>
	)
}

const mapStateToProps = state => ({
	routesGraph: get(state, ["graph", "routes"], {})
})
const mapDispatchToProps = {}
export default connect(mapStateToProps, mapDispatchToProps)(ActiveRouteComponents)
