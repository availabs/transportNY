const TrafficSignalsSources = [
  { id: "traffic_signals",
    source: {
      type: "vector",
      url: "https://tiles.availabs.org/data/osm_traffic_signals.json"
    }
  }
]

const TrafficSignalsLayers = [{
      'id': 'traffic_signals_layer',
      'type': 'circle',
      'source': 'traffic_signals',
      'beneath': 'road-label',
      'source-layer': "osm_traffic_signals",
      'layout': {
        'visibility': 'visible',
      },
      'filter': ["==","$type","Point"],
      'minzoom': 13,
      'paint': {
        'circle-radius': 3,
        'circle-color':' #B42222',
        'circle-stroke-color': '#fefefe',
        'circle-stroke-width': 1
      }
}]

export {
	TrafficSignalsSources,
	TrafficSignalsLayers
}