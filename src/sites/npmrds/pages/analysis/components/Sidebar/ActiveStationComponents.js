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

import { Header } from "./ActiveRouteComponents"

import {
	FuseWrapper,
	MultiLevelDropdown
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
	state = {
		openCompId: null,
		open: true
	}
	headerRef = React.createRef();

	extendSidebar(openCompId) {
		this.props.extendSidebar(openCompId)
		this.setState({ openCompId })
	}
	add(e, stationId) {
		e.stopPropagation();
		this.props.add(stationId);
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
								<MultiLevelDropdown
									xDirection={ 0 }
			  					searchable={ true }
			  					labelAccessor={ d =>
	                  `${ d.stationId } (${ d.muni }) (${ d.data_type.split(",").map(s => s[0]).join(", ")})`
	                }
			  					valueAccessor={ d => d.stationId }
									onClick={ id => this.props.addStationComp(id) }
									items={ this.props.availableStations.sort((a, b) => a.muni.localeCompare(b.muni)) }
								>
									<div className="px-1">
										<span className="fa fa-space-station-moon"/>
										<span className="px-1">Stations</span>
									</div>
								</MultiLevelDropdown>
							</Control>
						</ControlBox>
					</div>

				</div>

				<div id="station-comps-container"
					style={ {
						height: this.state.open ? height : "0px",
						maxHeight: height,
						overflow: this.state.open ? "auto" : "hidden"
					} }
				>

          <div style={ { position: "relative", display: "block" } }>
						<DragDropContext onDragEnd={ this.onDragEnd.bind(this) }>
							<Droppable droppableId="drop-area">
								{ (provided, snapshot) => (

									<div ref={ provided.innerRef }
										{ ...provided.droppableProps }
										style={ { background: snapshot.isDraggingOver ? "#555" : "none" } }>

			    					{
											this.props.station_comps.map((station, i) =>
												<Draggable key={ station.compId } index={ i } draggableId={ station.compId }>
													{ (provided, snapshot) => (
														<div ref={ provided.innerRef }
															{ ...provided.draggableProps }>

								                <div key={ station.compId }
								                  style={ { height: "27px", position: "relative" } }>
								                  <ActiveStationItem
								                    color={ station.color }
								                    hoverColor={ hexColorToRgb(station.color, 0.5) }
								                    onClick={ e => this.extendSidebar(station.compId) }>
								                    { station.name }
								                  </ActiveStationItem>
																	<DragHandle { ...provided.dragHandleProps }
																		className={ snapshot.isDragging ? "isDragging" : "" }
																		color={ station.color }>
																		<span className="fa fa-ellipsis-vertical"/>
																	</DragHandle>
								                  <div style={ { position: "absolute", top: "2px", right: "10px" } }>
								                    <Icon className="fa fa-plus"
								                      onClick={ e => this.props.addStationComp(station.stationId) }/>
								                    <Icon className="fa fa-minus"
								                      onClick={ e => this.props.removeStationComp(station.compId) }/>
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
export default ActiveStationComponents

const DragHandle = styled.div`
	position: absolute;
	top: 0px;
	left: 0px;
	color: ${ props => props.color };
	height: 24px;
	border-radius: 4px;
	transition: color 0.15s, background-color 0.15s;

	:hover,
	&.isDragging {
		background-color: ${ props => props.color };
		color: ${ props => props.theme.sidePanelBg };
	}
`
