import React from 'react';
import SidebarContainer from './SidebarContainer'

import ActiveGraphComponents from "./ActiveGraphComponents"
import GraphSelector from "./GraphSelector"
import ColorRangeSelector from "./ColorRangeSelector"

import ActiveRouteComponents from "./ActiveRouteComponents"
import RouteComponent from "./RouteComponent"
import RouteGroupComponent from "./RouteGroupComponent"

import ActiveStationComponents from "./ActiveStationComponents"
import StationComponent from "./StationComponent"

import {
	ControlBox,
	Control,
} from "./components/parts"

import { Header } from "./ActiveRouteComponents"

import {
	FuseWrapper,
	MultiLevelSelect
} from "~/sites/npmrds/components"

import {
	DropdownItem,
	InputContainer
} from "./ActiveRouteComponents"

import get from "lodash/get"
import { select as d3select } from "d3-selection"

const getSectionHeight = type => {
	const header = d3select(`div#${ type }-comps div#${ type }-comps-header`).node();
	const container = d3select(`div#${ type }-comps div#${ type }-comps-container`).node();

	return get(header, "clientHeight", 0) + get(container, "scrollHeight", 0);
}

const getSectionHeaderHeight = type => {
	const header = d3select(`div#${ type }-comps div#${ type }-comps-header`).node();
	return get(header, "clientHeight", 0);
}

