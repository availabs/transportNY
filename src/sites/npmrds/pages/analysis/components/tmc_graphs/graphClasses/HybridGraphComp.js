import React from "react"
import * as redux from "react-redux"
// import { reduxFalcor } from 'utils/redux-falcor';
// import { avlFalcor } from "modules/avl-components/src"

import deepequal from "deep-equal"
import get from "lodash.get"
import moment from "moment"
import styled from "styled-components"

import GeneralGraphComp, { getRequestKey } from "./GeneralGraphComp"
import GraphContainer from "./GraphContainer"
import MessageBox from "./components/MessageBox"

import DateObject from "../utils/DateObject"

import DATA_TYPES from "../utils/dataTypes"
import {
	// BASE_DATA_TYPES,
	INDICES,
	INDICES_BY_DATE_RANGE,
	TMC_ATTRIBUTES
} from "../utils/dataTypes"
import { HDS_DATA_TYPES, makeRequest } from "./HdsGraphComp"

import * as DomainManager from "../utils/DomainManager"

import "./styles.css"

import { GRAPH_TYPES } from "../index"

export default class HybridGraphComp extends GeneralGraphComp {

	IS_ACTIVE = false;

	DATA_TYPES = DATA_TYPES;
	HDS_DATA_TYPES = HDS_DATA_TYPES;

	graphDivRef = React.createRef();

	state = {
		loading: 0,
		svgToSave: null,
		fileName: this.props.state.title || this.props.type,
		resizing: false,
		position: { x: 0, y: 0 },
		direction: "none"
	}

	componentDidUpdate(oldProps) {
		const oldRouteSettings = oldProps.routes.map(r => r.settings),
			routeSettings = this.props.routes.map(r => r.settings);
		if (!deepequal(oldProps.state, this.props.state) ||
				!deepequal(oldRouteSettings, routeSettings) ||
				!deepequal(oldProps.station_comps, this.props.station_comps)) {
			this.fetchFalcorDeps();
		}
	}

	fetchFalcorDeps() {
		return super.fetchFalcorDeps()
			.then(() => {
				const stations = this.getActiveStationComponents();
				if (!stations.length) return Promise.resolve();

				const displayData = this.getHdsData();
				if (!displayData.length) return Promise.resolve();

				this.setState({ loading: ++this.state.loading })

		    return stations.reduce((promise, station) => {
		      const requestKey = makeRequest(station.settings, displayData[0].key);
		      return promise.then(() => this.props.falcor.get(
		        ["hds", "continuous", "data", station.stationId, requestKey],
						["hds", "continuous", "stations", "byId", station.stationId, "geom"]
		      )).then(res => {
		        const data = get(res, ["json", "hds", "continuous", "data", station.stationId, requestKey])
		        station.data[displayData[0].key] = data;
		      })
		    }, Promise.resolve())
		      .then(() => this.setState({ loading: --this.state.loading }));
			})
	}

	getActiveRouteComponents() {
		const compIds = get(this.props, 'state.activeRouteComponents', [get(this.props, 'routes[0].compId', 'none')]);
		return this.props.routes.filter(r => compIds.includes(r.compId));
	}
	getActiveStationComponents() {
		const compIds = get(this.props, 'state.activeStationComponents', [get(this.props, 'station_comps[0].compId', 'none')]);
		return this.props.station_comps.filter(s => compIds.includes(s.compId));
	}
	getResolution() {
		return null;
	}
	getDisplayData() {
		const keys = get(this.props, 'state.displayData', ['speed']);
		return this.DATA_TYPES.filter(dd => keys.includes(dd.key));
	}
	getHdsData() {
		const keys = get(this.props, 'state.hdsData', ['volume']);
		return this.HDS_DATA_TYPES.filter(dd => keys.includes(dd.key));
	}

	generateGraphData(routeComps, stationComps, displayData, hdsData, resolution) {
		return [];
	}

