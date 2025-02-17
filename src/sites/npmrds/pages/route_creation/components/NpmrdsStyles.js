import { LineColor } from "./ConflationStyles"

const NpmrdsSources = [
	{ id: "npmrds",
	  source: {
	    type: "vector",
	    url: "https://tiles.availabs.org/data/npmrds.json"
	  }
	}
]

const npmrdsPaint = {
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
	'line-color': LineColor
}

const yearMap = {
  '2016': '2016',
  '2017': '2017',
  '2018': '2018',
  '2019': '2019',
  '2020': '2020',
  '2021': '2021',
  '2022': '2021',
  '2023': '2021'
}

const NpmrdsLayers = ['2016','2017','2018','2019','2020','2021','2022','2023']
  .map(year => {
    return {
      id: `tmc-${year}`,
      type: 'line',
      source: 'npmrds',
      beneath: 'traffic_signals_layer',
      'source-layer': `npmrds_${yearMap[year]}`,
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
