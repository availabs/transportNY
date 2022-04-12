const TransitSources = [
	{
		id: "transit_2020",
		source: {
			type: "vector",
			url: "https://tiles.availabs.org/data/ris_transit_conflation_2020.json",
		},
	},
];

const TransitLayers = [
	{
		id: `transit`,
		type: "line",
		source: "transit_2020",
		beneath: "road-label",
		"source-layer": "transit_conflation_risndjson",
		layout: {
			visibility: "visible",
			"line-join": "round",
			"line-cap": "round",
		},
		paint: {
			"line-color": "hsl(185, 0%, 27%)",
			"line-opacity": [
				"case",
				["boolean", ["feature-state", "hover"], false],
				0.4,
				1,
			],
			"line-width": [
				"interpolate",
				["exponential", 1.5],
				["zoom"],
				12,
				0.5,
				14,
				2,
				18,
				18,
			],
			"line-offset": [
				"interpolate",
				["exponential", 1.5],
				["zoom"],
				11,
				0.4,
				14,
				2,
				18,
				12,
			],
		},
	},
];

export { TransitSources, TransitLayers };