	renderGraph(graphData, routeComps, stationComps, displayData, hdsData, resolution) {
		return <div>{ "OOPS!!! The component's <renderGraph> method has Not yet been implemented." }</div>;
	}
// //
	generateHeaderData(graphData, routeComps, stationComps, displayData, hdsData, resolution) {
		return []
	}
	expandHeaderData(headerData, graphData, routeComps, stationComps, displayData, hdsData, resolution) {
		const routes = this.mapRouteComps(this.props.routes, true);
		const stations = this.props.station_comps.map(s =>
      ({ key: s.compId, name: s.name })
    );
		return headerData.reduce((a, c) => {
			switch (c.type) {
				case "single-select-data":
					a.push({
						title: "Display Data",
						value: displayData.map(dd => dd.key).shift(),
						domain: this.DATA_TYPES,
						onChange: this.setSingleDisplayData.bind(this),
						...c,
						type: 'single-select'
					});
					break;
				case "multi-select-data":
					a.push({
						title: "Display Data",
						value: displayData.map(dd => dd.key),
						domain: this.DATA_TYPES,
						onChange: this.setSingleHdsData.bind(this),
						...c,
						type: 'multi-select'
					});
					break;
				case "single-select-hds-data":
					a.push({
						title: "HDS Data",
						value: hdsData.map(dd => dd.key).shift(),
						domain: this.HDS_DATA_TYPES,
						onChange: this.setSingleHdsData.bind(this),
						...c,
						type: 'single-select'
					});
					break;
				case "multi-select-hds-data":
					a.push({
						title: "HDS Data",
						value: hdsData.map(dd => dd.key),
						domain: this.HDS_DATA_TYPES,
						onChange: this.setMultiHdsData.bind(this),
						...c,
						type: 'multi-select'
					});
					break;
				case "single-select-route":
					if (routes.length > 1) {
						a.push({
							title: "Route",
							value: routeComps.map(rc => rc.compId).shift(),
							domain: routes,
							onChange: this.setSingleActiveRouteComponents.bind(this),
							...c,
							type: "single-select"
						});
					break;
				};
				case "multi-select-route":
					if (routes.length > 1) {
						a.push({
							title: "Routes",
							value: routeComps.map(rc => rc.compId),
							domain: routes,
							onChange: this.setMultiActiveRouteComponents.bind(this),
							...c,
							type: "multi-select"
						});
					}
					break;
				case "single-select-station":
					if (stations.length > 1) {
						a.push({
							title: "Station",
							value: stationComps.map(rc => rc.compId).shift(),
							domain: stations,
							onChange: this.setSingleActiveStationComponents.bind(this),
							...c,
							type: "single-select"
						});
					};
					break;
				case "multi-select-station":
					if (stations.length > 1) {
						a.push({
							title: "Stations",
							value: stationComps.map(rc => rc.compId),
							domain: stations,
							onChange: this.setMultiActiveStationComponents.bind(this),
							...c,
							type: "multi-select"
						});
          }
					break;
				default:
					a.push(c);
					break;
			}
			return a;
		}, [])
	}
	setSingleActiveStationComponents(value) {
		this.props.updateGraphComp(this.props.index, { state: { activeStationComponents: [value] } });
	}
	setMultiActiveStationComponents(activeStationComponents) {
		this.props.updateGraphComp(this.props.index, { state: { activeStationComponents } });
	}
	setSingleHdsData(value) {
		this.props.updateGraphComp(this.props.index, { state: { hdsData: [value] } });
	}
	setMultiHdsData(hdsData) {
		this.props.updateGraphComp(this.props.index, { state: { hdsData } });
	}

	generateTableData(graphData, routeComps, stationComps, displayData, hdsData, resolution) {
		return { data: [], keys: [] };
	}

	render() {
		const resolution = this.getResolution(),
			routeComps = this.getActiveRouteComponents(),
			stationComps = this.getActiveStationComponents(),
			displayData = this.getDisplayData(),
			hdsData = this.getHdsData(),
			graphData = this.generateGraphData(routeComps, stationComps, displayData, hdsData, resolution),
			colorRange = this.getColorRange(displayData),
			headerData = this.generateHeaderData(graphData, routeComps, stationComps, displayData, hdsData, resolution);

		const {
			x, y, w, h
		} = this.props.layout;

		const {
        saveImage = false,
        isColorfull = false
      } = GRAPH_TYPES.reduce((a, c) => c.type === this.props.type ? c : a, {}),

			hasMessage = Boolean(get(this.props, ["state", "message"], false)),

			message = get(this.props, ["state", "message"], {}),
			location = get(message, "location", null),
			mWidth = location === "bottom" ? 0 : get(message, "width", 0),
			mHeight = location === "bottom" ? get(message, "height", 0) : 0;

		return (
			<GraphContainer id={ this.props.id }
				headerData={ this.expandHeaderData(headerData, graphData, routeComps, stationComps, displayData, hdsData, resolution) }
				viewing={ this.props.viewing }
				previewing={ this.props.previewing }
				title={ this.props.state.title }
				type={ this.props.type }
				updateTitle={ title => this.props.updateGraphComp(this.props.index, { state: { title } }) }
				remove={ () => this.props.removeGraphComp(this.props.index, this.props.id) }
				add={ () => this.props.addGraphComp(this.props.type, { x, y, w, h }) }
				loading={ Boolean(this.state.loading) }
				showTableModal={ () => this.props.showTableModal(this.generateTableData(graphData, routeComps, stationComps, displayData, hdsData, resolution)) }
				saveImage={ saveImage }
				addMessageBox={ this.addMessageBox.bind(this) }
				hasMessageBox={ hasMessage }
				defaultColorRange={ this.props.colorRange }
				colorRange={ colorRange }
				setColorRange={ isColorfull ? this.setColorRange.bind(this) : null }>

				<div ref={ this.graphDivRef }
					style={ {
						width: "100%", height: "100%",
						display: "flex",
						flexDirection: location === "bottom" ? "column" : "row"
					} }
					onMouseMove={ this.state.resizing ? (e => this.doResive(e)) : null }
					onMouseUp={ this.state.resizing ? (e => this.endResize(e)) : null }>

					<div id={ this.props.id } style={ { width: `calc(100% - ${ mWidth }px)`, height: `calc(100% - ${ mHeight }px)` } }>
						{ this.renderGraph(graphData, routeComps, stationComps, displayData, hdsData, resolution, colorRange) }
					</div>

					{ !Boolean(hasMessage) ? null :
						<MessageBox { ...message }
							onChange={ text => this.setMessageBoxText(text) }
							startResize={ this.startResize.bind(this) }
							viewing={ this.props.viewing }
							resizing={ this.state.resizing }
							dockMessageBoxRight={ this.dockMessageBoxRight.bind(this) }
							dockMessageBoxBottom={ this.dockMessageBoxBottom.bind(this) }
							removeMessageBox={ this.removeMessageBox.bind(this) }/>
					}

				</div>

			</GraphContainer>
		)
	}
}
