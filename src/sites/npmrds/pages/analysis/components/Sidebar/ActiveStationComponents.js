import React from "react"
import { connect } from "react-redux"

import get from "lodash.get"

import styled from "styled-components"

import {
	DragDropContext,
	Droppable,
	Draggable
} from 'react-beautiful-dnd';

import { hexColorToRgb } from "../tmc_graphs/utils"

import {
	ControlBox,
	Control
} from "./components/parts"

import {
	DropdownItem,
	InputContainer
} from "./ActiveRouteComponents"

import { Header } from "./ActiveRouteComponents"

import {
	FuseWrapper,
	MultiLevelSelect
} from "sites/npmrds/components"

const ActiveStationItem = styled.div`
	color: ${ props => props.color || props.theme.textColor };
	padding: 3px 10px 3px 26px;
	border-radius: 4px;
	cursor: pointer;
	float: left;
	width: 100%;
	transition: background-color 0.15s;
	position: relative;
	color: ${ props => props.color };

	:hover {
		background-color: ${ props => props.hoverColor };
		font-weight: bold;
	}
`

// const Header = styled.div`
//   flex-grow: 1;
// 	display: flex;
// 	border-bottom: 2px solid ${ props => props.theme.textColorHl };
// 	h4 {
// 		margin-bottom: 0px;
// 		color: ${ props => props.theme.textColorHl };
// 		font-size: 1.5rem;
// 		font-weight: bold;
// 	}
// 	span.fa {
// 		color: ${ props => props.theme.textColorHl };
// 		font-size: 18px;
// 		border-radius: 4px;
// 		padding: 5px 4px 3px 5px;
// 		transition: background-color 0.15s;
// 	}
// `
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

const Icon = styled.span`
	color: ${ props => props.theme.textColor };
	border-radius: 4px;
	padding: 5px;
	cursor: pointer;
	transition: color 0.15s,
		background-color 0.15s;

	:hover {
		color: ${ props => props.theme.sidePanelBg };
		background-color: ${ props => props.theme.textColor };
	}
`

class ActiveStationComponents extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			openCompId: null,
			open: true
		}
		this.headerRef = React.createRef();

		this.extendSidebar = this.extendSidebar.bind(this);
	}

	extendSidebar(openCompId) {
		this.props.extendSidebar(openCompId)
		this.setState({ openCompId })
	}
	onDragEnd({ source, destination }) {
		if (destination === null) return;
		if (source.index === destination.index) return;

		this.props.reorderStationComps(source.index, destination.index);
	}
  render() {

		const headerHeight = get(this.headerRef, ["current", "clientHeight"], 0);
		const height = `calc(100% - ${ headerHeight }px)`;

    return (
			<div style={ {
        padding: "0px 10px",
        whiteSpace: "nowrap",
				position: "relative",
				height: "100%",
				maxHeight: "100%"
      } }>

				<div id="station-comps-header"
					ref={ this.headerRef }
				>

					<Header>
						<OpenCloseButton>
							<span onClick={ e => {
								e.stopPropagation();
								this.setState(state => ({ open: !state.open }));
							} } className={ `fa fa-${ this.state.open ? "minus" : "plus" }` }/>
						</OpenCloseButton>
						<h4>Stations</h4>
					</Header>

					<div style={ { borderBottom: `2px solid currentColor` } }>
						<ControlBox>
							<Control>
								<MultiLevelSelect isDropdown
									DisplayItem={ DropdownItem }
									InputContainer={ InputContainer }
			  					searchable={ true }
			  					displayAccessor={ d =>
	                  `${ d.muni } (${ d.stationId }) (${ d.data_type.split(",").map(s => s[0]).join(", ")})`
	                }
			  					valueAccessor={ d => d.stationId }
									onChange={ id => this.props.addStationComp(id) }
									options={ this.props.availableStations.sort((a, b) => a.muni.localeCompare(b.muni)) }
								>
									<div className="px-1">
										<span className="fa fa-space-station-moon"/>
										<span className="px-1">Stations</span>
									</div>
								</MultiLevelSelect>
							</Control>
						</ControlBox>
					</div>

				</div>

				<div
					style={ {
						height: this.state.open ? height : "0px",
						maxHeight: height,
						overflow: this.state.open ? "auto" : "hidden"
					} }
				>

          <div id="station-comps-container">
						<DragDropContext onDragEnd={ this.onDragEnd.bind(this) }>
							<Droppable droppableId="drop-area">
								{ (provided, snapshot) => (

									<div ref={ provided.innerRef }
										{ ...provided.droppableProps }
										style={ { background: snapshot.isDraggingOver ? "#555" : "none" } }>

			    					{
											this.props.station_comps.map((station, i) =>
												<Draggable key={ station.compId }
													index={ i } draggableId={ station.compId }
												>
													{ (provided, snapshot) => (
														<div ref={ provided.innerRef }
															{ ...provided.draggableProps }>

																<StationComp station={ station }
																	extendSidebar={ this.extendSidebar }
																	dragHandleProps={ provided.dragHandleProps }
																	isDragging={ snapshot.isDragging }
																	add={ this.props.addStationComp }
																 	remove={ this.props.removeStationComp }/>

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
export default ActiveStationComponents

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

const StationComp = props => {

	const {
		station,
		extendSidebar,
		dragHandleProps,
		isDragging,
		add,
	 	remove
	} = props;

	const extend = React.useCallback(e => {
		extendSidebar(station.compId);
	}, [extendSidebar, station.compId]);

	const doAdd = React.useCallback(e => {
		e.stopPropagation();
		add(station.stationId);
	}, [station.stationId, add]);
	const doRemove = React.useCallback(e => {
		e.stopPropagation();
		remove(station.compId);
	}, [station.compId, remove]);

	return (
		<CompContainer color={ station.color }
			dragHandleProps={ dragHandleProps }
			isDragging={ isDragging }
			onClick={ extend }
		>
			<div className="relative flex">
				<div className="overflow-hidden text-ellipsis flex-1">
					{ station.name }
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
							fa fa-minus hover:bg-gray-500 hover:text-white
							rounded flex justify-center items-center cursor-pointer
						` }
						onClick={ doRemove }/>
				</div>
			</div>
		</CompContainer>
	)
}
