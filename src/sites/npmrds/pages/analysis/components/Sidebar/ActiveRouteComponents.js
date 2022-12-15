import React from "react"
import { connect } from "react-redux"

import get from "lodash.get"

import styled from "styled-components"

import { hexColorToRgb } from "../tmc_graphs/utils"

import {
	ControlBox,
	Control
} from "./components/parts"

import {
	DragDropContext,
	Droppable,
	Draggable
} from 'react-beautiful-dnd';

import {
	FuseWrapper,
	MultiLevelDropdown
} from "sites/npmrds/components"

import { useFalcor } from "modules/avl-components/src"

export const Header = styled.div`
	flex-grow: 1;
	display: flex;
	border-bottom: 2px solid ${ props => props.theme.textColorHl };
	h4 {
		margin-bottom: 0px;
		color: ${ props => props.theme.textColorHl };
		font-size: 1.5rem;
		font-weight: bold;
	}
	span.fa {
		color: ${ props => props.theme.textColorHl };
		font-size: 18px;
		border-radius: 4px;
		padding: 5px 4px 3px 5px;
		transition: background-color 0.15s;
	}
`
const OpenCloseButton = styled.div`
	width: 30px;
	span.fa {
		padding: 5px;
	}
	:hover span.fa {
		color: ${ props => props.theme.sidePanelBg };
		background-color: ${ props => props.theme.textColorHl };
	}
`

const ActiveRouteItem = styled.div`
	color: ${ props => props.color };
	padding: 3px 0px 3px 30px;
	border-radius: 4px;
	cursor: pointer;
	height: 30px;
	line-height: 30px;
	width: 100%;
	transition: background-color 0.15s;
	position: relative;

	:hover {
		background-color: ${ props => props.hoverColor };
		font-weight: bold;
	}
`

