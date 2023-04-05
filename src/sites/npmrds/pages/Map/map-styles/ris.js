const RISSources = [
	{ id: "ris_2019",
	  source: {
	    type: "vector",
	    url: "https://tiles.availabs.org/data/ris_layers_2019.json"
	  }
	}
]

const RISLayers = [
    { 
      id: `ris-local`,
      type: 'line',
      source: 'ris_2019',
      beneath: 'road-label',
      'source-layer': 'local',
      layout: {
        'visibility': 'visible',
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': "hsl(185, 0%, 27%)",
        'line-opacity': [
		    "case",
		    ["boolean", ["feature-state", "hover"], false],
		    0.4,
		    1
		],
        'line-width': [
		  "interpolate",
		  ["exponential", 1.5],
		  ["zoom"],
		  12,
		  0.5,
		  14,
		  2,
		  18,
		  18
		]
      }
    },
    { 
      id: `ris-collector`,
      type: 'line',
      source: 'ris_2019',
      beneath: 'road-label',
      'source-layer': 'collector',
      layout: {
        'visibility': 'visible',
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': "hsl(185, 0%, 27%)",
        'line-opacity': [
		    "case",
		    ["boolean", ["feature-state", "hover"], false],
		    0.4,
		    1
		],
        'line-width': [
		  "interpolate",
		  ["exponential", 1.5],
		  ["zoom"],
		  12,
		  0.5,
		  14,
		  2,
		  18,
		  18
		]
      }
    },
    { 
      id: `ris-arterial`,
      type: 'line',
      source: 'ris_2019',
      beneath: 'road-label',
      'source-layer': 'arterial',
      layout: {
        'visibility': 'visible',
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': "hsl(185, 0%, 27%)",
        'line-opacity': [
		    "case",
		    ["boolean", ["feature-state", "hover"], false],
		    0.4,
		    1
		],
        'line-width': [
		  "interpolate",
		  ["exponential", 1.5],
		  ["zoom"],
		  5,
		  0.1,
		  18,
		  26
		]
      }
    },
    { 
      id: `ris-highway`,
      type: 'line',
      source: 'ris_2019',
      beneath: 'road-label',
      'source-layer': 'highway',
      layout: {
        'visibility': 'visible',
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': "hsl(185, 0%, 27%)",
        'line-opacity': [
		    "case",
		    ["boolean", ["feature-state", "hover"], false],
		    0.4,
		    1
		],
        'line-width': [
		  "interpolate",
		  ["exponential", 1.5],
		  ["zoom"],
		  5,
		  0.75,
		  18,
		  32
		]
      }
    },
    { 
      id: `ris-interstate`,
      type: 'line',
      source: 'ris_2019',
      beneath: 'road-label',
      'source-layer': 'interstate',
      layout: {
        'visibility': 'visible',
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': "hsl(185, 0%, 27%)",
        'line-opacity': [
		    "case",
		    ["boolean", ["feature-state", "hover"], false],
		    0.4,
		    1
		],
        'line-width': [
		  "interpolate",
		  ["exponential", 1.5],
		  ["zoom"],
		  5,
		  3,
		  8,
		  2,
		  18,
		  32
		]
      }
    }
]

export {
	RISSources,
	RISLayers
}