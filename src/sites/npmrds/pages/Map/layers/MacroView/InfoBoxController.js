import React from "react";
import { Select } from "modules/avl-components/src";
// import get from "lodash.get";

//import { format as d3format } from "d3-format";

import MeasureInfoBox from "./MeasureInfoBox";
import DataDownloader from "./DataDownload";
import MeasureVisBox from "./MeasureVisBox";
import BottlenecksBox from "./BottlenecksBox";
import IncidentsBox from "./IncidentsBox";

// import { useFalcor } from 'modules/avl-components/src'

const InfoBoxController = ({ layer }) => {
	//console.log("InfoBoxController render", layer.state);
	let activeBoxes = [...layer.state.infoBoxes];
	let InfoBoxes = [
		{ comp: MeasureInfoBox, name: "Measure Definition" },
		{
			comp: BottlenecksBox,
			name: "Bottlenecks",
			onRemove: () => {
				let layerId = layer.mapboxMap.getLayer("bottlnecks").id;
				let source = layer.mapboxMap.getLayer("bottlnecks").source;
				let hoverId = layer.mapboxMap.getLayer("bottlnecks-hover").id;
				layer.mapboxMap.removeLayer(layerId);
				layer.mapboxMap.removeLayer(hoverId);
				layer.mapboxMap.removeSource(source);
			},
		},
		{ comp: MeasureVisBox, name: "Region Overview" },
		{
			comp: IncidentsBox, name: "Transcom Incidents",
		  	onRemove: () => {
				let layerId = layer.mapboxMap.getLayer("incidents").id;
				let source = layer.mapboxMap.getLayer("incidents").source;
				layer.mapboxMap.removeLayer(layerId);
				layer.mapboxMap.removeSource(source);
			}
		},
	];

	let toggleBox = (v) => {
		let index = activeBoxes.indexOf(v);
		index !== -1 ? activeBoxes.splice(index, 1) : activeBoxes.push(v);
		layer.updateState({ infoBoxes: activeBoxes });
	};

	return (
		<div className="h-full">
			<div className="absolute py-2" style={{ width: 380 }}>
				<Select
					multi={false}
					onChange={toggleBox}
					placeholder={"Add Infobox"}
					options={InfoBoxes.filter(
						(d) => !activeBoxes.includes(d.name)
					).map((d) => d.name)}
				/>
			</div>
			<div style={{ height: 50 }} />
			<div className=" overflow-y-auto scrollbar">
				{InfoBoxes.filter((d) => activeBoxes.includes(d.name)).map(
					(Box) => {
						let Comp = Box.comp;
						return (
							<div
								key={Box.name}
								className="border-t-4 border-b-4"
								style={{ borderColor: "#242730" }}
							>
								<div className="flex justify-between items-baseline   p-2">
									<div className="text-lg">{Box.name}</div>
									<div>
										<span
											onClick={ () => {
												toggleBox(Box.name);
												if (typeof Box.onRemove === "function") {
													Box.onRemove();
												}
											} }
											className="text-lg cursor-pointer os-icon os-icon-x"
										/>
									</div>
								</div>
								<Comp layer={layer} />
							</div>
						);
					}
				)}
			</div>
		</div>
	);
};

export default InfoBoxController;
