import flatten from 'lodash.flatten'

export const VERSION = '0_6_0'

export const YEARS = [2022, 2021, 2020, 2019, 2018, 2017, 2016];

const ConflationSources = YEARS.map(year => ({
  id: `conflation_map_${year}_${VERSION}`,
  source: {
    type: "vector",
    url: `https://tiles.availabs.org/data/conflation_map_${year}_${VERSION}.json`
  }
}))

const LineColor = [
  "case",
  ["boolean", ["feature-state", "hover"], false],
  "#000000",
  "#999999"
]

const  networkLevels = {
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
          "line-color": LineColor
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
      "paint": {
        'line-color': LineColor,
        // 'line-opacity': [
        //   "case",
        //   ["boolean", ["feature-state", "hover"], false],
        //   0.4,
        //   1
        // ],
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
      "paint": {
        'line-color': LineColor,
        // 'line-opacity': [
        //   "case",
        //   ["boolean", ["feature-state", "hover"], false],
        //   0.4,
        //   1
        // ],
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
      "paint": {
        'line-color': LineColor,
        // 'line-opacity': [
        //   "case",
        //   ["boolean", ["feature-state", "hover"], false],
        //   0.4,
        //   1
        // ],
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
      "paint": {
        'line-color': LineColor,
        // 'line-opacity': [
        //   "case",
        //   ["boolean", ["feature-state", "hover"], false],
        //   0.4,
        //   1
        // ],
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


const ConflationYears = YEARS.map(year => {
  return Object.keys(networkLevels).map(level => {
    return {
            "id": `con-${year}-${level}`,
            "type": "line",
            "source": `conflation_map_${year}_${VERSION}`,
            "beneath": 'road-label',
            ...networkLevels[level](year)
      }
  })
})

const ConflationLayers = flatten(ConflationYears)

export {
	ConflationSources,
  ConflationLayers
}
