import React from "react"

import mapboxgl from 'mapbox-gl/dist/mapbox-gl'
import config from '~/config.json'

import HybridGraphComp from "./graphClasses/HybridGraphComp"
import { CLASSES } from "./graphClasses/HdsGraphComp"

// import onClickOutside from 'react-onclickoutside';

import { Tooltip } from "~/sites/npmrds/components"

import get from "lodash/get"
import throttle from "lodash/throttle"
import isEqual from "lodash/isEqual"
import styled from "styled-components"

import { rollup } from "d3-array"
import { scaleQuantile } from "d3-scale"

import {
	BASE_DATA_TYPES,
	INDICES_BY_DATE_RANGE
} from "./utils/dataTypes"

import { Button } from "~/modules/avl-components/src"

// import {
//   mb_tmc_metadata_2019,
// } from 'constants/mapboxTilesets'

mapboxgl.accessToken = config.MAPBOX_TOKEN

// const source = {
// 	id: 'tmc_extended_2019',
// 	source: {
// 		type: 'vector',
// 		url: mb_tmc_metadata_2019.url,
// 	}
// }
// const source = {
// 	id: 'tmc_extended_2019_with_mpo',
// 	source: {
// 		type: 'vector',
// // 		url: 'mapbox://am3081.bpr38c4u' << CAN'T USE WITHOUT KNOWING NEW SOURCE LAYER NAME
// 		//url: mb_tmc_metadata_2019.url,
// 		url: mb_tmc_metadata_2019.url,
// 	}
// }

const BASE_WIDTH = 10;
// const layer ={
//   id: 'npmrds',
//   type: 'line',
//   source: source.id,
//   // 'source-layer': tmc_extended_2019.layer,
// 	'source-layer': 'network_conflation',
//   layout: {
//     'line-join': 'miter',
//     'line-cap': 'butt'
//   },
//   paint: {
//     'line-color': '#ccc',
//     'line-width': BASE_WIDTH,
//     'line-offset': {
//       base: 1.5,
//       stops: [[5, 0], [9, 1], [15, 3], [18, 7]]
//     }
//   },
// 	filter: ["boolean", false]
// }

const MAP_STYLES = [
	{ name: "Default",
		style: "mapbox://styles/am3081/cjlpipjg47q7u2rmrmyo39x78" },
  { name: "Dark",
    style: "mapbox://styles/am3081/cjqqukuqs29222sqwaabcjy29" },
  // { name: "Light",
  //   style: 'mapbox://styles/am3081/cjms1pdzt10gt2skn0c6n75te' },
  { name: "Satellite",
    style: 'mapbox://styles/am3081/cjya6wla3011q1ct52qjcatxg' },
  { name: "Satellite Streets",
    style: `mapbox://styles/am3081/cjya70364016g1cpmbetipc8u` }
]

