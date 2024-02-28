import React from "react";
import { Select } from "~/modules/avl-components/src";
// import get from "lodash/get";

//import { format as d3format } from "d3-format";

import MeasureInfoBox from "./MeasureInfoBox";
// import DataDownloader from "./DataDownload";
import MeasureVisBox from "./MeasureVisBox";
import BottlenecksBox from "./BottlenecksBox";
import IncidentsBox from "./IncidentsBox";

// import { useFalcor } from '~/modules/avl-components/src'

const InfoBoxController = ({ layer }) => {
	//console.log("InfoBoxController render", layer.state);
	let activeBoxes = [...layer.state.infoBoxes];
	let InfoBoxes = [
		{ comp: MeasureInfoBox, name: "Measure Definition" },
		{
			comp: BottlenecksBox,
			name: "Bottlenecks",
			onRemove: () => {
				const source = layer.mapboxMap.getSource("bottlenecks-source");
				if (source) {
					source.setData({
						type: "FeatureCollection",
						features: []
					})
				}
			},
		},
		{ comp: MeasureVisBox, name: "Region Overview" },
		{
			comp: IncidentsBox, name: "Transcom Incidents",
		  	onRemove: () => {
					const source = layer.mapboxMap.getSource("incidents-source");
					if (source) {
						source.setData({
							type: "FeatureCollection",
							features: []
						})
					}
			}
		},
	];

	let toggleBox = (v) => {
		let index = activeBoxes.indexOf(v);
		index !== -1 ? activeBoxes.splice(index, 1) : activeBoxes.push(v);
		layer.updateState({ infoBoxes: activeBoxes });
	};

	return (
		<div>

			<div className="absolute p-2 bg-gray-100"
				style={ { width: "372px" } }
			>
				<Select
					multi={false}
					onChange={toggleBox}
					placeholder={"Add Infobox"}
					options={InfoBoxes.filter(
						(d) => !activeBoxes.includes(d.name)
					).map((d) => d.name)}
				/>
			</div>

			<div style={ { height: "56px" } }/>

			<div className="overflow-y-auto scrollbar">
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
											className="text-lg cursor-pointer fa fa-remove"
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
