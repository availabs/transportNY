import React from "react";
import get from "lodash/get";
import { format as d3format } from "d3-format";
import { quantile, quantileRank } from "simple-statistics";
import { /*LineGraph,*/ BarGraph } from "~/modules/avl-graph/src";
import { useFalcor, Input } from "~/modules/avl-components/src";

// import { download as shpDownload } from "../../utils/shp-write";
import shpwrite from  '@mapbox/shp-write'

import { saveAs } from "file-saver";
import { scaleLinear } from "d3-scale";
import { MultiLevelSelect } from "~/sites/npmrds/components"

// import { useFalcor } from '~/modules/avl-components/src'
/*const f_system_meta = {
  "0": "Total",
  "1": "Interstate",
  "2": "Freeways",
  "3": "Principal ",
  "4": "Minor Arterial",
  "5": "Major Collector",
  "6": "Minor Collector",
  "7": "Local"
}*/

const F_SYSTEMS = [
	{ value: 1, name: "Interstate" },
	{ value: 2, name: "Freeway" },
	{ value: 3, name: "Principal" },
	{ value: 4, name: "Minor Arterial" },
	{ value: 5, name: "Major Collector" },
	{ value: 6, name: "Minor Collector" },
	{ value: 7, name: "Local" }
]

const BottlenecksBox = ({ layer }) => {
	const { falcor, falcorCache } = useFalcor();

	const measure = layer.getMeasure(layer.filters);
	const currentData = React.useMemo(
		() => get(layer, "state.currentData", []).sort((a, b) => b.value - a.value),
		[layer.state.currentData]
	);

// console.log("CURRENT DATA:", currentData);

	const getMiles = React.useCallback(d => {
		const miles = get(d, "TMC_miles", "unknown")
		return miles === "unknown" ? "unknown" : miles.toFixed(2);
	}, [])

	const f = d3format(",.3~s");
	const numQuantiles = 100;
	const numBottleNecks = 30;
	const quantileGroup = (number) =>
		(Math.ceil(number * numQuantiles) / numQuantiles).toFixed(4);

	const [qaLevel, _setQaLevel] = React.useState(0.5)
	const setQaLevel = React.useCallback(v => {
		_setQaLevel(Math.max(0.1, Math.min(0.9, v)))
	}, []);

	const qaFilter = React.useCallback((d) => {
		return Math.max(
			d.pct_bins_reporting_am,
			d.pct_bins_reporting_pm,
			d.pct_bins_reporting_off
		) > qaLevel;
	}, [qaLevel]);

	const [fSystems, setFSystems] = React.useState([]);
	const toggleFSystem = React.useCallback(v => {

	}, []);

	const fSystemFilter = React.useCallback(d => {
		if (!fSystems.length) return true;
		return fSystems.includes(d.TMC_f_system);
	}, [fSystems])

	const domain = React.useMemo(
		() =>
			currentData
				.filter(Boolean)
				.filter((d) => qaFilter(d))
				.filter((d) => fSystemFilter(d))
				.map((d) => d.value)
				.sort((a, b) => a - b),
		[currentData, qaFilter, fSystemFilter]
	);

	const scale = React.useMemo(
		() =>
			layer.getColorScale(domain) ? layer.getColorScale(domain) : () => "blue",
		[domain]
	);

	const bottlenecks = React.useMemo(
		() =>
			currentData
				.filter(Boolean)
				.filter((d) => qaFilter(d))
				.filter((d) => fSystemFilter(d))
				.slice(0, numBottleNecks)
				.map((d, i) => {
					d.color = scale(d.value);
					d.rank = i + 1;
					d.percentile = (quantileRank(domain, d.value) * 100).toFixed(0) - 1;
					d.vmt = f(
						+d.TMC_miles * (d.TMC_aadt ? d.TMC_aadt : d.RIS_aadt_current_yr_est)
					);
					d.roadname = get(
						falcorCache,
						["tmc", d.id, "meta", layer.filters.year.value, "roadname"],
						d.id
					);
					d.roadname = get(
						falcorCache,
						["tmc", d.id, "meta", layer.filters.year.value, "firstname"],
						""
					);
					d.direction = get(
						falcorCache,
						["tmc", d.id, "meta", layer.filters.year.value, "direction"],
						""
					);
					d.region = get(
						falcorCache,
						["tmc", d.id, "meta", layer.filters.year.value, "region_code"],
						""
					);
					return d;
				}),
		[currentData, falcorCache, layer.filters.year.value, qaFilter, fSystemFilter]
	);

	React.useEffect(() => {
		if (bottlenecks.length === 0) return;
		falcor
			.get(
				[
					"tmc",
					bottlenecks.map((d) => d.id),
					"year",
					layer.filters.year.value,
					"geometries",
				],
				[
					"tmc",
					bottlenecks.map((d) => d.id),
					"meta",
					layer.filters.year.value,
					["roadname", "firstname", "direction", "region_code"],
				]
			)
			// .then((d) => console.log("test123", d));
	}, [falcor, bottlenecks, layer.filters.year.value]);

	const bottlenecksGeo = React.useMemo(() => {
		return bottlenecks.reduce((out, curr) => {
			/*	console.log('bn reduce',
					'get',get(falcorCache,['tmc', curr.id, 'year', layer.filters.year.value, 'geometries','value'],{}),
					'cache', falcorCache)*/
			out[curr.id] = get(
				falcorCache,
				[
					"tmc",
					curr.id,
					"year",
					layer.filters.year.value,
					"geometries",
					"value",
				],
				{}
			);
			return out;
		}, {});
	}, [bottlenecks, layer.filters.year.value, falcorCache]);

	const quantiles = React.useMemo(
		() =>
			[...Array(numQuantiles).keys()].map((k) =>
				domain.length > 0 ? quantile(domain, k / numQuantiles) : 0
			),
		[domain]
	);

	const quantileDist = React.useMemo(
		() =>
			domain.reduce((out, curr) => {
				let rank =
					domain.length > 0 ? quantileGroup(quantileRank(domain, curr)) : 0;
				if (!out[rank]) {
					out[rank] = 0;
				}
				out[rank] += 1;
				return out;
			}, {}),
		[domain]
	);

	const distData = React.useMemo(() => {
		return Object.keys(quantileDist).map((k) => ({
			color: scale(quantiles[Math.round(k * numQuantiles) - 1]),
			index: k,
			value: quantileDist[k]
		}))
	}, [quantiles, quantileDist, scale])

	const bottlnecksGeojson = React.useMemo(() => {
		return mapBottlenecks(
			layer.mapboxMap,
			layer.filters.year.value,
			bottlenecks,
			bottlenecksGeo,
			domain
		);
	}, [layer.mapboxMap, layer.filters.year.value, bottlenecks, bottlenecksGeo, domain]);

  React.useEffect(() => {
    layer.mapboxMap.getSource("bottlenecks-source").setData(bottlnecksGeojson);
  }, [layer.mapboxMap, bottlnecksGeojson])

	const hoverFilter = React.useCallback((tmc) => {
		layer.mapboxMap.setFilter("geo-bottlenecks-hover", ["in", "tmc", tmc]);
	}, [layer.mapboxMap]);
	const mouseOut = React.useCallback(() => {
		layer.mapboxMap.setFilter("geo-bottlenecks-hover", ["in", "tmc", "none"]);
	}, [layer.mapboxMap]);

	const downloadShp = () => {

		const filename = `${layer.filters.geography.value.join("_")}_${measure}_${
			layer.filters.year.value
		}`

		const options = {
			folder: filename,
			file: filename,
			outputType: "blob",
			compression: "DEFLATE",
		}
		return shpwrite.download(bottlnecksGeojson, options);

		// return shpDownload(
		// 	bottlnecksGeojson,
		// 	{
		// 		file: ,
		// 		folder: `${layer.filters.geography.value.join("_")}_${measure}_${
		// 			layer.filters.year.value
		// 		}`,
		// 		types: {
		// 			point: `${layer.filters.geography.value.join("_")}_${measure}_${
		// 				layer.filters.year.value
		// 			}`,
		// 		},
		// 	}
		// 	// aliasString,
		// 	// tmcMetaString
		// );
	};

	const downloadJson = () => {
		return downloadObjectAsJson(
			bottlnecksGeojson,
			`${layer.filters.geography.value.join("_")}_${measure}_${
				layer.filters.year.value
			}`
		);
	};
	//console.log('quantileDist',quantileDist, quantiles.map((v,i) => v === quantiles[i-1] ? v += .001 : v),domain)

// console.log("QUANTILES", quantiles)

	return (
		<div>
			<div className="flex items-center pr-1">
				<div className="flex-1">Data Quality Threshold</div>
				<Input type="number"
					className="w-28 px-2 py-1"
					value={ qaLevel }
					onChange={ setQaLevel }
					step={ 0.1 } min={ 0.1 } max={ 0.9 }/>
			</div>
			<div>
				<div>F System Filter</div>
				<div className="px-1">
					<MultiLevelSelect
						isMulti
						options={ F_SYSTEMS }
						value={ fSystems }
						valueAccessor={ d => d.value }
						displayAccessor={ d => d.name }
						onChange={ setFSystems }/>
				</div>
			</div>
			<div className="flex-1 flex border-b border-gray-700 pt-2 h-12 p-1">
				<div className="flex-1 text-base text-npmrds-100">
					<div className="text-xs text-npmrds-100 pr-2"># tmcs</div>
					{currentData.length}
				</div>
				<div className="flex-1 text-base text-npmrds-100">
					<div className="text-xs text-npmrds-100"># domain</div>
					{domain.length}
				</div>
			</div>
			<div className="mt-2">
				<BarGraph
					data={ distData }
					keys={["value"]}
					margin={{ left: 0, right: 0, top: 0, bottom: 10 }}
					colors={ (v, ii, data, key) => data.color }
				/>
				<BarGraph
					data={quantiles
						.map((v, i) => (v === quantiles[i - 1] ? (v += 0.001) : v))
						.map((v, i) => ({ index: i, value: v }))}
					keys={["value"]}
					margin={{ left: 0, right: 0, top: 0, bottom: 10 }}
					colors={ scale }
				/>
			</div>
			<div className="flex-1 flex border-b border-gray-700 bg-npmrds-500">
				<div className="flex-1 p-2"> Top {numBottleNecks} Bottlenecks </div>
				<div className="p-2 flex ">
					<div
						onClick={() => downloadShp()}
						className="bg-npmrds-800 hover:bg-gray-800 font-sans text-sm text-npmrds-100 font-medium text-center p-2 cursor-pointer"
					>
						.shp
					</div>
					<div
						onClick={() => downloadJson()}
						className="bg-npmrds-800 hover:bg-gray-800 font-sans text-sm text-npmrds-100 font-medium text-center p-2 cursor-pointer"
					>
						.json
					</div>
				</div>
			</div>
			<div className="h-64 overflow-y-scroll scrollbar-sm"
				onMouseLeave={ mouseOut }
			>
				{bottlenecks.map((d, i) => (
					<div
						onMouseEnter={() => hoverFilter(d.id)}
						key={i}
						className="flex-1 flex border-b border-gray-700 pt-2 hover:bg-gray-700"
					>
						<div className=" text-lg text-npmrds-100 w-8 pt-2">{i + 1}</div>
						<div className=" text-sm text-npmrds-100 w-32">
							<div className="text-xs text-npmrds-100 pr-2">tmc {d.id}</div>
							<div>
								{d.roadname ? d.roadname : d.id} {d.direction}
							</div>
							<div className="text-xs">{d.firstname}</div>
						</div>

						<div className="flex-1 text-base text-npmrds-100 flex flex-col">
							<div className="flex-1">
								<div className="text-xs text-npmrds-100">val</div>
								{f(d.value)}
							</div>
							<div className="flex-1">
								<div className="text-xs text-npmrds-100">
									{d.percentile} %tile
								</div>
							</div>
						</div>
						<div className="flex-1 text-base text-npmrds-100 flex flex-col">
							<div className="flex-1">
								<div className="text-xs text-npmrds-100">vmt </div>
								{d.vmt}
							</div>
							<div className="flex-1">
								<div className="text-xs text-npmrds-100">
									{getMiles(d)} mi
								</div>
							</div>
						</div>

						<div className="flex-1 text-base text-npmrds-100">
							<div className="text-xs text-npmrds-100">% rpt</div>
							{Math.max(
								d.pct_bins_reporting_am,
								d.pct_bins_reporting_pm,
								d.pct_bins_reporting_off
							).toFixed(2)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default BottlenecksBox;

const mapBottlenecks = (map, year, data, geo, domain) => {
	let bottlnecksGeo = { type: "FeatureCollection", features: [] };

	let scale = scaleLinear()
		.domain(domain)
		.range([5, 25]);

	data.forEach((segment, i) => {
		if (geo[segment.id].type) {
			let bottleneck = {
				type: "Feature",
				properties: {},
				geometry: {
					type: "Point",
					coordinates: geo[segment.id].coordinates[0][0],
				},
			};

			// if(geo[segment.id].type === 'MultiLineString') {
			// 	feat.geometry.type = 'LineString'
			// 	feat.geometry.coordinates = feat.geometry.coordinates[0][0]
			// }
			//let tmclength = length(feat)
			//let bottleneck =
			bottleneck.id = i;
			bottleneck.properties = {
				tmc: segment.id,
				roadname: segment.roadname,
				direction: segment.direction,
				firstname: segment.firstname,
				region: segment.region,
				rank: segment.rank,
				percentile: segment.percentile,
				measure: segment.value,
				vmt: segment.vmt,
				radius: Math.min(scale(segment.value), 20), //scale(tmcValue),
				color: segment.color,
				type: "bottleneck",
			};
			bottlnecksGeo.features.push(bottleneck);
		}
	});

	// let source = {
	// 	type: "geojson",
	// 	data: bottlnecksGeo,
	// };
	// let newLayer = {
	// 	id: "bottlnecks",
	// 	type: "circle",
	// 	source: "bottlenecks-source",
	// 	paint: {
	// 		"circle-radius": ["number", ["get", "radius"]],
	// 		"circle-opacity": 0.8,
	// 		"circle-color": ["string", ["get", "color"]],
	// 	},
	// };
	//
	// let higlightLayer = {
	// 	id: "bottlnecks-hover",
	// 	type: "circle",
	// 	source: "bottlenecks-source",
	// 	paint: {
	// 		"circle-radius": ["number", ["get", "radius"]],
	// 		"circle-opacity": 0,
	// 		"circle-stroke-width": 2,
	// 		"circle-stroke-color": "#fff",
	// 	},
	// 	filter: ["in", "tmc", ""],
	// };
	//
	// //map.getSource('bottlenecks-source').setData(bottlnecksGeo)
	// //map.setPaintProperty('bottlnecks',  'circle-radius', ['number', ['get', 'radius']])
	// //console.log('sourceFeatures', map.querySourceFeatures('geo-boundaries-source'))
	// //console.log('rendered features', map.queryRenderedFeatures({ layers: ['bottlnecks'] }))
	// if (map.getLayer("bottlnecks")) {
	// 	// console.log('get bottlnecks layer', map.getLayer('bottlnecks').id   )
	// 	let layerId = map.getLayer("bottlnecks").id;
	// 	let source = map.getLayer("bottlnecks").source;
	// 	let hoverId = map.getLayer("bottlnecks-hover").id;
	// 	map.removeLayer(layerId);
	// 	map.removeLayer(hoverId);
	// 	map.removeSource(source);
	// }
	// map.addSource("bottlenecks-source", source);
	// map.addLayer(newLayer);
	// map.addLayer(higlightLayer);

	//  if( map.getLayer('bottlnecks-hover') ) {
	//  	let hoverId =  map.getLayer('bottlnecks-hover').id
	//    map.removeLayer(hoverId)
	//    let source = map.getLayer('bottlnecks-hover').source
	//    map.removeSource(source)
	//  }
	// map.addLayer(higlightLayer)

	// console.log('get bottlnecks layer', map.getLayer('bottlnecks').id   )
	// console.log('set data', bottlnecksGeo)
	// map.getSource('bottlenecks-source').setData(bottlnecksGeo);

	// console.log('draw bottlnecks',bottlnecksGeo.features.length, bottlnecksGeo)

// console.log("bottlnecksGeo", bottlnecksGeo)

	return bottlnecksGeo;
};

function downloadObjectAsJson(exportObj, exportName) {
	var dataStr =
		"data:text/json;charset=utf-8," +
		encodeURIComponent(JSON.stringify(exportObj));
	var downloadAnchorNode = document.createElement("a");
	downloadAnchorNode.setAttribute("href", dataStr);
	downloadAnchorNode.setAttribute("download", exportName + ".json");
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}