class RouteMap extends HybridGraphComp {
	constructor(props) {
		super(props);

		this.state = {
			...this.state,
			map: null,
			bounds: null,
			width: 100,
			height: 100,
			point: {},
			moveTimer: 0,
			styleIndex: 0,
			hoveredStation: {
				point: {},
				stationId: null
			}
		}
		this.container = React.createRef();
		this.mapContainer = React.createRef();
		this.throttled = throttle(this.resize.bind(this), 100);

		this.stationHover = this.stationHover.bind(this);

		this.DATA_TYPES = [
			{ key: 'none', name: 'None' },
			...BASE_DATA_TYPES,
			...INDICES_BY_DATE_RANGE
		]
		this.timeout = null;

		this.MAP_IS_LOADING = false;
	}
	componentDidMount() {
		super.componentDidMount();

		this.loadMap();
		this.resize();
	}
	componentWillUnmount() {
		super.componentWillUnmount();

		clearTimeout(this.timeout);
	}
	componentDidUpdate(oldProps, oldState) {
		super.componentDidUpdate(oldProps, oldState);

		const bounds = this.getBounds();
		if (this.state.map && !isEqual(bounds, this.state.bounds)) {
			this.setState({ bounds });
		}
		if (!isEqual(oldState.bounds, this.state.bounds)) {
			this.fitBounds();
		}

		if (this.state.map &&
				!isEqual(oldProps.highlightedTmcs, this.props.highlightedTmcs)) {
		}
	}
	resize() {
		const container = this.mapContainer.current;
		if (container) {
			const width = container.clientWidth,
				height = container.clientHeight;
			if (this.state.map && ((width !== this.state.width) || (height !== this.state.height))) {
				this.setState({ width, height });
				this.state.map.resize();
				this.fitBounds();
			}
		}
		this.timeout = setTimeout(this.resize.bind(this), 50);
	}
	loadMap() {
		if (this.MAP_IS_LOADING) return;

		this.setState({ loading: ++this.state.loading });

		this.MAP_IS_LOADING = true;

    const map = new mapboxgl.Map({
      container: this.mapContainer.current,
			style: MAP_STYLES[this.state.styleIndex].style,//'mapbox://styles/am3081/cjms1pdzt10gt2skn0c6n75te',
			center: [-73.680647, 42.68],
			minZoom: 2,
			maxZoom: 20,
			zoom: 10,
			attributionControl: false,
			preserveDrawingBuffer: true
    });
    map.once('load', () => {
			this.setState({ loading: --this.state.loading });
			// map.on("styledata", () => this.initMap(map));
			this.initMap(map);
    })
    // map.on('sourcedata', () => {
    // 	this.forceUpdate();
    // })
	}

	initMap(map) {
		if (!map.getSource("route-start-source")) {
			map.addSource("route-start-source", {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			})
		}
		if (!map.getLayer("route-start")) {
			map.addLayer({
				id: "route-start",
				source: "route-start-source",
				type: "circle",
				paint: {
					"circle-opacity": 0,
					"circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 5, 20, 25],
					"circle-stroke-color": ["get", "color"],
					"circle-stroke-width": 6
				}
			})
		}

		if (!map.getSource("route-source")) {
			map.addSource("route-source", {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			})
		}
		if (!map.getLayer("route-layer")) {
			map.addLayer({
				id: "route-layer",
				source: "route-source",
				type: "line",
			  layout: {
			    'line-join': 'miter',
			    'line-cap': 'butt'
			  },
			  paint: {
			    'line-color': "#ccc",
			    'line-width': ["get", "lineWidth"],
			    'line-offset': {
			      base: 1.5,
			      stops: [[5, 0], [9, 1], [15, 3], [18, 7]]
			    }
			  }
			})

			map.on('mousemove', "route-layer", this.onMouseMove.bind(this));
			map.on('mouseleave', "route-layer", this.onMouseLeave.bind(this));
		}
		if (!map.getSource("station-source")) {
			map.addSource("station-source", {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			})
		}
		if (!map.getLayer("station-layer")) {
			map.addLayer({
				id: "station-layer",
				source: "station-source",
				type: "circle",
				paint: {
					"circle-opacity": 1,
					"circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 5, 20, 15],
					"circle-color": ["get", "color"]
				}
			})
			map.on('mousemove', "station-layer", this.stationHover);
			map.on('mouseleave', "station-layer", this.stationHover);
		}

		this.MAP_IS_LOADING = false;

		this.setState({ map });
	}

	stationHover({ features, point }) {
		const stationId = get(features, [0, "properties", "stationId"], null);
		if (stationId === null) point = {};
		this.setState({ hoveredStation: { point, stationId } });
	}

