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
	MultiLevelDropdown
} from "sites/npmrds/components"

class Sidebar extends React.Component {
  static defaultState = {
    extendedComponent: null,
    extendedComponentMeta: { comp: "none" }
  }
  state = { ...Sidebar.defaultState };
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
          route_comp = this.props.route_comps.reduce((a, c) => c.compId === compId ? c : a, { compId: "invalid" });
        return {
          ...route_comp,
          updateRouteCompSettings: this.props.updateRouteCompSettings,
          updateRouteComp: this.props.updateRouteComp,
          updateRouteCompColor: this.props.updateRouteCompColor,
          // reorderRouteComps: this.props.reorderRouteComps,
          dateExtent: this.props.dateExtent,
          yearsWithData: this.props.yearsWithData,
          SETTINGS: this.props.routeComponentSettings,
          route: this.props.routes.reduce((a, c) => c.compId == compId ? c : a, null)
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
          .reduce((a, c) => c.compId === compId ? true : a, false);
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
  render() {
    const {
      addRouteComp,
      removeRouteComp,
      updateAllRouteComps,
      ...rest
    } = this.props;

    return (
      <SidebarContainer
        onOpenOrClose={ this.props.onOpenOrClose }
        isOpen={ this.props.isOpen }
        extendedComp={ this.getExtendedComp() }>

  			<div style={ {
  				padding: "10px",
  				whiteSpace: "nowrap",
  				display: "flex",
  				flexDirection: "column"
  			} }>

  				<Header>
  					<h4>Controls</h4>
  				</Header>

					<div style={ { borderBottom: `2px solid currentColor` } }>
            <ControlBox>
							<Control>
	              <MultiLevelDropdown
	                labelAccessor={ d => d.name }
	                valueAccessor={ d => d.id }
	                onClick={ id => this.props.loadTemplate(id) }
	                items={ this.props.templates }
								>
									<div className="px-1">
		                <span className="fa fa-cog"/>
		                <span className="px-1">Templates</span>
									</div>
	              </MultiLevelDropdown>
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

        <ActiveRouteComponents { ...rest }
          add={ addRouteComp }
          remove={ removeRouteComp }
          extendSidebar={ compId =>
            this.extendSidebar(RouteComponent, { comp: "RouteComponent", compId })
          }/>

        <ActiveStationComponents { ...rest }
          extendSidebar={ compId =>
            this.extendSidebar(StationComponent, { comp: "StationComponent", compId })
          }/>

        <ActiveGraphComponents { ...rest }
          extendGraphSelector={ () =>
            this.extendSidebar(GraphSelector, { comp: "GraphSelector" })
          }
          extendColorSelector={ () =>
            this.extendSidebar(ColorRangeSelector, { comp: "ColorRangeSelector" })
          }/>

      </SidebarContainer>
    );
  }
}

export default Sidebar
