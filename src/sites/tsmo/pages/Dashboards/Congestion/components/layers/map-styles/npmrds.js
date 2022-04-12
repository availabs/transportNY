const NpmrdsSources = [
	{ id: "npmrds",
	  source: {
	    type: "vector",
	    url: "https://tiles.availabs.org/data/npmrds.json"
	  }
	}
]

const npmrdsPaint = {
  'line-color': '#ccc',
  'line-width': [
    "interpolate",
    ["linear"],
    ["zoom"],
    0,
    [
      "match",
      ["get", "n"],
      [1, 2],
      0.5,
      0
    ],
    13,
    [
      "match",
      ["get", "n"],
      [1, 2],
      1.5,
      1
    ],
    18,
    [
      "match",
      ["get", "n"],
      [1, 2],
      8,
      5
    ]
  ],
  'line-opacity': [
    "case",
    ["boolean", ["feature-state", "hover"], false],
    0.4,
    1
  ],
  'line-offset': {
    base: 1.5,
    stops: [[5, 0], [9, 1], [15, 3], [18, 7]]
  }
}

const NpmrdsLayers = ['2016','2017','2018','2019','2020','2021']
  .map(year => {
    return {
      id: `tmc-${year}`,
      type: 'line',
      source: 'npmrds',
      beneath: 'waterway-label',
      'source-layer': `npmrds_${year}`,
      layout: {
        'visibility': 'visible',
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: npmrdsPaint
    }
  })




export {
	NpmrdsSources,
	NpmrdsLayers
}