	onMouseMove({ features, point }, ...rest) {
		this.state.map.getCanvas().style.cursor = "pointer";
		const tmcs = [...features.reduce((a, c) => a.add(c.properties.tmc), new Set())];
		if (!isEqual(tmcs, this.props.highlightedTmcs)) {
			this.props.setHighlightedTmcs(tmcs);
		}
		const now = performance.now();
		if ((now - this.state.moveTimer) >= 25) {
			this.setState({ point, moveTimer: now });
		}
	}
	onMouseLeave() {
		this.state.map.getCanvas().style.cursor = "";
		this.props.setHighlightedTmcs([]);
		this.setState({ point: {} });
	}
	fitBounds() {
		const { map, bounds } = this.state;

		if (map && bounds && !bounds.isEmpty()) {

// check if bounds is a point.
// occurs when a single station is active.
			if ((bounds.getWest() === bounds.getEast()) && (bounds.getNorth() === bounds.getSouth())) {
				map.flyTo({
					center: bounds.getSouthWest(),
					zoom: 12,
					bearing: 0,
					pitch: 0
				})
			}
			else {
				map.fitBounds(bounds, { padding: 50, bearing: 0, pitch: 0 });
			}
		}
	}
	getBounds() {
		const coords = this.getActiveRouteComponents()
			.reduce((a, route) => {
				const { tmcArray } = route,
					year = this.getMaxYear(route),
					boxes = tmcArray.reduce((boxes, tmc) => {
						const bb = get(this.props.tmcGraph, `${ tmc }.meta.${ year }.bounding_box.value`, null);
						if (bb) {
							boxes.push(...bb);
						}
						return boxes;
					}, [])
				return [...a, ...boxes];
			}, []);

		this.getActiveStationComponents()
			.forEach(sc => {
				const geom = JSON.parse(
					get(this.props.hdsGraph, ["continuous", "stations", "byId", sc.stationId, "geom"], null)
				);
				Boolean(geom) && coords.push(geom.coordinates);
			})

		return coords.reduce((a, c) => {
			return a.extend(c);
		}, new mapboxgl.LngLatBounds());
	}
	setActiveRouteComponents(activeRouteComponents) {
		const current = this.getActiveRouteComponents().map(r => r.compId),
			[newCompId] = activeRouteComponents.filter(d => !current.includes(d)),
			newComp = this.props.routes.find(r => r.compId === newCompId);

		if (newComp) {
			activeRouteComponents = activeRouteComponents.filter(compId => {
				const comp = this.props.routes.find(r => r.compId === compId);
				return !current.length ||
					(compId === newCompId) ||
					!isEqual(newComp.tmcArray, comp.tmcArray)
			})
		}
		this.props.updateGraphComp(this.props.index, { state: { activeRouteComponents } });
	}
	selectNewStyle(index) {
		if (index === this.state.styleIndex) return false;

		if (this.state.map && !this.state.loading) {
			this.state.map.once("styledata", () => {
				this.initMap(this.state.map);
				this.setState({ styleIndex: index });
			});
			this.state.map.setStyle(MAP_STYLES[index].style);
			return true;
		}
		return false;
	}
	generateHeaderData(graphData, routeComps, stationComps, [displayData], resolution) {
		return [
			{ type: "multi-select-route",
				onChange: this.setActiveRouteComponents.bind(this) },
			{ type: "single-select-data" },
			{ type: "multi-select-station" },
			{ type: "single-select-hds-data" }
		]
	}
	generateGraphData(routes, stations, [displayData]) {
		const { key, group, transform, tmcReducer } = displayData,
			graphData = [];

		routes.forEach(route => {
			const year = this.getMaxYear(route);

			if (group === "indices-byDateRange") {
				const data = get(route, `data.${ key }`, []);
				data.forEach(({ tmc, value }) => {
					graphData.push({ name: route.name, tmc, value: transform(value, this.getTmcLength(year, tmc)) });
				})
			}
			else {
				const data = get(route, `data.${ key }`, []),
					rolled = rollup(data, v => tmcReducer(v, this.props.tmcGraph, year), d => d.tmc)
				rolled.forEach((value, tmc) => {
					graphData.push({ name: route.name, tmc, value });
				})
			}
		})
		return graphData;
	}
	generateTableData(graphData, routeComps, stationComps, [displayData], [hdsData], resolution) {
		const data = graphData.map(d => ({
			"Route Name": d.name,
			"TMC": d.tmc,
			"Data Type": displayData.name,
			"Value": d.value
		}));
		return { data, keys: ["Route Name", "TMC", "Data Type", "Value"] };
	}
	toggle() {
		const showLegend = !this.showLegend();
		this.props.updateGraphComp(this.props.index, { state: { showLegend } });
	}
	showLegend() {
		return get(this.props, ["state", "showLegend"], true);
	}
	renderGraph(graphData, routeComps, stationComps, [displayData], [hdsData], resolution, colorRange) {
		const { map } = this.state,
			scale = scaleQuantile()
				.domain([1, 2, 3, 4, 5])
				.range(colorRange),

			values = {},
			colors = {};

		if (map) {
			const routeStartSource = map.getSource("route-start-source");
			if (routeStartSource) {
				const collection = {
					type: "FeatureCollection",
					features: []
				}

				routeComps.forEach(rc => {
					const year = this.getMaxYear(rc),
						tmcArray = get(rc, "tmcArray", []),
						tmc = tmcArray[0],
						geom = get(this.props.tmcGraph, [tmc, 'year', year, 'geometries', 'value'], null),
						coordinates = get(geom, ["coordinates", 0, 0], null);
					if (coordinates) {
						collection.features.push({
							type: "Feature",
							properties: {
								color: rc.color
							},
							geometry: {
								type: "Point",
								coordinates
							}
						})
					}
				})

				routeStartSource.setData(collection);
			}

			const routeSource = map.getSource("route-source");
			if (routeSource) {
				const routeCollection = {
					type: "FeatureCollection",
					features: []
				}

				routeComps.forEach(rc => {
					const year = this.getMaxYear(rc),
						tmcArray = get(rc, "tmcArray", []);

					tmcArray.forEach((tmc, i) => {
						const geometry = get(this.props.tmcGraph, [tmc, 'year', year, 'geometries', 'value'], null);
						let lineWidth = BASE_WIDTH;
						if (this.props.highlightedTmcs.includes(tmc)) {
							lineWidth = BASE_WIDTH * 2.5
						}
						else if (i % 2) {
							lineWidth = BASE_WIDTH * 1.75;
						}
						routeCollection.features.push({
							type: "Feature",
							properties: { compId: rc.compId, tmc, lineWidth },
							geometry
						})
					})
				})
				routeSource.setData(routeCollection);
			}

			const stationSource = map.getSource("station-source");
			if (stationSource) {
				const stationCollection = {
					type: "FeatureCollection",
					features: stationComps.map(sc => ({
						type: "Feature",
						properties: {
							color: sc.color,
							stationId: sc.stationId
						},
						geometry: JSON.parse(
							get(this.props.hdsGraph, ["continuous", "stations", "byId", sc.stationId, "geom"], null)
						)
					})).filter(({ geometry }) => Boolean(geometry))
				}
				stationSource.setData(stationCollection);
			}

			scale.domain(graphData.map(d => d.value));;
			graphData.forEach(({ tmc, value }) => {
				colors[tmc] = scale(value) || "#000";
				values[tmc] = value;
			})
	    map.setPaintProperty(
	      "route-layer",
	      'line-color',
				["case",
					["has", ["to-string", ["get", "tmc"]], ["literal", colors]],
					["get", ["to-string", ["get", "tmc"]], ["literal", colors]],
					"#ccc"
				]

	    );
		}
		const {
			name,
			label,
			format
		} = displayData;

		const viewing = this.props.viewing || this.props.previewing || this.state.savingImage;

		return (
			<div style={ { height: "100%", width: "100%", padding: "5px 10px 10px 10px" } } ref={ this.container }>
				<div style={ { height: "100%", width: "100%", maxHeight: "100%" } } ref={ this.mapContainer }>

					<MapLegend show={ graphData.length && map }
						colorRange={ colorRange }
						name={ name }
						label={ label }
						format={ format }
						scale={ scale }
						toggle={ () => this.toggle() }
						hidden={ !viewing && !this.showLegend() }/>

					{ viewing ? null :
						<FitBoundsButton id={ this.props.id }
							fitBounds={ this.fitBounds.bind(this) }/>
					}

					<HoverComp { ...this.state.point }
						width={ this.state.width }
						height={ this.state.height }>
						<TmcTable name={ name }
							label={ label }
							format={ format }
							tmcs={ this.props.highlightedTmcs }
							values={ values }
							colors={ colors }/>
					</HoverComp>

					<HoverComp { ...this.state.hoveredStation.point }
						width={ this.state.width }
						height={ this.state.height }>
						<StationInfo hdsData={ hdsData }
							station={
								stationComps.reduce((a, c) =>
									c.stationId === this.state.hoveredStation.stationId ? c : a
								, null)
							}/>
					</HoverComp>

					{ viewing ? null :
						<SelectLayerButton select={ this.selectNewStyle.bind(this) }
							current={ this.state.styleIndex }/>
					}

				</div>
			</div>
		)
	}
}
export default HybridGraphComp.connect(RouteMap)

