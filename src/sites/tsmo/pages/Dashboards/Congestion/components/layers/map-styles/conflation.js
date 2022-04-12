import flatten from 'lodash.flatten'

const conflationVersion = '0_6_0'
const years =['2016','2017','2018','2019','2020']
const ConflationSources = years.map(year => {
	return { id: `conflation_map_${year}_${conflationVersion}`,
	  source: {
	    type: "vector",
	    url: `https://tiles.availabs.org/data/conflation_map_${year}_${conflationVersion}.json`
	  }
	}
})

const lineColors = [
  "hsl(185, 0%, 27%)",
  "hsl(185, 0%, 12%)",
  'white',
  'yellow',
  '#e021a3',
  '#ed985c',
  '#93a012',
  '#f1410c',
  ["match", ["get", "dir"], 1, 'red', 5, 'green', 3, 'blue', 7, 'yellow', 'pink']
]


//const line_offset_arterial =

// {
//     base: 0,
//     stops: [[5, 0], [9, 0.5], [15, ], [18, 6]]
// }

let  networkLevels = {
  'major-link': (year) => {
    return{
      "source-layer": `major`,
      "minzoom": 10,
      "filter": [
          "all",
          [
              "match",
              ["get", "h"],
              ["motorway_link", "trunk_link"],
              true,
              false
          ],
          ["==", ["geometry-type"], "LineString"]
      ],
      "layout": {
          'visibility': 'none',
          "line-cap": ["step", ["zoom"], "butt", 13, "round"],
          "line-join": ["step", ["zoom"], "miter", 13, "round"]
      },
      "paint": {
          "line-width": [
              "interpolate",
              ["exponential", 1.5],
              ["zoom"],
              12,
              0.5,
              14,
              2,
              18,
              18
          ],
          "line-color": lineColors[0]
      }
    }
  },
  'road-street': (year) => {
    return{
      "source-layer": `local`,
      "minzoom": 11,
      "filter": [
          "all",
          [
              "match",
              ["get", "h"],
              ["street", "street_limited", "primary", "primary_link", "residential"],
              true,
              false
          ],
          ["==", ["geometry-type"], "LineString"]
      ],
      "layout": {
          'visibility': 'none',
          "line-cap": ["step", ["zoom"], "butt", 14, "round"],
          "line-join": ["step", ["zoom"], "miter", 14, "round"]
      },
      paint: {
        'line-color': lineColors[0],//["match", ["get", "dir"], 1, 'red', 5, 'green', 3, 'blue', 7, 'yellow', 'pink'],//lineColors[5],
        'line-opacity': [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.4,
          1
        ],
        'line-offset': [
        "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          11,
          0.1,
          14,
          1.2,
          18,
          8
        ],
        'line-width': [
          "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            11,
            0.1,
            14,
            1,
            18,
            16
          ]
      }
    }
  },
  'secondary-tertiary': (year) => {
    return{
      "source-layer": `major`,
      "minzoom": 8,
      "filter": [
          "all",
          [
              "match",
              ["get", "h"],
              ["secondary", "tertiary"],
              true,
              false
          ],
          ["==", ["geometry-type"], "LineString"]
      ],
      "layout": {
          'visibility': 'none',
          "line-cap": ["step", ["zoom"], "butt", 14, "round"],
          "line-join": ["step", ["zoom"], "miter", 14, "round"]
      },
      paint: {
        'line-color': lineColors[0],
        'line-opacity': [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.4,
          1
        ],
        'line-offset': [
          "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            8,
            1,
            18,
            10
        ],

        'line-width': [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          8,
          .5,
          18,
          14
        ]
      }
    }
  },
  'primary': (year) => {
    return{
      "source-layer": `major`,
      "minzoom": 7,
      "filter": [
          "all",
          ["match", ["get", "h"], ["primary", "primary_link"], true, false],
          ["==", ["geometry-type"], "LineString"]
      ],
      "layout": {
          'visibility': 'none',
          "line-cap": ["step", ["zoom"], "butt", 14, "round"],
          "line-join": ["step", ["zoom"], "miter", 14, "round"]
      },
      paint: {
        'line-color': lineColors[0],
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
          10,
          1.25,
          18,
          22
        ],
        'line-offset': [
          "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            5,
            0.1,
            10,
            1,
            18,
            16
        ],
      }
    }
  },
  'motorway-trunk': (year) => {
    return {
      "source-layer": `major`,
      "layout": {
          'visibility': 'none',
          "line-cap": ["step", ["zoom"], "butt", 13, "round"],
          "line-join": ["step", ["zoom"], "miter", 13, "round"]
      },
      "filter": [
          "all",
          ["match", ["get", "h"], ["motorway", "trunk"], true, false],
          ["==", ["geometry-type"], "LineString"]
      ],
      paint: {
        'line-color': lineColors[0],
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
          .2,
          10,
          2,
          18,
          36
        ],
        'line-offset': [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          5,
          .2,
          10,
          1,
          18,
          9
        ],
      },
    }
  }
}


