import React from "react"

import GeneralGraphComp from "./GeneralGraphComp"
import GraphContainer from "./GraphContainer"
import MessageBox from "./components/MessageBox"

import deepequal from "deep-equal"
import get from "lodash.get"
import { format } from "d3-format"
import { sum } from "d3-array"

import { GRAPH_TYPES } from "../index"

export const CLASSES = [
  "f1", "f2", "f3", "f4", "f5", "f6", "f7",
  "f8", "f9", "f10", "f11", "f12", "f13"
]
export const HDS_DATA_TYPES = [
	{ key: 'volume', reverseColors: false, label: "Vehicles",
		name: 'Vehicle Volume', format: format(",d"),
		reducer: d => sum(d, d => d.value)
  },
	{ key: 'class', reverseColors: false, label: "Vehicles",
		name: 'Vehicle Classification', format: format(",d"),
		reducer: d => sum(d, d => CLASSES.reduce((a, c) => a + d[c], 0))
  }
]

export const makeRequest = (settings, dataType) => {
  let {
    startDate,
    endDate,
    startTime,
    endTime,
    weekdays,
    resolution
  } = settings;
  return encodeURI([
    startDate,
    endDate,
    startTime,
    endTime === "00:00" ? "24:00" : endTime,
    weekdays.join(),
    resolution,
    dataType
  ].join("|"));
}

class HdsGraphComp extends GeneralGraphComp {

  IS_ACTIVE = false;

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

	componentDidMount() {
		this.IS_ACTIVE = true;
	}
	componentWillUnmount() {
		this.IS_ACTIVE = false;
		// DomainManager.unregister(this.props.id);
	}
	setState(...args) {
		this.IS_ACTIVE && super.setState(...args);
	}
	forceUpdate() {
		this.IS_ACTIVE && super.forceUpdate();
	}

	componentDidUpdate(oldProps) {
		if (!deepequal(oldProps.state, this.props.state) ||
				!deepequal(oldProps.station_comps, this.props.station_comps)) {
			this.fetchFalcorDeps();
		}
	}

  fetchFalcorDeps() {
		const stations = this.getActiveStationComponents();
		if (!stations.length) return Promise.resolve();

		const [displayData] = this.getHdsData();
		if (!displayData) return Promise.resolve();

		this.setState({ loading: ++this.state.loading });

    const stationData = {};

    return stations.reduce((promise, station) => {
      stationData[station.compId] = {};
      const requestKey = makeRequest(station.settings, displayData.key);
      return promise.then(() => this.props.falcor.get(
        ["hds", "continuous", "data", station.stationId, requestKey]
      )).then(res => {
        const data = get(res, ["json", "hds", "continuous", "data", station.stationId, requestKey])
        // station.data[displayData.key] = data;
        stationData[station.compId][displayData.key] = data;
      })
    }, Promise.resolve())
      .then(() => this.setState({ loading: --this.state.loading }))
      .then(() => this.props.updateStationData(stationData));
  }

	getActiveStationComponents() {
		const compIds = get(this.props, 'state.activeStationComponents', [get(this.props, 'station_comps[0].compId', 'none')]);
		return this.props.station_comps.filter(s => compIds.includes(s.compId));
	}
	getResolution() {
		return get(this.getActiveStationComponents(), '[0].settings.resolution', '5-minutes');
	}
	getHdsData() {
		const keys = get(this.props, 'state.hdsData', ['volume']);
		return this.HDS_DATA_TYPES.filter(dd => keys.includes(dd.key));
	}

	generateGraphData(station_comps, hdsData, resolution) {
		return [];
	}

	renderGraph(graphData, station_comps, hdsData, resolution) {
		return <div>{ "OOPS!!! The component's <renderGraph> method has Not yet been implemented." }</div>;
	}
	generateHeaderData(graphData, station_comps, hdsData, resolution) {
    return [];
  }
	expandHeaderData(headerData, graphData, station_comps, hdsData, resolution) {
		const stations = this.props.station_comps.map(s =>
      ({ key: s.compId, name: s.name })
    );
		return headerData.reduce((a, hd) => {
			switch (hd.type) {
				case "single-select-hds-data":
					a.push({
						title: "HDS Data",
						value: get(hdsData, '[0].key', 'volume'),
						domain: this.HDS_DATA_TYPES,
						onChange: this.setSingleHdsData.bind(this),
						...hd,
						type: 'single-select'
					});
					break;
				case "multi-select-hds-data":
					a.push({
						title: "HDS Data",
						value: hdsData.map(dd => dd.key),
						domain: this.HDS_DATA_TYPES,
						onChange: this.setMultiHdsData.bind(this),
						...hd,
						type: 'multi-select'
					});
					break;
				case "single-select-station":
					if (stations.length > 1) {
						a.push({
							title: "Station",
							value: get(station_comps, '[0].compId', 'compId'),
							domain: stations,
							onChange: this.setSingleActiveStationComponents.bind(this),
							...hd,
							type: "single-select"
						});
					};
					break;
				case "multi-select-station":
					if (stations.length > 1) {
						a.push({
							title: "Stations",
							value: station_comps.map(rc => rc.compId),
							domain: stations,
							onChange: this.setMultiActiveStationComponents.bind(this),
							...hd,
							type: "multi-select"
						});
          }
					break;
				default:
					a.push(hd);
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

	updateTitle(title) {
		this.props.updateGraphComp(this.props.index, { state: { title } });
	}

	render() {
		const resolution = this.getResolution(),
			station_comps = this.getActiveStationComponents(),
			hdsData = this.getHdsData(),
			graphData = this.generateGraphData(station_comps, hdsData, resolution),
			colorRange = this.getColorRange(hdsData),
			headerData = this.generateHeaderData(graphData, station_comps, hdsData, resolution);

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

			//updateTitle={ title => this.props.updateGraphComp(this.props.index, { state: { title } }) }
		return (
			<GraphContainer id={ this.props.id }
				headerData={ this.expandHeaderData(headerData, graphData, station_comps, hdsData, resolution) }
				viewing={ this.props.viewing }
				previewing={ this.props.previewing }
				title={ this.props.state.title }
				updateTitle={ this.updateTitle }
				savingImage={ this.state.savingImage }
				setSavingImage={ this.setSavingImage }
				type={ this.props.type }
				
				remove={ () => this.props.removeGraphComp(this.props.index, this.props.id) }
				add={ () => this.props.addGraphComp(this.props.type, { x, y, w, h }) }
				loading={ Boolean(this.state.loading) }
				showTableModal={ () => this.props.showTableModal(this.generateTableData(graphData, station_comps, hdsData, resolution)) }
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
						{ this.renderGraph(graphData, station_comps, hdsData, resolution, colorRange) }
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

export default HdsGraphComp