const HoverContainer = styled.div`
	position: absolute;
	z-index: 5000;
	background: #fff;
	padding: 10px;
	pointer-events: none;
	border-radius: 4px;
	white-space: nowrap;
	table > tbody > tr > td {
		padding-bottom: 0px;
		white-space: nowrap;
	}

	table > tbody > tr > td > span {
		display: inline-block;
		width: 15px;
		height: 15px;
	}
`
class HoverComp extends React.Component {
	container = null;
	state = {
		cWidth: 0,
		cHeight: 0
	}
	componentDidUpdate() {
		if (!this.container) return;

		const cWidth = this.container.clientWidth,
			cHeight = this.container.clientHeight;

		if ((cWidth !== this.state.cWidth) || (cHeight !== this.state.cHeight)) {
			this.setState({ cWidth, cHeight });
		}
	}
	render() {
		const {
			x = null, y = null,
			width,
			height
		} = this.props;

		if (!x || !y) return null;

		let left = x + 10,
			top = y + 10;

		const { cWidth, cHeight } = this.state;
		if ((x + 10 + cWidth) > width) {
			left = Math.max(x -10 - cWidth, 0);
		}
		if ((y + 10 + cHeight) > height) {
			top = height - cHeight;
		}

		return (
			<HoverContainer ref={ comp => this.container = comp }
				style={ {
					left: `${ left }px`,
					top: `${ top }px`
				} }>
				{ this.props.children }
			</HoverContainer>
		)
	}
}
const TmcTable = ({ tmcs, colors, values, format, label, name }) =>
	<table className="table table-sm" style={ { margin: 0 } }>
		<tbody>
			{
				tmcs.map(tmc =>
					<tr key={ tmc }>
						{ !(tmc in colors) ? null :
							<td><span style={ { background: colors[tmc] } }/></td>
						}
						<td>TMC: { tmc }</td>
						{ name === "None" ? null :
							<td>{ format(values[tmc]) } { values[tmc] ? label : "No Data" }</td>
						}
					</tr>
				)
			}
		</tbody>
	</table>