class Sidebar extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
	    extendedComponent: null,
	    extendedComponentMeta: { comp: "none" }
		}
		this.sidebarRef = React.createRef();
		this.headerRef = React.createRef();
		this.routeRef = React.createRef();
		this.stationRef = React.createRef();
		this.graphRef = React.createRef();
	}

  componentDidUpdate(oldProps, oldState) {
    if (!this.renderExtendedComponent() && (this.props.isOpen === 2)) {
      this.props.onOpenOrClose(-1);
    }
  }
  extendSidebar(extendedComponent, extendedComponentMeta = {}) {
    this.setState({ extendedComponent, extendedComponentMeta })
    if (this.props.isOpen === 1) {
      this.props.onOpenOrClose(1);
    }
  }
  removeSidebarComponent() {
    this.setState({ ...Sidebar.defaultState });
    if (this.props.isOpen === 2) {
      this.props.onOpenOrClose(-1);
    }
  }
  getExtendedComponentProps() {
    switch (this.state.extendedComponentMeta.comp) {
      case "RouteComponent": {
        const { compId } = this.state.extendedComponentMeta;
        const [route_comp, route_group] = this.props.route_comps
						.reduce((a, c) => {
							if (c.type === "group") {
								return c.route_comps.reduce((aa, cc) => {
									if (cc.compId === compId) {
										return [cc, c]
									}
									return aa;
								}, a);
							}
							return c.compId === compId ? [c, null] : a;
						}, [{ compId: "invalid" }, null]);

				let usingRelativeDates = this.props.usingRelativeDates;
				let relativeDateBase = this.props.relativeDateBase;

				if (route_group && route_group.usingRelativeDates) {
					usingRelativeDates = true;
					relativeDateBase = route_group.relativeDateBase;
				}

        return {
          ...route_comp,
          updateRouteCompSettings: this.props.updateRouteCompSettings,
          updateRouteComp: this.props.updateRouteComp,
          updateRouteCompColor: this.props.updateRouteCompColor,
          // reorderRouteComps: this.props.reorderRouteComps,
          dateExtent: this.props.dateExtent,
          yearsWithData: this.props.yearsWithData,
          SETTINGS: this.props.routeComponentSettings,
          route: this.props.routes.reduce((a, c) => c.compId == compId ? c : a, null),

					route_group,

					usingRelativeDates,
					relativeDateBase
        }
      };
      case "StationComponent": {
        const { compId } = this.state.extendedComponentMeta,
          station_comp = this.props.station_comps.reduce((a, c) => {
            return c.compId === compId ? c : a
          }, null);
        return {
          station_comp,
          updateSettings: this.props.updateStationSettings,
          updateStation: this.props.updateStation,
          addStationComp: this.props.addStationComp,
          removeStationComp: this.props.removeStationComp
        }
      }
      case "GraphSelector": {
        return {
          addGraph: this.props.addGraphComp
        }
      }
      case "ColorRangeSelector": {
        return {
          colorRange: this.props.colorRange,
          selectColorRange: this.props.selectColorRange
        }
      }
			case "RouteGroupComponent": {
        const { compId } = this.state.extendedComponentMeta;
        const route_group = this.props.route_comps
						.reduce((a, c) => {
							return c.compId === compId ? c : a;
						}, { compId: "invalid" });
				return {
					updateRouteGroupWorkingSettings: this.props.updateRouteGroupWorkingSettings,
					updateRouteGroup: this.props.updateRouteGroup,
					...route_group
				}
			}
    }
    return {};
  }
  renderExtendedComponent() {
    const { compId, comp } = this.state.extendedComponentMeta;
    switch (comp) {
      case "RouteComponent":
			case "RouteGroupComponent":
        return this.props.route_comps
          .reduce((a, c) => {
						if (c.type === "group") {
							if (c.compId === compId) {
								return true;
							}
							return c.route_comps.reduce((aa, cc) => {
								return aa || cc.compId === compId;
							}, a)
						}
						return a || (c.compId === compId);
					}, false);
      case "StationComponent":
        return this.props.station_comps
          .reduce((a, c) => c.compId === compId ? true : a, false);
      case "none":
        return false;
    }
    return true;
  }
  getExtendedComp() {
    if (!this.renderExtendedComponent()) return null;

    const { compId } = this.state.extendedComponentMeta;

    return (
      <this.state.extendedComponent key={ compId }
        { ...this.getExtendedComponentProps() }/>
    )
  }
	calcSectionHeights(max) {
		if (max === 0) {
			return [
				{ height: null,
					maxHeight: null
				},
				{ height: null,
					maxHeight: null
				},
				{ height: null,
					maxHeight: null
				}
			]
		}

		const routeHeaderHeight = getSectionHeaderHeight("route");
		const stationHeaderHeight = getSectionHeaderHeight("station");
		const graphHeaderHeight = getSectionHeaderHeight("graph");

		const numRouteComps = this.props.route_comps.length;
		const numStationComps = this.props.station_comps.length;
		const numGraphComps = this.props.graphs.length;

		const routeHeight = routeHeaderHeight + numRouteComps * 24;
		const stationHeight = stationHeaderHeight + numStationComps * 24;
		const graphHeight = graphHeaderHeight + numGraphComps * 24;

		const total = routeHeight + stationHeight + graphHeight;

		if (total < max) {
			return [
				{ height: null,
					maxHeight: null
				},
				{ height: null,
					maxHeight: null
				},
				{ height: null,
					maxHeight: null
				}
			]
		}
		let available = max;

		const minRouteHeight = routeHeaderHeight + 312;
		const minStationHeight = stationHeaderHeight + 96;

		let routeStyle = Math.min(minRouteHeight, routeHeight);
		available -= routeStyle;

		let stationStyle = Math.min(minStationHeight, stationHeight);
		available -= stationStyle;

		let graphStyle = Math.min(available, graphHeight);
		available -= graphStyle;

		if (available > 0) {
			routeStyle += available;
		}

		return [
			{ height: routeStyle,
				maxHeight: routeStyle
			},
			{ height: stationStyle,
				maxHeight: stationStyle
			},
			{ height: graphStyle,
				maxHeight: graphStyle
			}
		]
	}
  render() {
    const {
      addRouteComp,
      removeRouteComp,
			createNewRouteGroup,
			removeRouteFromGroup,
      updateAllRouteComps,
      ...rest
    } = this.props;

		const sidebarHeight = get(this.sidebarRef, ["current", "clientHeight"], 0);
		const headerHeight = get(this.headerRef, ["current", "clientHeight"], 0);

		const [routeStyle, stationStyle, graphStyle] = this.calcSectionHeights(sidebarHeight - headerHeight);
// console.log("????????????", routeStyle, stationStyle, graphStyle)

    return (
      <SidebarContainer
        onOpenOrClose={ this.props.onOpenOrClose }
        isOpen={ this.props.isOpen }
        extendedComp={ this.getExtendedComp() }
			>

				<div ref={ this.sidebarRef } className="h-full">

{ /*HEADER START*/ }
					<div ref={ this.headerRef }
						style={ {
							padding: "10px",
							whiteSpace: "nowrap"
						} }
					>

						<Header>
							<h4>Controls</h4>
						</Header>

						<div style={ { borderBottom: `2px solid currentColor` } }>
							<ControlBox>
								<Control>
									<MultiLevelSelect isDropdown
										DisplayItem={ DropdownItem }
										InputContainer={ InputContainer }
										displayAccessor={ d => d.name }
										valueAccessor={ d => d.id }
										onChange={ id => this.props.loadTemplate(id) }
										options={ this.props.templates }
									>
										<div className="px-1">
											<span className="fa fa-cog"/>
											<span className="px-1">Templates</span>
										</div>
									</MultiLevelSelect>
								</Control>
								<Control disabled={ !this.props.needsUpdate }
									onClick={ this.props.updateAllComponents }
								>
									<div className="px-1">
										<span className="px-1">Update All</span>
										<span className="fa fa-sync-alt"/>
									</div>
								</Control>
							</ControlBox>
						</div>

					</div>
{ /*HEADER END*/ }

					<div className="relative"
						style={ {
							height: `calc(100% - ${ headerHeight }px)`,
							maxHeight: `calc(100% - ${ headerHeight }px)`
						} }
					>

						<div id="route-comps"
							className="relative"
							style={ routeStyle }
						>
							<ActiveRouteComponents { ...rest }
								add={ addRouteComp }
								remove={ removeRouteComp }
								createNewRouteGroup={ createNewRouteGroup }
								removeFromGroup={ removeRouteFromGroup }
								extendRouteComp={ compId =>
									this.extendSidebar(RouteComponent, { comp: "RouteComponent", compId })
								}
								extendRouteGroup={ compId =>
									this.extendSidebar(RouteGroupComponent, { comp: "RouteGroupComponent", compId })
								}/>
						</div>

						<div id="station-comps"
							className="relative"
							style={ stationStyle }
						>
							<ActiveStationComponents { ...rest }
								extendSidebar={ compId =>
									this.extendSidebar(StationComponent, { comp: "StationComponent", compId })
								}/>
						</div>

						<div id="graph-comps"
							className="relative"
							style={ graphStyle }
						>
							<ActiveGraphComponents { ...rest }
								extendGraphSelector={ () =>
									this.extendSidebar(GraphSelector, { comp: "GraphSelector" })
								}
								extendColorSelector={ () =>
									this.extendSidebar(ColorRangeSelector, { comp: "ColorRangeSelector" })
								}/>
						</div>

					</div>

				</div>

      </SidebarContainer>
    );
  }
}

export default Sidebar