const DragHandle = styled.div`
	position: absolute;
	top: 2px;
	bottom: 2px;
	left: 2px;
	width: 26px;
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

// const RouteSelectorContainer = styled.div`
// 	border-bottom: 2px solid ${ props => props.theme.textColorHl };
//
// 	.item-selector__dropdown .list__item__anchor {
// 		color: ${ props => props.theme.textColorHl };
// 		font-size: 1rem;
// 	}
// `
const DropdownItem = ({ onClick = null, children }) => {
  return (
    <div className="px-2 hover:bg-gray-300 text-left"
			style={ { minWidth: "15rem" } }
      onClick={ onClick }
    >
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

	const add = React.useCallback((e, routeId) => {
		e.stopPropagation();
		props.add(routeId);
	}, [props.add]);
	const remove = React.useCallback((e, compId) => {
		e.stopPropagation();
		if (compId === state.openCompId) {
			setState({ openCompId: null });
		}
		props.remove(compId);
	}, [props.remove, setState]);

	const onDragEnd = React.useCallback(({ source, destination }) => {
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
			value: routes.map(r => r.stuff_id),
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

	return (
		<div style={ {
			padding: "10px",
			whiteSpace: "nowrap",
			display: "flex",
			flexDirection: "column"
		} }>

			<Header>
				<OpenCloseButton>
					<span onClick={ toggle }
						className={ `fa fa-${ state.open ? "minus" : "plus" }` }/>
				</OpenCloseButton>
				<h4>Routes</h4>
			</Header>

			<div style={ {
				height: state.open ? "auto" : "0px",
				overflow: state.open ? "visible" : "hidden",
				flexGrow: 1
			} }>

				<div style={ {
					borderBottom: `2px solid currentColor`
				} }>
					<ControlBox>
						<Control>
							<MultiLevelDropdown
								searchable={ true }
								labelAccessor={ d => d.name }
								valueAccessor={ d => d.id }
								onClick={ id => props.add(id) }
								items={ availableRoutes }
								DropdownItem={ DropdownItem }
							>
								<div className="px-1">
									<span className="fa fa-road"/>
									<span className="px-1">Routes</span>
								</div>
							</MultiLevelDropdown>
						</Control>
						<Control>
							<MultiLevelDropdown
								searchable={ true }
								items={ folderData }
								onClick={ ids => props.add(ids) }
								DropdownItem={ DropdownItem }
							>
								<div className="px-1">
									<span className="px-1">Folders</span>
									<span className="fa fa-folder"/>
								</div>
							</MultiLevelDropdown>
						</Control>
					</ControlBox>
				</div>

				<div style={ { position: "relative" } }>
					<DragDropContext onDragEnd={ onDragEnd }>
						<Droppable droppableId="drop-area">
							{ (provided, snapshot) => (

								<div ref={ provided.innerRef }
									{ ...provided.droppableProps }
									style={ {
										background: snapshot.isDraggingOver ? "#555" : "none"
									} }
								>

									{ props.route_comps.map((route, i) =>
											<Draggable key={ route.compId } index={ i } draggableId={ route.compId }>
												{ (provided, snapshot) => (
													<div ref={ provided.innerRef }
														{ ...provided.draggableProps }
													>
														<div className="flex relative">
															<ActiveRouteItem
																color={ route.color }
																hoverColor={ hexColorToRgb(route.color, 0.5) }
																onClick={ e => route.isValid && extendSidebar(route.compId) }>
																<div style={ { width: "200px", overflow: "hidden" } }>
																	{ route.name }
																</div>
															</ActiveRouteItem>
															<DragHandle { ...provided.dragHandleProps }
																className={ snapshot.isDragging ? "isDragging" : "" }
																color={ route.color }
															>
																<span className="fa fa-ellipsis-vertical"/>
															</DragHandle>
															<div className="grid grid-cols-2 gap-1"
																style={ { position: "absolute", top: "2px", right: "2px", bottom: "2px" } }
															>
																<div style={ { width: "26px" } }
																	className={ `
																		fa fa-plus hover:bg-gray-500 hover:text-white
																		rounded flex justify-center items-center cursor-pointer
																	` }
																	onClick={ e => route.isValid && add(e, route.routeId) }/>
																<div style={ { width: "26px" } }
																	className={ `
																		fa fa-minus hover:bg-gray-500 hover:text-white
																		rounded flex justify-center items-center cursor-pointer
																	` }
																	onClick={ e => remove(e, route.compId) }/>
															</div>
														</div>

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

/*
class ActiveRouteComponentsOld extends React.Component {
	state = {
		openCompId: null,
		open: true
	}
	extendSidebar(openCompId) {
		this.props.extendSidebar(openCompId)
		this.setState({ openCompId })
	}
	add(e, routeId) {
		e.stopPropagation();
		this.props.add(routeId);
	}
	remove(e, compId) {
		e.stopPropagation();
		if (compId === this.state.openCompId) {
			this.setState({ openCompId: null });
		}
		this.props.remove(compId);
	}
	onDragEnd({ source, destination }) {
		if (destination === null) return;
		if (source.index === destination.index) return;

		this.props.reorderRouteComps(source.index, destination.index);
	}
	render() {
		const foldersWithRoutes = this.props.folders.filter(f =>
			f.stuff.reduce((a, c) => a || c.stuff_type === "collection", false)
		)
		const folderData = foldersWithRoutes.map(f =>
			[f.name,
				f.stuff.filter(s => s.stuff_type === "collection")
					.map(s => ({ id: s.stuff_id, name: get(this.props.routesGraph, ["byId", s.stuff_id, "name"], s.stuff_id) }))
			]
		)

// console.log("availableRoutes", this.props.availableRoutes)
		return (
			<div style={ {
				padding: "10px",
				whiteSpace: "nowrap",
				display: "flex",
				flexDirection: "column"
			} }>

				<Header>
					<OpenCloseButton>
						<span onClick={ e => {
							e.stopPropagation();
							this.setState(state => ({ open: !state.open }));
						} } className={ `fa fa-${ this.state.open ? "minus" : "plus" }` }/>
					</OpenCloseButton>
					<h4>Routes</h4>
				</Header>

				<div style={ {
					height: this.state.open ? "auto" : "0px",
					overflow: this.state.open ? "visible" : "hidden",
					flexGrow: 1
				} }>

					<div style={ {
						borderBottom: `2px solid currentColor`
					} }>
						<ControlBox>
							<DropDown className="control"
		  					searchable={ true }
		  					displayOption={ d => d.name }
		  					getOptionValue={ d => d.id }
								onChange={ id => this.props.add(id) }
								options={ this.props.availableRoutes.sort((a, b) => a.name < b.name ? -1 : 1) }>
								<span className="fa fa-road"/>
								<span>Routes</span>
							</DropDown>
							<DoubleDropdown className="control"
								data={ folderData }
								disabled={ !folderData.length }
								onSelect={ ids => this.props.add(ids) }>
								<span className="fa fa-folder"/>
								<span>Folders</span>
							</DoubleDropdown>
						</ControlBox>
					</div>

					<div style={ { position: "relative" } }>
						<DragDropContext onDragEnd={ this.onDragEnd.bind(this) }>
							<Droppable droppableId="drop-area">
								{ (provided, snapshot) => (

									<div ref={ provided.innerRef }
										{ ...provided.droppableProps }
										style={ { background: snapshot.isDraggingOver ? "#555" : "none" } }>

			    					{
											this.props.route_comps.map((route, i) =>
												<Draggable key={ route.compId } index={ i } draggableId={ route.compId }>
													{ (provided, snapshot) => (
														<div ref={ provided.innerRef }
															{ ...provided.draggableProps }>
															<div style={ { height: "27px", position: "relative" } }>
																<ActiveRouteItem
																	color={ route.color }
																	hoverColor={ hexColorToRgb(route.color, 0.5) }
																	onClick={ e => route.isValid && this.extendSidebar(route.compId) }>
																	<div style={ { width: "200px", overflow: "hidden" } }>
																		{ route.name }
																	</div>
																</ActiveRouteItem>
																<DragHandle { ...provided.dragHandleProps }
																	className={ snapshot.isDragging ? "isDragging" : "" }
																	color={ route.color }
																>
																	<span className="fa fa-ellipsis-vertical"/>
																</DragHandle>
																<div style={ { position: "absolute", top: "2px", right: "10px" } }>
																	<Icon className="fa fa-plus"
																		onClick={ e => route.isValid && this.add(e, route.routeId) }/>
																	<Icon className="fa fa-minus"
																		onClick={ e => this.remove(e, route.compId) }/>
																</div>
															</div>

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
}
*/
const mapStateToProps = state => ({
	routesGraph: get(state, ["graph", "routes"], {})
})
const mapDispatchToProps = {}
export default connect(mapStateToProps, mapDispatchToProps)(ActiveRouteComponents)