const StationInfo = ({ station, hdsData }) => {
	const [data, setData] = React.useState([]),
		keys = hdsData.key === "volume" ? ["value"] : CLASSES;

	React.useEffect(() => {
		const _data = get(station, ["data", hdsData.key], []);
		setData(
			_data.reduce((a, c) => {
				keys.forEach((k, i) => a[i] += c[k]);
				return a;
			}, new Array(keys.length).fill(0))
		)
	}, [station, hdsData])

	return (
		<div>
			{ get(station, "name", null) }<br />
			{ hdsData.name }<br />
			{ data.map((v, i) =>
					<div key={ i }>
						{ keys[i] }: { hdsData.format(v) } { hdsData.label }
					</div>
				)
			}
		</div>
	)
}

const MapStyle = styled.div`
	position: relative;
	padding: 2px 15px;
	border: 2px solid transparent;
	border-radius: 3px;
	transition: border-color 0.15s;
	:hover {
		border-color: currentColor;
	}
`

class SelectLayerButtonBase extends React.Component {
	state = {
		isOpen: false
	}
	setStyle(i) {
		this.setState({ isOpen: !this.props.select(i) });
	}
	handleClickOutside() {
		this.setState({ isOpen: false });
	}
	render() {
		return this.state.isOpen ?
		 	(
				<div style={ {
					position: "absolute",
					right: "5px",
					bottom: "5px",
					zIndex: 1,
					backgroundColor: "#fff",
					padding: "10px 20px 10px 10px",
					borderRadius: "4px"
				} }>
					<div className="absolute px-2 hover:bg-gray-200"
						style={ {
							top: "0px",
							right: "0px"
						} }
						onClick={ e => this.setState({ isOpen: false }) }
					>
						<span className="fa fa-close"/>
					</div>
					{ MAP_STYLES.map(({ name }, i) =>
							<MapStyle key={ name }
								onClick={ e => this.setStyle(i) }
								style={ {
									fontWeight: this.props.current === i ? "bold" : null,
									fontSize: this.props.current === i ? "1rem" : "0.75rem",
									cursor: this.props.current === i ? "not-allowed" : "pointer"
								} }>
								{ this.props.current !== i ? null :
									<span style={ { position: "absolute", left: "3px", top: "6px", fontSize: "0.75rem" } }
										className="fa fa-chevron-right"/>
								}
								{ name }
							</MapStyle>
						)
					}
				</div>
			)
		:
			(
				<div style={ { position: "absolute", right: "5px", bottom: "5px", zIndex: 1 } }>
					<Button
						data-tip data-for={ `tooltip-layer` }
						onClick={ e => this.setState({ isOpen: true }) }>
						<span className="fa fa-lg fa-map"/>
						<Tooltip id={ `tooltip-layer` }
							delayShow={ 500 }
							place="left"
							effect="solid">
							Select Layer
						</Tooltip>
					</Button>
				</div>
			)
	}
}
const SelectLayerButton = SelectLayerButtonBase

