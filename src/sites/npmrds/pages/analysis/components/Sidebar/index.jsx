import React from 'react';
import SidebarContainer from './SidebarContainer'

import ActiveGraphComponents from "./ActiveGraphComponents"
import GraphSelector from "./GraphSelector"
import ColorRangeSelector from "./ColorRangeSelector"

import ActiveRouteComponents from "./ActiveRouteComponents"
import RouteComponent from "./RouteComponent"

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
	const header = d3select(`div#${ type }-comps div#${ type }-comps-header`).node()
	const container = d3select(`div#${ type }-comps div#${ type }-comps-container`).node();

	return get(header, "clientHeight", 0) + get(container, "scrollHeight", 0);
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
        const { compId } = this.state.extendedComponentMeta,
          route_comp = this.props.route_comps
						.reduce((a, c) => {
							if (c.type === "group") {
								return c.route_comps.reduce((aa, cc) => {
									return cc.compId === compId ? cc : aa;
								}, a);
							}
							return c.compId === compId ? c : a;
						}, { compId: "invalid" });
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
					usingRelativeDates: this.props.usingRelativeDates,
					relativeDateBase: this.props.relativeDateBase
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
    }
    return {};
  }
  renderExtendedComponent() {
    const { compId, comp } = this.state.extendedComponentMeta;
    switch (comp) {
      case "RouteComponent":
        return this.props.route_comps
          .reduce((a, c) => {
						if (c.type === "group") {
							return c.route_comps.reduce((aa, cc) => {
								return aa || cc.compId === compId;
							}, a)
						}
						return a || c.compId === compId;
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
		const oneThird = max * 0.33333;

		const routeHeight = getSectionHeight("route");
		const stationHeight = getSectionHeight("station");
		const graphHeight = getSectionHeight("graph");

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
		let aboveOneThird = 0;

		let routeStyle = null;
		let stationStyle = null;
		let graphStyle = null;

		if (routeHeight < oneThird) {
			available -= routeHeight;
		}
		else {
			aboveOneThird += routeHeight;
		}
		if (stationHeight < oneThird) {
			available -= stationHeight;
		}
		else {
			aboveOneThird += stationHeight;
		}
		if (graphHeight < oneThird) {
			available -= graphHeight;
		}
		else {
			aboveOneThird += graphHeight;
		}

		if (routeHeight >= oneThird) {
			routeStyle = available * (routeHeight / aboveOneThird);
		}
		if (stationHeight >= oneThird) {
			stationStyle = available * (stationHeight / aboveOneThird);
		}
		if (graphHeight >= oneThird) {
			graphStyle = available * (graphHeight / aboveOneThird);
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
			updateRouteGroupName,
      ...rest
    } = this.props;

		const sidebarHeight = get(this.sidebarRef, ["current", "clientHeight"], 0);
		const headerHeight = get(this.headerRef, ["current", "clientHeight"], 0);

		const [routeStyle, stationStyle, graphStyle] = this.calcSectionHeights(sidebarHeight - headerHeight);

    return (
      <SidebarContainer
        onOpenOrClose={ this.props.onOpenOrClose }
        isOpen={ this.props.isOpen }
        extendedComp={ this.getExtendedComp() }
			>

				<div ref={ this.sidebarRef } className="h-full">

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
								updateRouteGroupName={ updateRouteGroupName }
								extendSidebar={ compId =>
									this.extendSidebar(RouteComponent, { comp: "RouteComponent", compId })
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