const ConflationYears = years.map(year => {
  return Object.keys(networkLevels).map(level => {
    return {
            "id": `con-${year}-${level}`,
            "type": "line",
            source: `conflation_map_${year}_${conflationVersion}`,
            beneath: 'road-label',
            ...networkLevels[level](year)
      }
  })
})


const ConflationLayers = flatten(ConflationYears)




/*const ConflationLayerCase = [
  {
      id: `con-2019-secondary-tertiary-case`,
      type: 'line',
      source: `conflation_map_${conflationVersion}`,
      beneath: 'road-label',
      'source-layer': 'major',
      "minzoom": 8,
      "filter": [
          "all",
          [
              "match",
              ["get", "h"],
              ["secondary", "tertiary"],
              true,
              false
          ],
          ["==", ["geometry-type"], "LineString"]
      ],
      "layout": {
          'visibility': 'none',
          "line-cap": ["step", ["zoom"], "butt", 14, "round"],
          "line-join": ["step", ["zoom"], "miter", 14, "round"]
      },
      paint: {
        'line-color': lineColors[1],
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          10,
          0.25,
          18,
          1.5
        ],
        "line-color": lineColors[1],
        'line-offset': [
          "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            8,
            0.75,
            18,
            7
        ],
        "line-gap-width": [
            "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            5,
            0.1,
            18,
            12
        ],
        //"line-opacity": ["step", ["zoom"], 0.1, 10, 1]
      }
    },
    {
      id: `con-2019-primary-case`,
      type: 'line',
      source: `conflation_map_${conflationVersion}`,
      beneath: 'road-label',
      'source-layer': 'major',
      "layout": {
          'visibility': 'none',
          "line-cap": ["step", ["zoom"], "butt", 13, "round"],
          "line-join": ["step", ["zoom"], "miter", 13, "round"]
      },
      "filter": [
          "all",
          ["==", ["get", "h"], "primary"],
          ["==", ["geometry-type"], "LineString"]
      ],
      minzoom:8,
      paint: {
        'line-color': lineColors[1],
        "line-width": [
            "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            10,
            .5,
            18,
            2
        ],
        // "line-color": "hsl(185, 0%, 16%)",
        "line-gap-width": [
            "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            5,
            1,
            18,
            14
        ],
        'line-offset': [
          "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            5,
            1.5,
            18,
            14
        ],
        //"line-opacity": ["step", ["zoom"], 0.1,  10, 1]

      }
    },
    {
      id: `con-2019-interstate-case`,
      type: 'line',
      source: `conflation_map_${conflationVersion}`,
      beneath: 'road-label',
      'source-layer': 'major',
      "layout": {
          'visibility': 'none',
          "line-cap": ["step", ["zoom"], "butt", 13, "round"],
          "line-join": ["step", ["zoom"], "miter", 13, "round"]
      },
      "filter": [
          "all",
          ["match", ["get", "h"], ["motorway", "trunk"], true, false],
          ["==", ["geometry-type"], "LineString"]
      ],
      minzoom:8,
      paint: {
        "line-width": [
            "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            5,
            .5,
            18,
            6
        ],
        "line-color": lineColors[1],
        "line-gap-width": [
            "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            5,
            0.4,
            18,
            36
        ],
        'line-offset': [
          "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            5,
            0.2,
            18,
            9
        ],
        //"line-dasharray": [3, 3]
    }
  },
]
*/
export {
	ConflationSources,
  ConflationLayers
}