const FitBoundsButton = ({ fitBounds, id }) =>
	<div style={ { position: "absolute", left: "5px", top: "5px", zIndex: 1 } }>
		<Button
			data-tip data-for={ `tooltip-${ id }` }
			onClick={ e => fitBounds() }>
			<span className="fa fa-lg fa-home"/>
			<Tooltip id={ `tooltip-${ id }` }
				delayShow={ 500 }
				place="right"
				effect="solid">
				Center Map
			</Tooltip>
		</Button>
	</div>

const MapLegend = ({ show, scale, name, label, format, colorRange, hidden, toggle }) =>
		!show ? null :
		hidden ? <ToggleButton toggle={ toggle }/> : (
		<div style={ { position: "absolute", right: "5px", top: "5px", minWidth: "150px", backgroundColor: "#ccc", borderRadius: "4px", overflow: "hidden", zIndex: 1 } }>
				<div style={ { textAlign: "center", padding: "3px 20px", fontSize: "15px", cursor: "pointer" } }
					onClick={ toggle }>
					{ name } { label ? `(${ label })` : "" }
				</div>
				<div style={ { overflowY: "hidden" } }>
					{
						colorRange.map(c => {
							const extent = scale.invertExtent(c);
							return (
								<div key={ c } style={ { height: "25px", backgroundColor: c, paddingTop: "3px", textAlign: "center", fontWeight: "bold" } }>
									{ `${ format(extent[0]) } - ${ format(extent[1]) }` }
								</div>
							)
						})
					}
				</div>
		</div>
	)

const ToggleButton = ({ toggle }) =>
	<div style={ { position: "absolute", right: "5px", top: "5px", zIndex: 1 } }>
		<Button
			data-tip data-for={ `tooltip-legend` }
			onClick={ e => toggle() }>
			<span className="fa fa-lg fa-bar-chart"/>
			<Tooltip id={ `tooltip-legend` }
				delayShow={ 500 }
				place="left"
				effect="solid">
				Show Legend
			</Tooltip>
		</Button>
	</div>
