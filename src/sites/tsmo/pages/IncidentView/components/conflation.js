import flatten from "lodash/flatten"

const conflationVersion = '0_6_0'
const years =['2016', '2017', '2018', '2019', '2020', '2021','2022']
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
  '#dfde4e',
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
  'major-link': (year,color,size=0) => {
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
              0.5 + size,
              14,
              2 + size * 2,
              18,
              18 + size * 3
          ],
          "line-color": color
      }
    }
  },
  'road-street': (year,color,size) => {
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
        'line-color': color,//["match", ["get", "dir"], 1, 'red', 5, 'green', 3, 'blue', 7, 'yellow', 'pink'],//lineColors[5],
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
          0.1+size,
          14,
          1.2+size*2,
          18,
          8+size*3
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
  'secondary-tertiary': (year,color,size=0) => {
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
        'line-color': color,
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
          .5 + (size * 1),
          18,
          14 + (size * 6)
        ]
      }
    }
  },
  'primary': (year,color,size=0) => {
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
        'line-color': color,
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
          0.1 +(size * 0.5),
          10,
          1 + (size * 1.5),
          18,
          22 + (size * 8)
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
  'motorway-trunk': (year,color,size=0) => {
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
        'line-color': color,
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
          .2 + size *2, 
          10,
          2 + size * 4,
          18,
          36 + size * 6
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
            ...networkLevels[level](year,lineColors[0])
      }
  })
})

const ConflationCaseYears = years.map(year => {
  return Object.keys(networkLevels).map(level => {
    return {
            "id": `concase-${year}-${level}`,
            "type": "line",
            source: `conflation_map_${year}_${conflationVersion}`,
            beneath: `con-${year}-${level}`,
            ...networkLevels[level](year,lineColors[2],1)
      }
  })
})


const ConflationLayers = flatten(ConflationYears)
const ConflationCaseLayers = flatten(ConflationCaseYears)


export {
	ConflationSources,
  ConflationLayers,
  ConflationCaseLayers
}
